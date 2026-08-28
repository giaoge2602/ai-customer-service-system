# 人工会话闭环设计规范

## 1. 目标

在现有 NestJS、Prisma、MySQL 和 React 项目基础上，完成不依赖 AI 的真实人工客服会话闭环：已登录客户发起会话并发送消息，会话进入机构队列，客服接管后双方实时收发消息，客服可退回队列或邀请评价，机构管理员可重新分配或强制结束，客户评价后结束会话，所有消息、状态、计时和操作均持久化。

本阶段优先保证权限隔离、数据可靠性、断线恢复和状态一致性。AI 接待、知识库检索、外部渠道和附件服务不在本阶段实现。

## 2. 已确认的业务边界

- 第一版只支持已登录客户，不支持匿名访客。
- 同一客户在同一机构内最多存在一个未结束会话；再次咨询时恢复该会话。
- 第一版仅支持文本消息和系统消息。
- 客户与当前接管客服都可以正常结束会话。
- 机构管理员可以强制结束本机构会话。
- 超级管理员只读，不能接管、回复、分配或结束会话。
- 客服可以把自己接管的会话退回队列。
- 机构管理员可以把会话指定或重新分配给本机构启用客服。
- 普通客服不能直接指定其他客服。
- REST API 是业务命令和历史数据的权威入口；Socket.IO 只负责实时通知。
- 定时收尾由 MySQL 中的截止时间和 NestJS 每 15 秒执行的扫描任务驱动，不引入 Redis 或消息队列。

## 3. 总体架构

### 3.1 服务端

- `ConversationsController` 暴露会话查询与业务命令。
- `ConversationsService` 负责权限校验、状态流转、消息幂等和事务。
- `ConversationGateway` 负责 Socket.IO JWT 鉴权、房间管理和事件推送。
- `ConversationRealtimePublisher` 隔离业务服务与 Socket.IO，业务事务提交后通过它发布事件。
- `ConversationTimeoutService` 每 15 秒扫描评价展示和自动结束期限。
- Prisma/MySQL 保存会话、消息、事件、评价、已读游标和截止时间。

### 3.2 前端

- `api.js` 增加真实会话 REST API。
- 独立的会话实时客户端负责 Socket.IO 连接、重连和事件订阅。
- 客户聊天页面、客服工作台、机构会话监控和平台会话监控共用规范化会话数据，不再把 `conversationsSeed` 作为运行时数据源。
- Socket.IO 事件只触发局部更新或重新获取；断线重连后必须通过 REST 拉取最新详情，以数据库结果消除漏事件和乱序。

## 4. 会话状态模型

持久化状态使用现有枚举中的四个状态：

```text
queued    排队等待客服
human     已由客服接管
ended     已结束但未提交评价
evaluated 已提交评价并结束
```

状态流转如下：

```text
创建或恢复 ──► queued
queued ──客服接管/管理员分配──► human
human ──客服退回队列─────────► queued
human ──管理员重新分配───────► human
queued/human ──正常结束或自动结束──► ended
human/ended ──客户提交评价────────► evaluated
```

规则：

- `ended` 和 `evaluated` 都是终态，不能再发送、接管、退回、分配或邀请评价。
- 只有评价已经到达展示时间的会话可以提交评价。
- 客户提交评价时，如果会话仍在 `human` 或已经因超时进入 `ended`，统一转为 `evaluated`。
- `ai_handling` 和 `transferred` 暂不进入本阶段业务流；转接历史通过 `ConversationEvent` 表达。

## 5. 自动收尾机制

### 5.1 客户五分钟无应答

- 客服成功发送文本消息后，将 `customerReplyDeadlineAt` 设置为服务端当前时间加 5 分钟。
- 客户在截止时间前发送任何有效普通消息，清除 `customerReplyDeadlineAt`。
- 截止时间到达且会话仍为 `human` 时，自动结束并写入 `endedReason = customer_inactive`。

### 5.2 结束意图三分钟倒计时

- 客户消息经标准化后匹配结束意图关键词时，将 `closingIntentDeadlineAt` 设置为当前时间加 3 分钟。
- 第一版关键词包含：`好的`、`好哒`、`可以`、`谢谢`、`感谢`、`明白了`、`知道了`、`没问题`、`不用了`、`再见`。
- 匹配采用去除首尾空白、常见标点和语气词后的完整短句匹配，不对包含实际问题的长消息做模糊命中。
- 客户在倒计时内发送未命中结束意图的新消息，清除 `closingIntentDeadlineAt`。
- 倒计时到达且会话未结束时，自动结束并写入 `endedReason = closing_intent_timeout`。
- 客服在倒计时期间发送消息不会取消客户已经表达的结束意图。

### 5.3 评价邀请

- 当前接管客服点击“问题已解决 / 邀请评价”后，设置 `evaluationRequestedAt = now` 和 `evaluationVisibleAt = now + 2 分钟`。
- 2 分钟到达时设置 `evaluationPresentedAt`、清除 `evaluationVisibleAt` 并推送一次 `evaluation.visible`，不立即结束会话。
- 客户提交评价后立即转为 `evaluated`，记录 `endedAt` 和 `endedReason = evaluation_submitted`。
- 评价邀请不会取消客服最后回复产生的 5 分钟无应答期限；客户不评价且不回复时，仍按 5 分钟规则结束。
- 重复邀请评价返回现有邀请时间，不重复创建倒计时或事件。

### 5.4 定时任务幂等

- 扫描任务每 15 秒执行一次，分批读取已经到期的记录。
- 每个到期动作使用包含会话状态、截止时间和 `version` 的条件更新；只有更新成功的进程可以写事件和发送实时通知。
- 处理成功后清除对应截止时间并递增 `version`。
- 应用重启后，数据库中的截止时间继续有效；启动后的下一次扫描会处理已经到期的数据。

## 6. 权限模型

### 6.1 客户

- 从 JWT 用户身份解析唯一客户记录，忽略请求体中的 `customerId`。
- 只能创建或恢复自己的会话。
- 只能查看、发送、标记已读、结束和评价自己的会话。
- 对不属于自己的会话统一返回 `404`，不暴露资源是否存在。

### 6.2 客服

- 可以查看本机构 `queued` 会话以及自己接管的会话。
- 可以接管本机构排队会话。
- 只能回复、退回、邀请评价和结束自己接管的会话。
- 不能指定其他客服，也不能操作其他客服已接管的会话。

### 6.3 机构管理员

- 可以查看本机构全部会话和消息。
- 可以把排队或已接管会话指定/重新分配给本机构状态为 `active` 的客服。
- 可以强制结束本机构未结束会话。
- 不能以客服身份发送消息或邀请评价。

### 6.4 超级管理员

- 必须显式指定 `tenantId` 后查询该机构会话。
- 只能执行列表和详情查询。
- 所有会话状态变更命令返回 `403`。

## 7. REST API

所有接口位于 `/api/v1/conversations`，使用 JWT 鉴权。

| 方法 | 路径 | 角色 | 行为 |
| --- | --- | --- | --- |
| `GET` | `/` | 全部角色 | 按角色范围分页查询；支持状态、渠道、客户、客服和更新时间过滤 |
| `POST` | `/` | 客户 | 创建新会话或返回该客户当前未结束会话 |
| `GET` | `/:id` | 全部角色 | 返回授权范围内的会话、消息、评价邀请状态和已读位置 |
| `POST` | `/:id/messages` | 客户、客服 | 发送文本消息；客服必须是当前接管人 |
| `POST` | `/:id/read` | 客户、客服 | 更新当前用户的最后已读消息序号 |
| `POST` | `/:id/claim` | 客服 | 原子接管排队会话 |
| `POST` | `/:id/release` | 客服 | 将自己接管的会话退回队列 |
| `POST` | `/:id/assign` | 机构管理员 | 指定或重新分配给本机构启用客服 |
| `POST` | `/:id/request-evaluation` | 客服 | 启动两分钟评价展示计时 |
| `POST` | `/:id/evaluation` | 客户 | 提交评价并结束会话 |
| `POST` | `/:id/end` | 客户、客服、机构管理员 | 按角色权限正常或强制结束 |

### 7.1 消息发送幂等

请求体：

```json
{
  "clientMessageId": "由客户端生成的 UUID",
  "content": "文本内容"
}
```

- 同一会话内重复提交相同 `clientMessageId` 时返回原消息，状态码保持成功。
- 消息写入、序号分配、会话最后消息时间、截止时间和事件记录在同一事务中完成。
- 文本去除首尾空白后不能为空，第一版最大长度为 5000 个字符。

### 7.2 评价提交

请求体：

```json
{
  "rating": "very_satisfied",
  "comment": "可选评价，最多 200 字"
}
```

评分映射：

| 枚举 | 文案 | 数据库存值 |
| --- | --- | --- |
| `very_satisfied` | 非常满意 | 5 |
| `satisfied` | 满意 | 4 |
| `neutral` | 一般 | 3 |
| `dissatisfied` | 不满意 | 2 |

同一会话仅允许一条评价；相同客户重复提交时返回原评价。

## 8. Socket.IO 实时协议

### 8.1 连接与房间

- 客户端在 Socket.IO `auth.token` 中携带 JWT。
- 服务端复用现有 JWT 校验逻辑，拒绝失效、禁用或缺少机构上下文的账号。
- 连接后自动加入 `user:{userId}` 和 `tenant:{tenantId}`。
- 客户或客服查看某会话时请求加入 `conversation:{conversationId}`；服务端再次执行会话访问权限检查。
- 离开详情页时退出会话房间。

### 8.2 服务端事件

```text
conversation.created
conversation.claimed
conversation.released
conversation.assigned
conversation.ended
message.created
message.read
evaluation.scheduled
evaluation.visible
evaluation.submitted
```

每个事件至少包含 `eventId`、`conversationId`、`tenantId`、`occurredAt` 和该事件需要的最小业务数据。客户端以 `eventId` 去重，不把事件顺序当作数据库真相。

### 8.3 推送范围

- 新排队会话推送给机构房间，用于更新客服队列和管理员监控。
- 会话消息推送给会话房间及相关用户房间。
- 分配、退回、结束和评价状态同时推送给会话房间与机构房间。
- 超级管理员不自动加入所有机构房间；平台监控页面通过 REST 查询并按需订阅指定机构。

## 9. 数据模型调整

### 9.1 Conversation 新增字段

```text
lastCustomerMessageAt      DateTime?
lastAgentMessageAt         DateTime?
customerReplyDeadlineAt    DateTime?
closingIntentDeadlineAt    DateTime?
evaluationRequestedAt      DateTime?
evaluationVisibleAt        DateTime?
evaluationPresentedAt      DateTime?
endedByType                String?
```

增加以下索引：

- `(status, customerReplyDeadlineAt)`
- `(status, closingIntentDeadlineAt)`
- `(status, evaluationVisibleAt)`

保留现有 `endedReason`、`version`、`nextSequence`、`lastMessageAt` 和租户索引。

### 9.2 ConversationReadCursor 新表

```text
id                String
tenantId          String
conversationId    String
userId            String
lastReadSequence  Int
updatedAt         DateTime
```

约束与索引：

- 唯一约束 `(conversationId, userId)`。
- 索引 `(tenantId, userId, updatedAt)`。
- 会话删除时级联删除游标；用户删除时限制或显式清理，避免游标成为孤儿。

### 9.3 现有模型复用

- `Message.clientMessageId` 用于客户端消息幂等。
- `Message.sequence` 用于稳定排序和已读位置。
- `ConversationEvent` 记录创建、接管、退回、重新分配、消息、评价邀请、自动结束和评价提交。
- `Evaluation` 保存数值评分、标签和可选评论。

## 10. 前端业务接线

### 10.1 客户页面

- 登录后获取或创建当前会话。
- 发送文本消息时生成 UUID `clientMessageId`，失败后允许安全重试。
- 展示排队、已接管、结束和已评价状态。
- 收到 `evaluation.visible` 后展示四档评价弹窗。
- 客户主动结束或评价提交后禁用输入框。

### 10.2 客服工作台

- 队列从真实会话列表接口加载。
- 接管成功后打开会话详情并加入会话房间。
- 只在当前账号是接管客服且状态为 `human` 时允许回复。
- 提供“退回队列”“问题已解决 / 邀请评价”和“结束会话”操作。
- 显示实时连接状态；重连后重新加载队列和当前会话。

### 10.3 机构管理员

- 会话监控改为本机构真实列表和消息详情。
- 提供客服分配、重新分配和强制结束入口。
- 不展示消息输入框。

### 10.4 超级管理员

- 会话监控通过显式机构筛选查询真实数据。
- 只显示详情和事件历史，不显示任何修改状态的操作。

## 11. 错误与并发处理

- 重复接管、接管已结束会话或非排队会话返回 `409`。
- 客户越权、跨机构访问和不可见会话统一返回 `404`。
- 客服操作其他客服会话返回 `403`。
- 已结束或已评价会话的写操作返回 `409`。
- 指定客服不存在、跨机构或已禁用返回 `422`。
- 相同 `clientMessageId` 返回已有消息，不创建新消息或重复推送。
- 定时结束与客户消息并发时，通过事务条件更新和 `version` 确保只有一个状态变化成功；失败方重新读取会话后返回当前状态。
- Socket.IO 发送失败不回滚已经提交的业务事务；客户端重连后通过 REST 补齐。

## 12. 测试策略

### 12.1 单元测试

- 结束意图标准化与完整短句匹配。
- 五分钟、三分钟和两分钟截止时间计算。
- 角色权限矩阵。
- 消息幂等和序号分配。
- 自动结束条件与幂等处理。

### 12.2 后端 E2E

- 客户创建/恢复同一未结束会话。
- 客户发消息、客服接管、双方回复、结束、查询历史。
- 客服退回队列和机构管理员重新分配。
- 客户五分钟无应答自动结束。
- 结束关键词三分钟自动结束及新问题取消倒计时。
- 两分钟评价展示、四档评价提交和提交后结束。
- 客户、客服、机构管理员和超级管理员权限隔离。
- 跨机构访问、重复接管、重复消息和重复定时任务。

测试不真实等待 2、3、5 分钟：直接把截止时间写为过去并调用一次扫描方法，验证持久化结果和事件。

### 12.3 Socket.IO 集成测试

- JWT 成功与失败连接。
- 用户、机构和会话房间隔离。
- 消息、接管、分配、评价和结束事件只发送到授权订阅者。
- 重复业务请求不产生重复实时事件。

### 12.4 前端测试与人工验收

- 消息发送失败重试与 `clientMessageId` 去重。
- Socket 断线提示、重连和 REST 补齐。
- 客户评价弹窗与提交后输入禁用。
- 不同角色操作按钮的显示和禁用状态。
- 通过 Nginx 同时登录客户与客服账号，验证完整双向流程。

## 13. 依赖与部署

后端新增：

- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `@nestjs/schedule`
- `socket.io`

前端新增：

- `socket.io-client`

Nginx `/socket.io/` 开启 WebSocket Upgrade 反向代理到 `127.0.0.1:4000`。REST 继续通过 `/api/` 代理。数据库迁移先于新后端发布，前端在新 API 和 Socket.IO 可用后发布。

## 14. 不在本阶段的范围

- AI 自动回复、AI 转人工和模型调用。
- 知识库检索与引用。
- 匿名访客会话。
- 微信、企业微信、电话和开放平台渠道。
- 图片、文件、语音和视频消息。
- Redis、BullMQ、Kafka 或多节点 Socket.IO Adapter。
- 复杂技能组路由、智能分配、坐席容量算法和 SLA 升级。

这些能力在人工闭环稳定后增量设计，不提前为其建立未使用的抽象。

## 15. 完成标准

- 客户、客服、机构管理员和超级管理员的权限符合本规范。
- 人工会话从创建、排队、接管、双向消息、退回/重新分配、结束到评价均真实落库。
- 2、3、5 分钟机制在应用重启后仍能继续执行。
- Socket.IO 实时事件可用，断线重连不会丢失最终业务状态。
- 前端核心会话页面不再依赖 `conversationsSeed` 运行。
- 后端单元测试、E2E、Socket.IO 集成测试和前端测试全部通过。
- Nginx 环境下完成客户与客服双端人工验收。
