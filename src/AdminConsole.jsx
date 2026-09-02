import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { auditLogs, customers, knowledgeDocs, models, organizationStats, platformStats, services, agents as demoAgents, todayRealtime, channelShare, tokenTrend, platformTrend, platformTodos, dashboardAlerts, realtimeMetrics, alertList, orgActivityData, orgRealtime, orgTodayRealtime, orgChannelShare, orgTokenTrend, orgRealtimeAlerts, orgAgentLoad } from './adminData'
import { deriveAgentWorkload, getConversationAssignment, getQueueType, conversationsSeed } from './workbenchData'
import { createTenant, fetchAgents, fetchTenants, updateAgentStatus, updateTenant, updateTenantStatus } from './api'
import AgentList from './components/AgentList'
import ApprovalCenter from './components/ApprovalCenter'
import CustomerCenter from './components/CustomerCenter'
import LogsView from './components/LogsView'
import { listApprovals } from './approvalData'
import { AiModelCenter, TenantAiCenter } from './components/AiManagement'
import { buildDashboardComparisons, buildOrganizationDashboardComparisons } from './dashboardInsights'
import { assignConversation, endConversation, getConversation, listAllConversations } from './conversationApi'
import { fetchDashboardOverview, fetchTenantChannels, decorateChannelShare, normalizeAlertTrend, buildOrganizationMetricCards, normalizeTenantChannels } from './dashboardApi'
import { createConversationRealtime } from './conversationRealtime'
import { readAccessToken } from './api'
import EmptyState from './EmptyState'

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
  { group: '平台运营', items: [{ id: 'overview', label: '平台总览', icon: 'grid' }, { id: 'organizations', label: '机构列表', icon: 'building' }, { id: 'customerCenter', label: '客户管理中心', icon: 'users' }, { id: 'approvals', label: '审核中心', icon: 'shield' }, { id: 'conversations', label: '会话监控', icon: 'chat' }] },
  { group: '平台配置', items: [{ id: 'models', label: 'AI 模型中心', icon: 'spark' }] },
  { group: '安全与运维', items: [{ id: 'alerts', label: '告警中心', icon: 'shield' }, { id: 'audit', label: '安全与审计', icon: 'shield' }, { id: 'monitoring', label: '运维监控', icon: 'chart' }, { id: 'logs', label: '系统日志', icon: 'database' }] },
]
const orgNav = [
  { group: '运营工作区', items: [{ id: 'overview', label: '总览', icon: 'grid' }] },
  { group: '客户与组织', items: [{ id: 'people', label: '客服', icon: 'users' }, { id: 'approvals', label: '审核中心', icon: 'shield' }, { id: 'customers', label: '客户中心', icon: 'users' }, { id: 'conversations', label: '会话监控', icon: 'chat' }] },
  { group: 'AI 服务', items: [{ id: 'aiService', label: 'AI 客服', icon: 'spark' }, { id: 'knowledge', label: '知识库', icon: 'database' }, { id: 'channels', label: '渠道接入', icon: 'channel' }] },
  { group: '数据与运营', items: [{ id: 'oplogs', label: '操作日志', icon: 'clock' }] },
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
  // 审核中心侧栏红点：真实待审数（平台=机构入驻申请，机构=本机构客服申请），处理完即消
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0)
  useEffect(() => {
    const compute = () => {
      const all = listApprovals()
      const count = isPlatform
        ? all.filter((a) => a.kind === 'tenant' && a.status === 'pending').length
        : all.filter((a) => a.kind === 'agent' && a.status === 'pending' && a.tenantId === (session.tenantId || '')).length
      setPendingApprovalCount(count)
    }
    compute()
    const timer = setInterval(compute, 5000)
    return () => clearInterval(timer)
  }, [isPlatform, session.tenantId])

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

  const renderSidebar = (className = '') => <aside className={`admin-sidebar ${className}`}>{nav.map((section) => <div className="admin-nav-group" key={section.group}><span>{section.group}</span>{section.items.map((item) => <button type="button" key={item.id} className={`admin-nav-item ${module === item.id ? 'active' : ''}`} aria-current={module === item.id ? 'page' : undefined} onClick={() => go(item.id)}><AIcon name={item.icon} size={16} /><span>{item.label}</span>{item.id === 'approvals' && pendingApprovalCount > 0 && <b>{pendingApprovalCount > 99 ? '99+' : pendingApprovalCount}</b>}</button>)}</div>)}<div className="admin-sidebar-bottom"><button type="button" className="admin-nav-item logout" onClick={onLogout}><AIcon name="arrow" size={16} />退出登录</button></div></aside>

  return <div className="admin-shell">
    <header className="admin-topbar"><button ref={mobileNavButtonRef} type="button" className="admin-mobile-menu admin-icon-btn" aria-label={mobileNavOpen ? '关闭管理导航' : '打开管理导航'} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}><AIcon name={mobileNavOpen ? 'close' : 'grid'} size={18} /></button><button type="button" className="admin-brand" onClick={() => go('overview')}><span className="admin-brand-mark"><AIcon name="spark" size={18} /></span><span><strong>AI智能客服系统</strong><small>{isPlatform ? '平台管理中心' : '机构管理中心'}</small></span></button><div className="admin-context"><span className="admin-env-dot" />{isPlatform ? '全平台视图' : `${session.tenantName || '星河科技'} · ${session.tenantId || 'TENANT-018'}`}</div><div className="admin-top-actions">{session.role === 'platform_admin' ? <button type="button" className="admin-role-switch" onClick={() => navigate(isPlatform ? '/organization/overview' : '/platform/overview')}><span>超级管理员</span><small>{isPlatform ? '进入机构上下文' : '返回平台视图'}</small></button> : <div className="admin-role-switch static"><span>机构管理员</span><small>{session.tenantName || session.tenantId || 'TENANT-018'}</small></div>}<span className="admin-user-avatar">{session.name.slice(0, 1)}</span><div className="admin-user-meta"><b>{session.name}</b><small>{session.title}</small></div></div></header>
    <div className="admin-body">{renderSidebar()}
      {mobileNavOpen && <><button type="button" className="admin-nav-scrim" aria-label="关闭管理导航" onClick={() => { setMobileNavOpen(false); mobileNavButtonRef.current?.focus() }} /><div className="admin-mobile-drawer">{renderSidebar('admin-mobile-sidebar')}</div></>}
      <main className="admin-main"><div className="admin-page-head"><div><div className="admin-breadcrumb">{isPlatform ? '平台管理' : '机构管理'} <span>/</span> {nav.flatMap((section) => section.items).find((item) => item.id === module)?.label || '总览'}</div><h1>{pageTitle(module, isPlatform)}</h1><p>{pageDescription(module, isPlatform)}</p></div>{module !== 'overview' && <div className="admin-head-actions"><span className="admin-updated">数据更新于 14:30</span>{(module === 'organizations' || module === 'people' || module === 'knowledge') && <button className="admin-primary-btn" onClick={() => isPlatform ? setTenantModal({ mode: 'create' }) : openModal(module === 'knowledge' ? '导入知识文档' : '邀请客服')}><AIcon name="plus" size={15} />{isPlatform ? '创建机构' : module === 'knowledge' ? '导入知识' : '邀请客服'}</button>}<button className="admin-secondary-btn" onClick={() => notify('运营摘要已生成（演示）')}><AIcon name="download" size={14} />导出摘要</button></div>}</div>
        {module !== 'overview' && module !== 'logs' && module !== 'oplogs' && module !== 'customerCenter' && <div className="admin-filter-bar"><div className="admin-search"><AIcon name="search" size={15} /><input aria-label="搜索" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isPlatform ? '搜索机构 ID 或行业' : '搜索姓名、文档或业务对象'} /></div><select aria-label="状态筛选" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">全部状态</option><option value="active">运行中</option><option value="review">待审核</option><option value="paused">已停用</option><option value="published">已发布</option><option value="processing">处理中</option></select><button type="button" className="admin-filter-clear" onClick={() => { setQuery(''); setStatusFilter('all') }}>清除条件</button></div>}
        {isPlatform
          ? module === 'models'
            ? <AiModelCenter onNotify={notify} />
            : <PlatformContent module={module} stats={platformStats} tenants={filteredTenants} models={models} logs={auditLogs} services={services} session={session} onToggleTenant={toggleTenant} onEditTenant={(tenant) => setTenantModal({ mode: 'edit', tenant })} onModal={openModal} onNotify={notify} />
          : module === 'aiService'
            ? <TenantAiCenter onNotify={notify} />
            : <OrganizationContent module={module} stats={organizationStats} agents={filteredAgents} customers={customers} docs={filteredDocs} session={session} onToggleAgent={toggleAgent} onPublishDoc={publishDoc} onModal={openModal} onNotify={notify} />}
      </main></div>
    {showModal && <DemoModal title={modalTitle} onClose={() => setShowModal(false)} onSubmit={() => { setShowModal(false); notify(`${modalTitle}成功（演示）`) }} />}
    {tenantModal && <TenantFormModal title={tenantModal.mode === 'create' ? '创建新机构' : '编辑机构'} initialName={tenantModal.mode === 'edit' ? tenantModal.tenant.name : ''} onClose={() => setTenantModal(null)} onSubmit={submitTenantForm} />}
    {toast && <div className="admin-toast" role="status"><span>✓</span>{toast}</div>}
  </div>
}

function pageTitle(module, platform) { const map = platform ? { overview: '平台运营总览', organizations: '机构列表', customerCenter: '客户管理中心', approvals: '注册审核中心', conversations: '会话监控', models: 'AI 模型中心', alerts: '告警中心', audit: '安全与审计', monitoring: '运维监控', logs: '系统日志' } : { overview: '机构运营总览', people: '客服', approvals: '客服审核中心', customers: '客户中心', conversations: '会话监控', aiService: 'AI 客服管理', knowledge: '知识库运营', channels: '渠道与开放能力', oplogs: '机构操作日志' }; return map[module] || '管理中心' }
function pageDescription(module, platform) { const map = platform ? { overview: '实时监控平台运营状态，聚合查看机构健康度、服务容量与平台风险', organizations: '管理机构生命周期、套餐配额与机构隔离', customerCenter: '跨机构查询客户档案，支持增删改查与历史会话追溯', approvals: '审核机构入驻申请，管理邀请码派发，客服注册由机构单级审核', conversations: '跨机构查看异常会话记录，追溯完整聊天内容，上帝视角监控客服对话', models: '统一管理模型供应商、版本和默认策略', alerts: '管理平台告警，及时处理异常事件', audit: '追踪关键操作、内容合规和数据权利请求', monitoring: '实时观察消息链路、检索与 Webhook 健康度', logs: '聚合检索平台关键链路日志，按级别追踪异常与告警事件' } : { overview: '查看星河科技的服务质量、AI 效率与团队负载', people: '管理客服账号、技能组、排班和服务绩效', approvals: '审核本机构客服入职申请，管理客服邀请码，机构通过后账号即激活', customers: '统一管理跨渠道客户档案、标签与隐私状态', conversations: '查看异常会话记录，追溯完整聊天内容，上帝视角监控客服对话', knowledge: '管理知识导入、审核发布与检索命中质量', channels: '接入微信、企业微信、Widget 与开放 API', oplogs: '追溯机构内知识发布、账号变更与配置调整等关键操作' }; return map[module] || '配置和运营你的客户服务团队' }

function PlatformContent({ module, stats, tenants: tenantRows, models: modelRows, logs, services: serviceRows, session, onToggleTenant, onEditTenant, onModal, onNotify }) { if (module === 'approvals') return <ApprovalCenter mode="platform" session={session} onNotify={onNotify} />; if (module === 'customerCenter') return <CustomerCenter onNotify={onNotify} />; if (module === 'organizations') return <><SectionHeader title="机构列表" subtitle={`共 ${tenantRows.length} 个机构 · 数据按机构隔离`} /><DataTable headers={['机构 ID', '套餐', '状态', '坐席使用', '今日会话', '配额使用', '最近活跃', '操作']} rows={tenantRows.map((row) => [<strong className="table-name">{row.name}<small>{row.id} · {row.industry}</small></strong>, row.plan, <Pill tone={row.status === 'active' ? 'success' : row.status === 'review' ? 'warning' : 'muted'}>{row.statusText}</Pill>, row.agents, row.conversations, <Progress value={row.usage} />, row.lastActive, <span className="table-actions"><button className="table-action" onClick={() => onEditTenant(row)}>编辑</button><button className="table-action" onClick={() => { onToggleTenant(row.id); onNotify('机构状态已更新并写入审计') }}>{row.status === 'paused' ? '启用' : row.status === 'review' ? '审核' : '停用'}</button></span>])} /></>; if (module === 'models') return <><SectionHeader title="模型供应商" subtitle="3 个模型已接入 · 1 个生产中" /><div className="admin-card-grid">{modelRows.map((model) => <div className="model-card" key={model.id}><div className="model-card-head"><div className="model-logo">{model.provider.slice(0, 1)}</div><Pill tone={model.status === 'active' ? 'success' : model.status === 'testing' ? 'purple' : 'muted'}>{model.statusText}</Pill></div><h3>{model.name}</h3><p>{model.provider} · {model.mode}</p><div className="model-stats"><span>版本<strong>{model.version}</strong></span><span>平均延迟<strong>{model.latency}</strong></span><span>Token 用量<strong>{model.usage}</strong></span></div><button className={model.isDefault ? 'table-action disabled' : 'admin-outline-btn'} onClick={() => onNotify(model.isDefault ? '已是默认模型' : `${model.name} 已设为默认模型`)}>{model.isDefault ? '当前默认模型' : '设为默认模型'}</button></div>)}</div></>; if (module === 'audit') return <><SectionHeader title="审计事件" subtitle="所有关键操作均保留 requestId 和机构上下文" /><DataTable headers={['事件 ID', '操作者', '动作', '目标资源', '时间', '风险', '操作']} rows={logs.map((row) => [<code>{row.id}</code>, <strong>{row.actor}<small>{row.role}</small></strong>, row.action, row.target, row.time, <Pill tone={row.risk === 'high' ? 'danger' : row.risk === 'medium' ? 'warning' : 'success'}>{row.riskText}</Pill>, <button className="table-action" onClick={() => onNotify(`已打开 ${row.id} 详情`)}>查看详情</button>])} /></>; if (module === 'monitoring') return <><SectionHeader title="服务健康" subtitle="消息链路无静默丢失 · 最近一次巡检 14:29" /><div className="service-grid">{serviceRows.map((service) => <div className="service-card" key={service.key}><div className="service-icon"><AIcon name={service.key === 'rag' ? 'database' : 'pulse'} size={17} /></div><div><h3>{service.name}</h3><span>{service.statusText}</span></div><strong>{service.value}</strong><small>延迟 {service.latency}</small></div>)}</div><SectionHeader title="近期告警" subtitle="需要平台管理员关注的事件" /><div className="alert-list"><Alert text="知识检索服务 P95 延迟升高，已自动切换备用节点" tone="warning" time="12 分钟前"/><Alert text="TENANT-014 配额使用达到 92%，建议联系机构管理员" tone="danger" time="36 分钟前"/></div></>; if (module === 'conversations') return <ConversationMonitor mode="platform" session={session} agents={[]} />; if (module === 'alerts') return <AlertCenter />; if (module === 'logs') return <LogsView dataset="system" />; return <PlatformOverview stats={stats} tenants={tenantRows} logs={logs} onModal={onModal} onNotify={onNotify} /> }

function OrganizationContent({ module, stats, agents: agentRows, customers: customerRows, docs, session, onToggleAgent, onPublishDoc, onModal, onNotify }) { if (module === 'approvals') return <ApprovalCenter mode="organization" session={session} onNotify={onNotify} />; if (module === 'people') return <><SectionHeader title="客服账号" subtitle={`${agentRows.length} 名客服 · ${agentRows.filter((row) => row.status === 'online').length} 人启用 · 数据来自数据库`} /><AgentList agents={agentRows} onToggle={onToggleAgent} onNotify={onNotify} /></>; if (module === 'customers') return <><SectionHeader title="客户档案" subtitle="跨渠道统一身份 · 敏感字段已脱敏" /><DataTable headers={['客户', '客户等级', '来源', '手机号', '标签', '历史会话', '最近咨询', '隐私状态']} rows={customerRows.map((row) => [<strong className="table-name">{row.name}<small>{row.id}</small></strong>, <Pill tone={row.level.includes('VIP') || row.level.includes('高价值') ? 'purple' : 'muted'}>{row.level}</Pill>, row.source, row.phone, <div className="tag-inline">{row.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>, row.sessions, row.last, <Pill tone={row.privacy === '已授权' ? 'success' : 'warning'}>{row.privacy}</Pill>])} /></>; if (module === 'knowledge') return <><SectionHeader title="知识文档" subtitle="4 个知识来源 · 1 个待审核 · 命中率 91.4%" /><DataTable headers={['文档名称', '类型', '状态', '分片数', '命中率', '最近更新', '操作']} rows={docs.map((row) => [<strong className="table-name">{row.name}<small>{row.id}</small></strong>, row.type, <Pill tone={row.status === 'published' ? 'success' : row.status === 'review' ? 'warning' : 'purple'}>{row.statusText}</Pill>, row.chunks, row.hitRate, row.updated, <button className="table-action" onClick={() => row.status === 'published' ? onNotify('已打开文档详情') : onPublishDoc(row.id)}>{row.status === 'published' ? '查看' : '发布'}</button>])} /></>; if (module === 'channels') return <ChannelBoard session={session} />; if (module === 'oplogs') return <LogsView dataset="operation" />; if (module === 'conversations') return <ConversationMonitor mode="organization" session={session} agents={agentRows} />; return <OrganizationOverview stats={stats} agentRows={agentRows} session={session} onModal={onModal} onNotify={onNotify} /> }

function PlatformOverview({ stats, tenants: rows, logs, onNotify }) {
  const [overview, setOverview] = useState(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchDashboardOverview()
        if (!cancelled) { setOverview(data); setLive(true) }
      } catch {
        if (!cancelled) setLive(false)
      }
    }
    load()
    const timer = setInterval(load, 3000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])
  const dashboards = useMemo(() => buildPlatformPanels(overview), [overview])
  const statCards = dashboards?.stats || stats
  return <>
    <MetricGrid stats={statCards} />
    <LiveDashboard
      metrics={overview?.metrics || realtimeMetrics}
      panels={dashboards?.panels || platformPanels}
      fullGrid={dashboards?.fullGrid || platformFullGrid}
      screenTitle="平台实时数据大屏"
      live={live}
    />
    <div className="admin-content-grid two-thirds">
      <SectionCard title="平台趋势" subtitle={live ? '近 7 日结束会话 · 高优先级新增 · AI 调用失败' : '近 7 日会话量 · 新增机构 · AI 解决率'}>
        <MultiTrendChart labels={dashboards?.trend?.labels} series={dashboards?.trend?.series} />
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
function MultiTrendChart({ labels = platformTrend.labels, series: customSeries } = {}) {
  const series = customSeries || [
    { name: '会话量', color: '#3558d4', values: platformTrend.conversations, latest: platformTrend.conversations[platformTrend.conversations.length - 1].toLocaleString() },
    { name: '新增机构', color: '#22835d', values: platformTrend.newOrgs, latest: `${platformTrend.newOrgs[platformTrend.newOrgs.length - 1]} 家` },
    { name: 'AI 解决率', color: '#b6791a', values: platformTrend.aiRate, latest: `${platformTrend.aiRate[platformTrend.aiRate.length - 1]}%` },
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
function TodayPanel({ today = todayRealtime, realtime = realtimeMetrics }) {
  const { organizations, agents } = buildDashboardComparisons(today, realtime, [])
  return (
    <div className="platform-comparison-grid">
      <section className="relationship-card organization-relationship">
        <header><div><span>机构活跃度</span><strong>总量与活跃构成</strong></div><b>{organizations.activeRate}%</b></header>
        <div className="relationship-primary"><div><span>机构总数</span><strong>{organizations.total}</strong></div><i>包含</i><div><span>活跃机构</span><strong>{organizations.active}</strong></div></div>
        <div className="relationship-track" role="img" aria-label={`活跃机构 ${organizations.active} 家，非活跃机构 ${organizations.inactive} 家`}><i className="active" style={{ width: `${organizations.activeRate}%` }} /><i className="inactive" style={{ width: `${100 - organizations.activeRate}%` }} /></div>
        <div className="relationship-legend"><span><i className="active" />活跃 {organizations.active}</span><span><i className="inactive" />非活跃 {organizations.inactive}</span></div>
        <div className="relationship-details"><span>近 7 日新增<strong>+{today.newOrgs7d ?? 0}</strong></span><span>待审核机构<strong>{today.pendingOrgs ?? 0}</strong></span><span>活跃率<strong>{organizations.activeRate}%</strong></span></div>
      </section>
      <section className="relationship-card agent-relationship">
        <header><div><span>客服容量</span><strong>总量与工作状态</strong></div><b>{agents.onlineRate}%</b></header>
        <div className="relationship-primary"><div><span>客服总数</span><strong>{agents.total}</strong></div><i>其中</i><div><span>在线客服</span><strong>{agents.online}</strong></div></div>
        <div className="relationship-track" role="img" aria-label={`在线客服 ${agents.online} 人，离线客服 ${agents.offline} 人`}><i className="online" style={{ width: `${agents.onlineRate}%` }} /><i className="offline" style={{ width: `${100 - agents.onlineRate}%` }} /></div>
        <div className="workload-track" role="img" aria-label={`在线客服中忙碌 ${agents.busy} 人，空闲 ${agents.idle} 人`}><i className="busy" style={{ width: `${agents.loadRate}%` }} /><i className="idle" style={{ width: `${agents.idleRate}%` }} /></div>
        <div className="workload-legend"><span><i className="busy" />忙碌 <strong>{agents.busy} 人</strong><em>{agents.loadRate}%</em></span><span><i className="idle" />空闲 <strong>{agents.idle} 人</strong><em>{agents.idleRate}%</em></span></div>
        <div className="relationship-details four"><span>忙碌<strong>{agents.busy}</strong></span><span>空闲<strong>{agents.idle}</strong></span><span>离线<strong>{agents.offline}</strong></span><span>负载率<strong>{agents.loadRate}%</strong></span></div>
      </section>
    </div>
  )
}
function SharePanel({ slices = channelShare }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const { channels } = buildDashboardComparisons(
    { orgs: 0, activeOrgs: 0, agents: 0, onlineAgents: 0 },
    { busyAgents: 0, idleAgents: 0 },
    slices,
  )
  const max = Math.max(...channels.map((channel) => channel.value), 1)
  const topTwoShare = Math.round((channels.slice(0, 2).reduce((sum, channel) => sum + channel.value, 0) / total) * 1000) / 10
  return (
    <div className="channel-composition-layout">
      <div className="channel-composition-bars">
        {channels.map((channel) => (
          <div className="channel-composition-row" key={channel.label}>
            <b>{channel.rank}</b>
            <span>{channel.label}</span>
            <div className="channel-composition-track"><i style={{ width: `${(channel.value / max) * 100}%`, background: channel.color }} /></div>
            <strong>{channel.value.toLocaleString()}</strong>
            <em>{channel.share}%</em>
            <small className={channel.change >= 0 ? 'success-text' : 'danger-text'}>{channel.change >= 0 ? '+' : ''}{channel.change}%</small>
          </div>
        ))}
      </div>
      <aside className="composition-summary">
        <div><span>今日会话</span><strong>{total.toLocaleString()}</strong></div>
        <div><span>主要渠道</span><strong>{channels[0]?.label || '—'}</strong><small>占比 {channels[0]?.share || 0}%</small></div>
        <div><span>前两渠道集中度</span><strong>{topTwoShare}%</strong><small>渠道分布保持稳定</small></div>
      </aside>
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
  const dayOnDay = values[values.length - 2] > 0
    ? Math.round(((values[values.length - 1] - values[values.length - 2]) / values[values.length - 2]) * 1000) / 10
    : 0
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

function PlatformCapacityPanel({ realtime }) {
  return (
    <div className="dd-panel">
      <div className="dd-side-stats" style={{ minWidth: 220 }}>
        <div><span>客服总数</span><strong>{realtime.totalAgents}</strong></div>
        <div><span>在线客服</span><strong>{realtime.onlineAgents}</strong></div>
        <div><span>接待中</span><strong>{realtime.busyAgents}</strong></div>
        <div><span>空闲</span><strong>{realtime.idleAgents}</strong></div>
      </div>
    </div>
  )
}

const percentOf = (value, total) => (total > 0 ? Math.round((value / total) * 1000) / 10 : 0)

/** 由后端平台 overview 构建平台大屏板块与指标卡；无数据时退回演示面板 */
function buildPlatformPanels(overview) {
  if (!overview) return null
  const metrics = overview.metrics
  const today = {
    orgs: overview.orgs ?? 0,
    activeOrgs: overview.activeOrgs ?? 0,
    newOrgs7d: overview.newOrgs7d ?? 0,
    pendingOrgs: 0,
    agents: metrics.totalAgents,
    onlineAgents: metrics.onlineAgents,
  }
  const realtime = { busyAgents: metrics.busyAgents, idleAgents: metrics.idleAgents }
  const slices = decorateChannelShare(overview.channelShare)
  const days = normalizeAlertTrend(overview.alertTrend)
  const alerts = overview.alerts?.length ? overview.alerts : platformAlertItems
  // 全平台满意度按机构：无评价的机构不展示
  const maxConversations = Math.max(...(overview.tenants || []).map((tenant) => tenant.conversations7d), 1)
  const satOrgs = (overview.tenants || []).map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    conversations: tenant.conversations7d,
    satisfaction: tenant.satisfaction,
    reviewCount: tenant.reviewCount,
    activity: percentOf(tenant.conversations7d, maxConversations),
  }))
  const stats = [
    { label: '机构总数', value: String(today.orgs), sub: { label: '活跃机构', value: String(today.activeOrgs), rate: `${percentOf(today.activeOrgs, today.orgs)}%` }, tone: 'blue', icon: 'building' },
    { label: '客服总数', value: String(metrics.totalAgents), sub: { label: '在线客服', value: String(metrics.onlineAgents), rate: `${percentOf(metrics.onlineAgents, metrics.totalAgents)}%` }, tone: 'green', icon: 'users' },
    { label: '今日会话', value: overview.today.todayConversations.toLocaleString(), sub: { label: '排队等待', value: String(metrics.queueLength), rate: `进行中 ${metrics.activeConversations}` }, tone: 'purple', icon: 'chat' },
    { label: 'AI 接管率', value: `${metrics.aiResolution}%`, sub: { label: '近 7 日口径', value: 'AI 接待占比', rate: `首响 ${metrics.avgResponseTime}s` }, tone: 'orange', icon: 'spark' },
    { key: 'satisfaction', label: '客户满意度', tone: 'blue', icon: 'star', orgs: satOrgs },
  ]
  return {
    stats,
    panels: [
      { key: 'today', title: '今日实时', render: <TodayPanel today={today} realtime={realtime} /> },
      { key: 'share', title: '会话构成', render: <SharePanel slices={slices} /> },
      { key: 'token', title: 'Token 消耗', render: <TokenTrendChart data={overview.tokenTrend} /> },
      { key: 'alert', title: '风险告警', render: <AlertSummary days={days} alerts={alerts} /> },
    ],
    fullGrid: [
      { title: '今日实时', icon: 'building', render: <TodayPanel today={today} realtime={realtime} /> },
      { title: '会话构成', icon: 'chart', render: <SharePanel slices={slices} /> },
      { title: 'Token 消耗', icon: 'spark', render: <TokenTrendChart data={overview.tokenTrend} /> },
      { title: '机构活跃度（近 7 日会话量占比）', icon: 'pulse', render: <OrgActivityChart rows={satOrgs} /> },
      { title: '客服容量', icon: 'users', render: <PlatformCapacityPanel realtime={metrics} /> },
      { title: '客户满意度（按机构）', icon: 'star', render: <SatisfactionCarousel orgs={satOrgs} /> },
    ],
    trend: {
      labels: days.map((day) => day.label),
      series: [
        { name: '结束会话', color: '#3558d4', values: days.map((day) => day.resolved), latest: String(days[days.length - 1].resolved) },
        { name: '高优先级新增', color: '#22835d', values: days.map((day) => day.warnings), latest: String(days[days.length - 1].warnings) },
        { name: 'AI 调用失败', color: '#b6791a', values: days.map((day) => day.errors), latest: String(days[days.length - 1].errors) },
      ],
    },
  }
}

// ==================== 机构业务大屏面板 ====================
function OrgTodayPanel({ today = orgTodayRealtime, realtime = orgRealtime }) {
  const { conversations, agents } = buildOrganizationDashboardComparisons(today, realtime)
  return (
    <div className="platform-comparison-grid">
      <section className="relationship-card conversation-relationship">
        <header><div><span>服务承载</span><strong>今日会话与接待构成</strong></div><b>{conversations.aiRate}%</b></header>
        <div className="org-visual-summary">
          <div className="ratio-ring conversation-ring" style={{ '--ratio': `${conversations.aiRate * 3.6}deg` }} role="img" aria-label={`AI 接待率 ${conversations.aiRate}%`}><div><strong>{conversations.aiRate}%</strong><span>AI 接待率</span></div></div>
          <div className="org-breakdown">
            <div><span><i className="ai" />AI 接待</span><strong>{conversations.aiHandled.toLocaleString()}</strong><small>{conversations.aiRate}%</small></div>
            <div><span><i className="human" />人工接待</span><strong>{conversations.humanHandled.toLocaleString()}</strong><small>{Math.round((100 - conversations.aiRate) * 10) / 10}%</small></div>
            <p>今日共处理 <strong>{conversations.total.toLocaleString()}</strong> 个会话</p>
          </div>
        </div>
        <div className="relationship-details"><span>正在接待<strong>{conversations.handling}</strong></span><span>排队等待<strong>{conversations.queued}</strong></span><span>客户满意度<strong>{today.satisfaction}</strong></span></div>
      </section>
      <section className="relationship-card agent-relationship">
        <header><div><span>客服容量</span><strong>总量与工作状态</strong></div><b>{agents.onlineRate}%</b></header>
        <div className="org-visual-summary">
          <div className="ratio-ring agent-ring" style={{ '--ratio': `${agents.onlineRate * 3.6}deg` }} role="img" aria-label={`客服在线率 ${agents.onlineRate}%`}><div><strong>{agents.onlineRate}%</strong><span>客服在线率</span></div></div>
          <div className="agent-state-tree">
            <div className="agent-state-total"><span>客服总数</span><strong>{agents.total} 人</strong></div>
            <div className="agent-state-online"><span><i />在线 {agents.online}</span><div><b className="busy">忙碌 {agents.busy}</b><b className="idle">空闲 {agents.idle}</b></div></div>
            <div className="agent-state-offline"><span><i />离线</span><strong>{agents.offline} 人</strong></div>
          </div>
        </div>
        <div className="relationship-details four"><span>在线<strong>{agents.online}</strong></span><span>忙碌<strong>{agents.busy}</strong></span><span>空闲<strong>{agents.idle}</strong></span><span>离线<strong>{agents.offline}</strong></span></div>
      </section>
    </div>
  )
}
function OrgAgentLoadChart({ rows = orgAgentLoad, realtime = orgRealtime }) {
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
        <div><span>在线客服</span><strong>{realtime.onlineAgents}</strong></div>
        <div><span>接待中</span><strong>{realtime.busyAgents}</strong></div>
        <div><span>空闲</span><strong>{realtime.idleAgents}</strong></div>
      </div>
    </div>
  )
}
function OrgSatisfactionPanel({ today = orgTodayRealtime }) {
  const stars = Math.round(today.satisfaction)
  return (
    <div className="dd-panel">
      <div className="sat-carousel" style={{ minWidth: 250 }}>
        <div className="sat-carousel-inner">
          <div className="sat-org-name" style={{ color: '#4163cb' }}><AIcon name="building" size={13} />当前机构</div>
          <div className="sat-score">{Number(today.satisfaction || 0).toFixed(2)}</div>
          <div className="sat-stars">{'★'.repeat(stars)}<span className="dim">{'★'.repeat(5 - stars)}</span></div>
          <div className="sat-count">基于 {(today.satisfactionCount ?? 0).toLocaleString()} 条客户评价 · 今日会话 {(today.todayConversations ?? 0).toLocaleString()}</div>
        </div>
      </div>
      <div className="dd-side-stats">
        <div><span>今日会话</span><strong>{(today.todayConversations ?? 0).toLocaleString()}</strong></div>
        <div><span>AI 解决率</span><strong>{today.aiRate}%</strong></div>
        <div><span>平均首响</span><strong>{today.avgResponse}</strong></div>
      </div>
    </div>
  )
}

const orgAlertItems = [
  { text: '客服王悦已离线超过 30 分钟，存在会话积压风险', tone: 'warning', time: '8 分钟前' },
  { text: '排队会话已超时 1 例，建议立即接管', tone: 'danger', time: '3 分钟前' },
  { text: 'Open API 渠道连接恢复，消息投递正常', tone: 'success', time: '20 分钟前' },
]

// 后端不可用时的演示降级面板
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

/** 由后端 overview 数据构建机构大屏板块；无数据时退回演示面板 */
function buildOrgPanels(overview) {
  if (!overview) return null
  const today = overview.today
  const realtime = overview.metrics
  const slices = decorateChannelShare(overview.channelShare)
  const days = normalizeAlertTrend(overview.alertTrend)
  const alerts = overview.alerts?.length ? overview.alerts : orgAlertItems
  return {
    panels: [
      { key: 'today', title: '今日实时', render: <OrgTodayPanel today={today} realtime={realtime} /> },
      { key: 'share', title: '会话构成', render: <SharePanel slices={slices} /> },
      { key: 'token', title: 'Token 消耗', render: <TokenTrendChart data={overview.tokenTrend} /> },
      { key: 'alert', title: '风险告警', render: <AlertSummary days={days} alerts={alerts} /> },
    ],
    fullGrid: [
      { title: '今日实时', icon: 'building', render: <OrgTodayPanel today={today} realtime={realtime} /> },
      { title: '会话构成', icon: 'chart', render: <SharePanel slices={slices} /> },
      { title: 'Token 消耗', icon: 'spark', render: <TokenTrendChart data={overview.tokenTrend} /> },
      { title: '客服负载', icon: 'users', render: <OrgAgentLoadChart rows={overview.agentLoad} realtime={realtime} /> },
      { title: '客户满意度', icon: 'star', render: <OrgSatisfactionPanel today={today} /> },
      { title: '风险告警', icon: 'pulse', render: <AlertSummary days={days} alerts={alerts} /> },
    ],
  }
}

function LiveDashboard({ metrics: initialMetrics = realtimeMetrics, panels = platformPanels, fullGrid = platformFullGrid, screenTitle = '平台实时数据大屏', live = false }) {
  const [viewIdx, setViewIdx] = useState(0)
  const [isFull, setIsFull] = useState(false)
  const [paused, setPaused] = useState(false)
  const [metrics, setMetrics] = useState(initialMetrics)
  const dashRef = useRef(null)
  useEffect(() => {
    if (live) setMetrics(initialMetrics)
  }, [live, initialMetrics])
  useEffect(() => {
    if (paused || isFull) return undefined
    const id = setInterval(() => setViewIdx((prev) => (prev + 1) % panels.length), 6000)
    return () => clearInterval(id)
  }, [paused, isFull, panels.length])
  useEffect(() => {
    if (live) return undefined
    const id = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        activeConversations: Math.max(20, prev.activeConversations + Math.floor(Math.random() * 5 - 2)),
        queueLength: Math.max(0, prev.queueLength + Math.floor(Math.random() * 3 - 1)),
        avgResponseTime: Math.max(20, prev.avgResponseTime + Math.floor(Math.random() * 10 - 5)),
      }))
    }, 3000)
    return () => clearInterval(id)
  }, [live])
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
        <div className="ld-live-item"><span>当前会话</span><strong>{metrics.activeConversations}<small>较上一时段 +4</small></strong></div>
        <div className="ld-live-item"><span>排队等待</span><strong className={metrics.queueLength > 5 ? 'danger-text' : ''}>{metrics.queueLength}<small>SLA 风险 2 个</small></strong></div>
        <div className="ld-live-item"><span>在线客服</span><strong>{metrics.onlineAgents}<small>忙 {metrics.busyAgents} · 闲 {metrics.idleAgents}</small></strong></div>
        <div className="ld-live-item"><span>平均首响</span><strong>{metrics.avgResponseTime}s<small>目标 ≤ 60s</small></strong></div>
        <div className="ld-live-item"><span>AI 解决率</span><strong>{metrics.aiResolution}%<small>较昨日 +1.3%</small></strong></div>
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
  const orgs = (stat.orgs || orgActivityData).filter((o) => o.satisfaction > 0)
  const [idx, setIdx] = useState(0)
  if (!orgs.length) return (
    <div className={`admin-metric-card paired ${stat.tone} sat-card`}>
      <div className="metric-head">
        <span>{stat.label}</span>
        <div className="metric-icon"><AIcon name={stat.icon} size={16} /></div>
      </div>
      <div className="sat-card-body"><strong>—</strong><small>暂无客户评价数据</small></div>
    </div>
  )
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
function SatisfactionCarousel({ orgs: sourceOrgs = orgActivityData }) {
  const orgs = sourceOrgs.filter((o) => o.satisfaction > 0)
  const [idx, setIdx] = useState(0)
  if (!orgs.length) return (
    <div className="sat-carousel"><div className="sat-carousel-inner"><div className="sat-score">—</div><div className="sat-count">暂无客户评价数据</div></div></div>
  )
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
const conversationMonitorStatuses = {
  queued: { label: '排队等待', tone: 'warning' },
  human: { label: '人工接待', tone: 'success' },
  ai_handling: { label: 'AI 接待', tone: 'purple' },
  ended: { label: '已结束', tone: 'muted' },
  evaluated: { label: '已评价', tone: 'muted' },
}

function monitorStatus(status) {
  return conversationMonitorStatuses[status] || { label: status || '未知状态', tone: 'muted' }
}

function monitorTime(value) {
  if (!value) return '暂无更新'
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function ConversationMonitor({ mode, session, agents }) {
  const location = useLocation()
  // 渠道接入板块「查看会话」带 ?channel=web 过来，直接预填检索词（会话检索已覆盖 channel 字段）
  const channelFromUrl = new URLSearchParams(location.search).get('channel') || ''
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState(channelFromUrl)
  const [tenantId, setTenantId] = useState(mode === 'organization' ? session.tenantId || '' : '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // 超管模式：机构提示检索（输入名称/ID 弹出匹配建议，点击即查）
  const [tenantOptions, setTenantOptions] = useState([])
  const [tenantInput, setTenantInput] = useState('')
  const [tenantPickerOpen, setTenantPickerOpen] = useState(false)
  useEffect(() => {
    if (mode !== 'platform') return
    fetchTenants({ pageSize: 100 })
      .then((result) => setTenantOptions(result.items || []))
      .catch(() => setTenantOptions([]))
  }, [mode])
  const tenantMatches = tenantOptions
    .filter((tenant) => {
      const keyword = tenantInput.trim().toLowerCase()
      if (tenant.id === tenantId) return false
      if (!keyword) return true
      return tenant.name.toLowerCase().includes(keyword) || tenant.id.toLowerCase().includes(keyword)
    })
    .slice(0, 8)
  const pickedTenant = tenantOptions.find((tenant) => tenant.id === tenantId) || null
  useEffect(() => { setQuery(channelFromUrl) }, [channelFromUrl])
  const summary = useMemo(() => ({
    total: conversations.length,
    active: conversations.filter((item) => ['human', 'ai_handling'].includes(item.status)).length,
    queued: conversations.filter((item) => item.status === 'queued').length,
    closed: conversations.filter((item) => ['ended', 'evaluated'].includes(item.status)).length,
  }), [conversations])
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = conversations.filter((conversation) => {
    const statusMatched = filter === 'all' || (filter === 'ended' ? ['ended', 'evaluated'].includes(conversation.status) : conversation.status === filter)
    const searchMatched = !normalizedQuery || [conversation.id, conversation.customer?.name, conversation.agent?.name, conversation.channel]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    return statusMatched && searchMatched
  })

  const load = async () => {
    if (!tenantId) { setConversations([]); setSelectedConv(null); return }
    setLoading(true)
    try {
      const result = await listAllConversations({ pageSize: 100, ...(mode === 'platform' ? { tenantId } : {}) })
      setConversations(result.items)
      setError('')
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }
  const open = async (id) => {
    try { setSelectedConv(await getConversation(id, mode === 'platform' ? tenantId : undefined)); setError('') } catch (requestError) { setError(requestError.message) }
  }
  useEffect(() => { load() }, [tenantId])
  useEffect(() => {
    if (mode !== 'organization') return undefined
    const token = readAccessToken()
    if (!token) return undefined
    const realtime = createConversationRealtime({ token, onReconnect: load })
    const refresh = () => load()
    const unsubscribers = ['conversation.created','conversation.claimed','conversation.released','conversation.assigned','conversation.ended','message.created','evaluation.submitted'].map((name) => realtime.subscribe(name, refresh))
    return () => { unsubscribers.forEach((unsubscribe) => unsubscribe()); realtime.close() }
  }, [mode, tenantId])

  const assign = async (agentId) => {
    if (!selectedConv || !agentId) return
    try { await assignConversation(selectedConv.id, agentId); await load(); await open(selectedConv.id) } catch (requestError) { setError(requestError.message) }
  }
  const forceEnd = async () => {
    if (!selectedConv || !window.confirm('确认强制结束该会话吗？')) return
    try { await endConversation(selectedConv.id, '机构管理员强制结束'); await load(); await open(selectedConv.id) } catch (requestError) { setError(requestError.message) }
  }
  return (
    <div className="cm-page">
      <div className="cm-summary-grid">
        <div className="cm-summary-card"><span className="blue"><AIcon name="chat" size={16} /></span><div><small>全部会话</small><strong>{summary.total}</strong></div><em>当前机构累计</em></div>
        <div className="cm-summary-card"><span className="green"><AIcon name="pulse" size={16} /></span><div><small>接待中</small><strong>{summary.active}</strong></div><em>人工与 AI</em></div>
        <div className="cm-summary-card"><span className="orange"><AIcon name="clock" size={16} /></span><div><small>排队等待</small><strong>{summary.queued}</strong></div><em>等待分配客服</em></div>
        <div className="cm-summary-card"><span className="purple"><AIcon name="shield" size={16} /></span><div><small>已完成</small><strong>{summary.closed}</strong></div><em>结束与已评价</em></div>
      </div>
      <div className="conversation-monitor">
        <div className="cm-sidebar">
          <div className="cm-sidebar-head">
            <div><strong>会话列表</strong><small>{loading ? '正在同步数据…' : `已加载 ${conversations.length} 条记录`}</small></div>
            <button type="button" className="cm-refresh" onClick={load} disabled={loading} aria-label="刷新会话"><AIcon name="pulse" size={15} /></button>
          </div>
          {mode === 'platform' && <label className="cm-tenant-field"><span>机构范围</span><input value={tenantInput} onChange={(event) => { setTenantInput(event.target.value); setTenantPickerOpen(true) }} onFocus={() => setTenantPickerOpen(true)} onBlur={() => setTimeout(() => setTenantPickerOpen(false), 150)} placeholder="输入机构名称或 ID 检索" />
            {tenantPickerOpen && tenantMatches.length > 0 && (
              <div className="cm-tenant-suggestions">
                {tenantMatches.map((tenant) => (
                  <button type="button" key={tenant.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { setTenantId(tenant.id); setTenantInput(`${tenant.name}（${tenant.id}）`); setTenantPickerOpen(false) }}>
                    <strong>{tenant.name}</strong><small>{tenant.id} · {tenant.status === 'active' ? '运行中' : '已停用'}</small>
                  </button>
                ))}
              </div>
            )}
            {pickedTenant && <small className="cm-tenant-current">当前查看：{pickedTenant.name}（{pickedTenant.id}）</small>}
          </label>}
          <label className="cm-search"><AIcon name="search" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索客户、客服或会话 ID" /></label>
          <div className="cm-filters">
            <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 <b>{summary.total}</b></button>
            <button type="button" className={filter === 'queued' ? 'active' : ''} onClick={() => setFilter('queued')}>排队 <b>{summary.queued}</b></button>
            <button type="button" className={filter === 'human' ? 'active' : ''} onClick={() => setFilter('human')}>人工 <b>{conversations.filter((item) => item.status === 'human').length}</b></button>
            <button type="button" className={filter === 'ai_handling' ? 'active' : ''} onClick={() => setFilter('ai_handling')}>AI <b>{conversations.filter((item) => item.status === 'ai_handling').length}</b></button>
            <button type="button" className={filter === 'ended' ? 'active' : ''} onClick={() => setFilter('ended')}>完成 <b>{summary.closed}</b></button>
          </div>
          {error && <p className="cm-error">{error}</p>}
          <div className="cm-list">
            {!tenantId && mode === 'platform' && <div className="cm-list-empty"><AIcon name="building" size={25} /><strong>请先选择机构范围</strong><small>输入机构 ID 后即可查看该机构的全部会话</small></div>}
            {tenantId && !loading && !filtered.length && <div className="cm-list-empty"><AIcon name="search" size={25} /><strong>暂无匹配会话</strong><small>可以调整状态筛选或搜索关键词</small></div>}
            {filtered.map((conv) => {
              const status = monitorStatus(conv.status)
              return (
                <button type="button" key={conv.id} className={`cm-item ${conv.status} ${selectedConv?.id === conv.id ? 'selected' : ''}`} onClick={() => open(conv.id)}>
                  <span className="cm-item-avatar">{(conv.customer?.name || '客').slice(0, 1)}</span>
                  <span className="cm-item-body">
                    <span className="cm-item-head"><strong>{conv.customer?.name || '客户'}</strong><span className={`cm-status ${status.tone}`}>{status.label}</span></span>
                    <span className="cm-item-preview">{conv.endedReason || `客服：${conv.agent?.name || '暂未分配'}`}</span>
                    <span className="cm-item-foot"><span>{conv.channel || '未知渠道'} · {conv.priority || 'normal'}</span><time>{monitorTime(conv.lastMessageAt || conv.updatedAt)}</time></span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="cm-main">
          {selectedConv ? (
            <>
              <div className="cm-header">
                <div className="cm-header-primary">
                  <span className="cm-customer-avatar">{(selectedConv.customer?.name || '客').slice(0, 1)}</span>
                  <div><div className="cm-title-line"><h3>{selectedConv.customer?.name || '客户会话'}</h3><span className={`cm-status ${monitorStatus(selectedConv.status).tone}`}>{monitorStatus(selectedConv.status).label}</span></div><code>{selectedConv.id}</code></div>
                </div>
                {mode === 'organization' && !['ended','evaluated'].includes(selectedConv.status) && <div className="cm-actions"><select defaultValue="" onChange={(event) => assign(event.target.value)}><option value="" disabled>分配 / 改派客服</option>{agents.filter((agent) => ['active','online'].includes(agent.status)).map((agent) => <option value={agent.id} key={agent.id}>{agent.name}</option>)}</select><button type="button" className="cm-end-btn" onClick={forceEnd}>强制结束</button></div>}
              </div>
              <div className="cm-header-meta">
                <span><small>接待客服</small><strong>{selectedConv.agent?.name || '暂未分配'}</strong></span>
                <span><small>接入渠道</small><strong>{selectedConv.channel || '—'}</strong></span>
                <span><small>优先级</small><strong>{selectedConv.priority || 'normal'}</strong></span>
                <span><small>消息数量</small><strong>{selectedConv.messages?.length || 0}</strong></span>
              </div>
              <div className="cm-chat">
                <div className="cm-chat-divider"><span>会话记录</span></div>
                {(selectedConv.messages || []).map((msg) => (
                  <div key={msg.id} className={`cm-message ${msg.senderType}`}>
                    {msg.senderType !== 'system' && <div className="cm-message-avatar">{msg.senderType === 'customer' ? '客' : msg.senderType === 'agent' ? '服' : 'AI'}</div>}
                    <div className="cm-message-content">
                      {msg.senderType !== 'system' && <div className="cm-message-name">{msg.senderType === 'customer' ? '客户' : msg.senderType === 'agent' ? '人工客服' : 'AI 客服'}</div>}
                      <div className="cm-message-text">{msg.content}</div>
                      <div className="cm-message-time">{new Date(msg.createdAt).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="cm-empty">
              <span><AIcon name="chat" size={32} /></span>
              <p>选择一个会话查看详情</p>
              <small>{mode === 'platform' ? '平台管理员可追溯完整会话记录与接待状态' : '可查看完整记录、分配客服或强制结束会话'}</small>
            </div>
          )}
        </div>
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
/**
 * 机构渠道接入数据。
 * 后端按 Conversation.channel 实时聚合，没有渠道配置表，所以这里只读不写；
 * 后端不可用时返回 rows=null，由调用方决定退回演示数据还是显示空态。
 */
function useTenantChannels({ tenantId, intervalMs = 15000 } = {}) {
  const [rows, setRows] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const payload = await fetchTenantChannels(tenantId ? { tenantId } : {})
        if (cancelled) return
        setRows(normalizeTenantChannels(payload))
        setSummary(payload?.summary || null)
        setError('')
      } catch (requestError) {
        if (cancelled) return
        setRows(null)
        setSummary(null)
        setError(requestError.message)
      }
    }
    load()
    const timer = setInterval(load, intervalMs)
    return () => { cancelled = true; clearInterval(timer) }
  }, [tenantId, intervalMs])
  return { rows, summary, error, live: rows !== null }
}

/** 渠道接入板块：渠道卡片全部来自后端真实会话聚合，点击可跳到会话监控按渠道检索 */
function ChannelBoard({ session }) {
  const navigate = useNavigate()
  const { rows, summary, error, live } = useTenantChannels({
    // 超管在机构上下文浏览时沿用页面其余部分的演示租户（与顶栏 TENANT-018 兜底一致）
    tenantId: session.role === 'platform_admin' ? session.tenantId || 'TENANT-018' : undefined,
  })
  if (!live) {
    return <>
      <SectionHeader title="渠道连接" subtitle="渠道接入数据来自会话库实时聚合" />
      <EmptyChannelState error={error} />
    </>
  }
  const subtitle = `${summary?.connected ?? 0} / ${summary?.total ?? 0} 个渠道已接入 · 今日新增会话 ${summary?.todayConversations ?? 0} 个 · 数据来自数据库（近 7 日口径）`
  return <>
    <SectionHeader title="渠道连接" subtitle={subtitle} />
    <div className="channel-admin-grid">
      {rows.map((channel) => (
        <div className="channel-admin-card" key={channel.key}>
          <div className="channel-admin-head">
            <div className="channel-symbol"><AIcon name={channel.key === 'api' ? 'database' : 'channel'} size={18} /></div>
            <Pill tone={channel.connected ? 'success' : 'muted'}>{channel.statusText}</Pill>
          </div>
          <h3>{channel.name}{!channel.known && <em className="channel-custom-tag">自定义</em>}</h3>
          <p>{channel.description}</p>
          <div><span>今日会话</span><strong>{channel.todayConversations}</strong><small>近 7 日 {channel.conversations7d} · 进行中 {channel.activeConversations}</small><small>最近活跃 {channel.lastActiveText}</small></div>
          <button className="admin-outline-btn" onClick={() => navigate(`/organization/conversations?channel=${encodeURIComponent(channel.key)}`)}>查看会话</button>
        </div>
      ))}
    </div>
  </>
}

function EmptyChannelState({ error }) {
  return <EmptyState
    icon="inbox"
    title="渠道数据暂不可用"
    desc={error ? `无法读取渠道聚合数据：${error}` : '渠道接入数据全部来自会话库实时聚合，后端不可用时无法降级为演示数据。'}
  />
}

function OrganizationOverview({ stats, agentRows, onModal, onNotify, session }) {
  const navigate = useNavigate()
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [overview, setOverview] = useState(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchDashboardOverview()
        if (!cancelled) { setOverview(data); setLive(true) }
      } catch {
        if (!cancelled) setLive(false)
      }
    }
    load()
    const timer = setInterval(load, 3000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])
  const dashboards = useMemo(() => buildOrgPanels(overview), [overview])
  const dashboardPanels = dashboards?.panels || orgPanels
  const dashboardFullGrid = dashboards?.fullGrid || orgFullGrid
  const dashboardMetrics = overview?.metrics || orgRealtime
  // 顶部四张指标卡：后端 summary 优先，后端不可用时退回演示数据
  const metricCards = useMemo(() => buildOrganizationMetricCards(overview) || stats, [overview, stats])
  const { rows: channelRows } = useTenantChannels({
    tenantId: session?.role === 'platform_admin' ? session.tenantId || 'TENANT-018' : undefined,
  })
  const rows = agentRows.length ? agentRows : demoAgents
  const selected = rows.find((agent) => agent.id === selectedAgent)
  const openAgent = (agent) => setSelectedAgent(agent.id)
  const sessionsFor = (agent) => {
    const workload = deriveAgentWorkload(conversationsSeed, agent.name)
    return workload.conversations
  }
  return <><MetricGrid stats={metricCards} /><LiveDashboard metrics={dashboardMetrics} panels={dashboardPanels} fullGrid={dashboardFullGrid} screenTitle="机构实时数据大屏" live={live} /><div className="admin-content-grid two-thirds"><SectionCard title="实时服务概览" subtitle={`${overview?.tenant?.name ? `当前机构 · ${overview.tenant.name}` : '当前机构 · 华东服务中心'} · ${live ? '数据来自数据库' : '演示数据（后端未连接）'}`}><div className="live-metrics"><div><span>排队会话</span><strong className={dashboardMetrics.queueLength > 5 ? 'danger-text' : ''}>{overview ? dashboardMetrics.queueLength : 12}</strong><small>{overview ? `${dashboardMetrics.activeConversations} 个进行中` : '3 个即将超时'}</small></div><div><span>在线客服</span><strong>{rows.filter((row) => row.status === 'online').length} / {rows.length}</strong><small>平均负载 72%</small></div><div><span>知识命中率</span><strong>91.4%</strong><small className="success-text">较昨日 +2.8%</small></div></div><div className="channel-strip">{channelRows ? channelRows.map((channel) => <span key={channel.key}>{channel.name} <b className={channel.connected ? '' : 'warning-text'}>{!channel.connected ? '未接入' : channel.conversations7d > 0 ? `近7日 ${channel.conversations7d}` : `进行中 ${channel.activeConversations}`}</b></span>) : <span>渠道数据加载中 <b className="warning-text">—</b></span>}</div></SectionCard><ChartCard title="近 7 日会话趋势" subtitle="AI 接待与人工接管"><TrendChart values={[44, 52, 48, 64, 58, 76, 82]} color="#6d4bd7" /></ChartCard></div><SectionCard title="客服实时工作情况" subtitle="点击客服查看当前对接会话、回答情况和服务负载"><div className="agent-live-grid">{rows.slice(0, 4).map((row) => { const workload = deriveAgentWorkload(conversationsSeed, row.name); return <button type="button" className={`agent-live-card ${selectedAgent === row.id ? 'selected' : ''}`} key={row.id} onClick={() => openAgent(row)} aria-pressed={selectedAgent === row.id}><span className={`mini-avatar ${row.status}`}>{row.initials}</span><span className="agent-live-main"><strong>{row.name}<small>{row.groups?.[0] || '客服团队'}</small></strong><em>{row.statusText || '在线'}</em></span><span className="agent-live-stat"><b>{workload.active}</b><small>当前对接</small></span><span className="agent-live-stat"><b>{workload.queue}</b><small>待接管</small></span><span className="agent-live-stat"><b>{row.response || '—'}</b><small>平均首响</small></span><span className="agent-live-open">查看详情 →</span></button>})}</div></SectionCard>{selected && <AgentWorkDetail agent={selected} sessions={sessionsFor(selected)} onClose={() => setSelectedAgent(null)} onOpenConversation={(id) => navigate(`/workbench/${id}`)} />}<div className="admin-content-grid two-thirds"><SectionCard title="客服负载排行" action="查看实时情况"><div className="rank-list">{rows.slice(0, 4).map((row) => <button type="button" className="rank-row agent-rank" key={row.id} onClick={() => openAgent(row)}><span className={`mini-avatar ${row.status}`}>{row.initials}</span><span>{row.name}<small>{row.groups?.[0] || '客服团队'}</small></span><Progress value={Math.min(100, (row.sessions || 0) * 2.5)} /><strong>{row.sessions || 0} 会话</strong></button>)}</div></SectionCard><SectionCard title="运营待办" action="查看全部"><Alert text="3 篇知识文档等待审核" tone="warning" time="知识库"/><Alert text="2 个会话即将触发 SLA 升级" tone="danger" time="客服工作台"/><Alert text="本周质检抽检完成率 86%" tone="success" time="质量管理"/></SectionCard></div></>
}

function AgentWorkDetail({ agent, sessions, onClose, onOpenConversation }) {
  const [queueType, setQueueType] = useState('all')
  const filteredSessions = sessions.filter((session) => queueType === 'all' || getQueueType(session).key === queueType)
  return <div className="agent-work-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="agent-work-detail" role="dialog" aria-modal="true" aria-labelledby="agent-work-title"><div className="agent-work-head"><div><span className={`mini-avatar ${agent.status}`}>{agent.initials}</span><div><h2 id="agent-work-title">{agent.name} 的工作情况</h2><p>{agent.groups?.join(' · ') || '客服团队'} · {agent.statusText || '在线'}</p></div></div><button type="button" className="admin-icon-btn" aria-label="关闭客服详情" onClick={onClose}><AIcon name="close" /></button></div><div className="agent-work-metrics"><span><b>{sessions.filter((session) => ['human', 'ai'].includes(session.status)).length}</b>当前对接</span><span><b>{sessions.filter((session) => session.status === 'queued').length}</b>待接管</span><span><b>{agent.response || '—'}</b>平均首响</span></div><div className="agent-work-note">演示快照 · 会话数据来自本地工作台种子</div><h3>当前对接会话 <small>{filteredSessions.length}</small></h3><div className="agent-work-filters"><button type="button" className={queueType === 'all' ? 'active' : ''} onClick={() => setQueueType('all')}>全部</button><button type="button" className={queueType === 'after_sales' ? 'active' : ''} onClick={() => setQueueType('after_sales')}>售后</button><button type="button" className={queueType === 'pre_sales' ? 'active' : ''} onClick={() => setQueueType('pre_sales')}>售前</button></div><div className="agent-work-sessions">{filteredSessions.length ? filteredSessions.map((session) => { const type = getQueueType(session); return <article key={session.id}><div><strong>{session.name} · {session.channel} <em className={`agent-queue-type ${type.key}`}>{type.label}</em></strong><span>{type.reason} · {session.statusText} · {session.slaLabel} · {session.preview}</span></div><button type="button" onClick={() => onOpenConversation(session.id)}>打开会话</button></article> }) : <p>当前分类暂无已分配会话</p>}</div></aside></div>
}
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
