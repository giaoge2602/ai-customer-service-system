# AI 智能客服后端 MVP 设计规格

## 1. 目标

在现有 React 前端演示仓库中新增一个独立的 NestJS 后端应用，交付一条可运行、可测试的客服业务主链路：用户登录、客户管理、会话创建、客服接管、发送文本回复和结束会话。

后端使用 MySQL 持久化数据，通过 JWT 承载用户和租户上下文，并对机构数据实施强制租户隔离。系统提供 Swagger 文档、数据库迁移、演示数据、自动化测试和本地启动说明。

## 2. 范围

### 2.1 包含范围

- NestJS REST API，统一路径前缀 `/api/v1`
- 健康检查
- 邮箱和密码登录
- 当前用户信息查询
- 三种角色：超级管理员、机构管理员、客服
- 机构级数据隔离
- 客户列表、详情、新增和修改
- 会话列表、创建、详情、接管、文本回复和结束
- MySQL 数据模型、Prisma 迁移和演示数据初始化
- Swagger API 文档
- 统一响应、参数校验、异常处理和请求追踪标识
- 核心单元测试和完整业务链路接口测试
- 仅包含 MySQL 8 的本地 Docker Compose

### 2.2 不包含范围

- Redis、MongoDB、PostgreSQL、pgvector、Elasticsearch 和 MinIO
- Tiledesk、FastGPT、OneAPI 和任何真实大模型调用
- WebSocket、消息队列、分布式锁、缓存和限流
- 注册邀请、密码找回、刷新令牌和单点登录
- 附件、图片、语音、实时通话和客户评价
- AI 自动回答、知识库、路由策略和报表
- 用户、角色、套餐、配额和租户的管理接口
- 对现有 React 前端进行 API 接入改造
- 微服务拆分、高可用和高并发设计

## 3. 技术与目录结构

### 3.1 技术栈

- Node.js 20 LTS
- NestJS
- TypeScript 严格模式
- Prisma ORM
- MySQL 8
- JWT
- bcrypt
- Swagger/OpenAPI
- Jest 与 Supertest
- npm

### 3.2 目录边界

后端代码全部位于仓库的 `backend/` 目录，拥有独立的 `package.json` 和 `package-lock.json`，不改变现有前端的构建方式。

```text
backend/
├── src/
│   ├── common/          # 响应、异常、请求标识、鉴权与租户边界
│   ├── health/          # 健康检查
│   ├── auth/            # 登录与当前用户
│   ├── customers/       # 客户管理
│   ├── conversations/   # 会话与消息操作
│   ├── prisma/          # Prisma 服务与生命周期管理
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/                # 接口测试
├── docker-compose.yml
├── .env.example
└── README.md
```

## 4. 应用架构

系统采用单进程、单实例的 NestJS 模块化单体。各业务模块通过 Prisma 访问同一个 MySQL 数据库，不引入缓存层、队列或内部 RPC。

模块职责如下：

- `health`：返回服务版本和运行状态，不访问外部服务。
- `auth`：校验邮箱和密码，签发 JWT，返回当前用户身份。
- `customers`：执行租户范围内的客户查询和维护。
- `conversations`：管理会话生命周期和文本消息。
- `prisma`：创建唯一的 Prisma 客户端并处理应用启动、关闭连接。
- `common`：提供 JWT 鉴权守卫、角色守卫、租户范围解析、DTO 校验、异常过滤和 `requestId`。

业务服务不得接受普通用户提交的 `tenantId` 作为数据范围。租户范围必须由已验证的 JWT 身份解析，并在 Prisma 查询条件中显式使用。

## 5. 身份、角色与租户隔离

### 5.1 JWT 载荷

JWT 至少包含以下字段：

```json
{
  "sub": "USR-TENANT-001",
  "role": "tenant_admin",
  "tenantId": "TENANT-018",
  "email": "admin@xinghe.demo"
}
```

超级管理员的 `tenantId` 为 `null`。令牌使用 `JWT_SECRET` 签名，有效期由 `JWT_EXPIRES` 配置，默认值为 `7d`。

### 5.2 角色权限

| 操作 | platform_admin | tenant_admin | agent |
| --- | --- | --- | --- |
| 健康检查 | 允许 | 允许 | 允许 |
| 登录、查询自己 | 允许 | 允许 | 允许 |
| 查询客户 | 指定租户后允许 | 本机构允许 | 本机构允许 |
| 新增、修改客户 | 指定租户后允许 | 本机构允许 | 禁止 |
| 查询会话 | 指定租户后允许 | 本机构允许 | 本机构允许 |
| 创建会话 | 指定租户后允许 | 本机构允许 | 本机构允许 |
| 接管、回复、结束会话 | 禁止 | 本机构允许 | 仅允许本人接管或已分配给本人的会话 |

超级管理员访问客户或会话接口时必须通过查询参数或请求体显式提供目标 `tenantId`。机构管理员和客服提交的 `tenantId` 不参与授权决策；系统始终使用 JWT 中的 `tenantId`。

### 5.3 密码安全

- 数据库只保存 bcrypt 密码哈希。
- 登录失败统一返回“账号或密码错误”，不透露账号是否存在。
- 演示账号密码仅由初始化脚本生成，生产环境必须在首次部署后更换。

## 6. 数据模型

所有主键使用字符串。演示数据保留现有前端使用的业务编号；新记录由服务端生成 UUID。

### 6.1 Tenant

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | String | 主键 |
| name | String | 必填 |
| status | Enum | `active`、`paused` |
| createdAt | DateTime | 自动生成 |
| updatedAt | DateTime | 自动更新 |

### 6.2 User

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | String | 主键 |
| tenantId | String? | 超级管理员为空，其他角色必填 |
| email | String | 全局唯一，统一转为小写 |
| passwordHash | String | 必填 |
| name | String | 必填 |
| role | Enum | `platform_admin`、`tenant_admin`、`agent` |
| status | Enum | `active`、`disabled` |
| createdAt | DateTime | 自动生成 |
| updatedAt | DateTime | 自动更新 |

### 6.3 Customer

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | String | 主键 |
| tenantId | String | 必填并建立索引 |
| name | String | 必填 |
| phone | String? | 可选 |
| email | String? | 可选 |
| source | String | 必填 |
| level | String | 必填 |
| tags | Json | 字符串数组，默认空数组 |
| createdAt | DateTime | 自动生成 |
| updatedAt | DateTime | 自动更新 |

### 6.4 Conversation

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | String | 主键 |
| tenantId | String | 必填并建立索引 |
| customerId | String | 必填 |
| agentId | String? | 未接管时为空 |
| channel | String | 必填 |
| status | Enum | `queued`、`human`、`ended` |
| priority | Enum | `normal`、`high`、`urgent` |
| startedAt | DateTime | 自动生成 |
| endedAt | DateTime? | 结束时写入 |
| createdAt | DateTime | 自动生成 |
| updatedAt | DateTime | 自动更新 |

### 6.5 Message

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | String | 主键 |
| tenantId | String | 必填并建立索引 |
| conversationId | String | 必填并建立索引 |
| senderType | Enum | `customer`、`agent`、`system` |
| senderId | String? | 客服消息填写用户 ID |
| content | String | 非空文本，限制最大长度 |
| createdAt | DateTime | 自动生成 |

`Customer`、`Conversation` 和 `Message` 均直接保存 `tenantId`，使每次查询都能在表级别实施租户过滤。关联对象的 `tenantId` 必须一致。

## 7. API 契约

### 7.1 通用响应

成功响应：

```json
{
  "code": 0,
  "data": {},
  "message": "ok",
  "requestId": "generated-request-id"
}
```

错误响应：

```json
{
  "code": 1001,
  "data": null,
  "message": "账号或密码错误",
  "requestId": "generated-request-id"
}
```

HTTP 状态码表达请求结果类别，业务错误码用于客户端稳定识别错误。数据库错误和堆栈信息不得返回客户端。

### 7.2 接口清单

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | 服务状态和版本 | 否 |
| POST | `/api/v1/auth/login` | 邮箱密码登录 | 否 |
| GET | `/api/v1/auth/me` | 当前用户信息 | 是 |
| GET | `/api/v1/customers` | 客户列表 | 是 |
| GET | `/api/v1/customers/:id` | 客户详情 | 是 |
| POST | `/api/v1/customers` | 新增客户 | 是 |
| PATCH | `/api/v1/customers/:id` | 修改客户 | 是 |
| GET | `/api/v1/conversations` | 会话列表 | 是 |
| POST | `/api/v1/conversations` | 创建会话和首条客户消息 | 是 |
| GET | `/api/v1/conversations/:id` | 会话和消息详情 | 是 |
| POST | `/api/v1/conversations/:id/claim` | 当前用户接管会话 | 是 |
| POST | `/api/v1/conversations/:id/messages` | 发送客服文本消息 | 是 |
| POST | `/api/v1/conversations/:id/end` | 结束会话 | 是 |

列表接口支持 `page` 和 `pageSize`，并返回 `items`、`page`、`pageSize` 和 `total`。客户列表支持 `search`；会话列表支持 `status`、`channel` 和 `customerId`。默认 `page=1`、`pageSize=20`，`pageSize` 最大为 100。

## 8. 核心业务规则

### 8.1 创建会话

1. 校验客户属于当前租户。
2. 创建状态为 `queued` 的会话。
3. 在同一数据库事务中创建第一条 `customer` 消息。
4. 返回创建后的会话摘要。

### 8.2 接管会话

1. 会话必须属于当前租户。
2. 会话状态必须为 `queued`。
3. 当前用户必须是 `agent` 或 `tenant_admin`。
4. 将 `agentId` 设置为当前用户，将状态更新为 `human`。
5. 写入一条 `system` 消息记录接管操作。

### 8.3 发送客服消息

1. 会话必须属于当前租户且状态为 `human`。
2. 客服角色只能向 `agentId` 等于自己的会话发送消息。
3. 机构管理员可向本机构处于 `human` 状态的会话发送消息。
4. 创建 `agent` 类型文本消息并返回消息对象。

### 8.4 结束会话

1. 会话必须属于当前租户且尚未结束。
2. 客服角色只能结束分配给自己的会话。
3. 将状态更新为 `ended` 并写入 `endedAt`。
4. 写入一条 `system` 消息记录结束操作。
5. 已结束会话不得再次接管或发送消息。

## 9. 校验与错误处理

- 全局启用 DTO 转换、白名单和未知字段拒绝。
- 邮箱在写入和查询前统一转为小写。
- 文本字段去除首尾空白；空消息被拒绝。
- 请求进入应用时生成或接受合法的 `X-Request-Id`，并将其写入响应头和响应体。
- 未认证返回 HTTP 401。
- 已认证但角色或租户不允许返回 HTTP 403。
- 资源在当前租户范围内不存在返回 HTTP 404，不暴露其他租户是否存在同一 ID。
- 会话状态不允许当前操作时返回 HTTP 409。
- DTO 校验失败返回 HTTP 400。
- 非预期错误返回 HTTP 500 和通用错误信息。

## 10. 演示数据

初始化脚本至少创建：

- 一个运行中的租户 `TENANT-018`，名称为“星河科技”。
- 三个与现有前端一致的账号：超级管理员、机构管理员和客服。
- 当前前端展示的四个客户。
- 当前前端展示的会话和文本消息样例，状态覆盖 `queued`、`human` 和 `ended`。

初始化脚本必须可重复运行，重复执行不得创建重复账号或重复演示记录。

## 11. 测试策略

### 11.1 单元测试

- 正确密码登录并签发包含角色和租户的 JWT。
- 错误邮箱或密码返回相同的认证错误。
- 机构用户的租户范围只能来自 JWT。
- 客服不能创建或修改客户。
- 客服不能操作分配给其他客服的会话。
- 已结束会话不能接管或发送消息。

### 11.2 接口测试

接口测试连接独立的 MySQL 测试数据库，至少验证：

1. 健康检查返回版本 `1.1.0` 和状态 `ok`。
2. 机构管理员登录成功。
3. 新建客户并能在本租户查询到。
4. 使用该客户创建会话和第一条消息。
5. 客服登录并接管会话。
6. 客服发送文本回复。
7. 客服结束会话。
8. 结束后再次发送消息返回 HTTP 409。
9. 另一租户身份不能读取该客户或会话。

## 12. 本地运行与配置

`backend/docker-compose.yml` 仅启动 MySQL 8，并创建开发数据库。应用从环境变量读取：

- `NODE_ENV`
- `PORT`，默认 `4000`
- `DATABASE_URL`
- `JWT_SECRET`，至少 32 个字符
- `JWT_EXPIRES`，默认 `7d`

`.env.example` 只提供非敏感示例值，真实 `.env` 必须被 Git 忽略。README 记录以下可复制执行的流程：安装依赖、启动 MySQL、运行迁移、初始化演示数据、启动开发服务、运行测试和打开 Swagger。

## 13. 验收标准

- `GET /api/v1/health` 返回 `{ code: 0, data: { status: "ok", version: "1.1.0" } }` 及 `requestId`。
- 三个演示账号可以登录并获得符合角色和租户定义的 JWT。
- 机构数据在 API 查询和修改中受到租户隔离。
- 客户和会话接口符合本规格的权限与状态规则。
- 完整链路接口测试通过。
- Prisma 迁移可在空 MySQL 数据库执行。
- 初始化脚本可重复执行。
- Swagger 能在 `/api/docs` 打开并展示全部 MVP 接口。
- 后端构建、测试和 lint 命令无错误退出。
- 现有 React 前端构建和测试不因新增后端目录而受影响。

