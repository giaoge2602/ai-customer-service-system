# AI 智能客服系统 V1（数据底座版）详细设计说明书

## 1. 文档说明

### 1.1 文档定位

本文档为《技术选型与实现说明书》的详细设计落地层，为研发提供可直接编码的数据库脚本、核心时序与接口契约。与既有系统架构完全一致：NestJS 模块化后端、PostgreSQL 业务实体库、MongoDB 会话消息库、Redis 状态缓存、Socket.io 实时通道。

### 1.2 架构对应关系

| 本文档章节 | 对应技术选型章节 | 交付物 |
| --- | --- | --- |
| 第 2 章 数据库设计 | 第 4 章 | PostgreSQL DDL + MongoDB 集合 + Redis 键 |
| 第 3 章 核心时序 | 第 5 章 | 消息收发时序、转人工/接管时序 |
| 第 4 章 接口契约 | 第 6 章 | REST 出入参 Schema + Socket.io 事件 |

### 1.3 命名与通用约定

1. PostgreSQL 表名/字段采用 snake_case，主键统一 `BIGSERIAL`（users 用 UUID）；
2. MongoDB 集合/字段采用 camelCase；
3. 所有业务表包含 `tenant_id`（平台级表除外），并建立 `(tenant_id, xxx)` 复合索引；
4. 时间统一 `TIMESTAMPTZ`（PG）/ `ISODate`（Mongo）；
5. 软删除统一 `deleted_at` 字段；审计统一写入 `audit_logs`。

## 2. 数据库设计（综合）

### 2.1 数据库总览

| 存储 | 用途 | 对象 |
| --- | --- | --- |
| PostgreSQL | 业务实体（事务强一致） | 7 张表：tenants / packages / users / roles / customers / audit_logs / api_keys |
| MongoDB | 会话与消息（高写入、水平扩展） | 4 个集合：sessions / messages / session_events / evaluations |
| Redis | 状态、缓存、限流 | 7 类键（见 2.4） |

### 2.2 PostgreSQL 建表脚本（DDL）

```sql
-- ============================================================
-- AI 智能客服系统 V1 · PostgreSQL 16 建表脚本
-- 库：ai_cs_v1  字符集：UTF8
-- ============================================================
CREATE DATABASE ai_cs_v1 ENCODING 'UTF8';

-- 1. 套餐表 packages
CREATE TABLE packages (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(50)  NOT NULL UNIQUE,           -- 套餐名
    code          VARCHAR(30)  NOT NULL UNIQUE,           -- 编码：trial/team/enterprise/flag
    seat_limit    INTEGER      NOT NULL DEFAULT 10,       -- 坐席上限
    token_limit   BIGINT       NOT NULL DEFAULT 1000000,  -- AI Token 月配额
    kb_limit_gb   INTEGER      NOT NULL DEFAULT 10,       -- 知识库容量 GB
    price_month   NUMERIC(10,2) NOT NULL DEFAULT 0,       -- 月价
    sort_order    INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE packages IS '套餐与配额定义（平台级）';

-- 2. 租户表 tenants
CREATE TABLE tenants (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,                    -- 租户名称
    code        VARCHAR(30)  NOT NULL UNIQUE,             -- 租户编码（子域名/API）
    package_id  BIGINT       NOT NULL REFERENCES packages(id),
    status      VARCHAR(20)  NOT NULL DEFAULT 'trial',    -- trial/normal/arrears/disabled/cancelled
    quota_json  JSONB        NOT NULL DEFAULT '{}',       -- 配额快照：seat/token/kb 已用量
    expire_at   TIMESTAMPTZ  NOT NULL,                    -- 到期时间
    contact_name VARCHAR(50),
    contact_phone VARCHAR(20),
    created_by  BIGINT,                                   -- 创建人（超级管理员）
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ                               -- 软删除
);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_package ON tenants(package_id);
CREATE INDEX idx_tenants_expire  ON tenants(expire_at);
COMMENT ON TABLE tenants IS '租户（机构）';

-- 3. 用户表 users（客服/管理员/超级管理员）
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      BIGINT,                                -- NULL=平台级（超级管理员）
    account        VARCHAR(64)  NOT NULL,                 -- 登录账号（手机号/邮箱）
    password_hash  VARCHAR(128) NOT NULL,
    name           VARCHAR(50)  NOT NULL,
    role_id        BIGINT       REFERENCES roles(id),     -- 角色（见 roles 表）
    user_type      VARCHAR(20)  NOT NULL DEFAULT 'agent', -- super_admin/tenant_admin/supervisor/agent
    status         VARCHAR(20)  NOT NULL DEFAULT 'pending', -- pending/normal/disabled/resigned
    max_concurrent INTEGER      NOT NULL DEFAULT 5,       -- 最大同时接待
    login_methods  VARCHAR(50)  NOT NULL DEFAULT 'password', -- password/sms/2fa 组合
    last_login_at  TIMESTAMPTZ,
    last_login_ip  INET,
    must_change_pwd BOOLEAN     NOT NULL DEFAULT true,    -- 首次登录强制改密
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ,
    UNIQUE (tenant_id, account)
);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role   ON users(role_id);
COMMENT ON TABLE users IS '用户（客服/租户管理员/超级管理员）';

-- 4. 角色表 roles
CREATE TABLE roles (
    id             BIGSERIAL PRIMARY KEY,
    tenant_id      BIGINT,                                -- NULL=平台级角色
    name           VARCHAR(50) NOT NULL,
    permissions    JSONB       NOT NULL DEFAULT '[]',     -- 权限编码数组
    scope          VARCHAR(20) NOT NULL DEFAULT 'tenant', -- platform/tenant
    is_builtin     BOOLEAN     NOT NULL DEFAULT false,    -- 内置角色不可删
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
COMMENT ON TABLE roles IS '角色（RBAC）';

-- 5. 客户表 customers
CREATE TABLE customers (
    id             BIGSERIAL PRIMARY KEY,
    tenant_id      BIGINT      NOT NULL,
    name           VARCHAR(50),
    phone          VARCHAR(20),                           -- 敏感字段（AES-256 加密）
    email          VARCHAR(100),                          -- 敏感字段
    source         VARCHAR(30) NOT NULL DEFAULT 'web',    -- web/openapi/import
    tags           JSONB       NOT NULL DEFAULT '[]',     -- 标签数组
    level          VARCHAR(20) NOT NULL DEFAULT 'normal', -- vip/high/normal/low
    custom_fields  JSONB       NOT NULL DEFAULT '{}',     -- 租户自定义字段
    consent_status VARCHAR(20) NOT NULL DEFAULT 'granted',-- granted/withdrawn
    remark         TEXT,
    last_contact_at TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ
);
CREATE INDEX idx_customers_tenant   ON customers(tenant_id);
CREATE INDEX idx_customers_phone    ON customers(tenant_id, phone);
CREATE INDEX idx_customers_tags     ON customers USING GIN(tags);
CREATE INDEX idx_customers_consent  ON customers(tenant_id, consent_status);
COMMENT ON TABLE customers IS '客户档案（敏感字段加密存储）';

-- 6. 审计日志表 audit_logs
CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT,                                   -- 平台级操作可为 NULL
    operator_id BIGINT,
    operator_name VARCHAR(50),
    action      VARCHAR(50)  NOT NULL,                    -- login/create_tenant/change_role/...
    target_type VARCHAR(30)  NOT NULL,
    target_id   VARCHAR(64),
    before_data JSONB,
    after_data  JSONB,
    ip          INET,
    user_agent  TEXT,
    request_id  VARCHAR(64),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_operator    ON audit_logs(operator_id);
CREATE INDEX idx_audit_action      ON audit_logs(action);
CREATE INDEX idx_audit_request     ON audit_logs(request_id);
COMMENT ON TABLE audit_logs IS '操作审计（只追加不可改）';

-- 7. Open API 密钥表 api_keys
CREATE TABLE api_keys (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT      NOT NULL,
    name        VARCHAR(50) NOT NULL,
    key_hash    VARCHAR(128) NOT NULL UNIQUE,             -- SHA-256 哈希存储
    key_prefix  VARCHAR(12) NOT NULL,                     -- 展示用前缀
    scopes      JSONB       NOT NULL DEFAULT '[]',        -- session/message/customer/...
    quota_day   INTEGER     NOT NULL DEFAULT 10000,       -- 日调用配额
    used_today  INTEGER     NOT NULL DEFAULT 0,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',    -- active/disabled
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ
);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
COMMENT ON TABLE api_keys IS 'Open API 访问密钥';
```

### 2.3 MongoDB 集合定义

```javascript
// ============================================================
// MongoDB 7 集合定义 · 库：ai_cs_v1_chat
// ============================================================

// 1. sessions 会话集合
db.createCollection('sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tenantId', 'status', 'channel', 'createdAt'],
      properties: {
        tenantId:     { bsonType: 'long' },
        status:       { enum: ['NEW','AI_HANDLING','QUEUED','HUMAN_HANDLING','TRANSFERRED','ENDED','EVALUATED'] },
        channel:      { enum: ['web_widget','web_page','openapi'] },
        priority:     { enum: ['vip','high','normal','low'] },
        customerId:   { bsonType: 'long' },
        customerName: { bsonType: 'string' },
        agentId:      { bsonType: 'long' },
        skillGroupId: { bsonType: 'long' },
        aiSummary:    { bsonType: 'string' },
        transferReason:{ bsonType: 'string' },
        aiConfidence: { bsonType: 'double' },
        slaResponseAt:{ bsonType: 'date' },
        lastMessageAt:{ bsonType: 'date' },
        unreadCount:  { bsonType: 'int' },
        createdAt:    { bsonType: 'date' },
        endedAt:      { bsonType: 'date' }
      }
    }
  }
});
// 索引
db.sessions.createIndex({ tenantId: 1, status: 1, createdAt: -1 });
db.sessions.createIndex({ tenantId: 1, agentId: 1, status: 1 });
db.sessions.createIndex({ tenantId: 1, customerId: 1, createdAt: -1 });
db.sessions.createIndex({ status: 1, slaResponseAt: 1 });   // SLA 巡检

// 2. messages 消息集合
db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tenantId', 'sessionId', 'senderType', 'msgType', 'content', 'ts'],
      properties: {
        tenantId:    { bsonType: 'long' },
        sessionId:   { bsonType: 'objectId' },
        senderType:  { enum: ['customer','agent','ai','system'] },
        senderId:    { bsonType: 'long' },
        msgType:     { enum: ['text','richtext','image','file','system'] },
        content:     { bsonType: 'string' },
        fileId:      { bsonType: 'string' },
        fileName:    { bsonType: 'string' },
        fileSize:    { bsonType: 'long' },
        aiQuote:     { bsonType: 'array' },               // AI 引用知识条目
        clientMsgId: { bsonType: 'string' },              // 客户端去重 ID
        ts:          { bsonType: 'date' }
      }
    }
  }
});
// 索引
db.messages.createIndex({ sessionId: 1, ts: 1 });
db.messages.createIndex({ tenantId: 1, ts: -1 });
db.messages.createIndex({ clientMsgId: 1 }, { unique: true, sparse: true });

// 3. session_events 会话事件轨迹
db.createCollection('session_events', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sessionId', 'eventType', 'ts'],
      properties: {
        sessionId:  { bsonType: 'objectId' },
        eventType:  { enum: ['created','ai_handling','queued','assigned','transferred','ended','evaluated','ai_summary'] },
        fromStatus: { bsonType: 'string' },
        toStatus:   { bsonType: 'string' },
        actorType:  { bsonType: 'string' },
        actorId:    { bsonType: 'long' },
        payload:    { bsonType: 'object' },
        ts:         { bsonType: 'date' }
      }
    }
  }
});
db.session_events.createIndex({ sessionId: 1, ts: 1 });

// 4. evaluations 满意度评价
db.createCollection('evaluations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sessionId', 'tenantId', 'rating', 'createdAt'],
      properties: {
        sessionId:  { bsonType: 'objectId' },
        tenantId:   { bsonType: 'long' },
        customerId: { bsonType: 'long' },
        agentId:    { bsonType: 'long' },
        rating:     { bsonType: 'int', minimum: 1, maximum: 5 },
        tags:       { bsonType: 'array' },
        comment:    { bsonType: 'string', maxLength: 200 },
        createdAt:  { bsonType: 'date' }
      }
    }
  }
});
db.evaluations.createIndex({ sessionId: 1 }, { unique: true });
db.evaluations.createIndex({ tenantId: 1, createdAt: -1 });
db.evaluations.createIndex({ agentId: 1, createdAt: -1 });
```

### 2.4 Redis 键设计

| 键 | 类型 | 用途 | TTL |
| --- | --- | --- | --- |
| online:{agent_id} | Hash | 客服在线状态（socket_id, since） | 心跳刷新 |
| session:{session_id} | Hash | 会话实时状态缓存 | 会话期间 |
| unread:{agent_id} | String | 未读会话数 | 无 |
| token:blacklist:{jti} | String | 注销 Token | Access TTL |
| rate:limit:{key} | ZSet | 滑动窗口限流 | 窗口期 |
| queue:{skill_group_id} | List | 排队会话 | 排队期间 |
| room:session:{session_id} | Set | 会话房间成员 socket_id | 会话期间 |

## 3. 核心时序

### 3.1 客户发消息 → 落库 → 广播 → 多端同步

| 步骤 | 发送方 | 接收方 | 事件/操作 | 说明 |
| --- | --- | --- | --- | --- |
| 1 | 客户（Web Widget） | NestJS Gateway | `client:send` | 携带 sessionId、content、clientMsgId |
| 2 | Gateway | MessageService | 内部调用 | 校验会话状态与权限 |
| 3 | MessageService | MongoDB messages | insertOne | 落库（含去重 clientMsgId） |
| 4 | MessageService | Redis | 更新会话缓存 | lastMessageAt、unreadCount+1 |
| 5 | MessageService | SessionService | 更新会话 | 非终态时更新 lastMessageAt |
| 6 | Gateway | 客服端（房间内） | `server:message` | 广播到 session 房间 |
| 7 | Gateway | 客服端 | `server:unread` | 更新该客服未读数 |
| 8 | 客服端 | Gateway | `server:ack`（自动） | Socket.io ack 确认送达 |

时序要点：客户端重连后以 `lastMessageId` 拉取补发；消息送达率目标 ≥99.99%。

### 3.2 AI 转人工 / 人工接管时序

| 步骤 | 发送方 | 接收方 | 事件/操作 | 说明 |
| --- | --- | --- | --- | --- |
| 1 | AI 客服 | SessionService | 触发转人工 | 低置信度/客户要求/命中敏感规则 |
| 2 | SessionService | MongoDB sessions | 状态变更 | AI_HANDLING → QUEUED |
| 3 | SessionService | MongoDB session_events | 写入轨迹 | eventType=queued，记录原因 |
| 4 | 路由引擎 | Redis queue | 入队 | 按技能组 push 到 queue:{skill_group} |
| 5 | 路由引擎 | 在线客服 | `server:session:status` | 广播"有排队会话"（含摘要） |
| 6 | 客服 | NestJS | `POST /session/:id/assign` | 点击接管，携带确认 |
| 7 | SessionService | MongoDB sessions | 状态变更 | QUEUED → HUMAN_HANDLING，写入 agentId |
| 8 | SessionService | MongoDB messages | 插入系统消息 | "客服 XX 已接管会话" |
| 9 | Gateway | 客户 + 客服 | `server:session:status` | 广播接管状态与 AI 摘要 |
| 10 | SessionService | AuditModule | 写审计 | 记录接管人与时间 |

接管约束：同一会话仅一个主接待者有发送权限；摘要生成失败时展示原始消息不阻塞接管；接管超时触发 SLA 提醒。

## 4. 接口契约（出入参定义）

> 统一约定：Base URL `/api/v1`；认证 `Authorization: Bearer <access_token>`；错误响应统一 `{ "code": <业务码>, "message": "..." }`。

### 4.1 REST API

#### 4.1.1 认证 Auth

**POST /auth/login** — 登录

```json
// 请求
{ "account": "13800138000", "password": "P@ssw0rd", "tenantCode": "demo" }
// 响应 200
{ "accessToken": "eyJhbGci...", "refreshToken": "eyJhbGci...", "expiresIn": 7200,
  "user": { "id": "uuid", "name": "李总", "userType": "tenant_admin", "tenantId": 1 } }
// 错误：400 参数错误 / 401 账号或密码错误 / 403 账号停用
```

**POST /auth/refresh** — 刷新 Token

```json
// 请求
{ "refreshToken": "eyJhbGci..." }
// 响应 200
{ "accessToken": "eyJhbGci...", "expiresIn": 7200 }
```

**POST /auth/change-password** — 修改密码

```json
// 请求
{ "oldPassword": "old123", "newPassword": "New@12345" }
// 响应 200
{ "message": "ok" }
// 错误：400 新密码不满足策略 / 401 原密码错误
```

#### 4.1.2 平台管理 Platform

**GET /platform/overview** — 平台看板（F-004）

```json
// 响应 200
{ "totalTenants": 128, "onlineTenants": 96, "totalAgents": 1842, "todaySessions": 512,
  "aiResolutionRate": 0.724, "aiAvgResponseMs": 1800, "availability30d": 0.9995, "activeAlerts": 3 }
```

**POST /platform/tenants** — 创建租户（F-001/002）

```json
// 请求
{ "name": "示例科技", "code": "demo", "packageCode": "enterprise",
  "contactName": "王总", "contactPhone": "13900000000", "expireAt": "2026-11-15" }
// 响应 201
{ "id": 1, "name": "示例科技", "code": "demo", "status": "trial", "expireAt": "2026-11-15" }
```

**GET /platform/tenants** — 租户列表（分页筛选）

```json
// Query: ?page=1&pageSize=20&keyword=demo&status=normal
// 响应 200
{ "total": 128, "list": [
  { "id": 1, "name": "示例科技", "code": "demo", "packageName": "企业版",
    "status": "normal", "seatUsed": 32, "seatLimit": 50, "tokenUsedPct": 0.82, "expireAt": "2026-11-15" } ] }
```

**PATCH /platform/tenants/:id** — 编辑租户/配额（F-002）

```json
// 请求
{ "packageCode": "flag", "expireAt": "2027-01-01", "quotaAdjust": { "seat": 100, "token": 20000000 } }
// 响应 200
{ "id": 1, "status": "normal", "expireAt": "2027-01-01" }
```

**DELETE /platform/tenants/:id** — 停用/注销租户（软删除）

```json
// 响应 200
{ "message": "ok", "auditId": 8821 }
```

**GET /platform/models** · **POST /platform/models** — AI 模型管理（F-003/018）

```json
// GET 响应
{ "list": [ { "id": 1, "name": "DeepSeek-V3", "provider": "deepseek",
  "endpoint": "https://api.deepseek.com/v1", "modelId": "deepseek-chat",
  "deployMode": "cloud", "capabilities": ["chat"], "status": "active" } ] }
// POST 请求
{ "name": "GLM-4", "provider": "zhipu", "endpoint": "https://open.bigmodel.cn/api/paas/v4",
  "apiKey": "sk-xxx", "modelId": "glm-4", "deployMode": "cloud",
  "capabilities": ["chat", "embedding"], "tpmLimit": 100000, "rpmLimit": 1000 }
```

**GET /platform/audit-logs** — 审计日志（F-038）

```json
// Query: ?page=1&tenantId=1&operator=admin&action=create_tenant&start=2026-08-01&end=2026-08-21
// 响应
{ "total": 120, "list": [ { "id": 1, "time": "2026-08-21T10:00:00Z", "operator": "Super Admin",
  "action": "create_tenant", "target": "tenant:1", "ip": "10.0.0.1", "requestId": "req_abc123" } ] }
```

#### 4.1.3 租户运营 Tenant

**POST /tenant/agents** — 创建客服账号（F-006）

```json
// 请求
{ "name": "小李", "account": "xiaoli@demo.com", "roleIds": [2],
  "loginMethods": ["password", "2fa"], "maxConcurrent": 5, "invite": true }
// 响应 201
{ "id": "uuid", "name": "小李", "status": "pending", "inviteLink": "https://.../invite/abc", "inviteExpireAt": "2026-08-24" }
```

**PATCH /tenant/agents/:id** — 修改/启停/重置密码（F-006）

```json
// 请求
{ "status": "disabled", "resetPassword": false }
// 响应 200
{ "id": "uuid", "status": "disabled" }
```

**GET /tenant/agents** — 客服列表

```json
// Query: ?page=1&keyword=李&status=normal
// 响应
{ "total": 32, "list": [ { "id": "uuid", "name": "小李", "account": "xiaoli@demo.com",
  "roles": ["客服人员"], "status": "normal", "maxConcurrent": 5, "lastLoginAt": "2026-08-21T09:00:00Z" } ] }
```

**POST /tenant/roles** — 创建角色（F-005）

```json
// 请求
{ "name": "售后组长", "permissions": ["session:view", "session:assign", "agent:view"], "scope": "tenant" }
// 响应 201
{ "id": 5, "name": "售后组长" }
```

**GET /tenant/customers** — 客户列表（F-010）

```json
// Query: ?page=1&keyword=王&tags=vip&source=web
// 响应
{ "total": 500, "list": [ { "id": 1001, "name": "王女士", "phone": "138****8000",
  "email": "w**@demo.com", "source": "web", "tags": ["vip"], "level": "vip",
  "lastContactAt": "2026-08-21T08:30:00Z" } ] }
// 说明：phone/email 按权限脱敏返回
```

**GET /tenant/customers/:id** — 客户详情

```json
// 响应
{ "id": 1001, "name": "王女士", "phone": "138****8000", "source": "web",
  "tags": ["vip"], "level": "vip", "customFields": { "orderNo": "A20260819001" },
  "consentStatus": "granted",
  "recentSessions": [ { "sessionId": "65c9...", "status": "ENDED", "createdAt": "2026-08-20T10:00:00Z" } ] }
```

**GET /tenant/channels/widget** — Web Widget 配置（F-029/035）

```json
// 响应
{ "themeColor": "#2563EB", "position": "bottom-right", "welcomeText": "您好，请问有什么可以帮您？",
  "mode": "ai_first", "visitorIdentify": "anonymous", "offlineForm": { "enabled": true, "fields": ["name","phone"] },
  "snippet": "<script src=\"https://widget.demo.com/sdk.js\" data-tenant=\"demo\"></script>" }
```

#### 4.1.4 会话 Session

**GET /session/list** — 会话列表（客服工作台，F-020）

```json
// Query: ?status=QUEUED&channel=web_widget&page=1&pageSize=20
// 响应
{ "total": 12, "list": [ { "sessionId": "65c9...", "customerName": "陈先生",
  "status": "AI_HANDLING", "channel": "web_widget", "priority": "normal",
  "unreadCount": 3, "lastMessage": "订单什么时候到？", "aiConfidence": 0.62,
  "slaRemainSec": 95, "assignedAgentId": null, "lastMessageAt": "2026-08-21T11:20:00Z" } ] }
```

**POST /session/:id/assign** — 客服接管（F-020）

```json
// 请求
{ "acknowledge": true }
// 响应 200
{ "sessionId": "65c9...", "status": "HUMAN_HANDLING", "agentId": 100,
  "aiSummary": "客户咨询订单物流，AI 已回答 2 次，置信度 0.38",
  "transferReason": "AI 置信度低于阈值",
  "historyCount": 8 }
```

**POST /session/:id/transfer** — 转接（F-020）

```json
// 请求
{ "targetAgentId": 200, "skillGroupId": 3, "reason": "客户要求售后组" }
// 响应 200
{ "sessionId": "65c9...", "status": "TRANSFERRED", "toAgentId": 200 }
```

**POST /session/:id/end** — 结束会话（F-020）

```json
// 请求
{ "endReason": "resolved", "sendEvaluation": true }
// 响应 200
{ "sessionId": "65c9...", "status": "ENDED", "evaluationSent": true }
```

**GET /session/:id/messages** — 历史消息（游标分页，F-019）

```json
// Query: ?cursor=65c9...&limit=50
// 响应
{ "nextCursor": "65cb...", "list": [
  { "id": "65cc...", "senderType": "customer", "msgType": "text",
    "content": "订单什么时候到？", "ts": "2026-08-21T11:15:00Z" },
  { "id": "65cd...", "senderType": "ai", "msgType": "text",
    "content": "已为您查询到…", "aiQuote": [{ "kbId": 12, "title": "物流时效说明" }], "ts": "2026-08-21T11:15:02Z" } ] }
```

**GET /search/sessions** — 会话检索（F-037）

```json
// Query: ?keyword=订单&customer=王&agent=小李&channel=web_widget&start=2026-08-01&end=2026-08-21&page=1
// 响应
{ "total": 23, "list": [ { "sessionId": "65c9...", "customerName": "王女士",
  "agentName": "小李", "status": "ENDED", "messageCount": 12, "satisfaction": 5,
  "createdAt": "2026-08-20T10:00:00Z" } ] }
```

### 4.2 Socket.io 事件

#### 4.2.1 client:send（客户/客服 → 服务端）

```json
// 客户端发送
{ "event": "client:send", "data": {
    "sessionId": "65c9...", "senderType": "customer",
    "msgType": "text", "content": "订单什么时候到？", "clientMsgId": "c-001" } }
// 服务端 ack（送达确认）
{ "ok": true, "messageId": "65cc...", "ts": "2026-08-21T11:15:00Z" }
// 失败：{ "ok": false, "code": 4001, "message": "会话已结束" }
```

#### 4.2.2 server:message（服务端 → 房间广播）

```json
{ "event": "server:message", "data": {
    "sessionId": "65c9...", "message": { "id": "65cc...", "senderType": "customer",
    "msgType": "text", "content": "订单什么时候到？", "ts": "2026-08-21T11:15:00Z" } } }
```

#### 4.2.3 server:session:status（服务端 → 状态变更广播）

```json
{ "event": "server:session:status", "data": {
    "sessionId": "65c9...", "fromStatus": "AI_HANDLING", "toStatus": "QUEUED",
    "transferReason": "AI 置信度低于阈值", "aiSummary": "客户咨询订单物流",
    "queuePosition": 2, "ts": "2026-08-21T11:16:00Z" } }
```

#### 4.2.4 server:typing（服务端 → 输入状态）

```json
{ "event": "server:typing", "data": { "sessionId": "65c9...", "senderType": "agent", "typing": true } }
```

#### 4.2.5 server:unread（服务端 → 未读数）

```json
{ "event": "server:unread", "data": { "agentId": 100, "totalUnread": 8, "sessions": [ { "sessionId": "65c9...", "unreadCount": 3 } ] } }
```

#### 4.2.6 server:online（服务端 → 在线状态）

```json
{ "event": "server:online", "data": { "agentId": 100, "online": true, "maxConcurrent": 5, "currentSessions": 3, "ts": "2026-08-21T11:00:00Z" } }
```

## 5. 通用错误码

| 错误码 | HTTP | 含义 |
| --- | --- | --- |
| 4000 | 400 | 参数校验失败 |
| 4001 | 400 | 会话状态不允许该操作 |
| 4010 | 401 | Token 无效或过期 |
| 4030 | 403 | 无权限（RBAC 拒绝） |
| 4031 | 403 | 租户数据越权 |
| 4040 | 404 | 资源不存在 |
| 4290 | 429 | 触发限流 |
| 5000 | 500 | 服务内部错误 |
