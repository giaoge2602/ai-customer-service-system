# 版本更迭记录（Changelog）

本文件使用**中文**记录每个版本的任务产出、功能新增与修复内容。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 惯例。

## [v0.7.0] - 2026-08-31

### ✨ 新增：客服审核单级化 + 日志 API 化与系统诊断

本次迭代完成两件事：客服注册审核从「机构 + 平台两级」简化为**机构单级审核**（含旧数据自动迁移）；服务日志 / 系统日志全面**后端 API 化**，新增系统运行时诊断面板与语音多媒体交互开发说明书。

#### 新增功能

**客服审核流程简化（两级 → 机构单级）**
- `approvalData.js`：客服申请由机构端审核**通过即激活**，平台阶段不再参与；驳回仍作废并释放邀请码
- `migrateLegacyTwoStageApprovals`：旧版「机构端已过、等待平台终审」的客服申请自动迁移为直接激活，兼容历史数据
- 文案与视图同步：`AuthPage` 注册提示、`ApprovalCenter` 审核视图、`auth.test.js` / `approvalData.test.js` 用例同步改写（平台阶段审核客服申请现在返回错误）

**日志 API 化与系统诊断（`serviceLogApi.js` + `LogsView` 增强）**
- `fetchServiceLogs` / `fetchSystemLogs`：服务日志（会话流转 + AI 调用失败）与超管系统日志（全平台审计）后端优先加载，失败自动降级演示数据，界面标注「已连接数据库 / 演示数据」与更新时间
- `fetchSystemDiagnostics` + `DiagnosticsPanel`：**系统诊断面板**（系统日志页）——数据库 / 内存 / AI 通道 / 队列水位检查项，**15 秒自动轮询**，运行时长 / 版本 / Node / 平台，AI 24h 失败统计与最近错误码，异常时给出联调排查提示
- `normalizeServiceLogRows`：后端行 → 视图行归一化（时间本地格式、级别/角色兜底、排序键）
- `dashboardApi.fetchDashboardOverview` 支持 `tenantId` 参数（单机构视图）
- `AdminConsole` 各模块页增加运营级描述文案

**文档**
- 新增 `docs/用户客服语音与多媒体交互系统开发说明书.md`（V1.0）：语音消息 / ASR 转写 / 图片文件上传 / 第二期实时语音通话的增量开发说明书，含现有代码改造位置表与两期实施范围

**工程化与测试**
- 单元测试扩展至 **75 个用例**（新增 `serviceLogApi.test.js`，审核用例改写），`npm test` 全绿
- README 同步更新（单级审核、日志 API、诊断面板、新文档与 75 用例）

#### 技术说明
- 审核数据层提供 `migrateLegacyTwoStageApprovals` 幂等迁移，旧 localStorage 数据无需手动清理
- 日志接口按角色隔离：服务日志（坐席/管理员）、系统日志（仅超管）、机构操作日志（本地演示）
- 诊断面板不阻塞日志浏览，后端不可用时降级显示「诊断接口不可用（后端未启动或版本过旧）」

## [v0.6.0] - 2026-08-30

### ✨ 新增：可审计 AI 接管闭环（AI Takeover）

本次迭代将「AI 一键接管」从本地模拟升级为**平台管模型、机构配策略、坐席可接管/接回**的可审计闭环：平台统一管理任意 OpenAI 兼容模型的接入与密钥，机构配置接待模型与回答边界，客服可将处理中会话一键交给 AI 自动回复并随时接回。

#### 新增功能

**平台 AI 模型中心（/platform/models，`AiModelCenter`）**
- `aiApi.js` API 层：`listAiModels` / `createAiModel` / `updateAiModel` / `disableAiModel`（停用即删除）/ `testAiModel`（连接测试）/ `getPlatformAiUsage`（聚合用量）
- 接入表单支持接口类型快速填充（DeepSeek 云端 / LongCat 私有化 / 自定义 OpenAI 兼容接口），配置 Base URL、模型 ID、API Key（**加密存储仅显示掩码**）、显示名、超时与重试
- 已接入模型列表（logo / 启用状态 / 掩码密钥 / 编辑 / 测试 / 停用）+ 四格用量卡（累计调用 / 成功率 / Token 用量 / 平均耗时）

**机构 AI 客服管理（/organization/aiService，`TenantAiCenter`）**
- `getTenantAiPolicy` / `updateTenantAiPolicy`：启用开关、接待模型（平台已启用模型）、系统提示词、机构知识规则、强制转人工关键词、温度 / 最大输出 Token / 每分钟上限 / 最大并发
- 本机构用量卡 + 最近 100 次实时调用记录（模型 / 会话 / 状态 / Token / 耗时）

**客服工作台 AI 接管闭环**
- 处理中会话（当前接待客服可操作）一键「AI 接管」→ 状态变 `ai_handling`，停止人工超时计时，AI 自动回复期间输入框锁定并提示「人工接回后才能发送」，结束 / 退回按钮禁用
- 「人工接回」可随时恢复人工处理，重新指定接待客服
- 会话列表 / 状态徽章 / SLA 时钟 / 筛选（AI 接待）全面支持 `ai_handling`；订阅 `conversation.ai_taken_over / ai_reclaimed / ai_handoff` 实时事件自动刷新
- `listAllConversations`：会话 REST 按总量**自动翻页**拉取机构内全部会话（工作台「全部状态」视图）

**工作台与样式打磨**
- `TicketWorkspace` 工单工作台重做：指标卡（全部 / 待处理 / 处理中 / 已解决）**一键联动筛选**、解决率实时计算、高优先级统计、关联会话跳转（`tickets.css`）
- `dashboardApi.js`：运营大屏数据 API + 渠道配色装饰（`decorateChannelShare`）与告警趋势归一化（`normalizeAlertTrend`）
- `fix-nginx.bat`：NGINX 80 端口残留实例清理与正确配置（含 /api 与 WebSocket 代理）启动脚本

**工程化与文档**
- 单元测试扩展至 **72 个用例**（新增 `aiApi.test.js`、`dashboardApi.test.js`，扩展 `conversationApi.test.js` 自动翻页），`npm test` 全绿
- `docs/superpowers/`：AI 接管可审计闭环设计规格（`specs/2026-08-28-ai-takeover-design.md`）与实施计划（`plans/2026-08-28-ai-takeover.md`）
- README 同步更新（AI 接管闭环、模型中心 / 策略配置、工单工作台、新模块与 72 用例）

#### 技术说明
- 安全默认值：温度 0.3、最大输出 800 Token、超时 30s、重试 2 次；上下文最多 30 条会话消息，排除内部系统与备注内容
- 密钥由后端加密存储、绝不回传明文；模型删除在有历史/租户引用时降级为停用
- AI 仅能回答问题，不可执行退款、改单、账号、工单等业务变更；失败 / 超时 / 强制转人工关键词自动退回人工队列

## [v0.5.0] - 2026-08-28

### ✨ 新增：人工会话闭环 + 客户多端对接待办 SDK

本次迭代打通「免登录访客 → 会话建立 → 人工/实时接待 → 结束评价」的**人工会话闭环**，并沉淀一套可对接第三方小程序 / H5 / 网页的**对话客户端 SDK**。

#### 新增功能

**客户多端对接待办（免登录访客聊天）**
- `/visitor/chat` 免登录访客聊天窗口（`CustomerChatWidget`，支持 `autoOpen`，可注入 tenantId/channel）
- `chatClient.js` 对话客户端 SDK：访客 session 存独立 localStorage key（不覆盖坐席/管理员登录态），`ensureGuestSession` 用客户端 UUID 幂等收敛匿名客户并签发 JWT（TTL 7 天），`createChatClient` 组合 REST + Realtime，`getToken` 可注入
- `conversationApi.js` 会话 REST：`listConversations` / `createOrResumeConversation` + DTO 归一化（`normalizeMessage` / `normalizeConversation`）
- `conversationRealtime.js` 实时层：Socket.IO 覆盖 10 类事件（会话创建/接管/释放/分配/结束、消息创建/已读、评价调度/可见/提交），事件 ID 去重（上限 500）+ 断线重连
- 新增依赖 `socket.io-client@^4.8.3`

**客服工作台扩展**
- 服务日志（`/workbench/service-logs`）：客服操作与系统事件日志视图（`LogsView`）
- 客户目录升级：`CustomerCenter` 组件
- 看板洞察：`dashboardInsights.js` 机构/客服/渠道占比、AI 处理率等对比指标

**工程化与文档**
- 单元测试扩展至 **66 个用例**（新增 `chatClient.test.js`、`conversationApi.test.js`、`conversationRealtime.test.js`、`dashboardInsights.test.js`），`npm test` 全绿
- `docs/client-integration.md`：客户多端对接待办接口接入说明（访客会话、REST + Socket.IO 实时对账）
- `output/客服会话处理流程图.json`：会话处理流程可视化
- 此前已规划提交：`docs/superpowers/` 新增人工会话闭环设计规格与实施计划（e9c4f8b / f68e96a）
- README 同步更新（访客聊天、SDK、新组件与 66 用例）

#### 技术说明
- HTTPS REST 为权威数据源，Socket.IO 仅作实时提示，断线后用 REST 对账
- 访客会话与登录态完全隔离，互不覆盖，多端可同时使用

## [v0.4.0] - 2026-08-26

### ✨ 新增：注册审核中心 + AI 一键接管 + 实时运营大屏

本次迭代聚焦「注册安全闭环」「客服繁忙兜底」「运营可视化管理」三大方向，并完成客服列表组件拆分与前端体验细节打磨。

#### 新增功能

**邀请码 + 两级审核注册闭环**
- 审核数据层（`approvalData.js`）：模拟后端三张表（邀请码 / 注册申请 / 激活账号），localStorage 持久化
- 机构入驻：平台派发机构邀请码 → 申请人提交 → 平台端审核 → 创建机构并激活管理员账号
- 客服入职：机构派发客服邀请码（绑定机构）→ 申请人提交 → 机构端 + 平台端**两级审核均通过**才激活；任一端驳回释放邀请码
- 审核中心界面（`ApprovalCenter.jsx`）：超管 / 机构管理员两套视图，邀请码派发与撤销，两级审核状态指示条

**AI 一键接管（aiService.js）**
- 会话工作台聊天窗口头部新增「AI 接管」按钮，客服繁忙 / 下班 / 休息时段一键 AI 实时接待
- 三种 provider：`local-mock`（本地模拟引擎，开箱即用）/ `backend-proxy`（后端 `/api/v1/ai/chat`）/ `openai-compatible`（直连 OpenAI 兼容协议），接入真实大模型无需改调用方
- 接管原因 → 客户可见系统提示文案（繁忙 / 非工作时间 / 休息 / 过载）

**实时运营大屏（LiveDashboard）**
- 平台端与机构端运营总览内置动态大屏：指标每 3 秒自动刷新、多视图轮播、全屏浏览按钮
- 板块：今日实时、会话构成、Token 消耗、机构活跃度 / 客服负载、订单达成率、客户满意度、风险告警
- `designs/` 提供 3 个视觉设计稿（指挥中心 / 驾驶舱 / 平台全局）

**会话监控与告警中心**
- 平台 / 机构新增会话监控模块：跨机构 / 本机构异常会话记录，追溯完整聊天内容
- 平台新增告警中心：告警管理与异常事件处理

**客服工作台体验打磨**
- 会话筛选条件写入 URL（`useSearchParams`），刷新 / 分享不丢失
- SLA 实时倒计时组件（`SlaCountdown`）、通用空状态组件（`EmptyState`）
- 会话数据层抽离（`workbenchData.js`）：种子数据 + 客服分配映射 + 团队队列选项模型
- 客服列表组件拆分（`AgentList.jsx`）：多选批量操作，机构 / 平台复用
- 新增 `/workbench/customers` 客户目录路由

**工程化与文档**
- 单元测试扩展至 **49 个用例**（新增 `approvalData.test.js`、`aiService.test.js`、`workbenchData.test.js`），`npm test` 全绿
- 文档：`docs/frontend-improvements.md`（前端改进清单 P0/P1）、`docs/superpowers/plans/2026-08-26-dual-agent-dispatch-plan.md`（双客服调度计划）
- output 新增迭代说明：AI 一键接管接入、Nginx 生产部署、前端改进落地、客服看板优化与分流联调、大厅客服管理看板对标总结
- README 同步更新（审核注册、AI 接管、大屏、新组件与目录结构）

#### 技术说明
- 审核、AI 接管、工作台数据均为纯函数 / 数据模块，与 UI 解耦，接后端时仅需替换实现
- AI 接管预留三种 provider 切换点，接入真实大模型零改动调用方

## [v0.3.0] - 2026-08-25

### ✨ 新增：双前端入口 + 四角色认证 + 客户服务端

本次迭代将系统从「单端演示」升级为**双门户架构**：客服/客户走服务中心，平台/机构管理员走管理中心，并新增客户聊天窗口与客服工作区扩展。

#### 新增功能

**双前端入口与四角色认证**
- `service` 门户（`/service/*`）：客服坐席 + 客户；`admin` 门户（`/admin/*`）：超级管理员 + 机构管理员；两套品牌文案与注册流程隔离，可互相跳转
- 后端 API 优先 + 演示降级：`loginWithDemoFallback` 优先调用 `/api/v1/auth/login`，后端不可用时自动降级本地演示账号
- 四类注册：客服坐席 / 客户 / 机构管理员 / 超级管理员独立注册接口与表单校验
- RBAC 扩展：新增 `customer` 角色、客户聊天路由、知识库与配置的管理员限定

**客服工作区扩展（/workbench 子路由）**
- 客服看板 `/workbench/dashboard`：团队工作负载、班次安排、交接提醒
- 知识库 `/workbench/knowledge`：FAQ / 文档 / 未命中问题管理
- AI 与界面配置 `/workbench/settings`：非工作时间 AI 接管时段、欢迎语、主题色，实时预览 + 发布

**客户服务端（/customer/chat）**
- 独立客户聊天窗口：常见问题快捷提问、会话状态机（欢迎 → 排队 → 接待 → 结束 → 评价）
- AI / 人工模式自动判定：工作时段人工优先，非工作时间 AI 基于企业知识库接待（`resolveServiceMode`）

**API 层与工程化**
- `api.js`：业务接口封装（坐席 F-006、租户 F-002），自动附带 Bearer Token，支持分页搜索
- `vite.config.js`：新增 `/api` 代理到后端 `localhost:4000`
- `start.bat`：Windows 一键启动脚本（MySQL8 检查 → 后端 NestJS → 前端 Vite）
- 单元测试扩展至 **29 个用例**（新增 `authPortal.test.js`、`prototype.test.js`），`npm test` 全绿

**设计文档与原型产出**
- `docs/原型设计/`：7 个高保真 HTML 原型页（登录页、PC 客服工作台、客户 Web 入口、平台管理后台、租户运营后台等）
- `docs/superpowers/`：新增双前端认证设计规格与实施计划（对应此前 2 个 docs 提交）
- `output/`：第一期五份文档交付（产品思维导图、详细设计、原型设计、简化版、技术选型），md / html / docx 三态
- `AI智能客服系统 第一期产品思维导图.pdf`：产品思维导图源文件

#### 技术说明
- 认证逻辑保持纯函数化（`auth.js` / `authPortal.js` / `prototype.js`），与 UI 解耦，可测试性良好
- 后端 MVP 代码位于 `.worktrees/backend-mvp/`（git worktree，`.gitignore` 已忽略），仓库托管前端与文档
- 未启动后端时全部功能可离线演示，接入后端后无缝切换真实 API

## [v0.2.0] - 2026-08-20

### ✨ 新增：登录认证与权限控制

本次迭代为系统接入**登录认证与 RBAC 权限路由**，所有工作台与管理页面从「直接可访问」升级为「登录后按角色访问」。

#### 新增功能
- **三合一认证页**（`AuthPage.jsx`）：登录、邀请码注册激活、找回密码三种模式，左侧品牌故事区 + 右侧认证卡片
- **演示账号体系**（`auth.js`）：超级管理员 / 机构管理员 / 客服专员 3 个内置账号，一键快速登录
- **RBAC 权限路由**：`ProtectedRoute` 守卫 + `canAccessPath` 路径级鉴权，未登录跳转登录页，越权访问自动跳转角色首页
- **登录态管理**：会话保存至 `sessionStorage`，刷新不丢失；顶部栏动态展示当前登录人姓名与角色；管理端/工作台提供「退出登录」
- **表单校验**：注册（邀请码 / 邮箱 / 密码强度 / 二次确认 / 协议勾选）、找回密码（邮箱格式）
- **单元测试**（`auth.test.js`，`npm test`）：认证、RBAC、注册校验、找回密码共 5 个用例全绿

#### 工程化与文档
- `package.json` 新增 `test` 脚本（Node 内置 `node:test`，无需额外依赖）
- `main.jsx` 引入认证页样式 `auth.css` 与全局打磨样式 `polish.css`
- README 补充认证模块功能、演示账号表、路由权限矩阵与测试说明
- CHANGELOG 新增本版本产出记录

#### 技术说明
- 认证逻辑全部抽离为纯函数（`auth.js`），不依赖 UI，保证可测试性
- 权限边界与 PRD 角色边界对齐：平台管理仅超级管理员、机构管理含机构管理员、工作台全员可进

## [v0.1.1] - 2026-08-20

### 📚 补充：后端 MVP 设计文档

- 新增 `docs/superpowers/specs/`：智能客服后端 MVP 设计规格（技术方案、模块边界、数据模型）
- 新增 `docs/superpowers/plans/`：后端 MVP 实施计划（任务拆解与里程碑）
- `.gitignore` 忽略本地 Git 工作树目录（`.worktrees/`）

## [v0.1.0] - 2026-08-19

### ✨ 初始版本产出（任务介绍）

首个可运行的前端演示原型交付，打通「客服接待 → 平台管理 → 机构管理」三端视图，全部数据使用本地 Mock，无需后端即可体验完整业务流程。

#### 新增功能

**客服工作台（/workbench）**
- 三栏布局工作台：会话列表 + 消息工作区 + 客户上下文侧栏
- 会话多维筛选：状态、渠道、SLA 风险三组筛选器 + 关键词搜索
- AI 辅助接待：展示 AI 应答置信度、知识库引用来源
- AI 建议回复：根据会话上下文生成建议，支持一键采纳到草稿
- 人工接管流程：低置信度会话自动请求人工，一键接管后开启发送权限
- SLA 实时监控：正常 / 即将超时 / 已超时三档风险标识
- 完整会话操作：快捷回复、转接技能组、结束会话、创建关联工单
- 客户信息面板：等级、来源、脱敏联系方式、满意度、标签体系

**平台管理中心（/platform）**
- 平台运营总览：核心指标卡 + 近 7 日服务量趋势 + 租户健康排行 + 待办与审计动态
- 机构与租户管理：生命周期（审核 / 启用 / 停用）、套餐与配额可视化
- AI 模型中心：DeepSeek V3、通义千问 Max、私有化模型统一管理，支持设置默认
- 安全与审计：关键操作审计日志，含操作者、目标资源与风险等级
- 运维监控：消息 API / Socket / RAG / Webhook 服务健康度面板

**机构管理中心（/organization）**
- 机构运营总览：今日会话、AI 解决率、SLA 达成率、满意度 + 实时服务概览
- 客服与组织管理：账号状态、技能组、会话量、首响与满意度绩效
- 客户中心：跨渠道统一档案，字段脱敏，隐私授权状态管理
- 知识库运营：文档导入、审核发布、分片与命中率统计
- AI 路由策略：意图识别规则（退款 / 技术 / 投诉），置信度阈值与人工兜底
- 渠道接入管理：Web Widget、公众号、企业微信、Open API 状态切换
- 服务运营：首响 SLA、转人工率、质检通过率健康指标

#### 工程化与文档
- 基于 Vite 7 + React 19 + react-router-dom 7 搭建，SWC 编译加速
- 新增中文 README.md：功能特性、技术栈、目录结构、模块代码说明、提交规范
- 新增中文 CHANGELOG.md：版本更迭与任务产出记录
- 建立中文 Commit 规范（`feat：中文变更说明`），见 README「提交规范」章节

#### 技术说明
- 演示数据集中管理于 `src/adminData.js`，便于后续替换为真实 API
- 管理端复用同一套表格 / 标签 / 弹窗组件，按 `mode` 区分平台与机构视图
- 所有演示操作仅修改页面本地状态，不持久化、不调用真实服务
