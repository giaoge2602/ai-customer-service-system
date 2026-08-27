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
- **邀请码 + 两级审核注册**：机构入驻需持有平台派发的机构邀请码，客服入职需持有机构派发的客服邀请码；注册申请提交后进入审核中心，客服申请需机构管理员与平台管理员**两端均审核通过**才激活，机构申请由平台管理员审核通过后创建机构并激活管理员账号，任一端驳回则申请作废并释放邀请码
- **登录态管理**：会话与 Token 保存在 `sessionStorage`，刷新不丢失，按门户路由退出

### 1. 客服工作台（/workbench）
- **会话接待**：实时会话列表（状态 / 渠道 / SLA 风险多维筛选 + 关键词搜索，**筛选条件写入 URL 可分享/刷新不丢**）、AI 置信度与知识引用展示、人工接管、AI 建议回复、快捷回复、**SLA 实时倒计时**（`SlaCountdown`）、转接 / 结束 / 建工单、空状态兜底（`EmptyState`）
- **AI 一键接管**：聊天窗口头部「AI 接管」按钮，客服繁忙 / 下班 / 休息时段一键让 AI 实时接待（`aiService` 服务层：当前为本地模拟引擎，已预留后端代理与 OpenAI 兼容协议两种接入模式）
- **客服看板（/workbench/dashboard）**：团队工作负载、在线/排队/满意度指标、班次安排与交接提醒、**分流接待队列**（队列类型 + 优先级 + 客服分配联动）
- **客户目录（/workbench/customers）**：客户档案列表
- **知识库（/workbench/knowledge）**：FAQ 与知识文档管理、命中率统计、未命中问题沉淀
- **AI 与界面配置（/workbench/settings）**：非工作时间 AI 接管时段、欢迎语、品牌主题色、窗口形态配置，实时预览并可发布到客户入口

### 2. 客户服务入口（/customer/chat）
- **独立聊天窗口**：客户登录后发起咨询，支持常见问题快捷提问
- **AI / 人工模式切换**：工作时段人工优先，非工作时间由 AI 基于企业知识库接待（`resolveServiceMode` 按时间自动判定）
- **会话流转**：欢迎 → 排队 → 接待中 → 已结束 → 评价（`transitionChat` 状态机），结束可提交星级评价

### 3. 平台管理中心（/platform）
- **平台运营总览**：机构总数、在线租户、今日会话、全局 AI 解决率；近 7 日服务量趋势；租户健康排行；待办与审计动态。内置**动态实时运营大屏**（指标每 3 秒刷新、多视图轮播、全屏浏览按钮，可一键进入全屏大屏查看今日实时、会话构成、Token 消耗、机构活跃度、订单达成率、客户满意度等板块）
- **注册审核中心（/platform/approvals）**：机构入驻申请审核（通过后创建机构并激活管理员账号）、客服两级审核（机构端 + 平台端，两端通过才激活）、机构邀请码派发与撤销
- **机构与租户**：租户生命周期管理（审核 / 启用 / 停用）、套餐与配额可视化（已封装 `api.js` 租户接口，可对接后端 F-002）
- **会话监控（/platform/conversations、/organization/conversations）**：跨机构/本机构异常会话记录，追溯完整聊天内容
- **告警中心（平台 /alerts）**：平台告警管理与异常事件处理
- **AI 模型中心**：DeepSeek V3、通义千问 Max、私有化模型统一管理，支持设置默认模型
- **全局配置 / 安全与审计 / 运维监控**：平台级参数、审计日志、核心服务健康度

### 4. 机构管理中心（/organization）
- **机构运营总览**：今日会话、AI 解决率、SLA 达成率、满意度；实时服务概览与客服负载。内置与超管一致的**动态实时运营大屏**（指标每 3 秒刷新、多视图轮播、全屏按钮，可进入全屏大屏查看机构维度的今日实时、会话构成、Token 消耗、客服负载、客户满意度、风险告警等板块）
- **客服审核中心（/organization/approvals）**：本机构客服入职申请审核（机构端通过后仍需平台端终审）、客服邀请码派发与撤销
- **客服与组织**：客服账号管理（已封装 `api.js` 坐席接口，可对接后端 F-006）
- **客户中心 / 知识库 / AI 路由策略 / 渠道接入 / 服务运营**：档案、知识文档、意图路由、渠道状态、服务健康指标

### 5. 设计文档与原型产出
- `docs/原型设计/`：7 个可独立打开的 HTML 原型页（登录页、PC 客服工作台、客户 Web 入口、平台管理后台、租户运营后台等）
- `docs/superpowers/`：设计规格与实施计划（后端 MVP、双前端认证改造、双客服调度计划）
- `docs/frontend-improvements.md`：前端纯前端改进建议清单（P0/P1 分级）
- `designs/`：运营大屏视觉设计稿（指挥中心 / 驾驶舱 / 平台全局 3 个 HTML 稿）
- `output/`：设计文档交付物（产品思维导图、详细设计、原型设计、简化版、技术选型，md / html / docx 三态）及迭代说明（AI 一键接管接入、Nginx 生产部署、前端改进落地、客服看板优化与分流联调、大厅客服管理看板对标总结）
- `AI智能客服系统 第一期产品思维导图.pdf`

## 技术栈

| 分类 | 技术 | 版本 |
| --- | --- | --- |
| 框架 | React | ^19.1.1 |
| 路由 | react-router-dom | ^7.9.5 |
| 构建工具 | Vite | ^7.1.7 |
| 编译插件 | @vitejs/plugin-react-swc | ^4.1.0 |
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
│   └── frontend-improvements.md # 前端改进建议清单（P0/P1 分级）
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
    ├── workbenchData.js        # 工作台数据层（会话种子数据 / 客服团队队列 / 分配联动）
    ├── AgentWorkspaceShell.jsx # 客服工作区外壳（角色感知导航栏）
    ├── ServiceWorkspace.jsx    # 客服看板 / 知识库 / 配置 + 客户聊天窗口
    ├── prototype.js            # 原型逻辑（工作区映射、聊天状态机、服务模式、配置持久化）
    ├── AdminConsole.jsx        # 管理控制台（平台模式 + 机构模式 + 实时大屏 + 会话监控 + 告警）
    ├── adminData.js            # Mock 数据（租户、模型、审计、客服、客户、知识库、渠道、路由规则）
    ├── components/             # 拆分组件（AgentList 客服列表 / ApprovalCenter 审核中心）
    ├── EmptyState.jsx          # 通用空状态组件
    ├── SlaCountdown.jsx        # SLA 实时倒计时组件
    ├── *.test.js               # 单元测试（auth / authPortal / approvalData / prototype / aiService / workbenchData）
    └── *.css                   # 各模块样式（styles / admin / auth / approval / polish / prototype / dashboard）
```

## 模块代码说明

### src/main.jsx — 应用入口
挂载 React 应用，包裹 `HashRouter`（适配 Gitee Pages 子路径部署），引入全部全局样式（含认证页与原型样式）。

### src/App.jsx — 路由编排 + 客服工作台
- **路由编排**：`/service/*`、`/admin/*` 为双门户认证路由（注册按角色细分：`/service/register/agent`、`/admin/register/tenant`、`/admin/register/platform-admin`）；`/customer/chat` 客户聊天；`/workbench*` 客服工作区（含 `/workbench/customers` 客户目录）；`/platform/*`、`/organization/*` 管理后台——受保护路由统一由 `ProtectedRoute` 守卫
- **工作区路由分流**：`WorkbenchRoute` 通过 `getWorkArea()` 判断 `/workbench` 下的子区域（会话 / 看板 / 知识库 / 配置），非会话区域渲染 `ServiceWorkspace`
- **客服工作台三栏布局**：会话列表（筛选 + 搜索，**条件同步 URL** 可刷新保持）、消息工作区（SLA 实时倒计时、AI 接管横幅、AI 一键接管、消息流、AI 建议、快捷回复）、客户上下文侧栏（客户档案、接管摘要、知识引用、备注工单）
- 会话数据来自 `workbenchData.js`，AI 接管逻辑来自 `aiService.js`

### src/auth.js — 认证与权限核心
- **后端 API 层**：`apiRequest` 统一封装（错误码映射、服务不可用识别）、`apiLogin`、`registerAgent` / `registerPlatformAdmin` / `registerTenant` / `registerCustomer`、`fetchTenantOptions`
- **演示降级**：`loginWithDemoFallback` 在后端不可用时用 `demoAccounts`（4 角色）完成登录；审核激活的注册账号（机构管理员 / 客服）同样可登录，未激活或被驳回的申请会提示对应状态
- **RBAC**：`resolveHome` / `resolveLoginPath` / `resolveLogoutPath` / `canAccessPath` / `roleMatchesPortal`
- **校验**：`validatePassword`、四类注册表单校验（邀请码必填）、`validateInvitation`、`validateRecoveryEmail`

### src/approvalData.js — 审核数据层
模拟后端三张表（邀请码 / 注册申请 / 激活账号），localStorage 持久化：
- **邀请码**：平台派发机构邀请码（`T-INV-*`）、机构派发客服邀请码（`A-INV-*`，绑定机构），支持撤销与一次性使用
- **注册申请**：提交申请即消耗邀请码；机构申请仅平台端审核，客服申请需机构端 + 平台端两级审核，任一端驳回释放邀请码
- **激活账号**：两端均通过后创建用户（机构管理员 / 客服）并写入用户表，登录时校验激活状态

### src/aiService.js — AI 一键接管服务层
为会话工作台提供「AI 接管」能力：
- `AI_TAKEOVER` 配置：总开关 + 三种 provider（`local-mock` 本地模拟引擎 / `backend-proxy` 走 `/api/v1/ai/chat` 后端代理 / `openai-compatible` 直连 OpenAI 兼容协议）
- `requestAiReply`：根据接管摘要、队列类型、优先级生成贴合上下文回复，模拟延迟可配
- `buildAiSystemNote`：接管触发原因（繁忙 / 非工作时间 / 休息 / 过载）→ 客户可见的系统提示文案

### src/workbenchData.js — 工作台数据层
- `conversationsSeed`：会话种子数据（从 App.jsx 抽出，含 7 条会话）
- `getConversationAssignment`：会话 → 客服分配映射
- 客服团队队列选项模型：用于「团队工作负载 ↔ 分流接待队列」联调（队列类型 / 优先级 / 客服分配）

### src/components/ApprovalCenter.jsx — 注册审核中心
管理后台的审核界面，`mode` 区分超管 / 机构管理员两套视图：
- 超管：机构入驻审核、客服两级审核（平台端操作）、机构邀请码派发与撤销
- 机构管理员：本机构客服注册审核（机构端操作）、客服邀请码派发与撤销
- 客服申请表格同时展示两端审核状态与“审核流程”指示条，终态一目了然

### src/AuthPage.jsx — 双门户认证页
根据 `portal` 属性读取 `authPortal.js` 的文案与角色分类，渲染服务端（客服/客户）或管理端（平台/机构管理员）的登录 / 注册 / 找回密码表单；注册按角色分流到对应表单。

### src/api.js — 业务 API 封装
`authRequest` 自动附带 Bearer Token；`fetchAgents` / `updateAgentStatus`（坐席 F-006）、`fetchTenants` / `updateTenantStatus` / `createTenant` / `updateTenant`（租户 F-002），支持分页与搜索参数。

### src/prototype.js — 原型与状态逻辑
- `getWorkArea` / `getAgentWorkspaceNav`：工作区路由映射与角色感知导航
- `transitionChat`：客户聊天状态机（欢迎 → 排队 → 接待 → 结束 → 评价）
- `resolveServiceMode`：按工作时段判定 AI / 人工服务模式
- `loadPrototypeConfig` / `savePrototypeConfig`：客户入口配置（欢迎语、主题色、AI 时段）持久化

### src/ServiceWorkspace.jsx — 客服工作区 + 客户聊天
- `TeamDashboard`：团队负载、排班、交接提醒
- `KnowledgeBase`：FAQ / 文档 / 未命中问题
- `ServiceSettings`：AI 接管时段与客户入口界面配置，实时预览与发布
- `CustomerChat`：客户聊天窗口（状态机流转、AI/人工模式、星级评价）

### src/AgentWorkspaceShell.jsx — 工作区外壳
角色感知的左侧导航（会话 / 看板 / 知识库 / 配置），顶栏展示登录人与退出登录。

### src/AdminConsole.jsx — 管理控制台
`mode` 区分平台 / 机构两套导航：
- `PlatformContent`：审核中心、机构列表（编辑）、模型、会话监控、告警中心、审计、监控、配置
- `OrganizationContent`：审核中心、客服与组织（`AgentList` 组件 + 批量操作）、客户、知识库、路由策略、渠道、会话监控、运营
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
`auth.test.js`（认证 / RBAC / 校验 / 激活登录门禁）、`authPortal.test.js`（门户配置）、`approvalData.test.js`（邀请码 / 两级审核状态机 / 激活）、`prototype.test.js`（工作区 / 状态机 / 服务模式 / 配置持久化）、`aiService.test.js`（AI 接管回复 / 系统提示）、`workbenchData.test.js`（分配映射 / 团队队列），共 **49 个用例**，`npm test` 全绿。

### docs/ 与 output/ — 文档与原型
- `docs/原型设计/*.html`：7 个可独立打开的高保真原型页
- `docs/superpowers/`：后端 MVP、双前端认证、双客服调度的设计规格（specs）和实施计划（plans）
- `docs/frontend-improvements.md`：前端改进建议清单（P0 / P1 分级，只做纯前端可独立完成项）
- `designs/*.html`：运营大屏视觉设计稿（指挥中心 / 驾驶舱 / 平台全局）
- `output/`：第一期设计文档交付态及迭代说明（AI 一键接管接入、Nginx 生产部署、前端改进落地、客服看板优化与分流联调、大厅客服管理看板对标总结）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 运行单元测试（49 个用例）
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
