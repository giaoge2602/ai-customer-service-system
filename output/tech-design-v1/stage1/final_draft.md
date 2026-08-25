# AI 智能客服系统 V1（数据底座版）技术选型与实现说明书

## 1. 文档说明

### 1.1 文档定位

本文档基于《AI 智能客服系统 V1（数据底座版）设计文档（简化版）》，为产品、研发、测试提供 V1 数据底座版的技术实现基线。内容覆盖技术选型、系统架构、模块划分、数据库设计、核心实现方案、接口契约、安全与部署，以及实施计划。

### 1.2 依据与口径

本文档遵循 PRD V1.2 的技术口径：后端主路线采用 Node.js/NestJS；存储采用 MongoDB 存储会话/消息，PostgreSQL+pgvector 存储向量数据；产品需求保持技术中立，研发以本文档为工程基线。

### 1.3 设计原则

1. 数据底座优先：核心实体 CRUD 与三端协同先行，业务能力（AI、路由、报表）以接口占位 + 数据预留方式接入二期；
2. 租户隔离是硬约束：所有业务对象强制 tenant_id，数据访问层二次注入；
3. 实时性优先：消息与会话状态通过 Socket.io 实时推送，断线重连后数据一致；
4. 可水平扩展：无状态服务 + 外部化中间件，支撑并发会话≥5000。

## 2. 技术选型

### 2.1 技术栈总览

| 层次 | 选型 | 版本 | 选型理由 |
| --- | --- | --- | --- |
| 前端框架 | React + Vite | React 19 / Vite 7 | 组件化、生态成熟、热更新快 |
| 前端语言 | TypeScript | 5.x | 类型安全，三端共享类型定义 |
| 后端框架 | NestJS (Node.js) | NestJS 10 / Node 22 | 模块化、装饰器 DI、与 TS 天然契合 |
| 实时通信 | Socket.io | 4.x | 自动重连、房间机制、多端广播成熟 |
| 业务库 | PostgreSQL | 16 | 事务强一致，支撑租户/客服/客户等实体 |
| 会话/消息库 | MongoDB | 7 | 消息高写入、灵活 schema、水平分片 |
| 向量库 | pgvector (PostgreSQL 插件) | 0.7+ | 二期 RAG 检索，与业务库同源 |
| 缓存 | Redis | 7 | 会话状态、在线状态、Token 黑名单、限流 |
| 任务队列 | BullMQ | 5.x | 异步任务（通知、导入导出、清洗） |
| 认证 | JWT + Passport | — | Access 2h + Refresh 7d，RBAC |
| 文件存储 | MinIO / 对象存储 | — | 消息附件、头像、知识文档 |
| 搜索（二期） | Elasticsearch | 8.x | 会话全文检索 |
| 监控 | Prometheus + Grafana + ELK | — | 指标、日志、告警、追踪 |
| 容器化 | Docker + Docker Compose | — | 本地开发与生产部署 |
| 编排（可选） | Kubernetes | 1.3x | 生产环境水平扩容 |

### 2.2 关键技术选型决策

1. **后端为何选 NestJS 而非 Spring Boot**：PRD 技术口径主路线为 Node.js/NestJS；NestJS 的模块化/DI/装饰器与 TypeScript 类型安全契合多租户与微服务拆分；Node 异步 IO 适合高并发消息场景。
2. **双库架构**：PostgreSQL 负责事务型业务实体（租户、客服、客户、权限）；MongoDB 负责高写入、无固定 schema 的会话与消息；向量检索用 pgvector 同库插件，减少组件。
3. **实时通道**：Socket.io + Redis Adapter 实现多实例广播，支持水平扩展。
4. **前端三端一套代码库**：React + Vite monorepo，三端（平台后台/租户后台/客服工作台）共用组件库与 API 客户端，仅路由与权限菜单不同。

## 3. 系统架构

### 3.1 分层架构

| 层 | 说明 |
| --- | --- |
| 客户端层 | 平台管理后台（Web）、租户运营后台（Web）、PC 客服工作台（Web）、客户 Web Widget |
| 接入层 | Nginx 网关 + WSS 反向代理 |
| 应用层 | NestJS 服务（Auth/Platform/Tenant/Agent/Customer/Session/Message/Channel/Audit） |
| 数据层 | PostgreSQL（业务实体）、MongoDB（会话/消息）、Redis（状态/缓存）、MinIO（文件） |
| 基础设施 | Docker/K8s、Prometheus、Grafana、ELK |

### 3.2 模块划分（NestJS Module）

| 模块 | 职责 | 对应系统 |
| --- | --- | --- |
| AuthModule | 登录、JWT、刷新、2FA、密码管理 | 系统 5 |
| PlatformModule | 平台看板、租户管理、套餐配额 | 系统 1 |
| ConfigModule | 平台配置、AI 模型、第三方参数 | 系统 1 |
| AuditModule | 审计日志、合规拦截 | 系统 1 |
| TenantModule | 租户内组织、客服账号、角色权限 | 系统 2 |
| CustomerModule | 客户档案、标签、导入导出 | 系统 2 |
| ChannelModule | Web Widget、Open API | 系统 2 |
| SearchModule | 会话检索（一期基础版，二期 ES） | 系统 2 |
| SessionModule | 会话生命周期、状态机 | 系统 3/4 |
| MessageModule | 消息收发、附件、多端同步 | 系统 3/4 |
| GatewayModule | Socket.io 网关、房间、事件 | 系统 3/4 |

### 3.3 部署架构

```
[浏览器/Widget] → Nginx (WSS/TLS) → NestJS 集群 (无状态, 水平扩展)
                                        ├─ PostgreSQL (主从)
                                        ├─ MongoDB (复制集)
                                        ├─ Redis (主从/哨兵)
                                        ├─ MinIO (对象存储)
                                        └─ BullMQ Worker (异步)
```

## 4. 数据库设计

### 4.1 PostgreSQL（业务实体）

| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| tenants | id, name, code, package_id, status, quota_json, expire_at | 租户，platform 级 |
| packages | id, name, seat_limit, token_limit, kb_limit, price | 套餐 |
| users | id, tenant_id, account, password_hash, name, role_id, status | 用户（客服/管理员） |
| roles | id, tenant_id, name, permissions_json | 角色 |
| customers | id, tenant_id, name, phone, email, source, tags, level, custom_fields | 客户档案 |
| agent_customer | agent_id, customer_id, ... | 客服-客户关系 |
| audit_logs | id, tenant_id, operator, action, target, before, after, ip, ua | 审计 |
| api_keys | id, tenant_id, key_hash, name, scopes, quota | Open API 密钥 |

所有业务表包含 tenant_id，并建立 (tenant_id, xxx) 复合索引；敏感字段加密存储。

### 4.2 MongoDB（会话/消息）

| 集合 | 关键字段 | 说明 |
| --- | --- | --- |
| sessions | _id, tenant_id, status, channel, priority, customer_id, agent_id, sla | 会话，含状态机字段 |
| messages | _id, tenant_id, session_id, sender_type, sender_id, msg_type, content, file_id, ts | 消息（文本/图片/文件/系统） |
| session_events | _id, session_id, event_type, payload, ts | 会话事件轨迹（转接/接管/结束） |
| evaluations | _id, session_id, customer_id, rating, tags, comment | 满意度评价 |

设计要点：会话与消息按 tenant_id 分片；消息设置 TTL 索引支持近期检索；消息写入采用批量/异步落库保证吞吐。

### 4.3 Redis（状态/缓存）

| key | 用途 |
| --- | --- |
| online:{agent_id} | 客服在线状态 |
| session:{session_id} | 会话实时状态缓存 |
| unread:{agent_id} | 未读数 |
| token:blacklist:{jti} | Token 注销 |
| rate:limit:{key} | 限流计数 |
| queue:{skill_group} | 排队会话 |

## 5. 核心实现方案

### 5.1 多租户隔离

1. JWT 携带 user_id、tenant_id、role、permissions；
2. NestJS 中间件解析 token 注入请求上下文（RequestContext）；
3. 数据访问层统一拦截：查询强制拼接 tenant_id 条件（TypeORM Filter / Mongoose Middleware）；
4. 跨租户访问（超级管理员查看汇总）显式切换上下文并记审计。

### 5.2 RBAC 权限

- 菜单权限：前端根据 permissions 渲染可见菜单；
- 操作权限：后端 Guard + 装饰器（@RequirePermission('tenant:create')）校验；
- 数据权限：本人/本组/本租户/全部四级，查询条件注入。

### 5.3 会话状态机

```
NEW → AI_HANDLING → QUEUED → HUMAN_HANDLING → TRANSFERRED → ENDED → EVALUATED
```

实现：状态机引擎（如 xstate）或自研状态守卫；所有状态变更写 session_events；非法流转拒绝并告警；转人工携带上下文（历史、客户、摘要、原因）。

### 5.4 实时消息通道（Socket.io）

1. 客户端连接后认证（JWT）；
2. 加入房间：客户加入 session:{id}，客服加入 agent:{id} + tenant:{id}；
3. 消息事件：client:send → 服务端校验/落库 → server:message 广播到房间；
4. Redis Adapter 支持多实例广播；
5. 断线重连：客户端自动重连 + 消息偏移补拉（lastMessageId）。

### 5.5 消息与附件

- 消息类型：文本/富文本/图片/文件/系统消息；
- 附件：客户端直传 MinIO（预签名 URL）→ 返回 file_id → 消息引用；
- 单文件限制 50MB，图片自动压缩。

### 5.6 AI 通道预留（二期）

- Provider 抽象接口（DeepSeek/通义/GLM/OpenAI 兼容/私有）；
- 平台级模型池配置（ConfigModule），租户选择模型；
- 一期仅配置 CRUD + 测试连通性，二期接入问答/转人工。

## 6. 接口契约

### 6.1 REST API（/api/v1）

| 模块 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| Auth | POST | /auth/login | 登录，返回 access/refresh |
| Auth | POST | /auth/refresh | 刷新 Token |
| Auth | POST | /auth/change-password | 修改密码 |
| Platform | GET | /platform/overview | 平台看板 KPI |
| Platform | CRUD | /platform/tenants | 租户管理 |
| Platform | CRUD | /platform/models | AI 模型配置 |
| Tenant | CRUD | /tenant/agents | 客服账号 |
| Tenant | CRUD | /tenant/roles | 角色权限 |
| Tenant | CRUD | /tenant/customers | 客户档案 |
| Tenant | GET | /tenant/channels/widget | Web Widget 配置 |
| Session | GET | /session/list | 会话列表（分页/筛选） |
| Session | POST | /session/:id/assign | 接管会话 |
| Session | POST | /session/:id/transfer | 转接 |
| Session | POST | /session/:id/end | 结束会话 |
| Message | GET | /session/:id/messages | 历史消息（游标分页） |
| Search | GET | /search/sessions | 会话检索 |

### 6.2 Socket.io 事件

| 事件 | 方向 | 说明 |
| --- | --- | --- |
| client:send | C→S | 客户/客服发送消息 |
| server:message | S→C | 新消息广播 |
| server:session:status | S→C | 会话状态变更通知 |
| server:typing | S→C | 输入状态 |
| server:unread | S→C | 未读数更新 |
| server:online | S→C | 客服在线状态 |

## 7. 安全与合规

| 项 | 方案 |
| --- | --- |
| 认证 | JWT（Access 2h / Refresh 7d / 滑动续期）、2FA（TOTP） |
| 传输 | HTTPS / WSS，TLS 1.2+ |
| 存储 | 密码 bcrypt、敏感字段 AES-256、附件加密 |
| 注入防护 | TypeORM/Mongoose 参数化查询、输入校验（class-validator） |
| XSS/CSRF | CSP、CORS 白名单、CSRF Token |
| 限流 | Redis 滑动窗口，登录/API 分级 |
| 审计 | 关键操作写 audit_logs，防篡改 |
| 隐私 | 客户同意管理、数据导出/删除请求、字段脱敏 |

## 8. 非功能保障

| 指标 | 实现 |
| --- | --- |
| 首屏 ≤2s | Vite 分包、路由懒加载、CDN 静态资源 |
| 消息 ≤500ms | Socket.io + Redis，服务端批处理 |
| AI ≤3s（二期） | Provider 超时、流式输出 |
| 并发 ≥5000 | 无状态集群 + MongoDB 分片 + 连接池 |
| 可用性 ≥99.9% | 多实例、健康检查、自动重启、主从复制 |
| 可观测 | Prometheus 指标、Grafana 面板、ELK 日志、requestId 链路 |

## 9. 实施计划

| 阶段 | 周期 | 内容 | 里程碑 |
| --- | --- | --- | --- |
| P0 基础底座 | 2 周 | 项目脚手架、数据库、Auth、租户 CRUD | 超级管理员可管租户 |
| P1 三端管理 | 2 周 | 平台后台、租户后台、RBAC | 三端菜单可用 |
| P2 会话消息 | 3 周 | 客服工作台、会话状态机、Socket.io | 客户-客服实时对话 |
| P3 客户入口 | 2 周 | Web Widget、隐私同意、评价 | 端到端闭环 |
| P4 检索/审计 | 1 周 | 会话检索、审计日志 | 数据底座完成 |
| P5 二期预留 | — | AI、知识库、路由、报表接口对接 | 二期启动 |

## 10. 风险与应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| 双库一致性 | 业务与消息数据不同步 | 事件驱动 + 补偿任务 |
| 实时通道性能 | 消息延迟 | Redis Adapter、批处理、监控告警 |
| 租户隔离漏洞 | 数据越权 | 强制 tenant_id 注入 + 渗透测试 |
| 二期对接返工 | 接口不兼容 | 一期即定义 Provider 抽象与扩展字段 |
