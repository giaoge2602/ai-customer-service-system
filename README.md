# AI 智能客服系统

一个面向多租户场景的 **AI 智能客服系统** 前端演示原型，覆盖「登录认证 + 客服接待工作台 + 平台管理中心 + 机构管理中心」多端视图。项目采用 React 19 + Vite 7 构建，全部数据为本地 Mock 演示数据，开箱即用。

## 功能特性

### 0. 登录认证与权限控制（/login /register /forgot-password）
- **三合一认证页**：登录、邀请码注册激活、找回密码三种模式，统一品牌展示与安全提示
- **演示账号快速登录**：一键切换超级管理员 / 机构管理员 / 客服专员三种身份
- **RBAC 权限路由**：`ProtectedRoute` 守卫，按角色（`platform_admin` / `tenant_admin` / `agent`）控制页面访问，越权自动跳转角色首页
- **会话级登录态**：登录状态保存在 `sessionStorage`，页面刷新不丢失，退出登录一键清除
- **表单校验**：注册校验邀请码、邮箱格式、密码强度（大小写 + 数字 + ≥8 位）；找回密码校验邮箱
- **单元测试**：认证逻辑全部覆盖 Node 内置测试框架（`npm test`），5 个用例全绿

### 1. 客服工作台（/workbench）
- **实时会话列表**：支持按状态（待接管 / 处理中 / AI 接待 / 已结束）、渠道（微信 / 网页 / 企业微信 / H5 / API）、SLA 风险（即将超时 / 已超时 / 正常）多维度筛选与关键词搜索
- **AI 辅助接待**：展示 AI 应答置信度、知识库引用来源，低置信度会话自动请求人工协助
- **人工接管**：一键接管 AI 会话，接管后获得发送权限
- **AI 建议回复**：基于当前会话与知识库生成回复建议，可一键采纳到草稿
- **快捷回复 / 附件 / 语音**：常用话术快捷发送，演示附件与语音能力
- **SLA 监控**：每个会话展示 SLA 剩余时间与风险状态（正常 / 即将超时 / 已超时）
- **客户上下文侧栏**：客户档案（等级、来源、脱敏手机号、满意度、标签）、AI 接管摘要、转人工原因、知识引用
- **会话转接 / 结束 / 工单创建**：转接至技能组或指定客服，结束会话等待客户评价，一键创建关联工单

### 2. 平台管理中心（/platform）
- **平台运营总览**：机构总数、在线租户、今日会话、全局 AI 解决率等核心指标；近 7 日服务量趋势；租户健康排行；待处理事项与最近审计事件
- **机构与租户**：租户生命周期管理（审核 / 启用 / 停用），展示套餐、坐席使用、配额使用率
- **AI 模型中心**：模型供应商管理（DeepSeek V3、通义千问 Max、私有化模型），支持设置默认模型
- **全局配置**：会话保留时长、AI 安全模式、默认首响 SLA 等平台级参数
- **安全与审计**：关键操作审计日志（含 requestId、操作者、风险等级）
- **运维监控**：消息 API、Socket 实时通道、知识检索、Webhook 等核心服务健康度

### 3. 机构管理中心（/organization）
- **机构运营总览**：今日会话、AI 自助解决率、SLA 达成率、客户满意度；实时服务概览、渠道状态、客服负载排行
- **客服与组织**：客服账号管理（在线状态、技能组、会话量、首响时间、满意度）
- **客户中心**：跨渠道统一客户档案，敏感字段脱敏展示，隐私授权状态
- **知识库运营**：知识文档导入、审核发布、分片数与命中率统计
- **AI 与路由策略**：意图识别路由规则（退款售后 / 技术故障 / 投诉升级），置信度阈值与人工兜底配置
- **渠道与开放能力**：Web Widget、微信公众号、企业微信、Open API 渠道接入状态管理
- **服务运营**：首响 SLA、AI 转人工率、质检通过率等服务健康指标

## 技术栈

| 分类 | 技术 | 版本 |
| --- | --- | --- |
| 框架 | React | ^19.1.1 |
| 路由 | react-router-dom | ^7.9.5 |
| 构建工具 | Vite | ^7.1.7 |
| 编译插件 | @vitejs/plugin-react-swc | ^4.1.0 |
| 测试框架 | Node 内置 node:test | Node 22+ |
| 开发语言 | JavaScript (JSX) | ES Module |

## 目录结构

```
ai-customer-service-system/
├── index.html                  # HTML 入口（SPA 挂载点）
├── package.json                # 项目依赖与脚本（含 test）
├── vite.config.js              # Vite 构建配置
├── .gitignore                  # Git 忽略规则
├── docs/                       # 设计文档（superpowers/specs 与 plans）
└── src/
    ├── main.jsx                # 应用入口：挂载 React、注册路由、引入全局样式
    ├── App.jsx                 # 路由编排 + 受保护路由 + 客服工作台（三栏布局）
    ├── AuthPage.jsx            # 认证页（登录 / 注册激活 / 找回密码）
    ├── auth.js                 # 认证逻辑（演示账号、RBAC 权限判断、表单校验）
    ├── auth.test.js            # 认证逻辑单元测试（node:test）
    ├── AdminConsole.jsx        # 管理控制台（平台模式 + 机构模式，按路由模块渲染）
    ├── adminData.js            # Mock 数据（租户、模型、审计、客服、客户、知识库、渠道、路由规则）
    ├── styles.css              # 客服工作台样式
    ├── admin.css               # 管理控制台样式
    ├── auth.css                # 认证页面样式
    └── polish.css              # 全局细节打磨样式
```

## 模块代码说明

### src/main.jsx — 应用入口
使用 `ReactDOM.createRoot` 挂载应用，外层包裹 `BrowserRouter` 提供路由能力，引入全局样式 `styles.css`、`admin.css`、`polish.css` 与认证页样式 `auth.css`。

### src/auth.js — 认证与权限逻辑
纯函数模块，便于单元测试：
- `demoAccounts`：3 个演示账号（超级管理员 / 机构管理员 / 客服专员），含角色、租户、权限列表
- `authenticateDemo(email, password)`：演示登录校验，成功返回去除描述字段的会话对象
- `resolveHome(role)`：按角色返回首页路由
- `canAccessPath(role, pathname)`：RBAC 路径级访问控制
- `validateInvitation(values)` / `validateRecoveryEmail(email)`：注册与找回密码表单校验

### src/AuthPage.jsx — 认证页面
左右分栏布局：左侧品牌故事区（平台理念 + 运行概览），右侧认证卡片（`LoginForm` / `RegisterForm` / `RecoveryForm`）。支持演示账号快速登录、密码可见性切换、邀请码激活流程。

### src/App.jsx — 路由编排 + 客服工作台
- **路由编排**：`/`、`/login`、`/register`、`/forgot-password` 公开访问；`/workbench`、`/platform/*`、`/organization/*` 由 `ProtectedRoute` 守卫（未登录跳转登录页，越权跳转角色首页）；登录态存 `sessionStorage`，支持退出登录
- **客服工作台三栏布局**：
  - **左侧会话栏**：搜索、筛选、会话列表（`ConversationItem` 渲染）
  - **中间消息区**：会话头部（SLA 时钟、转接 / 结束按钮）、AI 接管横幅（`HandoffBanner`）、消息流（`MessageItem`，区分客户 / AI / 客服 / 系统）、AI 建议回复卡片（`AiSuggestionCard`）、输入框（Enter 发送、快捷回复）
  - **右侧上下文栏**：客户信息卡（`CustomerCard`）、AI 接管摘要、转人工原因、知识引用、备注与工单（`PanelSection` 折叠面板）
- 内置 6 条演示会话数据（`conversationsSeed`），支持接管、发送、结束、转接、建工单等完整交互
- 顶栏展示当前登录客服姓名与角色，提供退出登录

### src/AdminConsole.jsx — 管理控制台
通过 `mode` 属性区分 **平台管理**（`platformNav`）与 **机构管理**（`orgNav`）两套导航与内容渲染，接收 `session` 与 `onLogout` 展示真实登录身份：
- `PlatformContent`：租户管理表格、模型卡片、审计日志、服务监控
- `OrganizationContent`：客服账号、客户档案、知识库、路由策略、渠道接入表格
- `PlatformOverview` / `OrganizationOverview`：两端运营总览（指标卡 `MetricGrid`、趋势图 `TrendChart`、待办事项、排行榜）
- `Operations` / `SettingsPanel`：服务运营指标、全局配置表单
- 通用组件：`DataTable` 数据表格、`Pill` 状态标签、`Progress` 进度条、`DemoModal` 演示弹窗
- 顶栏按 `session.role` 动态渲染：超级管理员可切换租户上下文，机构管理员固定租户视图；侧栏提供「退出登录」

### src/adminData.js — Mock 数据层
集中管理全部演示数据：`platformStats`（平台指标）、`organizationStats`（机构指标）、`tenants`（租户）、`models`（模型）、`auditLogs`（审计）、`services`（服务监控）、`agents`（客服）、`customers`（客户）、`knowledgeDocs`（知识库）、`channels`（渠道）、`routingRules`（路由规则）。

### docs/ — 设计文档
- `docs/superpowers/specs/`：后端 MVP 设计规格（技术方案、模块边界、数据模型）
- `docs/superpowers/plans/`：后端 MVP 实施计划（任务拆解与里程碑）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 运行单元测试（认证逻辑，共 5 个用例）
npm test

# 生产构建
npm run build

# 预览生产构建产物
npm run preview
```

### 演示账号

| 身份 | 邮箱 | 密码 |
| --- | --- | --- |
| 超级管理员 | `admin@ai-service.demo` | `Demo@2026` |
| 机构管理员 | `admin@xinghe.demo` | `Demo@2026` |
| 客服专员 | `lina@xinghe.demo` | `Demo@2026` |

> 登录页也提供「演示身份快速登录」一键选择。

### 访问入口

| 页面 | 路由 | 可访问角色 |
| --- | --- | --- |
| 登录 / 注册 / 找回密码 | `/login` `/register` `/forgot-password` | 公开 |
| 客服工作台 | `/workbench` | 全部角色 |
| 平台管理中心 | `/platform`（默认跳转 `/platform/overview`） | 超级管理员 |
| 机构管理中心 | `/organization`（默认跳转 `/organization/overview`） | 超级管理员 / 机构管理员 |

> 超级管理员可在管理控制台右上角切换租户上下文，机构管理员固定在其机构视图；越权访问会自动跳转回角色首页。

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

示例：

```bash
git commit -m "feat：新增 AI 建议回复一键采纳到草稿"
```

## 版本更迭

版本历史与每个版本的任务产出介绍见 [CHANGELOG.md](./CHANGELOG.md)（中文维护）。

## 说明

- 本项目为 **前端演示原型**，所有数据均为本地 Mock，不涉及真实后端服务与真实用户数据
- 敏感字段（手机号、邮箱等）均已在展示层脱敏
- 管理端操作（创建、停用、发布等）仅更新页面本地状态，不会持久化
