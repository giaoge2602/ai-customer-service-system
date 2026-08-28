# 客户多端对接待办接口 · 接入说明

> 面向第三方小程序 / H5 / 网页的**客户客服窗口对接**。核心目标：客户免注册、打开即聊。
> 本系统后端 `NestJS + Prisma + Socket.IO`，前端 `React`。HTTPS REST 为权威，Socket.IO 为实时提示；断线后必须用 REST 对账。

---

## 1. 一句话流程

```
客户端            POST /api/v1/guest/session        后端
  │  ── clientSessionId + channel + tenantId ────▶  建/复用匿名客户 + 签 JWT
  │  ◀───────────── accessToken + customer ──────────
  │
  │  POST /api/v1/conversations（带 Bearer）        建/恢复会话
  │  Socket.IO connect（auth.token） + join         实时通道
  │  发消息/收消息/已读/结束/评价                    持久化 + 广播
```

- **访客身份**：用 `clientSessionId`（客户端生成并本地持久化的 UUID）在后端幂等收敛到同一匿名客户。
- **渠道**：`channel` 白名单 `web / h5 / miniprogram / wechat / api`；访客入口不传或非法渠道会被拒。
- **登录老客户**：也可用 `POST /auth/login` 换取同一套 `accessToken`，历史会话自动带出。

---

## 2. 接口契约

### 2.1 免登录访客接入

**`POST /api/v1/guest/session`**（公开，无需鉴权）

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `clientSessionId` | uuid | 是 | 客户端生成并只在本设备保存（幂等键）。**必须是 UUID** |
| `channel` | string | 是 | 渠道，白名单 `web/h5/miniprogram/wechat/api` |
| `tenantId` | string | 是 | 机构 ID（客户归属的租户） |
| `name` | string | 否 | 访客昵称，默认「访客」，最长 120 字 |

响应（全局包裹 `{ code: 0, data, message:'ok', requestId }`）：

```jsonc
{
  "code": 0,
  "data": {
    "accessToken": "<JWT，须放入 Authorization: Bearer 与 Socket.IO auth.token>",
    "user": { "id": "USR-...", "tenantId": "TENANT-018", "tenantName": "星河科技",
              "email": "guest-...@guest.xinghe.invalid", "name": "访客", "role": "customer" },
    "customer": { "id": "C-...", "source": "h5", "level": "访客" }
  },
  "message": "ok",
  "requestId": "..."
}
```

错误：`400`（缺参/非法渠道/非 UUID）、`404 code 2002`（机构不存在）、`409 code 2003`（机构已停用）。

### 2.2 登录（老客户）

**`POST /api/v1/auth/login`**：`{ email, password }` → `{ accessToken, user }`。之后与访客共用同一套会话接口。

### 2.3 会话（REST 权威）

所有接口需 `Authorization: Bearer <accessToken>`。会话归属主体是 `customer`（由 token 反查），**无需传 tenantId**（后端从 token 解析）。

| 方法 | 路径 | 请求 | 幂等 |
| --- | --- | --- | --- |
| GET | `/conversations` | 分页/筛选 | — |
| POST | `/conversations` | `{ channel, priority?, clientMessageId, firstMessage }` | `clientMessageId` |
| GET | `/conversations/:id` | — | 断线对账用（返回全量消息） |
| POST | `/conversations/:id/messages` | `{ clientMessageId, content }` | `clientMessageId` |
| POST | `/conversations/:id/read` | `{ lastReadSequence }` | 单调递增游标 |
| POST | `/conversations/:id/end` | `{ reason? }` | — |
| POST | `/conversations/:id/evaluation` | `{ rating, comment? }` | `rating = very_satisfied/satisfied/neutral/dissatisfied` |

### 2.4 Socket.IO 实时

- 连接：同源 `#/socket.io`（或后端根 `/socket.io`），`transports: ['websocket','polling']`，握手 `auth: { token }`。
- 进房：`emit('conversation:join', { conversationId }, ack)` → `{ ok: true }`；离开 `conversation:leave`。
- 事件（每个事件含 `eventId`，前端用 Set 去重）：

| 事件 | 含义 |
| --- | --- |
| `message.created` / `message.read` | 新消息 / 已读位置更新 |
| `conversation.claimed` / `.released` / `.assigned` / `.ended` | 会话被接管/释放/分配/结束 |
| `conversation.created` | 会话创建 |
| `evaluation.scheduled` / `.visible` / `.submitted` | 评价调度 / 可见 / 已提交 |

> **断线对账**：`connect` 后或 `onReconnect` 时，用 `GET /conversations/:id` 重拉全量，以 REST 为准覆盖本地乐观状态。

---

## 3. 数据模型（前端视角）

消息（经 `normalizeMessage`）：

```jsonc
{ "id": "M-...", "sequence": 2, "clientMessageId": "...",
  "senderType": "customer|agent|ai|system", "content": "文本", "createdAt": "..." }
```

会话（经 `normalizeConversation`）：

```jsonc
{ "id": "CS-...", "status": "queued|human|ended|evaluated", "priority": "normal|high|urgent",
  "channel": "h5", "customer": {...}, "agent": { "name": "..." } | null,
  "evaluationRequestedAt": "...", "evaluationPresentedAt": "...",
  "messages": [ { 见上 } ], ... }
```

- `queued`：排队待客服；`human`：已接管；`ended`：结束（可再补消息）；`evaluated`：只读终态。
- 每个客户 + 机构**同时只有一个未结束会话**；再次创建会复用（返回同一会话）。

---

## 4. 接入方式

### 4.1 Web / H5（用内置 SDK）

本项目前端已内置 `src/chatClient.js` SDK + `src/chat/CustomerChatWidget.jsx` 悬浮窗。接入方只需在页面 URL 带上参数：

```
https://<你的域名>/<base>/#/customer/chat?visitor=1&tenantId=TENANT-018&channel=h5
```

SDK 用法（也可嵌入任意第三方页面）：

```js
import { ensureGuestSession, createChatClient } from 'your-chat-sdk'

const session = await ensureGuestSession({ tenantId: 'TENANT-018', channel: 'h5' })
const client = createChatClient({ getToken: () => session.accessToken, channel: 'h5' })

// 拉当前会话/建会话
const conv = await client.rest.createOrResumeConversation({ firstMessage: '你好' })
const rt = client.openRealtime(conv.id)
rt.subscribe('message.created', (e) => appendMessage(e.data))
```

### 4.2 小程序

小程序原生 WebSocket 与 socket.io 握手不完全兼容，**推荐以 REST 增量轮询兜底**为主：

1. `wx.request` 调 `POST /api/v1/guest/session` 拿 token（`wx.setStorage` 持久化 `clientSessionId`）。
2. `wx.request` 带 `Authorization` 做创建会话 / 发消息。
3. 轮询 `GET /conversations/:id`，用 `messages[].sequence` 增量同步（只追加比自己本地 `lastSequence` 大的消息）；已读用 `lastReadSequence` 上报。
4. 如需实时，可用 `wx.connectSocket` 连 `wss://.../socket.io` 做 engine.io 兼容层（进阶，非必须）。

`channel` 传 `miniprogram`，`source` 会自动落到客户档案。

### 4.3 多渠道同一客户

- 免登录客户每次接入都持同一 `clientSessionId`（本地持久化），后端据此复用同一 `customer`。
- 客户日后注册/登录，历史会话通过 `Customer.userId` 自动带出。

---

## 5. 幂等与可靠性

- **消息幂等**：`clientMessageId` 由客户端生成（重复请求返回同一条消息，不重复入库）。
- **已读单调**：`lastReadSequence` 只能增大，防回退。
- **断线重连**：Socket 去重（`eventId`）+ `onReconnect` → REST 全量对账。
- **访客会话复用**：并发同 `(tenantId, clientSessionId)` 只产生一条 `GuestSession`（唯一索引兜底）。

---

## 6. 安全说明

- `clientSessionId` 等同访客身份凭证，**须仅存客户端本地**；推荐配合限流。
- 访客 `accessToken` 为 JWT（默认 7d），服务端吊销手段有限；"退出"= 客户端丢弃 token。
- 访客入口公开，建议按租户配额 + IP 限流（`@nestjs/throttler`）防止批量造数据。
- `channel` 白名单只约束访客入口；channel 仅作标签，不是安全边界。

---

## 7. 演示账号

后端未启动时前端回退演示数据（仅登录模式）；**免登录访客依赖后端真实运行**（需 MySQL + NestJS，见 `start.bat`）。

| 角色 | 账号 | 密码 |
| --- | --- | --- |
| 客服坐席 | `lina@xinghe.demo` | `Demo@2026` |
| 客户 | `customer@xinghe.demo` | `Demo@2026` |

测试访客：`POST /api/v1/guest/session`，`tenantId=TENANT-018`，`channel=h5`，`clientSessionId=<uuid>`，即可在客服工作台看到该访客会话。
