# AI 智能客服系统

一个面向多租户场景的 **AI 智能客服系统**，包含 **双前端入口**（客服/客户服务端 + 平台/机构管理端）与可选的 **NestJS 后端**（MVP 阶段，已预留 `/api` 代理与 API 封装）。前端采用 React 19 + Vite 7 构建，后端未启动时自动降级为本地演示数据，开箱即用。

## 功能特性

### 0. 双前端入口与四角色认证（/service/*、/admin/*）

系统按业务场景拆分为两个独立认证门户，共支持 **四种角色**：

| 门户 | 角色 | 演示账号 | 首页 |
| --- | --- | --- | --- |
| 服务中心 `/service/*` | 客服坐席 `agent` | `lina@xinghe.demo` | `/workbench` |
| 服务中心 `/service/*` | 客户 `customer` | `customer@xinghe.demo` | `/customer/chat` |
| 管理中心 `/admin/*` | 超级管理员 `platform_admin` | `admin@ai-service.demo` | `/platform/overview` |
| 管理中心 `/admin/*` | 机构管理员 `tenant_admin` | `admin@xinghe.demo` | `/organization/overview` |

> 所有演示账号密码均为 `Demo@2026`。

- **门户隔离**：客服/客户走 `service` 门户，平台/机构管理员走 `admin` 门户，两套品牌文案与注册入口相互独立，登录页可互相跳转
- **RBAC 权限路由**：`ProtectedRoute` 守卫 + `canAccessPath` 路径级鉴权；`/platform` 仅超管、`/organization` 限管理员、`/customer/*` 限客户、`/workbench/knowledge` 与 `/workbench/settings` 限管理员
- **后端优先 + 演示降级**：优先调用后端登录接口（`/api/v1/auth/login`），后端不可用时自动降级为本地演示账号（`loginWithDemoFallback`）
- **邀请码 + 单级审核注册**：机构入驻需持有平台派发的机构邀请码，客服入职需持有机构派发的客服邀请码；注册申请提交后进入审核中心，客服申请由**机构管理员单级审核**通过即激活，机构申请由平台管理员审核通过后创建机构并激活管理员账号，驳回则申请作废并释放邀请码
- **登录态管理**：会话与 Token 保存在 `sessionStorage`，刷新不丢失，按门户路由退出

### 1. 客服工作台（/workbench）
- **会话接待**：实时会话列表（状态 / 渠道 / SLA 风险多维筛选 + 关键词搜索，**筛选条件写入 URL 可分享/刷新不丢**）、AI 置信度与知识引用展示、人工接管、AI 建议回复、快捷回复、**SLA 实时倒计时**（`SlaCountdown`）、转接 / 结束 / 建工单、空状态兜底（`EmptyState`）
- **AI 接管 / 人工接回闭环**：处理中会话可一键「AI 接管」（仅当前接待客服可操作）转交机构配置的 AI 模型自动回复，AI 接待中可随时「人工接回」；会话状态 `ai_handling` 贯穿会话列表、状态徽章、SLA 时钟与实时事件（`conversation.ai_taken_over / ai_reclaimed / ai_handoff`），AI 回复期间停止人工超时计时，失败自动退回队列
- **客服看板（/workbench/dashboard）**：团队工作负载、在线/排队/满意度指标、班次安排与交接提醒、**分流接待队列**（队列类型 + 优先级 + 客服分配联动）、**看板洞察指标**（机构/客服/渠道占比、AI 处理率、对比分析，`dashboardInsights`）
- **服务工单（/workbench/tickets）**：工单指标卡一键联动筛选（全部 / 待处理 / 处理中 / 已解决）、解决率实时计算、关联会话跳转、状态流转
- **客户目录（/workbench/customers）**：客户档案列表（`CustomerCenter` 组件）
- **服务日志（/workbench/service-logs）**：客服操作与系统事件日志视图（`LogsView`，**后端优先加载、失败降级演示数据**，按级别/时间筛选，可导出 CSV）
- **知识库（/workbench/knowledge）**：FAQ 与知识文档管理、命中率统计、未命中问题沉淀
- **AI 与界面配置（/workbench/settings）**：非工作时间 AI 接管时段、欢迎语、品牌主题色、窗口形态配置，实时预览并可发布到客户入口

### 2. 客户服务入口（/customer/chat、/visitor/chat）
- **登录客户聊天窗口**：客户登录后发起咨询，支持常见问题快捷提问
- **免登录访客聊天（/visitor/chat）**：面向第三方小程序 / H5 / 网页的**客户客服窗口对接**——客户免注册、打开即聊；`chatClient` SDK 提供独立的访客会话（localStorage 独立 key，不覆盖坐席/管理员登录态）
- **多端对话客户端 SDK**：`chatClient.js`（访客会话 + REST + Realtime 封装）、`conversationApi.js`（会话 REST：建/恢复、消息、DTO 归一化）、`conversationRealtime.js`（Socket.IO 实时：会话创建/接管/分配/结束、消息收发/已读、评价事件，去重 + 断线重连）
- **AI / 人工模式切换**：工作时段人工优先，非工作时间由 AI 基于企业知识库接待（`resolveServiceMode` 按时间自动判定）
- **会话流转**：欢迎 → 排队 → 接待中 → 已结束 → 评价（`transitionChat` 状态机），结束可提交星级评价

### 3. 平台管理中心（/platform）
- **平台运营总览**：机构总数、活跃机构、今日会话、全局 AI 解决率；近 7 日服务量趋势；租户健康排行；待办与审计动态。内置**动态实时运营大屏**（指标每 3 秒刷新、多视图轮播、全屏浏览按钮，可一键进入全屏大屏查看今日实时、会话构成、Token 消耗、机构活跃度、订单达成率、客户满意度等板块）
- **注册审核中心（/platform/approvals）**：机构入驻申请审核（通过后创建机构并激活管理员账号）、机构邀请码派发与撤销（客服注册由机构单级审核，平台端不再参与）
- **机构与租户**：租户生命周期管理（审核 / 启用 / 停用）、套餐与配额可视化（已封装 `api.js` 租户接口，可对接后端 F-002）
- **会话监控（/platform/conversations、/organization/conversations）**：跨机构/本机构异常会话记录，追溯完整聊天内容
- **告警中心（平台 /alerts）**：平台告警管理与异常事件处理
- **AI 模型中心（/platform/models）**：任意 OpenAI 兼容接口统一接入（DeepSeek 云端 / LongCat 私有化 / 自定义聚合平台），支持新增 / 编辑 / 停用 / **连接测试**，API Key 加密存储仅显示掩码；实时展示累计调用、成功率、Token 用量与平均耗时（`AiModelCenter`）
- **全局配置 / 安全与审计 / 运维监控**：平台级参数、审计日志、核心服务健康度
- **系统日志（/platform/logs）**：全平台审计事件与 AI 调用异常聚合检索，内置**系统诊断面板**（数据库 / 内存 / AI 通道 / 队列水位，15 秒自动轮询，崩溃与联调排查用）

### 4. 机构管理中心（/organization）
- **机构运营总览**：今日会话、AI 解决率、SLA 达成率、满意度；实时服务概览与客服负载。内置与超管一致的**动态实时运营大屏**（指标每 3 秒刷新、多视图轮播、全屏按钮，可进入全屏大屏查看机构维度的今日实时、会话构成、Token 消耗、客服负载、客户满意度、风险告警等板块）
- **客服审核中心（/organization/approvals）**：本机构客服入职申请审核（机构端通过即激活）、客服邀请码派发与撤销
- **客服与组织**：客服账号管理（已封装 `api.js` 坐席接口，可对接后端 F-006）
- **客户中心 / 知识库 / AI 路由策略 / 渠道接入 / 服务运营**：档案、知识文档、意图路由、渠道状态、服务健康指标
- **AI 客服管理（/organization/aiService）**：选择平台已启用模型、配置系统提示词与机构知识规则、强制转人工关键词、温度 / 最大输出 Token / 每分钟上限 / 最大并发，实时查看最近 100 次模型调用记录（`TenantAiCenter`）

### 5. 设计文档与原型产出
- `docs/原型设计/`：7 个可独立打开的 HTML 原型页（登录页、PC 客服工作台、客户 Web 入口、平台管理后台、租户运营后台等）
- `docs/superpowers/`：设计规格与实施计划（后端 MVP、双前端认证改造、双客服调度计划、**人工会话闭环设计/规划**、**AI 接管可审计闭环设计/实施**）
- `docs/frontend-improvements.md`：前端纯前端改进建议清单（P0/P1 分级）
- `docs/client-integration.md`：**客户多端对接待办接口接入说明**（访客会话、REST + Socket.IO 实时对账）
- `docs/用户客服语音与多媒体交互系统开发说明书.md`：**语音 / 图片 / 文件 / 实时通话** 增量能力开发说明书（V1.0，含改造位置表与两期实施范围）
- `designs/`：运营大屏视觉设计稿（指挥中心 / 驾驶舱 / 平台全局 3 个 HTML 稿）
- `output/`：设计文档交付物（产品思维导图、详细设计、原型设计、简化版、技术选型，md / html / docx 三态）及迭代说明（AI 一键接管接入、Nginx 生产部署、前端改进落地、客服看板优化与分流联调、大厅客服管理看板对标总结、**客服会话处理流程图**）
- `AI智能客服系统 第一期产品思维导图.pdf`

## 技术栈

| 分类 | 技术 | 版本 |
| --- | --- | --- |
| 框架 | React | ^19.1.1 |
| 路由 | react-router-dom | ^7.9.5 |
| 构建工具 | Vite | ^7.1.7 |
| 编译插件 | @vitejs/plugin-react-swc | ^4.1.0 |
| 实时通信 | socket.io-client | ^4.8.3 |
| 测试框架 | Node 内置 node:test | Node 22+ |
| 后端（可选） | NestJS（MVP，位于 `.worktrees/backend-mvp`） | — |
| 开发语言 | JavaScript (JSX) | ES Module |

## 目录结构

```
ai-customer-service-system/
├── index.html                  # HTML 入口（SPA 挂载点）
├── package.json                # 项目依赖与脚本（含 test）
├── vite.config.js              # Vite 构建配置（含 /api 后端代理）
├── start.bat                   # 一键启动脚本（MySQL + 后端 + 前端）
├── .gitignore                  # Git 忽略规则
├── docs/                       # 设计文档与 HTML 原型
│   ├── 原型设计/               # 7 个可独立打开的原型页面
│   ├── superpowers/            # 设计规格（specs）与实施计划（plans）
│   ├── frontend-improvements.md # 前端改进建议清单（P0/P1 分级）
│   └── client-integration.md   # 客户多端对接待办接口接入说明
│   └── 用户客服语音与多媒体交互系统开发说明书.md # 语音/图片/文件/通话增量能力开发说明（V1.0）
├── designs/                    # 运营大屏视觉设计稿（3 个 HTML）
├── output/                     # 文档交付物与迭代说明（md / html / docx）
└── src/
    ├── main.jsx                # 应用入口：挂载 React、注册路由、引入全局样式
    ├── App.jsx                 # 路由编排 + 受保护路由 + 客服工作台（三栏布局）
    ├── AuthPage.jsx            # 认证页（双门户：登录 / 注册 / 找回密码）
    ├── authPortal.js           # 双门户文案与角色分类配置
    ├── auth.js                 # 认证逻辑（后端 API 调用、演示降级、RBAC、表单校验）
    ├── approvalData.js         # 审核数据层（邀请码 / 注册申请 / 激活账号，localStorage 持久化）
    ├── api.js                  # 业务 API 封装（坐席 F-006、租户 F-002，Bearer Token）
    ├── aiService.js            # AI 一键接管服务层（本地模拟 / 后端代理 / OpenAI 兼容三模式）
    ├── aiApi.js                # AI 接管 API 封装（平台模型 CRUD/测试/用量、租户策略、会话接管/接回）
    ├── dashboardApi.js         # 运营大屏 API 封装 + 渠道配色 / 告警趋势结构归一化
    ├── serviceLogApi.js        # 日志 API 封装（服务日志 / 系统日志 / 系统诊断，失败降级演示数据）
    ├── workbenchData.js        # 工作台数据层（会话种子数据 / 客服团队队列 / 分配联动）
    ├── chatClient.js           # 免登录访客对话客户端 SDK（独立访客会话 + REST + Realtime）
    ├── conversationApi.js      # 会话 REST API（建/恢复、消息、DTO 归一化）
    ├── conversationRealtime.js # 会话实时层（Socket.IO 事件、去重、断线重连）
    ├── dashboardInsights.js    # 看板洞察指标（机构/客服/渠道占比、AI 处理率）
    ├── AgentWorkspaceShell.jsx # 客服工作区外壳（角色感知导航栏）
    ├── ServiceWorkspace.jsx    # 客服看板 / 知识库 / 配置 + 客户聊天窗口
    ├── prototype.js            # 原型逻辑（工作区映射、聊天状态机、服务模式、配置持久化）
    ├── AdminConsole.jsx        # 管理控制台（平台模式 + 机构模式 + 实时大屏 + 会话监控 + 告警）
    ├── adminData.js            # Mock 数据（租户、模型、审计、客服、客户、知识库、渠道、路由规则）
    ├── components/             # 拆分组件（AgentList / ApprovalCenter / CustomerCenter / LogsView / AiManagement）
    ├── chat/                   # 客户聊天 Widget（CustomerChatWidget + 样式）
    ├── EmptyState.jsx          # 通用空状态组件
    ├── SlaCountdown.jsx        # SLA 实时倒计时组件
    ├── *.test.js               # 单元测试（auth / authPortal / approvalData / prototype / aiService / aiApi / dashboardApi / serviceLogApi / workbenchData / chatClient / conversationApi / conversationRealtime / dashboardInsights）
    └── *.css                   # 各模块样式（styles / admin / auth / approval / polish / prototype / dashboard / logs / customer-center / chat-widget / tickets）
```

## 模块代码说明

### src/main.jsx — 应用入口
挂载 React 应用，包裹 `HashRouter`（适配 Gitee Pages 子路径部署），引入全部全局样式（含认证页与原型样式）。

### src/App.jsx — 路由编排 + 客服工作台
- **路由编排**：`/service/*`、`/admin/*` 为双门户认证路由（注册按角色细分：`/service/register/agent`、`/admin/register/tenant`、`/admin/register/platform-admin`）；`/customer/chat` 登录客户聊天、`/visitor/chat` **免登录访客聊天**（`CustomerChatWidget`，可注入 tenantId/channel）；`/workbench*` 客服工作区（含 `/workbench/customers` 客户目录、`/workbench/service-logs` 服务日志）；`/platform/*`、`/organization/*` 管理后台——受保护路由统一由 `ProtectedRoute` 守卫
- **工作区路由分流**：`WorkbenchRoute` 通过 `getWorkArea()` 判断 `/workbench` 下的子区域（会话 / 看板 / 知识库 / 配置），非会话区域渲染 `ServiceWorkspace`
- **客服工作台三栏布局**：会话列表（筛选 + 搜索，**条件同步 URL** 可刷新保持）、消息工作区（SLA 实时倒计时、AI 接管横幅、**AI 接管 / 人工接回按钮**、消息流、AI 建议、快捷回复）、客户上下文侧栏（客户档案、接管摘要、知识引用、备注工单）
- **AI 接管闭环**：`handToAi` / `reclaimFromAi` 调用 `aiApi` 的接管 / 接回接口，订阅 `conversation.ai_taken_over / ai_reclaimed / ai_handoff` 实时事件刷新会话；`ai_handling` 状态下输入框锁定并提示「人工接回后才能发送」，结束 / 退回按钮禁用
- 会话数据来自 `workbenchData.js`，AI 接管逻辑来自 `aiService.js`

### src/auth.js — 认证与权限核心
- **后端 API 层**：`apiRequest` 统一封装（错误码映射、服务不可用识别）、`apiLogin`、`registerAgent` / `registerPlatformAdmin` / `registerTenant` / `registerCustomer`、`fetchTenantOptions`
- **演示降级**：`loginWithDemoFallback` 在后端不可用时用 `demoAccounts`（4 角色）完成登录；审核激活的注册账号（机构管理员 / 客服）同样可登录，未激活或被驳回的申请会提示对应状态
- **RBAC**：`resolveHome` / `resolveLoginPath` / `resolveLogoutPath` / `canAccessPath` / `roleMatchesPortal`
- **校验**：`validatePassword`、四类注册表单校验（邀请码必填）、`validateInvitation`、`validateRecoveryEmail`

### src/approvalData.js — 审核数据层
模拟后端三张表（邀请码 / 注册申请 / 激活账号），localStorage 持久化：
- **邀请码**：平台派发机构邀请码（`T-INV-*`）、机构派发客服邀请码（`A-INV-*`，绑定机构），支持撤销与一次性使用
- **注册申请**：提交申请即消耗邀请码；机构申请仅平台端审核，客服申请由机构端**单级审核**通过即激活，驳回释放邀请码
- **激活账号**：对应端审核通过后创建用户（机构管理员 / 客服）并写入用户表，登录时校验激活状态
- **旧数据迁移**：`migrateLegacyTwoStageApprovals` 自动将旧版「机构端已过、等待平台终审」的客服申请直接激活（兼容两级审核历史数据）

### src/aiService.js — AI 一键接管服务层
为会话工作台提供「AI 接管」能力（v0.4 的本地模拟引擎，v0.6 已升级为后端可审计闭环，见 `aiApi.js`）：
- `AI_TAKEOVER` 配置：总开关 + 三种 provider（`local-mock` 本地模拟引擎 / `backend-proxy` 走 `/api/v1/ai/chat` 后端代理 / `openai-compatible` 直连 OpenAI 兼容协议）
- `requestAiReply`：根据接管摘要、队列类型、优先级生成贴合上下文回复，模拟延迟可配
- `buildAiSystemNote`：接管触发原因（繁忙 / 非工作时间 / 休息 / 过载）→ 客户可见的系统提示文案

### src/aiApi.js — AI 接管 API 封装
后端可审计 AI 接管闭环的前端接口层（全部走 `authRequest` Bearer Token）：
- **平台模型管理**：`listAiModels` / `createAiModel` / `updateAiModel` / `disableAiModel`（停用即删除）/ `testAiModel`（连接测试）/ `getPlatformAiUsage`（聚合用量）
- **租户 AI 策略**：`listTenantAiModels`（可用模型）/ `getTenantAiPolicy` / `updateTenantAiPolicy`（启用、模型、提示词、知识规则、转人工关键词、限流）/ `getTenantAiUsage`（机构用量 + 最近调用记录）
- **会话流转**：`takeoverConversationByAi`（人工 → AI 接管）/ `reclaimConversationFromAi`（AI → 人工接回）

### src/dashboardApi.js — 运营大屏 API 封装
- `fetchDashboardOverview`：拉取运营大屏总览数据（机构管理员 = 本机构，超管 = 全平台；可传 `tenantId` 指定单机构；失败由调用方降级为演示数据）
- `decorateChannelShare`：后端只回传 label/value，前端补齐渠道配色与变化幅度字段
- `normalizeAlertTrend`：补齐告警趋势（warnings / errors / resolved）结构

### src/serviceLogApi.js — 日志 API 封装
- `fetchServiceLogs`：拉取服务日志（会话流转事件 + AI 调用失败，支持分页 / 按会话过滤）
- `fetchSystemLogs`：拉取超管系统日志（全平台审计事件 + AI 调用失败，仅超管可用）
- `fetchSystemDiagnostics`：系统运行时诊断（数据库延迟 / 内存 / AI 通道 / 队列水位）
- `normalizeServiceLogRows`：后端行 → LogsView 行结构（时间统一本地格式、级别/角色兜底、sortKey 排序键）

### src/components/AiManagement.jsx — AI 模型中心与策略配置
- `AiModelCenter`（平台）：已接入模型列表（logo / 状态 / 掩码密钥）+ 接入表单（接口类型快速填充、Base URL、模型 ID、API Key、显示名、超时 / 重试），支持编辑 / 测试 / 停用，顶部四格用量卡（累计调用 / 成功率 / Token / 平均耗时）
- `TenantAiCenter`（机构）：AI 客服策略表单（启用开关、接待模型、系统提示词、机构知识规则、强制转人工关键词、温度 / 最大输出 / 每分钟上限 / 最大并发）+ 最近 100 次实时调用记录（状态 / Token / 耗时）

### src/workbenchData.js — 工作台数据层
- `conversationsSeed`：会话种子数据（从 App.jsx 抽出，含 7 条会话）
- `getConversationAssignment`：会话 → 客服分配映射
- 客服团队队列选项模型：用于「团队工作负载 ↔ 分流接待队列」联调（队列类型 / 优先级 / 客服分配）

### src/components/ApprovalCenter.jsx — 注册审核中心
管理后台的审核界面，`mode` 区分超管 / 机构管理员两套视图：
- 超管：机构入驻审核、机构邀请码派发与撤销（客服审核已收敛到机构端）
- 机构管理员：本机构客服注册审核（机构端操作，通过即激活）、客服邀请码派发与撤销
- 客服申请表格展示审核状态与“审核流程”指示条，终态一目了然

### src/AuthPage.jsx — 双门户认证页
根据 `portal` 属性读取 `authPortal.js` 的文案与角色分类，渲染服务端（客服/客户）或管理端（平台/机构管理员）的登录 / 注册 / 找回密码表单；注册按角色分流到对应表单。

### src/api.js — 业务 API 封装
`authRequest` 自动附带 Bearer Token；`fetchAgents` / `updateAgentStatus`（坐席 F-006）、`fetchTenants` / `updateTenantStatus` / `createTenant` / `updateTenant`（租户 F-002），支持分页与搜索参数。

### src/chatClient.js — 免登录访客对话客户端 SDK
面向 Web / H5 / 小程序的多端对话客户端：
- 访客 session 存**独立 localStorage key**（`ai-customer-service-guest`），绝不写入共享登录态，不覆盖坐席/管理员会话
- `ensureGuestSession`：用客户端生成的 UUID（`clientSessionId`）在后端幂等收敛到同一匿名客户，换取 JWT（TTL 7 天）
- `createChatClient`：组合 REST（`conversationApi`）+ Realtime（`conversationRealtime`），`getToken` 可注入，解耦后端实现
- 无 `crypto.randomUUID` 环境（小程序）自动降级 UUID 生成

### src/conversationApi.js — 会话 REST API
- `listConversations` / `listAllConversations`：分页查询 / **按总量自动翻页拉取机构内全部会话**（工作台「全部状态」视图使用）、`createOrResumeConversation`（建/恢复会话，带查询参数过滤）
- `normalizeMessage` / `normalizeConversation`：后端 DTO → 前端视图模型统一映射
- 复用 `api.js` 的 `authRequest`（Bearer Token）

### src/conversationRealtime.js — 会话实时层
- 基于 `socket.io-client`，`createConversationRealtime` 返回带订阅去重的实时通道
- 覆盖 10 类事件：会话创建/接管/释放/分配/结束、消息创建/已读、评价调度/可见/提交
- 事件 ID 去重（最多缓存 500 条）+ 断线重连回调

### src/dashboardInsights.js — 看板洞察指标
- `buildDashboardComparisons`：机构（总数/活跃/占比）、客服（在线/忙碌/负载率）、渠道（排名/占比）对比指标
- `buildOrganizationDashboardComparisons`：机构维度会话构成、AI 处理率等洞察

### src/components/CustomerCenter.jsx — 客户中心
客服工作台客户目录界面，客户档案列表与检索。

### src/components/LogsView.jsx — 日志视图（服务 / 系统 / 操作）
- `useRemoteLogs`：通用远程日志加载——**后端优先（`fetchServiceLogs` / `fetchSystemLogs`），失败自动降级演示数据**，并标注「已连接数据库 / 演示数据」与更新时间
- `useDiagnostics` + `DiagnosticsPanel`：系统诊断面板（仅系统日志页）——数据库 / 内存 / AI 通道 / 队列水位检查项，**15 秒自动轮询**，异常时给出联调排查提示（含 AI 24h 失败统计与最近错误码）
- 三个数据集：`service`（服务日志）/ `system`（系统日志）/ `operation`（机构操作日志），按级别/时间筛选，支持导出 CSV

### src/chat/CustomerChatWidget.jsx — 客户聊天 Widget
`/visitor/chat` 免登录访客聊天窗口（`autoOpen` 支持），通过 `chatClient` SDK 对接后端。

### src/prototype.js — 原型与状态逻辑
- `getWorkArea` / `getAgentWorkspaceNav`：工作区路由映射与角色感知导航
- `transitionChat`：客户聊天状态机（欢迎 → 排队 → 接待 → 结束 → 评价）
- `resolveServiceMode`：按工作时段判定 AI / 人工服务模式
- `loadPrototypeConfig` / `savePrototypeConfig`：客户入口配置（欢迎语、主题色、AI 时段）持久化

### src/ServiceWorkspace.jsx — 客服工作区 + 客户聊天
- `TicketWorkspace`：**工单工作台**（指标卡联动筛选、解决率实时计算、关联会话跳转、开始处理 / 标记解决）
- `TeamDashboard`：团队负载、排班、交接提醒
- `KnowledgeBase`：FAQ / 文档 / 未命中问题
- `ServiceSettings`：AI 接管时段与客户入口界面配置，实时预览与发布
- `CustomerChat`：客户聊天窗口（状态机流转、AI/人工模式、星级评价；`ai_handling` 状态显示「AI 客服正在为您服务」）

### src/AgentWorkspaceShell.jsx — 工作区外壳
角色感知的左侧导航（会话 / 看板 / 知识库 / 配置），顶栏展示登录人与退出登录。

### src/AdminConsole.jsx — 管理控制台
`mode` 区分平台 / 机构两套导航：
- `PlatformContent`：审核中心、机构列表（编辑）、**AI 模型中心（`AiModelCenter`）**、会话监控、告警中心、审计、监控、**系统日志（`LogsView` + 诊断面板）**、配置
- `OrganizationContent`：审核中心、客服与组织（`AgentList` 组件 + 批量操作）、客户、知识库、路由策略、渠道、会话监控、**AI 客服管理（`TenantAiCenter`）**、运营、机构操作日志
- 两端总览内置 **LiveDashboard 实时运营大屏**（指标每 3 秒刷新、多视图轮播、全屏浏览）
- 通用表格 / 标签 / 弹窗 / 空状态组件

### src/adminData.js — Mock 数据层
集中管理演示数据：平台指标、机构指标、租户、模型、审计、服务监控、客服、客户、知识库、渠道、路由规则。

### src/components/AgentList.jsx — 客服列表组件
从 AdminConsole 拆分的自包含客服列表（机构 / 平台复用），支持多选批量操作、状态切换、空状态兜底。

### src/EmptyState.jsx / src/SlaCountdown.jsx — 通用组件
- `EmptyState`：列表 / 搜索结果为空时的统一占位
- `SlaCountdown`：SLA 剩余时间实时倒计时，按风险档位变色

### 测试（src/*.test.js）
`auth.test.js`（认证 / RBAC / 校验 / 激活登录门禁）、`authPortal.test.js`（门户配置）、`approvalData.test.js`（邀请码 / **单级审核状态机** / 激活）、`prototype.test.js`（工作区 / 状态机 / 服务模式 / 配置持久化）、`aiService.test.js`（AI 接管回复 / 系统提示）、`aiApi.test.js`（平台模型 / 租户策略 / 会话接管端点）、`dashboardApi.test.js`（大屏数据装饰与归一化）、`serviceLogApi.test.js`（日志查询 / 行归一化）、`workbenchData.test.js`（分配映射 / 团队队列）、`chatClient.test.js`（访客会话 / 客户端）、`conversationApi.test.js`（会话 REST 归一化 / **自动翻页**）、`conversationRealtime.test.js`（实时事件去重）、`dashboardInsights.test.js`（看板洞察指标），共 **75 个用例**，`npm test` 全绿。

### docs/ 与 output/ — 文档与原型
- `docs/原型设计/*.html`：7 个可独立打开的高保真原型页
- `docs/superpowers/`：后端 MVP、双前端认证、双客服调度、**AI 接管可审计闭环**的设计规格（specs）和实施计划（plans）
- `docs/frontend-improvements.md`：前端改进建议清单（P0 / P1 分级，只做纯前端可独立完成项）
- `designs/*.html`：运营大屏视觉设计稿（指挥中心 / 驾驶舱 / 平台全局）
- `output/`：第一期设计文档交付态及迭代说明（AI 一键接管接入、Nginx 生产部署、前端改进落地、客服看板优化与分流联调、大厅客服管理看板对标总结）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 运行单元测试（75 个用例）
npm test

# 生产构建
npm run build

# 预览生产构建产物
npm run preview
```

### 发布到 Gitee Pages

项目使用 `HashRouter`，适合部署到 Gitee Pages 的仓库子路径；刷新 `#/service/login`、`#/organization/overview` 等页面不会 404。首次发布前：

1. 在 Gitee 创建一个专门存放构建产物的空仓库，例如 `ai-customer-service-pages`。
2. **Windows PowerShell 推荐执行 PowerShell 脚本**（避免 WSL Bash 误用 Linux 版依赖）：

```powershell
.\deploy-pages.ps1 "https://gitee.com/silver125/ai-customer-service-pages.git"
```

如果 PowerShell 提示禁止执行脚本，只需对当前窗口临时放开权限：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\deploy-pages.ps1 "https://gitee.com/silver125/ai-customer-service-pages.git"
```

脚本会自动执行 `npm run build`、克隆或更新项目同级目录的 `..\ai-customer-service-pages`、同步 `dist\` 并推送到 Gitee。然后在 Gitee 仓库的「服务 → Gitee Pages」中选择 `master` 分支、根目录 `/`，点击「启动」或「更新」。以后更新只需重新执行上面的 PowerShell 命令。PowerShell 脚本使用 ASCII 输出，兼容 Windows PowerShell 5.1；若本地已安装 PowerShell 7，也可以使用 `pwsh -File .\deploy-pages.ps1 -PagesRepoUrl ...`。

Git Bash 用户可以执行 `bash deploy-pages.sh "https://gitee.com/你的用户名/ai-customer-service-pages.git"`；但不要从 WSL Bash 复用 Windows 的 `node_modules`，否则可能出现 Rollup 原生依赖不匹配。发布后的访问地址类似 `https://你的用户名.gitee.io/ai-customer-service-pages/#/service/login`。

### 一键启动（Windows，含后端）

双击 `start.bat` 或命令行执行：

```bat
start.bat
```

脚本依次执行：检查/启动 MySQL8 → 启动后端 NestJS（`:4000`，位于 `.worktrees/backend-mvp/backend`）→ 启动前端 Vite（`:5173`）。

- 前端地址：http://localhost:5173
- 后端地址：http://localhost:4000/api/v1
- API 文档：http://localhost:4000/api/docs

> 未启动后端时，前端会自动使用本地演示账号与 Mock 数据，功能不受影响。

### 访问入口

| 页面 | 路由 | 可访问角色 |
| --- | --- | --- |
| 服务中心（客服/客户登录） | `/service/login` `/service/register` | 公开 |
| 管理中心（管理员登录） | `/admin/login` `/admin/register` | 公开 |
| 客户聊天窗口 | `/customer/chat` | 客户 |
| 客服工作台 | `/workbench`（含 `/workbench/dashboard` 等） | 客服坐席 / 管理员 |
| 平台管理中心 | `/platform` | 超级管理员 |
| 机构管理中心 | `/organization` | 超级管理员 / 机构管理员 |

## 提交规范（feat 填写说明）

本项目所有 Commit Message 使用 **中文填写**，采用「分类标签：中文变更说明」格式：

| 标签 | 含义 | 示例 |
| --- | --- | --- |
| `feat` | 新功能 | `feat：新增客户满意度评价弹窗` |
| `fix` | 缺陷修复 | `fix：修复会话列表筛选重置失效的问题` |
| `refactor` | 重构（非新功能非修复） | `refactor：抽取消息发送为公共 Hook` |
| `style` | 样式 / 格式调整 | `style：调整工作台三栏响应式断点` |
| `docs` | 文档变更 | `docs：补充平台模型中心使用说明` |
| `test` | 测试相关 | `test：新增会话接管单元测试` |
| `deps` | 依赖变更 | `deps：升级 Vite 至 7.x` |
| `chore` | 构建 / 工具链调整 | `chore：忽略本地工作树目录` |

示例：

```bash
git commit -m "feat：新增 AI 建议回复一键采纳到草稿"
```

## 版本更迭

版本历史与每个版本的任务产出介绍见 [CHANGELOG.md](./CHANGELOG.md)（中文维护）。

## 说明

- 前端为 **演示原型**，数据以本地 Mock 为主；接入后端后自动切换为真实 API（`/api` 代理已配置）
- 后端 MVP 代码位于 `.worktrees/backend-mvp/`（git worktree，已忽略不入库），仓库仅托管前端与设计文档
- 敏感字段（手机号、邮箱等）均已在展示层脱敏
- 管理端操作（创建、停用、发布等）在演示模式下仅更新页面本地状态
