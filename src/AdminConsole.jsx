import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { auditLogs, channels, customers, knowledgeDocs, models, organizationStats, platformStats, routingRules, services, agents as demoAgents, todayRealtime, channelShare, tokenTrend, platformTrend, platformTodos, dashboardAlerts, monitoredConversations, conversationMessages, realtimeMetrics, alertList, orgActivityData, orgRealtime, orgTodayRealtime, orgChannelShare, orgTokenTrend, orgRealtimeAlerts, orgAgentLoad } from './adminData'
import { deriveAgentWorkload, getConversationAssignment, getQueueType, conversationsSeed } from './workbenchData'
import { createTenant, fetchAgents, fetchTenants, updateAgentStatus, updateTenant, updateTenantStatus } from './api'
import AgentList from './components/AgentList'
import ApprovalCenter from './components/ApprovalCenter'

const AIcon = ({ name, size = 17 }) => {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    building: <><path d="M4 21V5l8-3 8 3v16M2 21h20M8 8h1M15 8h1M8 12h1M15 12h1M8 16h1M15 16h1"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M16 11a3 3 0 1 0 0-6M17 15c2.5.3 4 2 4 5"/></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.4-.7L4 20l1.7-3.4A7.3 7.3 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"/></>,
    spark: <><path d="m12 3 1.3 5.7L19 10l-5.7 1.3L12 17l-1.3-5.7L5 10l5.7-1.3L12 3Z"/><path d="m19 16 .5 2.5L22 19l-2.5.5L19 22l-.5-2.5L16 19l2.5-.5L19 16Z"/></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.2-8 10-4.5-1.8-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/></>,
    route: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a6 6 0 0 1 6 6v4M16 18h-4a6 6 0 0 1-6-6V8"/></>,
    channel: <><path d="M4 5h16v11H4zM8 20h8M12 16v4"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 3-4 3 2 5-7"/></>,
    pulse: <><path d="M3 12h4l2-6 4 12 2-6h6"/></>,
    clock: <><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 15a2 2 0 0 0 .3 2l.1.1-1.7 1.7-.1-.1a2 2 0 0 0-2-.3 2 2 0 0 0-1.1 1.8v.1h-2.4v-.1a2 2 0 0 0-1.1-1.8 2 2 0 0 0-2 .3l-.1.1-1.7-1.7.1-.1a2 2 0 0 0 .3-2A2 2 0 0 0 6 14H5v-2h1a2 2 0 0 0 1.7-1.1 2 2 0 0 0-.3-2l-.1-.1L9 7.1l.1.1a2 2 0 0 0 2 .3A2 2 0 0 0 12 6V5h2v1a2 2 0 0 0 1.1 1.7 2 2 0 0 0 2-.3l.1-.1 1.7 1.7-.1.1a2 2 0 0 0-.3 2A2 2 0 0 0 20 12h1v2h-1a2 2 0 0 0-1.7 1Z"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.5 4.5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    download: <><path d="M12 3v12M7 11l5 5 5-5M4 20h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
        fullscreen: <><path d="M3 3h7v2H5v5H3zM14 3h7v7h-2V5h-5zM3 14h2v5h5v2H3zM19 14h2v7h-7v-2h5z"/></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.grid}</svg>
}

const platformNav = [
  { group: '平台运营', items: [{ id: 'overview', label: '平台总览', icon: 'grid' }, { id: 'organizations', label: '机构列表', icon: 'building' }, { id: 'approvals', label: '审核中心', icon: 'shield' }, { id: 'conversations', label: '会话监控', icon: 'chat' }] },
  { group: '平台配置', items: [{ id: 'models', label: 'AI 模型中心', icon: 'spark' }, { id: 'config', label: '全局配置', icon: 'settings' }] },
  { group: '安全与运维', items: [{ id: 'alerts', label: '告警中心', icon: 'shield' }, { id: 'audit', label: '安全与审计', icon: 'shield' }, { id: 'monitoring', label: '运维监控', icon: 'chart' }] },
]
const orgNav = [
  { group: '运营工作区', items: [{ id: 'overview', label: '机构总览', icon: 'grid' }] },
  { group: '客户与组织', items: [{ id: 'people', label: '客服与组织', icon: 'users' }, { id: 'approvals', label: '审核中心', icon: 'shield' }, { id: 'customers', label: '客户中心', icon: 'users' }, { id: 'conversations', label: '会话监控', icon: 'chat' }] },
  { group: 'AI 服务', items: [{ id: 'knowledge', label: '知识库', icon: 'database' }, { id: 'ai', label: 'AI 与路由策略', icon: 'route' }, { id: 'channels', label: '渠道接入', icon: 'channel' }] },
  { group: '数据与运营', items: [{ id: 'operations', label: '服务运营', icon: 'chart' }] },
]

function currentModule(pathname, mode) {
  const prefix = mode === 'platform' ? '/platform/' : '/organization/'
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length).split('/')[0] || 'overview' : 'overview'
}

function mapAgent(agent) {
  return {
    id: agent.id,
    name: agent.name,
    initials: agent.name.slice(0, 1),
    role: '客服专员',
    email: agent.email,
    status: agent.status === 'active' ? 'online' : 'offline',
    statusText: agent.status === 'active' ? '在线' : '离线',
    groups: [],
    sessions: 0,
    response: '—',
    satisfaction: '—',
  }
}

function mapTenant(tenant) {
  return {
    id: tenant.id,
    name: tenant.name,
    industry: '—',
    plan: '标准版',
    status: tenant.status,
    statusText: tenant.status === 'active' ? '运行中' : '已停用',
    agents: `${tenant.agentCount ?? 0}`,
    conversations: String(tenant.conversationCount ?? 0),
    usage: 0,
    lastActive: '—',
  }
}

export default function AdminConsole({ mode = 'platform', session, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [localTenants, setLocalTenants] = useState([])
  const [localAgents, setLocalAgents] = useState([])
  const [localDocs, setLocalDocs] = useState(knowledgeDocs)
  const [localRules, setLocalRules] = useState(routingRules)
  const [localChannels, setLocalChannels] = useState(channels)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mobileNavButtonRef = useRef(null)
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [tenantModal, setTenantModal] = useState(null)
  const module = currentModule(location.pathname, mode)

  useEffect(() => {
    if (!mobileNavOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false)
        mobileNavButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileNavOpen])

  const loadTenants = () => fetchTenants().then((data) => setLocalTenants((data.items || []).map(mapTenant))).catch(() => setLocalTenants([]))

  useEffect(() => {
    if (mode === 'platform') {
      loadTenants()
    } else {
      fetchAgents({ tenantId: session.tenantId || 'TENANT-018' })
        .then((data) => setLocalAgents((data.items || []).map(mapAgent)))
        .catch(() => setLocalAgents([]))
    }
  }, [mode])
  const nav = mode === 'platform' ? platformNav : orgNav
  const isPlatform = mode === 'platform'

  const notify = (text) => { setToast(text); window.setTimeout(() => setToast(''), 2400) }
  const go = (id) => {
    navigate(`${isPlatform ? '/platform' : '/organization'}/${id}`)
    setMobileNavOpen(false)
  }
  const openModal = (title) => { setModalTitle(title); setShowModal(true) }
  const submitTenantForm = async (name) => {
    if (tenantModal.mode === 'create') {
      await createTenant({ name })
      notify('机构已创建并写入数据库')
    } else {
      await updateTenant(tenantModal.tenant.id, { name })
      notify('机构信息已更新并写入数据库')
    }
    setTenantModal(null)
    loadTenants()
  }
  const matchesStatus = (item) => statusFilter === 'all' || item.status === statusFilter
  const filteredTenants = useMemo(() => localTenants.filter((item) => matchesStatus(item) && `${item.name} ${item.id} ${item.industry}`.toLowerCase().includes(query.toLowerCase())), [localTenants, query, statusFilter])
  const filteredAgents = useMemo(() => localAgents.filter((item) => matchesStatus(item) && `${item.name} ${item.role} ${item.groups.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [localAgents, query, statusFilter])
  const filteredDocs = useMemo(() => localDocs.filter((item) => matchesStatus(item) && `${item.name} ${item.type}`.toLowerCase().includes(query.toLowerCase())), [localDocs, query, statusFilter])

  const toggleTenant = async (id) => {
    const target = localTenants.find((item) => item.id === id)
    if (!target) return
    const nextStatus = target.status === 'paused' ? 'active' : 'paused'
    try {
      await updateTenantStatus(id, nextStatus)
      setLocalTenants((items) => items.map((item) => item.id === id ? { ...item, status: nextStatus, statusText: nextStatus === 'active' ? '运行中' : '已停用' } : item))
      notify('机构状态已更新并写入数据库')
    } catch (err) {
      notify(err.message || '机构状态更新失败')
    }
  }
  const toggleAgent = async (id) => {
    const target = localAgents.find((item) => item.id === id)
    if (!target) return
    const nextStatus = target.status === 'offline' ? 'active' : 'disabled'
    try {
      await updateAgentStatus(id, nextStatus)
      setLocalAgents((items) => items.map((item) => item.id === id ? { ...item, status: nextStatus === 'active' ? 'online' : 'offline', statusText: nextStatus === 'active' ? '在线' : '离线' } : item))
      notify('客服状态已更新并写入数据库')
    } catch (err) {
      notify(err.message || '客服状态更新失败')
    }
  }
  const publishDoc = (id) => { setLocalDocs((items) => items.map((item) => item.id === id ? { ...item, status: 'published', statusText: '已发布' } : item)); notify('知识文档已发布') }
  const toggleRule = (id) => { setLocalRules((items) => items.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item)); notify('路由策略状态已更新') }
  const toggleChannel = (id) => { setLocalChannels((items) => items.map((item) => item.id === id ? { ...item, status: item.status === 'connected' ? 'warning' : 'connected', statusText: item.status === 'connected' ? '待配置' : '已连接' } : item)); notify('渠道连接状态已更新') }

  const renderSidebar = (className = '') => <aside className={`admin-sidebar ${className}`}><div className="admin-side-label">{isPlatform ? 'ORGANIZATION' : 'ORGANIZATION'} CONSOLE</div>{nav.map((section) => <div className="admin-nav-group" key={section.group}><span>{section.group}</span>{section.items.map((item) => <button type="button" key={item.id} className={`admin-nav-item ${module === item.id ? 'active' : ''}`} aria-current={module === item.id ? 'page' : undefined} onClick={() => go(item.id)}><AIcon name={item.icon} size={16} /><span>{item.label}</span>{item.id === 'audit' && <b>2</b>}</button>)}</div>)}<div className="admin-sidebar-bottom"><button type="button" className="admin-nav-item" onClick={() => notify('帮助中心即将开放')}><AIcon name="settings" size={16} />帮助与设置</button><button type="button" className="admin-nav-item logout" onClick={onLogout}><AIcon name="arrow" size={16} />退出登录</button></div></aside>

  return <div className="admin-shell">
    <header className="admin-topbar"><button ref={mobileNavButtonRef} type="button" className="admin-mobile-menu admin-icon-btn" aria-label={mobileNavOpen ? '关闭管理导航' : '打开管理导航'} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}><AIcon name={mobileNavOpen ? 'close' : 'grid'} size={18} /></button><button type="button" className="admin-brand" onClick={() => go('overview')}><span className="admin-brand-mark"><AIcon name="spark" size={18} /></span><span><strong>AI智能客服系统</strong><small>{isPlatform ? '平台管理中心' : '机构管理中心'}</small></span></button><div className="admin-context"><span className="admin-env-dot" />本地演示环境 <i /> {isPlatform ? '全平台视图' : `${session.tenantName || '星河科技'} · ${session.tenantId || 'TENANT-018'}`}</div><div className="admin-top-actions">{session.role === 'platform_admin' ? <button type="button" className="admin-role-switch" onClick={() => navigate(isPlatform ? '/organization/overview' : '/platform/overview')}><span>超级管理员</span><small>{isPlatform ? '进入机构上下文' : '返回平台视图'}</small></button> : <div className="admin-role-switch static"><span>机构管理员</span><small>{session.tenantName || session.tenantId || 'TENANT-018'}</small></div>}<button type="button" className="admin-icon-btn" aria-label="查看通知" onClick={() => notify('暂无新的系统通知')}><AIcon name="chat" size={17} /></button><span className="admin-user-avatar">{session.name.slice(0, 1)}</span><div className="admin-user-meta"><b>{session.name}</b><small>{session.title}</small></div></div></header>
    <div className="admin-body">{renderSidebar()}
      {mobileNavOpen && <><button type="button" className="admin-nav-scrim" aria-label="关闭管理导航" onClick={() => { setMobileNavOpen(false); mobileNavButtonRef.current?.focus() }} /><div className="admin-mobile-drawer">{renderSidebar('admin-mobile-sidebar')}</div></>}
      <main className="admin-main"><div className="admin-page-head"><div><div className="admin-breadcrumb">{isPlatform ? '平台管理' : '机构管理'} <span>/</span> {nav.flatMap((section) => section.items).find((item) => item.id === module)?.label || '总览'}</div><h1>{pageTitle(module, isPlatform)}</h1><p>{pageDescription(module, isPlatform)}</p></div><div className="admin-head-actions"><span className="admin-updated">数据更新于 14:30</span>{(module === 'overview' || module === 'organizations' || module === 'people' || module === 'knowledge') && <button className="admin-primary-btn" onClick={() => isPlatform ? setTenantModal({ mode: 'create' }) : openModal(module === 'knowledge' ? '导入知识文档' : '邀请客服')}><AIcon name="plus" size={15} />{isPlatform ? '创建机构' : module === 'knowledge' ? '导入知识' : '邀请客服'}</button>}<button className="admin-secondary-btn" onClick={() => notify('运营摘要已生成（演示）')}><AIcon name="download" size={14} />导出摘要</button></div></div>
        <div className="admin-demo-notice"><AIcon name="shield" size={14} /><span>{isPlatform ? '机构数据已连接数据库 · 其余模块为演示数据' : '客服数据已连接数据库 · 其余模块为演示数据'}</span>{isPlatform && <strong>跨机构查看已开启审计记录</strong>}</div>
        {module !== 'overview' && <div className="admin-filter-bar"><div className="admin-search"><AIcon name="search" size={15} /><input aria-label="搜索" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isPlatform ? '搜索机构 ID 或行业' : '搜索姓名、文档或业务对象'} /></div><select aria-label="状态筛选" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">全部状态</option><option value="active">运行中</option><option value="review">待审核</option><option value="paused">已停用</option><option value="published">已发布</option><option value="processing">处理中</option></select><button type="button" className="admin-filter-clear" onClick={() => { setQuery(''); setStatusFilter('all') }}>清除条件</button></div>}
        {isPlatform ? <PlatformContent module={module} stats={platformStats} tenants={filteredTenants} models={models} logs={auditLogs} services={services} session={session} onToggleTenant={toggleTenant} onEditTenant={(tenant) => setTenantModal({ mode: 'edit', tenant })} onModal={openModal} onNotify={notify} /> : <OrganizationContent module={module} stats={organizationStats} agents={filteredAgents} customers={customers} docs={filteredDocs} rules={localRules} channels={localChannels} session={session} onToggleAgent={toggleAgent} onPublishDoc={publishDoc} onToggleRule={toggleRule} onToggleChannel={toggleChannel} onModal={openModal} onNotify={notify} />}
      </main></div>
    {showModal && <DemoModal title={modalTitle} onClose={() => setShowModal(false)} onSubmit={() => { setShowModal(false); notify(`${modalTitle}成功（演示）`) }} />}
    {tenantModal && <TenantFormModal title={tenantModal.mode === 'create' ? '创建新机构' : '编辑机构'} initialName={tenantModal.mode === 'edit' ? tenantModal.tenant.name : ''} onClose={() => setTenantModal(null)} onSubmit={submitTenantForm} />}
    {toast && <div className="admin-toast" role="status"><span>✓</span>{toast}</div>}
  </div>
}

function pageTitle(module, platform) { const map = platform ? { overview: '平台运营总览', organizations: '机构列表', approvals: '注册审核中心', conversations: '会话监控', models: 'AI 模型中心', config: '平台全局配置', alerts: '告警中心', audit: '安全与审计', monitoring: '运维监控' } : { overview: '机构运营总览', people: '客服与组织', approvals: '客服审核中心', customers: '客户中心', conversations: '会话监控', knowledge: '知识库运营', ai: 'AI 与路由策略', channels: '渠道与开放能力', operations: '服务运营' }; return map[module] || '管理中心' }
function pageDescription(module, platform) { const map = platform ? { overview: '实时监控平台运营状态，聚合查看机构健康度、服务容量与平台风险', organizations: '管理机构生命周期、套餐配额与机构隔离', approvals: '审核机构入驻与客服入职申请，管理邀请码派发，两级审核通过后账号方可激活', conversations: '跨机构查看异常会话记录，追溯完整聊天内容，上帝视角监控客服对话', models: '统一管理模型供应商、版本和默认策略', config: '配置平台级限流、通知与全局参数', alerts: '管理平台告警，及时处理异常事件', audit: '追踪关键操作、内容合规和数据权利请求', monitoring: '实时观察消息链路、检索与 Webhook 健康度' } : { overview: '查看星河科技的服务质量、AI 效率与团队负载', people: '管理客服账号、技能组、排班和服务绩效', approvals: '审核本机构客服入职申请，管理客服邀请码，机构与平台两端通过后账号激活', customers: '统一管理跨渠道客户档案、标签与隐私状态', conversations: '查看异常会话记录，追溯完整聊天内容，上帝视角监控客服对话', knowledge: '管理知识导入、审核发布与检索命中质量', ai: '配置意图、置信度护栏、模型和人工兑底', channels: '接入微信、企业微信、Widget 与开放 API', operations: '配置 SLA、质检、告警和运营报表' }; return map[module] || '配置和运营你的客户服务团队' }

function PlatformContent({ module, stats, tenants: tenantRows, models: modelRows, logs, services: serviceRows, session, onToggleTenant, onEditTenant, onModal, onNotify }) { if (module === 'approvals') return <ApprovalCenter mode="platform" session={session} onNotify={onNotify} />; if (module === 'organizations') return <><SectionHeader title="机构列表" subtitle={`共 ${tenantRows.length} 个机构 · 数据按机构隔离`} /><DataTable headers={['机构 ID', '套餐', '状态', '坐席使用', '今日会话', '配额使用', '最近活跃', '操作']} rows={tenantRows.map((row) => [<strong className="table-name">{row.name}<small>{row.id} · {row.industry}</small></strong>, row.plan, <Pill tone={row.status === 'active' ? 'success' : row.status === 'review' ? 'warning' : 'muted'}>{row.statusText}</Pill>, row.agents, row.conversations, <Progress value={row.usage} />, row.lastActive, <span className="table-actions"><button className="table-action" onClick={() => onEditTenant(row)}>编辑</button><button className="table-action" onClick={() => { onToggleTenant(row.id); onNotify('机构状态已更新并写入审计') }}>{row.status === 'paused' ? '启用' : row.status === 'review' ? '审核' : '停用'}</button></span>])} /></>; if (module === 'models') return <><SectionHeader title="模型供应商" subtitle="3 个模型已接入 · 1 个生产中" /><div className="admin-card-grid">{modelRows.map((model) => <div className="model-card" key={model.id}><div className="model-card-head"><div className="model-logo">{model.provider.slice(0, 1)}</div><Pill tone={model.status === 'active' ? 'success' : model.status === 'testing' ? 'purple' : 'muted'}>{model.statusText}</Pill></div><h3>{model.name}</h3><p>{model.provider} · {model.mode}</p><div className="model-stats"><span>版本<strong>{model.version}</strong></span><span>平均延迟<strong>{model.latency}</strong></span><span>Token 用量<strong>{model.usage}</strong></span></div><button className={model.isDefault ? 'table-action disabled' : 'admin-outline-btn'} onClick={() => onNotify(model.isDefault ? '已是默认模型' : `${model.name} 已设为默认模型`)}>{model.isDefault ? '当前默认模型' : '设为默认模型'}</button></div>)}</div></>; if (module === 'audit') return <><SectionHeader title="审计事件" subtitle="所有关键操作均保留 requestId 和机构上下文" /><DataTable headers={['事件 ID', '操作者', '动作', '目标资源', '时间', '风险', '操作']} rows={logs.map((row) => [<code>{row.id}</code>, <strong>{row.actor}<small>{row.role}</small></strong>, row.action, row.target, row.time, <Pill tone={row.risk === 'high' ? 'danger' : row.risk === 'medium' ? 'warning' : 'success'}>{row.riskText}</Pill>, <button className="table-action" onClick={() => onNotify(`已打开 ${row.id} 详情`)}>查看详情</button>])} /></>; if (module === 'monitoring') return <><SectionHeader title="服务健康" subtitle="消息链路无静默丢失 · 最近一次巡检 14:29" /><div className="service-grid">{serviceRows.map((service) => <div className="service-card" key={service.key}><div className="service-icon"><AIcon name={service.key === 'rag' ? 'database' : 'pulse'} size={17} /></div><div><h3>{service.name}</h3><span>{service.statusText}</span></div><strong>{service.value}</strong><small>延迟 {service.latency}</small></div>)}</div><SectionHeader title="近期告警" subtitle="需要平台管理员关注的事件" /><div className="alert-list"><Alert text="知识检索服务 P95 延迟升高，已自动切换备用节点" tone="warning" time="12 分钟前"/><Alert text="TENANT-014 配额使用达到 92%，建议联系机构管理员" tone="danger" time="36 分钟前"/></div></>; if (module === 'config') return <SettingsPanel onNotify={onNotify} />; if (module === 'conversations') return <ConversationMonitor />; if (module === 'alerts') return <AlertCenter />; return <PlatformOverview stats={stats} tenants={tenantRows} logs={logs} onModal={onModal} onNotify={onNotify} /> }

function OrganizationContent({ module, stats, agents: agentRows, customers: customerRows, docs, rules, channels: channelRows, session, onToggleAgent, onPublishDoc, onToggleRule, onToggleChannel, onModal, onNotify }) { if (module === 'approvals') return <ApprovalCenter mode="organization" session={session} onNotify={onNotify} />; if (module === 'people') return <><SectionHeader title="客服账号" subtitle={`${agentRows.length} 名客服 · ${agentRows.filter((row) => row.status === 'online').length} 人启用 · 数据来自数据库`} /><AgentList agents={agentRows} onToggle={onToggleAgent} onNotify={onNotify} /></>; if (module === 'customers') return <><SectionHeader title="客户档案" subtitle="跨渠道统一身份 · 敏感字段已脱敏" /><DataTable headers={['客户', '客户等级', '来源', '手机号', '标签', '历史会话', '最近咨询', '隐私状态']} rows={customerRows.map((row) => [<strong className="table-name">{row.name}<small>{row.id}</small></strong>, <Pill tone={row.level.includes('VIP') || row.level.includes('高价值') ? 'purple' : 'muted'}>{row.level}</Pill>, row.source, row.phone, <div className="tag-inline">{row.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>, row.sessions, row.last, <Pill tone={row.privacy === '已授权' ? 'success' : 'warning'}>{row.privacy}</Pill>])} /></>; if (module === 'knowledge') return <><SectionHeader title="知识文档" subtitle="4 个知识来源 · 1 个待审核 · 命中率 91.4%" /><DataTable headers={['文档名称', '类型', '状态', '分片数', '命中率', '最近更新', '操作']} rows={docs.map((row) => [<strong className="table-name">{row.name}<small>{row.id}</small></strong>, row.type, <Pill tone={row.status === 'published' ? 'success' : row.status === 'review' ? 'warning' : 'purple'}>{row.statusText}</Pill>, row.chunks, row.hitRate, row.updated, <button className="table-action" onClick={() => row.status === 'published' ? onNotify('已打开文档详情') : onPublishDoc(row.id)}>{row.status === 'published' ? '查看' : '发布'}</button>])} /></>; if (module === 'ai') return <><SectionHeader title="AI 策略与护栏" subtitle="当前模型：DeepSeek V3 · 低置信度自动转人工" /><div className="policy-banner"><div className="policy-icon"><AIcon name="shield" /></div><div><strong>策略服务运行正常</strong><span>引用要求、禁答主题与人工确认规则均已启用</span></div><button className="table-action" onClick={() => onNotify('策略测试完成：3/3 场景符合预期')}>测试策略</button></div><DataTable headers={['规则名称', '目标技能组', '置信度阈值', '兜底动作', '命中次数', '状态', '操作']} rows={rules.map((row) => [<strong className="table-name">{row.name}<small>意图编码 · {row.intent}</small></strong>, row.group, `${row.threshold}%`, row.fallback, row.hits, <Pill tone={row.enabled ? 'success' : 'muted'}>{row.enabled ? '已启用' : '已停用'}</Pill>, <button className="table-action" onClick={() => onToggleRule(row.id)}>{row.enabled ? '停用' : '启用'}</button>])} /></>; if (module === 'channels') return <><SectionHeader title="渠道连接" subtitle="3 个渠道正常 · 1 个待配置" /><div className="channel-admin-grid">{channelRows.map((channel) => <div className="channel-admin-card" key={channel.id}><div className="channel-admin-head"><div className="channel-symbol"><AIcon name={channel.name === 'Open API' ? 'database' : 'channel'} size={18} /></div><Pill tone={channel.status === 'connected' ? 'success' : 'warning'}>{channel.statusText}</Pill></div><h3>{channel.name}</h3><p>{channel.description}</p><div><span>今日会话</span><strong>{channel.conversations}</strong><small>{channel.updated}</small></div><button className="admin-outline-btn" onClick={() => onToggleChannel(channel.id)}>{channel.status === 'connected' ? '断开连接' : '重新连接'}</button></div>)}</div></>; if (module === 'operations') return <Operations onNotify={onNotify} />; if (module === 'conversations') return <ConversationMonitor />; return <OrganizationOverview stats={stats} agentRows={agentRows} onModal={onModal} onNotify={onNotify} /> }

function PlatformOverview({ stats, tenants: rows, logs, onNotify }) {
  return <>
    <MetricGrid stats={stats} />
    <LiveDashboard />
    <div className="admin-content-grid two-thirds">
      <SectionCard title="平台趋势" subtitle="近 7 日会话量 · 新增机构 · AI 解决率">
        <MultiTrendChart />
      </SectionCard>
      <SectionCard title="机构配额排行" action="查看全部">
        <div className="rank-list">
          {rows.slice(0, 4).map((row, index) => (
            <div className="rank-row" key={row.id}>
              <b>{index + 1}</b>
              <span>{row.name}<small>{row.plan}</small></span>
              <Progress value={row.usage} />
              <strong>{row.usage}%</strong>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
    <div className="admin-content-grid two-thirds">
      <SectionCard title="待办工作台" subtitle={`${platformTodos.length} 项待处理 · 按紧急程度排序`} action="全部待办">
        <TodoWorkbench onNotify={onNotify} />
      </SectionCard>
      <SectionCard title="最近审计事件" action="查看全部">
        {logs.slice(0, 3).map((log) => (
          <div className="timeline-row" key={log.id}>
            <span className="timeline-dot" />
            <div><strong>{log.action}</strong><small>{log.actor} · {log.time}</small></div>
          </div>
        ))}
      </SectionCard>
    </div>
  </>
}
function smoothPath(points) {
  if (!points.length) return ''
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cx = (prev.x + curr.x) / 2
    d += ` C${cx},${prev.y} ${cx},${curr.y} ${curr.x},${curr.y}`
  }
  return d
}
function MultiTrendChart() {
  const { labels, conversations, newOrgs, aiRate } = platformTrend
  const series = [
    { name: '会话量', color: '#3558d4', values: conversations, latest: conversations[conversations.length - 1].toLocaleString() },
    { name: '新增机构', color: '#22835d', values: newOrgs, latest: `${newOrgs[newOrgs.length - 1]} 家` },
    { name: 'AI 解决率', color: '#b6791a', values: aiRate, latest: `${aiRate[aiRate.length - 1]}%` },
  ]
  const w = 560
  const h = 180
  const padX = 20
  const padY = 18
  const buildPath = (values) => {
    const max = Math.max(...values)
    const min = Math.min(...values)
    const pts = values.map((v, i) => ({ x: padX + (i * (w - 2 * padX)) / (values.length - 1), y: padY + (1 - (v - min) / (max - min || 1)) * (h - 2 * padY) }))
    return smoothPath(pts)
  }
  return (
    <div className="multi-trend-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="multi-trend-chart" preserveAspectRatio="none" role="img" aria-label="平台近 7 日多指标趋势">
        {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={padX} x2={w - padX} y1={padY + t * (h - 2 * padY)} y2={padY + t * (h - 2 * padY)} className="chart-grid" />)}
        {series.map((s) => <path key={s.name} d={buildPath(s.values)} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinecap="round" pathLength="600" className="dd-line" />)}
      </svg>
      <div className="chart-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div>
      <div className="multi-trend-legend">
        {series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}<b>{s.latest}</b></span>)}
      </div>
    </div>
  )
}
function TodoWorkbench({ onNotify }) {
  return (
    <div className="todo-list">
      {platformTodos.map((todo) => (
        <div className="todo-row" key={todo.id}>
          <span className={`alert-icon ${todo.tone}`}>{todo.tone === 'muted' ? '✓' : '!'}</span>
          <span className="todo-text">{todo.text}<small>{todo.tag}</small></span>
          <b className="todo-count">{todo.count}</b>
          <button type="button" className="table-action" onClick={() => onNotify(`已打开「${todo.tag}」处理页（演示）`)}>去处理</button>
        </div>
      ))}
    </div>
  )
}
function BarChart({ items, className = '' }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <div className={`bar-chart ${className}`}>
      {items.map((item) => (
        <div className="bar-col" key={item.label}>
          <span className="bar-val">{item.value}</span>
          <div className="bar-fill" style={{ height: `${Math.max((item.value / max) * 100, 3)}%`, background: item.color }} />
          <span className="bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
function TodayPanel() {
  const items = [
    { label: '机构总数', value: todayRealtime.orgs, color: '#4163cb' },
    { label: '在线机构', value: todayRealtime.onlineOrgs, color: '#22835d' },
    { label: '客服总数', value: todayRealtime.agents, color: '#7656c9' },
    { label: '在线客服', value: todayRealtime.onlineAgents, color: '#b6791a' },
  ]
  const aiRate = Math.round((todayRealtime.aiHandled / todayRealtime.conversations) * 1000) / 10
  return (
    <div className="dd-panel">
      <BarChart items={items} className="dd-today-bars" />
      <div className="dd-side-stats">
        <div><span>今日会话总量</span><strong>{todayRealtime.conversations.toLocaleString()}</strong></div>
        <div><span>AI 接管会话</span><strong>{todayRealtime.aiHandled.toLocaleString()}</strong></div>
        <div><span>AI 接管率</span><strong>{aiRate}%</strong></div>
      </div>
    </div>
  )
}
function PieChart({ slices, centerValue, centerLabel }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const r = 58
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox="0 0 160 160" className="pie-chart" role="img" aria-label={`${centerLabel}渠道分布`}>
      {slices.map((s) => {
        const dash = (s.value / total) * c
        const el = <circle key={s.label} cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeWidth="24" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} transform="rotate(-90 80 80)" />
        offset += dash
        return el
      })}
      <text x="80" y="76" textAnchor="middle" className="pie-center-num">{centerValue}</text>
      <text x="80" y="92" textAnchor="middle" className="pie-center-label">{centerLabel}</text>
    </svg>
  )
}
function SharePanel({ slices = channelShare }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  return (
    <div className="dd-panel">
      <PieChart slices={slices} centerValue={total.toLocaleString()} centerLabel="今日会话" />
      <ul className="pie-legend">
        {slices.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} />
            <span>{s.label}<small>{Math.round((s.value / total) * 100)}%</small></span>
            <b>{s.value.toLocaleString()}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}
function TokenTrendChart({ data = tokenTrend }) {
  const w = 560
  const h = 200
  const padX = 26
  const padY = 22
  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const pts = data.map((d, i) => ({ x: padX + (i * (w - 2 * padX)) / (data.length - 1), y: padY + (1 - (d.value - min) / (max - min || 1)) * (h - 2 * padY) }))
  const line = smoothPath(pts)
  const area = `${line} L${pts[pts.length - 1].x},${h - 8} L${pts[0].x},${h - 8} Z`
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
  const dayOnDay = Math.round(((values[values.length - 1] - values[values.length - 2]) / values[values.length - 2]) * 1000) / 10
  return (
    <div className="token-trend-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="token-trend-chart" preserveAspectRatio="none" role="img" aria-label="近 7 日 Token 消耗趋势">
        <defs>
          <linearGradient id="tokenAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7656c9" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7656c9" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={padX} x2={w - padX} y1={padY + t * (h - 2 * padY)} y2={padY + t * (h - 2 * padY)} className="chart-grid" />)}
        <path d={area} fill="url(#tokenAreaGrad)" className="dd-area" />
        <path d={line} fill="none" stroke="#7656c9" strokeWidth="2.5" strokeLinecap="round" pathLength="600" className="dd-line" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#7656c9" strokeWidth="2" className="dd-line-dot" />)}
      </svg>
      <div className="chart-labels">{data.map((d) => <span key={d.label}>{d.label}</span>)}</div>
      <div className="token-trend-stats">
        <span>今日消耗 <strong>{values[values.length - 1]}M</strong> tokens</span>
        <span>7 日均值 <strong>{avg}M</strong></span>
        <span>较昨日 <strong className={dayOnDay >= 0 ? 'danger-text' : 'success-text'}>{dayOnDay >= 0 ? '+' : ''}{dayOnDay}%</strong></span>
      </div>
    </div>
  )
}
const platformAlertItems = [
  { text: 'TENANT-014 配额使用达到 92%，建议联系机构管理员', tone: 'danger', time: '36 分钟前' },
  { text: '知识检索服务 P95 延迟升高，已自动切换备用节点', tone: 'warning', time: '12 分钟前' },
  { text: 'RAG 服务延迟恢复正常', tone: 'success', time: '1 小时前' },
]

function AlertSummary({ days = dashboardAlerts, alerts = platformAlertItems }) {
  const today = days[days.length - 1]
  const items = [
    { label: '今日预警', value: today.warnings, color: '#b6791a' },
    { label: '今日异常', value: today.errors, color: '#c04d48' },
    { label: '已解决', value: today.resolved, color: '#22835d' },
  ]
  return (
    <div className="dd-panel">
      <BarChart items={items} className="dd-alert-bars" />
      <div className="dd-alert-list">
        {alerts.map((alert) => <Alert key={alert.text} text={alert.text} tone={alert.tone} time={alert.time} />)}
      </div>
    </div>
  )
}
// ==================== 平台业务大屏面板（默认配置） ====================
const platformPanels = [
  { key: 'today', title: '今日实时', render: <TodayPanel /> },
  { key: 'share', title: '会话构成', render: <SharePanel /> },
  { key: 'token', title: 'Token 消耗', render: <TokenTrendChart /> },
  { key: 'alert', title: '风险告警', render: <AlertSummary /> },
]
const platformFullGrid = [
  { title: '今日实时', icon: 'building', render: <TodayPanel /> },
  { title: '会话构成', icon: 'chart', render: <SharePanel /> },
  { title: 'Token 消耗', icon: 'spark', render: <TokenTrendChart /> },
  { title: '机构活跃度', icon: 'pulse', render: <OrgActivityChart /> },
  { title: '订单达成率', icon: 'clock', render: <OrgCompletionChart /> },
  { title: '客户满意度（按机构）', icon: 'star', render: <SatisfactionCarousel /> },
]

// ==================== 机构业务大屏面板 ====================
function OrgTodayPanel() {
  const items = [
    { label: '排队会话', value: orgTodayRealtime.queued, color: '#b6791a' },
    { label: '正在接待', value: orgTodayRealtime.handling, color: '#4163cb' },
    { label: '今日会话', value: orgTodayRealtime.todayConversations, color: '#22835d' },
    { label: 'AI 接管', value: orgTodayRealtime.aiHandled, color: '#7656c9' },
  ]
  return (
    <div className="dd-panel">
      <BarChart items={items} className="dd-today-bars" />
      <div className="dd-side-stats">
        <div><span>AI 接管率</span><strong>{orgTodayRealtime.aiRate}%</strong></div>
        <div><span>平均首响</span><strong>{orgTodayRealtime.avgResponse}</strong></div>
        <div><span>客户满意度</span><strong>{orgTodayRealtime.satisfaction}</strong></div>
      </div>
    </div>
  )
}
function OrgAgentLoadChart({ rows = orgAgentLoad }) {
  return (
    <div className="dd-panel">
      <div className="org-chart" style={{ minWidth: 190 }}>
        {rows.map((agent) => (
          <div key={agent.name} className="org-row">
            <span className="org-name">{agent.name}</span>
            <div className="org-bar"><div className={`org-fill ${agent.tone === 'busy' ? 'completion' : ''}`} style={{ width: `${Math.round((agent.value / agent.max) * 100)}%` }} /></div>
            <span className="org-value">{agent.value}/{agent.max}</span>
          </div>
        ))}
      </div>
      <div className="dd-side-stats">
        <div><span>在线客服</span><strong>{orgRealtime.onlineAgents}</strong></div>
        <div><span>接待中</span><strong>{orgRealtime.busyAgents}</strong></div>
        <div><span>空闲</span><strong>{orgRealtime.idleAgents}</strong></div>
      </div>
    </div>
  )
}
function OrgSatisfactionPanel() {
  const stars = Math.round(orgTodayRealtime.satisfaction)
  return (
    <div className="dd-panel">
      <div className="sat-carousel" style={{ minWidth: 250 }}>
        <div className="sat-carousel-inner">
          <div className="sat-org-name" style={{ color: '#4163cb' }}><AIcon name="building" size={13} />当前机构</div>
          <div className="sat-score">{orgTodayRealtime.satisfaction.toFixed(2)}</div>
          <div className="sat-stars">{'★'.repeat(stars)}<span className="dim">{'★'.repeat(5 - stars)}</span></div>
          <div className="sat-count">基于 1,204 条客户评价 · 今日会话 {orgTodayRealtime.todayConversations.toLocaleString()}</div>
        </div>
      </div>
      <div className="dd-side-stats">
        <div><span>今日会话</span><strong>{orgTodayRealtime.todayConversations.toLocaleString()}</strong></div>
        <div><span>AI 解决率</span><strong>{orgTodayRealtime.aiRate}%</strong></div>
        <div><span>平均首响</span><strong>{orgTodayRealtime.avgResponse}</strong></div>
      </div>
    </div>
  )
}

const orgAlertItems = [
  { text: '客服王悦已离线超过 30 分钟，存在会话积压风险', tone: 'warning', time: '8 分钟前' },
  { text: '排队会话已超时 1 例，建议立即接管', tone: 'danger', time: '3 分钟前' },
  { text: 'Open API 渠道连接恢复，消息投递正常', tone: 'success', time: '20 分钟前' },
]

const orgPanels = [
  { key: 'today', title: '今日实时', render: <OrgTodayPanel /> },
  { key: 'share', title: '会话构成', render: <SharePanel slices={orgChannelShare} /> },
  { key: 'token', title: 'Token 消耗', render: <TokenTrendChart data={orgTokenTrend} /> },
  { key: 'alert', title: '风险告警', render: <AlertSummary days={orgRealtimeAlerts} alerts={orgAlertItems} /> },
]
const orgFullGrid = [
  { title: '今日实时', icon: 'building', render: <OrgTodayPanel /> },
  { title: '会话构成', icon: 'chart', render: <SharePanel slices={orgChannelShare} /> },
  { title: 'Token 消耗', icon: 'spark', render: <TokenTrendChart data={orgTokenTrend} /> },
  { title: '客服负载', icon: 'users', render: <OrgAgentLoadChart /> },
  { title: '客户满意度', icon: 'star', render: <OrgSatisfactionPanel /> },
  { title: '风险告警', icon: 'pulse', render: <AlertSummary days={orgRealtimeAlerts} alerts={orgAlertItems} /> },
]

function LiveDashboard({ metrics: initialMetrics = realtimeMetrics, panels = platformPanels, fullGrid = platformFullGrid, screenTitle = '平台实时数据大屏' }) {
  const [viewIdx, setViewIdx] = useState(0)
  const [isFull, setIsFull] = useState(false)
  const [paused, setPaused] = useState(false)
  const [metrics, setMetrics] = useState(initialMetrics)
  const dashRef = useRef(null)
  useEffect(() => {
    if (paused || isFull) return undefined
    const id = setInterval(() => setViewIdx((prev) => (prev + 1) % panels.length), 6000)
    return () => clearInterval(id)
  }, [paused, isFull, panels.length])
  useEffect(() => {
    const id = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        activeConversations: Math.max(20, prev.activeConversations + Math.floor(Math.random() * 5 - 2)),
        queueLength: Math.max(0, prev.queueLength + Math.floor(Math.random() * 3 - 1)),
        avgResponseTime: Math.max(20, prev.avgResponseTime + Math.floor(Math.random() * 10 - 5)),
      }))
    }, 3000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    const onFsChange = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])
  const view = panels[viewIdx]
  const toggleFull = () => {
    if (!document.fullscreenElement) dashRef.current?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }
  return (
    <div className={`dynamic-dashboard ${isFull ? 'is-fullscreen' : ''} ${paused ? 'dd-paused' : ''}`} ref={dashRef} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="dd-head">
        {isFull ? (
          <div className="dd-full-title"><AIcon name="pulse" size={16} />{screenTitle} · 多板块总览</div>
        ) : (
          <div className="ld-title-wrap">
            <span className="ld-title"><span className="rm-live-dot" />实时运营大屏</span>
            <div className="dd-tabs">
              {panels.map((v, i) => (
                <button key={v.key} type="button" className={`dd-tab ${i === viewIdx ? 'active' : ''}`} onClick={() => setViewIdx(i)}>{v.title}</button>
              ))}
            </div>
          </div>
        )}
        <div className="dd-actions">
          <span className="ld-refresh-hint">指标每 3 秒刷新</span>
          <button type="button" className="dd-fullscreen-btn" onClick={toggleFull} aria-label={isFull ? '退出全屏' : '全屏浏览'}>
            <AIcon name="fullscreen" size={14} />{isFull ? '退出全屏' : '全屏浏览'}
          </button>
        </div>
      </div>
      <div className="ld-live-strip">
        <div className="ld-live-item"><span>当前会话</span><strong>{metrics.activeConversations}</strong></div>
        <div className="ld-live-item"><span>排队等待</span><strong className={metrics.queueLength > 5 ? 'danger-text' : ''}>{metrics.queueLength}</strong></div>
        <div className="ld-live-item"><span>在线客服</span><strong>{metrics.onlineAgents}<small>忙 {metrics.busyAgents} · 闲 {metrics.idleAgents}</small></strong></div>
        <div className="ld-live-item"><span>平均首响</span><strong>{metrics.avgResponseTime}s</strong></div>
        <div className="ld-live-item"><span>AI 解决率</span><strong>{metrics.aiResolution}%</strong></div>
      </div>
      {isFull ? (
        <div className="ld-full-grid">
          {fullGrid.map((cell) => (
            <section className="dd-full-cell" key={cell.title}><h3><AIcon name={cell.icon} size={14} />{cell.title}</h3>{cell.render}</section>
          ))}
        </div>
      ) : (
        <div className="dd-chart-area" key={view.key}>{view.render}</div>
      )}
    </div>
  )
}
function MetricGrid({ stats }) {
  return (
    <div className="admin-metric-grid paired">
      {stats.map((stat) => stat.key === 'satisfaction' ? (
        <SatisfactionCard key={stat.label} stat={stat} />
      ) : (
        <div className={`admin-metric-card paired ${stat.tone}`} key={stat.label}>
          <div className="metric-head">
            <span>{stat.label}</span>
            <div className="metric-icon"><AIcon name={stat.icon} size={16} /></div>
          </div>
          <strong>{stat.value}</strong>
          {stat.sub && (
            <small>{stat.sub.label} <b>{stat.sub.value}</b>{stat.sub.rate && <em>{stat.sub.rate}</em>}</small>
          )}
        </div>
      ))}
    </div>
  )
}
function SatisfactionCard({ stat }) {
  const orgs = orgActivityData.filter((o) => o.satisfaction > 0)
  const [idx, setIdx] = useState(0)
  const org = orgs[idx]
  const switchOrg = (dir) => setIdx((i) => (i + dir + orgs.length) % orgs.length)
  return (
    <div className={`admin-metric-card paired ${stat.tone} sat-card`}>
      <div className="metric-head">
        <span>{stat.label}</span>
        <div className="metric-icon"><AIcon name={stat.icon} size={16} /></div>
      </div>
      <div className="sat-card-body" key={org.id}>
        <strong>{org.satisfaction.toFixed(2)}</strong>
        <small className="sat-card-org"><AIcon name="building" size={10} />{org.name}</small>
        <small>基于 {org.reviewCount} 条评价</small>
      </div>
      <button type="button" className="sat-mini-arrow left" onClick={() => switchOrg(-1)} aria-label="查看上一个机构满意度">‹</button>
      <button type="button" className="sat-mini-arrow right" onClick={() => switchOrg(1)} aria-label="查看下一个机构满意度">›</button>
    </div>
  )
}
function SatisfactionCarousel() {
  const orgs = orgActivityData.filter((o) => o.satisfaction > 0)
  const [idx, setIdx] = useState(0)
  const org = orgs[idx]
  const stars = Math.round(org.satisfaction)
  const switchOrg = (dir) => setIdx((i) => (i + dir + orgs.length) % orgs.length)
  return (
    <div className="sat-carousel">
      <div className="sat-carousel-inner" key={org.id}>
        <div className="sat-org-name"><AIcon name="building" size={13} />{org.name}</div>
        <div className="sat-score">{org.satisfaction.toFixed(2)}</div>
        <div className="sat-stars">{'★'.repeat(stars)}<span className="dim">{'★'.repeat(5 - stars)}</span></div>
        <div className="sat-count">基于 {org.reviewCount} 条客户评价 · 今日会话 {org.conversations.toLocaleString()}</div>
      </div>
      <button type="button" className="sat-arrow left" onClick={() => switchOrg(-1)} aria-label="上一个机构满意度">‹</button>
      <button type="button" className="sat-arrow right" onClick={() => switchOrg(1)} aria-label="下一个机构满意度">›</button>
    </div>
  )
}
function ConversationMonitor() {
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? monitoredConversations : monitoredConversations.filter((c) => c.status === filter)
  const selectedConv = monitoredConversations.find((c) => c.id === selectedId)
  const selectedMessages = selectedId ? conversationMessages[selectedId] || [] : []
  return (
    <div className="conversation-monitor">
      <div className="cm-sidebar">
        <div className="cm-filters">
          <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 ({monitoredConversations.length})</button>
          <button type="button" className={filter === 'abnormal' ? 'active' : ''} onClick={() => setFilter('abnormal')}>异常 ({monitoredConversations.filter((c) => c.status === 'abnormal').length})</button>
          <button type="button" className={filter === 'normal' ? 'active' : ''} onClick={() => setFilter('normal')}>正常</button>
        </div>
        <div className="cm-list">
          {filtered.map((conv) => (
            <div key={conv.id} className={`cm-item ${conv.status} ${selectedId === conv.id ? 'selected' : ''}`} onClick={() => setSelectedId(conv.id)}>
              <div className="cm-item-head">
                <strong>{conv.customer}</strong>
                <span className={`cm-status ${conv.status}`}>{conv.statusText}</span>
              </div>
              <div className="cm-item-meta">客服：{conv.agent} · {conv.startTime} · {conv.duration}</div>
              <div className="cm-item-preview">{conv.lastMessage}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="cm-main">
        {selectedConv ? (
          <>
            <div className="cm-header">
              <h3>会话详情：{selectedConv.id}</h3>
              <div className="cm-header-meta">
                <span>客户：{selectedConv.customer}</span>
                <span>客服：{selectedConv.agent}</span>
                <span>渠道：{selectedConv.channel}</span>
                <span>消息数：{selectedConv.messages}</span>
              </div>
            </div>
            <div className="cm-chat">
              {selectedMessages.map((msg, i) => (
                <div key={i} className={`cm-message ${msg.sender}`}>
                  <div className="cm-message-avatar">{msg.name[0]}</div>
                  <div className="cm-message-content">
                    <div className="cm-message-name">{msg.name}</div>
                    <div className="cm-message-text">{msg.text}</div>
                    <div className="cm-message-time">{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="cm-empty">
            <AIcon name="chat" size={48} />
            <p>选择一个会话查看详情</p>
            <small>支持查看完整聊天记录，定位异常对话</small>
          </div>
        )}
      </div>
    </div>
  )
}
function OrgActivityChart({ rows = orgActivityData }) {
  return (
    <div className="org-chart">
      {rows.filter((o) => o.activity > 0).map((org) => (
        <div key={org.id} className="org-row">
          <span className="org-name">{org.name}</span>
          <div className="org-bar"><div className="org-fill" style={{ width: `${org.activity}%` }} /></div>
          <span className="org-value">{org.activity}%</span>
        </div>
      ))}
    </div>
  )
}
function OrgCompletionChart() {
  return (
    <div className="org-chart">
      {orgActivityData.filter((o) => o.orderCompletion > 0).map((org) => (
        <div key={org.id} className="org-row">
          <span className="org-name">{org.name}</span>
          <div className="org-bar"><div className="org-fill completion" style={{ width: `${org.orderCompletion}%` }} /></div>
          <span className="org-value">{org.orderCompletion}%</span>
        </div>
      ))}
    </div>
  )
}
function AlertCenter() {
  const [alerts, setAlerts] = useState(alertList)
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter)
  const acknowledge = (id) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'acknowledged' } : a))
  const resolve = (id) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'resolved' } : a))
  return (
    <div className="alert-center">
      <div className="ac-filters">
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 ({alerts.length})</button>
        <button type="button" className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>待处理 ({alerts.filter((a) => a.status === 'active').length})</button>
        <button type="button" className={filter === 'acknowledged' ? 'active' : ''} onClick={() => setFilter('acknowledged')}>已确认</button>
        <button type="button" className={filter === 'resolved' ? 'active' : ''} onClick={() => setFilter('resolved')}>已解决</button>
      </div>
      <div className="ac-list">
        {filtered.map((alert) => (
          <div key={alert.id} className={`ac-item ${alert.severity} ${alert.status}`}>
            <div className="ac-head">
              <span className={`ac-severity ${alert.severity}`}>{alert.severity === 'critical' ? '严重' : alert.severity === 'warning' ? '警告' : '信息'}</span>
              <strong>{alert.title}</strong>
              <span className="ac-time">{alert.time}</span>
            </div>
            <div className="ac-desc">{alert.description}</div>
            <div className="ac-meta">
              <span>机构：{alert.org}</span>
              <span className={`ac-status ${alert.status}`}>{alert.status === 'active' ? '待处理' : alert.status === 'acknowledged' ? '已确认' : '已解决'}</span>
            </div>
            {alert.status === 'active' && (
              <div className="ac-actions">
                <button type="button" className="table-action" onClick={() => acknowledge(alert.id)}>确认</button>
                <button type="button" className="table-action" onClick={() => resolve(alert.id)}>解决</button>
              </div>
            )}
            {alert.status === 'acknowledged' && (
              <div className="ac-actions">
                <button type="button" className="table-action" onClick={() => resolve(alert.id)}>标记为已解决</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
function OrganizationOverview({ stats, agentRows, onModal, onNotify }) {
  const navigate = useNavigate()
  const [selectedAgent, setSelectedAgent] = useState(null)
  const rows = agentRows.length ? agentRows : demoAgents
  const selected = rows.find((agent) => agent.id === selectedAgent)
  const openAgent = (agent) => setSelectedAgent(agent.id)
  const sessionsFor = (agent) => {
    const workload = deriveAgentWorkload(conversationsSeed, agent.name)
    return workload.conversations
  }
  return <><MetricGrid stats={stats} /><LiveDashboard metrics={orgRealtime} panels={orgPanels} fullGrid={orgFullGrid} screenTitle="机构实时数据大屏" /><div className="admin-content-grid two-thirds"><SectionCard title="实时服务概览" subtitle="当前机构 · 华东服务中心"><div className="live-metrics"><div><span>排队会话</span><strong className="danger-text">12</strong><small>3 个即将超时</small></div><div><span>在线客服</span><strong>{rows.filter((row) => row.status === 'online').length} / {rows.length}</strong><small>平均负载 72%</small></div><div><span>知识命中率</span><strong>91.4%</strong><small className="success-text">较昨日 +2.8%</small></div></div><div className="channel-strip"><span>Web Widget <b>正常</b></span><span>微信公众号 <b>正常</b></span><span>企业微信 <b>正常</b></span><span>Open API <b className="warning-text">待配置</b></span></div></SectionCard><ChartCard title="近 7 日会话趋势" subtitle="AI 接待与人工接管"><TrendChart values={[44, 52, 48, 64, 58, 76, 82]} color="#6d4bd7" /></ChartCard></div><SectionCard title="客服实时工作情况" subtitle="点击客服查看当前对接会话、回答情况和服务负载"><div className="agent-live-grid">{rows.slice(0, 4).map((row) => { const workload = deriveAgentWorkload(conversationsSeed, row.name); return <button type="button" className={`agent-live-card ${selectedAgent === row.id ? 'selected' : ''}`} key={row.id} onClick={() => openAgent(row)} aria-pressed={selectedAgent === row.id}><span className={`mini-avatar ${row.status}`}>{row.initials}</span><span className="agent-live-main"><strong>{row.name}<small>{row.groups?.[0] || '客服团队'}</small></strong><em>{row.statusText || '在线'}</em></span><span className="agent-live-stat"><b>{workload.active}</b><small>当前对接</small></span><span className="agent-live-stat"><b>{workload.queue}</b><small>待接管</small></span><span className="agent-live-stat"><b>{row.response || '—'}</b><small>平均首响</small></span><span className="agent-live-open">查看详情 →</span></button>})}</div></SectionCard>{selected && <AgentWorkDetail agent={selected} sessions={sessionsFor(selected)} onClose={() => setSelectedAgent(null)} onOpenConversation={(id) => navigate(`/workbench/${id}`)} />}<div className="admin-content-grid two-thirds"><SectionCard title="客服负载排行" action="查看实时情况"><div className="rank-list">{rows.slice(0, 4).map((row) => <button type="button" className="rank-row agent-rank" key={row.id} onClick={() => openAgent(row)}><span className={`mini-avatar ${row.status}`}>{row.initials}</span><span>{row.name}<small>{row.groups?.[0] || '客服团队'}</small></span><Progress value={Math.min(100, (row.sessions || 0) * 2.5)} /><strong>{row.sessions || 0} 会话</strong></button>)}</div></SectionCard><SectionCard title="运营待办" action="查看全部"><Alert text="3 篇知识文档等待审核" tone="warning" time="知识库"/><Alert text="2 个会话即将触发 SLA 升级" tone="danger" time="客服工作台"/><Alert text="本周质检抽检完成率 86%" tone="success" time="质量管理"/></SectionCard></div></>
}

function AgentWorkDetail({ agent, sessions, onClose, onOpenConversation }) {
  const [queueType, setQueueType] = useState('all')
  const filteredSessions = sessions.filter((session) => queueType === 'all' || getQueueType(session).key === queueType)
  return <div className="agent-work-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="agent-work-detail" role="dialog" aria-modal="true" aria-labelledby="agent-work-title"><div className="agent-work-head"><div><span className={`mini-avatar ${agent.status}`}>{agent.initials}</span><div><h2 id="agent-work-title">{agent.name} 的工作情况</h2><p>{agent.groups?.join(' · ') || '客服团队'} · {agent.statusText || '在线'}</p></div></div><button type="button" className="admin-icon-btn" aria-label="关闭客服详情" onClick={onClose}><AIcon name="close" /></button></div><div className="agent-work-metrics"><span><b>{sessions.filter((session) => ['human', 'ai'].includes(session.status)).length}</b>当前对接</span><span><b>{sessions.filter((session) => session.status === 'queued').length}</b>待接管</span><span><b>{agent.response || '—'}</b>平均首响</span></div><div className="agent-work-note">演示快照 · 会话数据来自本地工作台种子</div><h3>当前对接会话 <small>{filteredSessions.length}</small></h3><div className="agent-work-filters"><button type="button" className={queueType === 'all' ? 'active' : ''} onClick={() => setQueueType('all')}>全部</button><button type="button" className={queueType === 'after_sales' ? 'active' : ''} onClick={() => setQueueType('after_sales')}>售后</button><button type="button" className={queueType === 'pre_sales' ? 'active' : ''} onClick={() => setQueueType('pre_sales')}>售前</button></div><div className="agent-work-sessions">{filteredSessions.length ? filteredSessions.map((session) => { const type = getQueueType(session); return <article key={session.id}><div><strong>{session.name} · {session.channel} <em className={`agent-queue-type ${type.key}`}>{type.label}</em></strong><span>{type.reason} · {session.statusText} · {session.slaLabel} · {session.preview}</span></div><button type="button" onClick={() => onOpenConversation(session.id)}>打开会话</button></article> }) : <p>当前分类暂无已分配会话</p>}</div></aside></div>
}
function Operations({ onNotify }) { return <><div className="operation-highlight"><div><span>本月服务健康分</span><strong>94.6</strong><small>较上月提升 3.2%</small></div><div className="health-ring"><b>96.8%</b><span>SLA 达成</span></div><button className="admin-primary-btn" onClick={() => onNotify('服务报告已导出（演示）')}><AIcon name="download" size={14}/>导出服务报告</button></div><div className="admin-content-grid three"><SectionCard title="首响 SLA"><strong className="big-number">42<span>秒</span></strong><small>目标 ≤ 60 秒 · 达成率 97.2%</small><Progress value={97}/></SectionCard><SectionCard title="AI 转人工率"><strong className="big-number">17.4<span>%</span></strong><small>较上周下降 2.1%</small><Progress value={83}/></SectionCard><SectionCard title="质检通过率"><strong className="big-number">92.8<span>%</span></strong><small>已完成 128 / 138 个抽检</small><Progress value={93}/></SectionCard></div></> }
function SettingsPanel({ onNotify }) { return <div className="settings-panel"><SectionHeader title="平台全局配置" subtitle="变更将影响所有机构，提交后会写入审计日志" /><div className="settings-form"><label>默认会话保留时长<select><option>180 天</option><option>365 天</option></select></label><label>全局 AI 安全模式<select><option>严格模式（推荐）</option><option>标准模式</option></select></label><label>默认首响 SLA<input defaultValue="60" /></label><label>通知邮箱<input defaultValue="ops@ai-service.demo" /></label></div><button className="admin-primary-btn" onClick={() => onNotify('全局配置已保存（演示）')}>保存配置</button></div> }
function SectionHeader({ title, subtitle }) { return <div className="admin-section-head"><div><h2>{title}</h2><p>{subtitle}</p></div></div> }
function SectionCard({ title, subtitle, action, children }) { return <section className="admin-section-card"><div className="admin-card-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <button className="admin-link-btn">{action} <AIcon name="arrow" size={13}/></button>}</div>{children}</section> }
function ChartCard({ title, subtitle, children }) { return <SectionCard title={title} subtitle={subtitle}>{children}</SectionCard> }

function Progress({ value }) { return <span className="admin-progress"><i style={{ width: `${value}%` }}/></span> }
function TrendChart({ values, color }) { const points = values.map((value, index) => `${index * 48 + 12},${112 - value}`).join(' '); return <div className="trend-wrap"><svg className="trend-chart" viewBox="0 0 300 130" role="img" aria-label="近七日趋势图"><path d="M12 112H292M12 72H292M12 32H292" className="chart-grid"/><polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{values.map((value, index) => <circle key={index} cx={index * 48 + 12} cy={112 - value} r="4" fill="#fff" stroke={color} strokeWidth="2"/> )}</svg><div className="chart-labels"><span>8/13</span><span>8/14</span><span>8/15</span><span>8/16</span><span>8/17</span><span>8/18</span><span>今天</span></div></div> }
function DataTable({ headers, rows }) { return <div className="table-wrap"><table className="admin-table"><caption className="sr-only">管理数据列表</caption><thead><tr>{headers.map((header) => <th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length}><div className="admin-table-empty">暂无匹配数据，请调整筛选条件</div></td></tr>}</tbody></table></div> }
function Pill({ tone = 'muted', children }) { return <span className={`admin-pill ${tone}`}>{children}</span> }
function Alert({ text, tone, time }) { return <div className="alert-row"><span className={`alert-icon ${tone}`}>{tone === 'danger' ? '!' : tone === 'warning' ? '!' : '✓'}</span><span>{text}<small>{time}</small></span><AIcon name="arrow" size={13}/></div> }
function DemoModal({ title, onClose, onSubmit }) { return <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title"><div className="admin-modal-head"><h2 id="admin-modal-title">{title}</h2><button className="admin-icon-btn" onClick={onClose} aria-label="关闭"><AIcon name="close" /></button></div><p>这是本地演示操作。提交后只会更新当前页面数据，不会调用真实服务。</p><label>名称 / 标题<input autoFocus placeholder="请输入名称" /></label><label>说明 / 备注<textarea placeholder="补充描述信息..." /></label><div className="admin-modal-actions"><button className="admin-secondary-btn" onClick={onClose}>取消</button><button className="admin-primary-btn" onClick={onSubmit}>确认提交</button></div></section></div> }

function TenantFormModal({ title, initialName, onClose, onSubmit }) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim()) { setError('请输入机构名称'); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit(name.trim())
    } catch (err) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  return <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="tenant-modal-title"><div className="admin-modal-head"><h2 id="tenant-modal-title">{title}</h2><button className="admin-icon-btn" onClick={onClose} aria-label="关闭"><AIcon name="close" /></button></div><p>提交后机构信息将直接写入数据库 tenant 表。</p><form onSubmit={submit}><label>机构名称<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入机构名称" /></label>{error && <small className="auth-field-error" role="alert">{error}</small>}<div className="admin-modal-actions"><button type="button" className="admin-secondary-btn" onClick={onClose}>取消</button><button type="submit" className="admin-primary-btn" disabled={loading}>{loading ? '提交中...' : '确认提交'}</button></div></form></section></div>
}
