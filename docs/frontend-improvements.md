# 前端修改建议（纯前端 · 不涉及后端联调）

> 原则：只做前端能独立完成的改进，后端接口预留但不调用。

---

## 🔴 P0 — 影响核心使用

### 1. 看板数据用本地 state 模拟"活"的

**现状**：`TeamDashboard()` 的 `team` 数组硬编码，数字永不变化。

**改法**：用 `useState` + `useEffect(() => setInterval(...), 1000)` 做本地模拟：

- 排队数 ±1 随机波动
- SLA 倒计时从 `03:42` 变成真正的每秒递减
- 客服状态按概率随机切换（online ↔ busy）
- 加 `/* TODO: 替换为后端 /api/v1/dashboard/realtime */` 注释

---

### 2. 排队队列加排序 + 一键接入

**现状**：会话按数组顺序排列；接入要先选中再点按钮。

**改法**：

```js
// 排序：danger → warning → safe，同等级按时间升序
const sorted = [...conversations].sort((a, b) => {
  const order = { danger: 0, warning: 1, safe: 2 };
  return order[a.slaRisk] - order[b.slaRisk];
});
```

- 每行直接显示「接管」按钮，点击即切换 `status: 'human'`
- 顶部加「一键接下一」按钮，自动调用 `takeOver(sorted[0])`

---

### 3. 拆分 AdminConsole

**现状**：230 行单文件，`mode === 'platform'` 和 `organization` 条件满天飞。

**改法**：

```
src/
  AdminConsole.jsx          → 只保留 layout + 路由分发
  components/
    PlatformOverview.jsx    → 超管总览
    OrgOverview.jsx         → 机构总览
    AgentList.jsx           → 客服列表（两种模式复用）
    KnowledgeList.jsx       → 知识库
```

---

## 🟡 P1 — 体验优化

### 4. SLA 倒计时组件化

**现状**：`sla: '03:42'` 是死字符串。

**改法**：

```jsx
// SlaCountdown.jsx
function SlaCountdown({ deadline /* ISO 时间或秒数 */ }) {
  const [left, setLeft] = useState(deadline);
  useEffect(() => {
    const t = setInterval(() => setLeft(v => v > 0 ? v - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return <span className={left < 60 ? 'danger' : left < 180 ? 'warning' : ''}>{mm}:{ss}</span>;
}
```

种子数据里 `sla` 改成秒数：`sla: 222` 表示 3 分 42 秒。

---

### 5. AI 辅助回复按钮移到工具栏

**现状**：按钮在消息流底部，打断阅读。

**改法**：把 `ai-trigger` 按钮从 `message-scroll` 移到 `composer-toolbar` 里，和快捷回复、附件、语音并列。

---

### 6. 评价组件增强

**现状**：纯 1-5 星，提交后无反馈。

**改法**：

- 星星下方加 `<textarea placeholder="还有什么想说的？（选填）">`
- 提交后显示一个渐变的「感谢反馈 ✓」动画卡片，2 秒后自动消失
- 用 CSS `@keyframes slideUp` 实现，不依赖后端

---

### 7. 筛选条件写入 URL

**现状**：切换 tab 后搜索词和筛选丢失。

**改法**：

```js
// 用 useSearchParams 替代 useState
const [params, setParams] = useSearchParams();
const query = params.get('q') || '';
const status = params.get('status') || 'all';
```

---

### 8. 表格加批量操作

**现状**：只能逐条操作。

**改法**：

- 表头加全选 checkbox
- 每行加 checkbox
- 选中后底部出现操作栏：「批量停用」「批量导出」
- 操作只改本地 state，加注释 `/* TODO: 批量 API */`

---

## 🟢 P2 — 细节打磨

### 9. 客服状态切换入口

**改法**：在 `topbar` 的「在线接待」旁边加一个下拉：

```
[在线接待 ▾]
  ├─ 在线接待
  ├─ 忙碌（不分配新会话）
  └─ 离线
```

用 `useState` 控制，影响新会话是否分配给自己。

---

### 10. 右侧面板默认关闭

**改法**：`const [rightOpen, setRightOpen] = useState(false)`。

把「AI 接管摘要」和「转人工原因」折叠到聊天区顶部的 `handoff-banner` 里，不依赖右侧面板。

---

### 11. 邀请码输入框加引导

**改法**：在邀请码输入框下方加一行灰色小字：

> 没有邀请码？试用账号请直接前往登录：`admin@ai-service.demo`

---

### 12. 移动端导航支持手势关闭

**改法**：在 `mobile-rail-drawer` 上监听 `touchstart/touchend`，左滑 > 80px 时调用 `setMobileOpen(false)`。

---

### 13. 表格空状态统一

**现状**：每个表格的 empty 状态文案不同。

**改法**：抽成 `<EmptyState icon="search" title="暂无数据" desc="试试调整筛选条件" />` 组件。

---

## 📁 文件改动清单

| 文件 | 改动 |
|------|------|
| `ServiceWorkspace.jsx` | `TeamDashboard` 加本地模拟 + SLA 倒计时 |
| `App.jsx` | 排队排序 + 一键接入 + AI 按钮移位 + 右侧默认关 |
| `AdminConsole.jsx` | 拆分为 4-5 个子组件 |
| `AuthPage.jsx` | 邀请码引导文字 |
| `AgentWorkspaceShell.jsx` | 状态切换下拉 + 手势关闭 |
| 新建 `SlaCountdown.jsx` | 倒计时组件 |
| 新建 `EmptyState.jsx` | 空状态组件 |
| `dashboard.css` | 表格批量操作栏样式 |

---

## ⏱ 预估工时

| 优先级 | 工时 |
|--------|------|
| P0 | 1-2 天 |
| P1 | 2-3 天 |
| P2 | 1 天 |
| **合计** | **4-6 天** |
