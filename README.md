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
- **四类注册**：客服坐席、客户、机构管理员、超级管理员各有独立注册接口与表单校验（密码强度、邮箱格式、机构 ID 等）
- **登录态管理**：会话与 Token 保存在 `sessionStorage`，刷新不丢失，按门户路由退出

### 1. 客服工作台（/workbench）
- **会话接待**：实时会话列表（状态 / 渠道 / SLA 风险多维筛选 + 关键词搜索）、AI 置信度与知识引用展示、人工接管、AI 建议回复、快捷回复、SLA 监控、转接 / 结束 / 建工单
- **客服看板（/workbench/dashboard）**：团队工作负载、在线/排队/满意度指标、班次安排与交接提醒
- **知识库（/workbench/knowledge）**：FAQ 与知识文档管理、命中率统计、未命中问题沉淀
- **AI 与界面配置（/workbench/settings）**：非工作时间 AI 接管时段、欢迎语、品牌主题色、窗口形态配置，实时预览并可发布到客户入口

### 2. 客户服务入口（/customer/chat）
- **独立聊天窗口**：客户登录后发起咨询，支持常见问题快捷提问
- **AI / 人工模式切换**：工作时段人工优先，非工作时间由 AI 基于企业知识库接待（`resolveServiceMode` 按时间自动判定）
- **会话流转**：欢迎 → 排队 → 接待中 → 已结束 → 评价（`transitionChat` 状态机），结束可提交星级评价

### 3. 平台管理中心（/platform）
- **平台运营总览**：机构总数、在线租户、今日会话、全局 AI 解决率；近 7 日服务量趋势；租户健康排行；待办与审计动态
- **机构与租户**：租户生命周期管理（审核 / 启用 / 停用）、套餐与配额可视化（已封装 `api.js` 租户接口，可对接后端 F-002）
- **AI 模型中心**：DeepSeek V3、通义千问 Max、私有化模型统一管理，支持设置默认模型
- **全局配置 / 安全与审计 / 运维监控**：平台级参数、审计日志、核心服务健康度

### 4. 机构管理中心（/organization）
- **机构运营总览**：今日会话、AI 解决率、SLA 达成率、满意度；实时服务概览与客服负载
- **客服与组织**：客服账号管理（已封装 `api.js` 坐席接口，可对接后端 F-006）
- **客户中心 / 知识库 / AI 路由策略 / 渠道接入 / 服务运营**：档案、知识文档、意图路由、渠道状态、服务健康指标

### 5. 设计文档与原型产出
- `docs/原型设计/`：7 个可独立打开的 HTML 原型页（登录页、PC 客服工作台、客户 Web 入口、平台管理后台、租户运营后台等）
- `docs/superpowers/`：设计规格与实施计划（后端 MVP、双前端认证改造）
- `output/`：第一期文档交付物（产品思维导图、详细设计、原型设计、简化版、技术选型，均为 md / html / docx 三态）
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
│   └── superpowers/            # 设计规格（specs）与实施计划（plans）
├── output/                     # 第一期文档交付物（md / html / docx）
└── src/
    ├── main.jsx                # 应用入口：挂载 React、注册路由、引入全局样式
    ├── App.jsx                 # 路由编排 + 受保护路由 + 客服工作台（三栏布局）
    ├── AuthPage.jsx            # 认证页（双门户：登录 / 注册 / 找回密码）
    ├── authPortal.js           # 双门户文案与角色分类配置
    ├── auth.js                 # 认证逻辑（后端 API 调用、演示降级、RBAC、表单校验）
    ├── api.js                  # 业务 API 封装（坐席 F-006、租户 F-002，Bearer Token）
    ├── AgentWorkspaceShell.jsx # 客服工作区外壳（角色感知导航栏）
    ├── ServiceWorkspace.jsx    # 客服看板 / 知识库 / 配置 + 客户聊天窗口
    ├── prototype.js            # 原型逻辑（工作区映射、聊天状态机、服务模式、配置持久化）
    ├── AdminConsole.jsx        # 管理控制台（平台模式 + 机构模式）
    ├── adminData.js            # Mock 数据（租户、模型、审计、客服、客户、知识库、渠道、路由规则）
    ├── auth.test.js            # 认证逻辑单元测试
    ├── authPortal.test.js      # 双门户配置单元测试
    ├── prototype.test.js       # 原型逻辑单元测试
    └── *.css                   # 各模块样式（styles / admin / auth / polish / prototype）
```

## 模块代码说明

### src/main.jsx — 应用入口
挂载 React 应用，包裹 `BrowserRouter`，引入全部全局样式（含认证页与原型样式）。

### src/App.jsx — 路由编排 + 客服工作台
- **路由编排**：`/service/*`、`/admin/*` 为双门户认证路由；`/customer/chat` 客户聊天；`/workbench*` 客服工作区；`/platform/*`、`/organization/*` 管理后台——受保护路由统一由 `ProtectedRoute` 守卫
- **工作区路由分流**：`WorkbenchRoute` 通过 `getWorkArea()` 判断 `/workbench` 下的子区域（会话 / 看板 / 知识库 / 配置），非会话区域渲染 `ServiceWorkspace`
- **客服工作台三栏布局**：会话列表（筛选 + 搜索）、消息工作区（SLA 时钟、AI 接管横幅、消息流、AI 建议、快捷回复）、客户上下文侧栏（客户档案、接管摘要、知识引用、备注工单）

### src/auth.js — 认证与权限核心
- **后端 API 层**：`apiRequest` 统一封装（错误码映射、服务不可用识别）、`apiLogin`、`registerAgent` / `registerPlatformAdmin` / `registerTenant` / `registerCustomer`、`fetchTenantOptions`
- **演示降级**：`loginWithDemoFallback` 在后端不可用时用 `demoAccounts`（4 角色）完成登录
- **RBAC**：`resolveHome` / `resolveLoginPath` / `resolveLogoutPath` / `canAccessPath` / `roleMatchesPortal`
- **校验**：`validatePassword`、四类注册表单校验、`validateInvitation`、`validateRecoveryEmail`

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
`mode` 区分平台 / 机构两套导航；`PlatformContent`（租户、模型、审计、监控）、`OrganizationContent`（客服、客户、知识库、路由、渠道）；运营总览指标卡、趋势图、待办；通用表格 / 标签 / 弹窗组件。

### src/adminData.js — Mock 数据层
集中管理演示数据：平台指标、机构指标、租户、模型、审计、服务监控、客服、客户、知识库、渠道、路由规则。

### 测试（src/*.test.js）
`auth.test.js`（认证 / RBAC / 校验）、`authPortal.test.js`（门户配置）、`prototype.test.js`（工作区 / 状态机 / 服务模式 / 配置持久化），共 **29 个用例**，`npm test` 全绿。

### docs/ 与 output/ — 文档与原型
- `docs/原型设计/*.html`：7 个可独立打开的高保真原型页
- `docs/superpowers/`：后端 MVP 与双前端认证的设计规格（specs）和实施计划（plans）
- `output/`：第一期五份设计文档（产品思维导图、详细设计、原型设计、简化版、技术选型）的 md / html / docx 交付态

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 运行单元测试（29 个用例）
npm test

# 生产构建
npm run build

# 预览生产构建产物
npm run preview
```

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
