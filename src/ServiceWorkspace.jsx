import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AgentWorkspaceShell from './AgentWorkspaceShell'
import SlaCountdown, { parseSlaToSeconds, slaRiskByLeft } from './SlaCountdown'
import { loadPrototypeConfig, resolveServiceMode, savePrototypeConfig, transitionChat } from './prototype'
import { deriveAgentWorkload, deriveCustomerDirectory, deriveQueue, filterQueueByAgent, conversationsSeed, teamSeed } from './workbenchData'

const knowledge = [
  { title: '退款到账需要多久？', category: '退款售后', answer: '审核通过后，原路退回通常需要 3–5 个工作日。', hits: 238, status: '已启用' },
  { title: '企业版支持私有化部署吗？', category: '产品介绍', answer: '支持独立部署与混合部署，可由顾问提供部署清单。', hits: 196, status: '已启用' },
  { title: '如何修改登录密码？', category: '账号安全', answer: '登录后进入个人中心，在账号设置中修改密码。', hits: 154, status: '已启用' },
]

function WorkspaceTop({ title, subtitle, session }) {
  const organization = session.role === 'platform_admin' ? '全平台视图' : session.tenantName || session.tenantId || '机构信息未返回'
  return <header className="service-top"><div><p><strong>{organization}</strong><span>/</span>华东服务中心 <span>/</span> {subtitle}</p><h1>{title}</h1></div><span className="workspace-live-status"><i />{title === '客户目录' ? '本地演示数据' : '实时数据已连接'}</span></header>
}

export default function ServiceWorkspace({ area, session, onLogout }) {
  const page = area === 'dashboard'
    ? { title: '客服团队看板', subtitle: '团队实时负载' }
    : area === 'knowledge'
      ? { title: '企业知识库', subtitle: '知识运营' }
      : area === 'tickets'
        ? { title: '工单协同', subtitle: '跟进服务问题与升级事项' }
        : area === 'customers'
          ? { title: '客户目录', subtitle: '客户关系与历史咨询汇总' }
          : { title: 'AI 与客户入口配置', subtitle: '服务策略' }
  return <AgentWorkspaceShell active={area} session={session} onLogout={onLogout}><main className="service-main workspace-section-main"><WorkspaceTop title={page.title} subtitle={page.subtitle} session={session}/>{area === 'dashboard' ? <TeamDashboard session={session}/> : area === 'knowledge' ? <KnowledgeBase/> : area === 'tickets' ? <TicketWorkspace/> : area === 'customers' ? <CustomerDirectory session={session}/> : <ServiceSettings/>}</main></AgentWorkspaceShell>
}

const ticketSeed = [
  { id: 'TK-20260819-026', title: '退款到账进度核对', conversationId: 'CS-240819-018', priority: 'high', priorityText: '高优先级', owner: '李楠', status: 'pending', statusText: '待处理', updated: '刚刚' },
  { id: 'TK-20260819-025', title: 'API 消息延迟排查', conversationId: 'CS-240819-016', priority: 'urgent', priorityText: '紧急', owner: '张宁', status: 'processing', statusText: '处理中', updated: '5 分钟前' },
  { id: 'TK-20260819-024', title: '企业版部署资料准备', conversationId: 'CS-240819-017', priority: 'normal', priorityText: '普通', owner: '陈哲', status: 'resolved', statusText: '已解决', updated: '今天 13:36' },
]

function TicketWorkspace() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState(ticketSeed)
  const [filter, setFilter] = useState('all')
  const [notice, setNotice] = useState('')
  const filtered = filter === 'all' ? tickets : tickets.filter((ticket) => ticket.status === filter)
  const updateStatus = (id, status) => {
    const statusText = status === 'resolved' ? '已解决' : status === 'processing' ? '处理中' : '待处理'
    setTickets((items) => items.map((ticket) => ticket.id === id ? { ...ticket, status, statusText, updated: '刚刚' } : ticket))
    setNotice('工单状态已更新（演示）')
  }
  return <div className="service-content ticket-content">
    <section className="metric-row compact">{[['全部工单', tickets.length, '本周新增 8'], ['待处理', tickets.filter((ticket) => ticket.status === 'pending').length, '需要及时跟进'], ['高优先级', tickets.filter((ticket) => ticket.priority !== 'normal' && ticket.status !== 'resolved').length, '含 1 个紧急事项'], ['已解决', tickets.filter((ticket) => ticket.status === 'resolved').length, '本周解决率 92%']].map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>
    <section className="surface ticket-surface"><div className="surface-head"><div><h2>服务工单</h2><p>集中跟进会话中的异常、投诉与协同事项</p></div><span className="demo-badge">演示数据</span></div><div className="ticket-toolbar"><div className="ticket-filters" role="group" aria-label="工单状态筛选">{[['all', '全部'], ['pending', '待处理'], ['processing', '处理中'], ['resolved', '已解决']].map(([value, label]) => <button type="button" key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="ticket-count">共 {filtered.length} 条</span></div><div className="ticket-list">{filtered.map((ticket) => <article className="ticket-row" key={ticket.id}><div className="ticket-main"><div className="ticket-id">{ticket.id}<span className={`ticket-priority ${ticket.priority}`}>{ticket.priorityText}</span></div><h3>{ticket.title}</h3><p>关联会话 {ticket.conversationId} · 负责人 {ticket.owner}</p></div><span className={`ticket-status ${ticket.status}`}>{ticket.statusText}</span><time>{ticket.updated}</time><div className="ticket-actions"><button type="button" onClick={() => navigate(`/workbench/${ticket.conversationId}`)}>查看会话</button>{ticket.status !== 'resolved' && <button type="button" onClick={() => updateStatus(ticket.id, ticket.status === 'pending' ? 'processing' : 'resolved')}>{ticket.status === 'pending' ? '开始处理' : '标记解决'}</button>}</div></article>)}{filtered.length === 0 && <div className="ticket-empty">当前筛选下暂无工单</div>}</div></section>{notice && <div className="prototype-toast" role="status">✓ {notice}<button type="button" onClick={() => setNotice('')}>关闭</button></div>}</div>
}

function CustomerDirectory({ session }) {
  const navigate = useNavigate()
  const customers = useMemo(() => deriveCustomerDirectory(conversationsSeed, session.role === 'platform_admin' ? null : session.tenantId), [session.role, session.tenantId])
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [channel, setChannel] = useState('all')
  const [selectedId, setSelectedId] = useState(customers[0]?.id || '')
  const selected = customers.find((customer) => customer.id === selectedId) || customers[0]
  const filtered = customers.filter((customer) => {
    const haystack = `${customer.id} ${customer.name} ${customer.phone} ${customer.email} ${customer.source} ${customer.tags.join(' ')} ${customer.latestPreview}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (level === 'all' || customer.level.includes(level)) && (channel === 'all' || customer.channels.includes(channel))
  })
  const clearFilters = () => { setQuery(''); setLevel('all'); setChannel('all') }
  return <div className="service-content customer-directory">
    <section className="metric-row compact">{[['客户总数', customers.length, '来自本地会话记录'], ['近期活跃', customers.filter((customer) => customer.latestStatus !== 'ended').length, '有进行中的服务'], ['VIP / 高价值', customers.filter((customer) => customer.level.includes('VIP') || customer.level.includes('高价值')).length, '重点客户'], ['历史会话', customers.reduce((sum, customer) => sum + customer.sessionCount, 0), '已汇总会话']].map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>
    <div className="directory-notice"><span>演示数据</span><p>基于本地客服会话记录汇总，后续可接入客户 API。</p></div>
    <section className="surface directory-surface"><div className="directory-toolbar"><div className="directory-search"><span>⌕</span><input aria-label="搜索客户" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名、客户 ID、标签或最近咨询" /></div><select aria-label="客户等级筛选" value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">全部等级</option><option value="VIP">VIP 客户</option><option value="高价值">高价值客户</option><option value="普通">普通客户</option><option value="新客户">新客户</option></select><select aria-label="来源渠道筛选" value={channel} onChange={(event) => setChannel(event.target.value)}><option value="all">全部渠道</option>{[...new Set(customers.flatMap((customer) => customer.channels))].map((item) => <option key={item} value={item}>{item}</option>)}</select><button type="button" className="directory-clear" onClick={clearFilters}>清除筛选</button></div><div className="directory-layout"><div className="directory-list"><div className="directory-list-head"><strong>客户通讯录</strong><span>{filtered.length} 位客户</span></div>{filtered.map((customer) => <button type="button" key={customer.id} className={`directory-row ${selected?.id === customer.id ? 'selected' : ''}`} onClick={() => setSelectedId(customer.id)} aria-pressed={selected?.id === customer.id}><span className={`directory-avatar ${customer.tone}`}>{customer.initials}</span><span className="directory-row-main"><strong>{customer.name}<small>{customer.id}</small></strong><span>{customer.latestPreview}</span><em>{customer.latestStatusText} · {customer.sessionCount} 次会话</em></span><span className="directory-row-time">{customer.latestTime}</span></button>)}{filtered.length === 0 && <div className="directory-empty"><strong>没有匹配的客户</strong><span>尝试调整关键词或筛选条件</span><button type="button" onClick={clearFilters}>清除筛选</button></div>}</div>{selected && <aside className="directory-detail"><div className="directory-detail-head"><span className={`directory-avatar large ${selected.tone}`}>{selected.initials}</span><div><h2>{selected.name}</h2><p>{selected.id} · {selected.level}</p></div></div><div className="directory-tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="directory-fields"><div><span>来源渠道</span><strong>{selected.source}</strong></div><div><span>联系电话</span><strong>{selected.phone}</strong></div><div><span>邮箱</span><strong>{selected.email}</strong></div><div><span>满意度</span><strong>{selected.satisfaction === '—' ? '暂无评价' : `${selected.satisfaction} / 5`}</strong></div></div><div className="directory-summary"><span>最近咨询</span><p>{selected.latestPreview}</p><small>{selected.latestTime} · {selected.latestStatusText}</small></div><h3>相关会话 <small>{selected.conversations.length}</small></h3><div className="directory-sessions">{selected.conversations.map((conversation) => <div className="directory-session" key={conversation.id}><div><strong>{conversation.id}</strong><span>{conversation.channel} · {conversation.statusText}</span></div><button type="button" onClick={() => navigate(`/workbench/${conversation.id}`)}>查看会话</button></div>)}</div></aside>}</div></section>
  </div>
}

function TeamDashboard({ session }) {
  const navigate = useNavigate()
  const [queueView, setQueueView] = useState('all')
  const [agentFocus, setAgentFocus] = useState(null)
  const [claimed, setClaimed] = useState([])
  const [notice, setNotice] = useState('')
  const [team, setTeam] = useState(() => teamSeed.map((agent) => {
    const load = deriveAgentWorkload(conversationsSeed, agent.name)
    return { ...agent, active: Math.max(load.active, 0), queue: load.queue }
  }))
  const [showAll, setShowAll] = useState(false)
  const [slaLeft, setSlaLeft] = useState(() => {
    const map = {}
    deriveQueue(conversationsSeed).forEach((c) => { map[c.id] = parseSlaToSeconds(c.sla) })
    return map
  })
  const [queueFlux, setQueueFlux] = useState(0)
  // TODO: 替换为后端 /api/v1/dashboard/realtime（WebSocket / SSE）实时推送
  useEffect(() => {
    const timer = setInterval(() => {
      setSlaLeft((prev) => {
        const next = {}
        Object.keys(prev).forEach((id) => { next[id] = prev[id] > 0 ? prev[id] - 1 : 0 })
        return next
      })
      setQueueFlux(() => (Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? -1 : 1))
      setTeam((prev) => prev.map((a) => {
        if (a.state === '离线' || Math.random() > 0.06) return a
        const toBusy = a.state === '空闲'
        return { ...a, state: toBusy ? '忙碌' : '空闲', tone: toBusy ? 'busy' : 'ready' }
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const queue = useMemo(() => deriveQueue(conversationsSeed).filter((conversation) => !claimed.includes(conversation.id)), [claimed])
  const afterSales = queue.filter((conversation) => conversation.queueType === 'after_sales')
  const preSales = queue.filter((conversation) => conversation.queueType === 'pre_sales')
  const slaLeftOf = (conversation) => slaLeft[conversation.id] ?? parseSlaToSeconds(conversation.sla)
  const liveRiskOf = (conversation) => slaRiskByLeft(slaLeftOf(conversation))
  const riskItems = queue.filter((conversation) => liveRiskOf(conversation) !== 'safe')
  const riskDanger = riskItems.filter((conversation) => liveRiskOf(conversation) === 'danger')
  const riskWarning = riskItems.filter((conversation) => liveRiskOf(conversation) === 'warning')
  const activeCount = team.reduce((sum, agent) => sum + agent.active, 0)
  const focusAgent = team.find((agent) => agent.name === agentFocus) || null
  const me = session?.name || '李楠'
  const onlineTeam = team.filter((agent) => agent.state !== '离线')
  // 人数可扩展：默认只展示在线客服，离线客服折叠；被聚焦的客服始终可见
  const baseVisible = showAll ? team : onlineTeam
  const visibleTeam = agentFocus && !baseVisible.some((agent) => agent.name === agentFocus)
    ? [...baseVisible, team.find((agent) => agent.name === agentFocus)]
    : baseVisible

  const toggleAgentFocus = (name) => setAgentFocus((current) => (current === name ? null : name))
  const claim = (id, assigneeName = me) => {
    setClaimed((items) => [...items, id])
    setTeam((items) => items.map((agent) => (agent.name === assigneeName ? { ...agent, active: agent.active + 1, queue: Math.max(0, agent.queue - 1) } : agent)))
    setNotice(`已接管会话，计入 ${assigneeName} 的当前负载`)
  }

  // 联调：团队负载中选中的客服 → 队列只展示该客服可承接的会话
  const scopedQueue = focusAgent ? filterQueueByAgent(queue, focusAgent) : queue
  const scopedAfter = scopedQueue.filter((conversation) => conversation.queueType === 'after_sales')
  const scopedPre = scopedQueue.filter((conversation) => conversation.queueType === 'pre_sales')
  const groups = queueView === 'after_sales'
    ? [{ key: 'after', items: scopedAfter, title: '售后队列', desc: '已购买 / 已注册客户，优先处理订单、退款、故障与投诉', tone: 'after' }]
    : queueView === 'pre_sales'
      ? [{ key: 'pre', items: scopedPre, title: '售前队列', desc: '未注册 / 临时客户，聚焦产品、功能与企业版部署解答', tone: 'pre' }]
      : [{ key: 'after', items: scopedAfter, title: '售后队列', desc: '已购买 / 已注册客户，优先处理订单、退款、故障与投诉', tone: 'after' }, { key: 'pre', items: scopedPre, title: '售前队列', desc: '未注册 / 临时客户，聚焦产品、功能与企业版部署解答', tone: 'pre' }]

  const renderQueueRow = (conversation, index) => (
    <article className={`db-queue-row ${index === 0 && !agentFocus ? 'db-recommended' : ''}`} key={conversation.id}>
      <div className="db-rank">{index === 0 ? <span className="db-rank-pin">优先</span> : `#${index + 1}`}</div>
      <div className="db-customer">
        <strong>{conversation.name}<small>{conversation.channel} · {conversation.id}</small></strong>
        <span>{conversation.preview}</span>
      </div>
      <span className={`db-priority ${conversation.priority}`}>{conversation.priorityText}</span>
      <span className="db-wait">{conversation.time}</span>
      <span className={`db-sla-chip ${liveRiskOf(conversation)}`}><i />{conversation.slaLabel}<small>SLA <SlaCountdown seconds={slaLeftOf(conversation)} fallback={conversation.sla} /></small></span>
      <div className="db-actions">
        <button type="button" onClick={() => navigate(`/workbench/${conversation.id}`)}>查看</button>
        <button type="button" className="db-claim" onClick={() => claim(conversation.id)}>接管</button>
      </div>
    </article>
  )

  const renderQueueGroup = ({ key, items, title, desc, tone }) => (
    <section className={`db-lane db-lane-${tone}`} key={key}>
      <div className="db-lane-head">
        <div><h3>{title}<small>{items.length} 个</small></h3><p>{desc}</p></div>
        <span className={items.some((item) => item.slaRisk !== 'safe') ? 'db-lane-flag hot' : 'db-lane-flag'}>{items.some((item) => item.slaRisk !== 'safe') ? '含待跟进项' : '等待中'}</span>
      </div>
      <div className="db-queue-list">{items.map(renderQueueRow)}{items.length === 0 && <div className="db-queue-empty"><strong>暂无待处理会话</strong><span>{focusAgent ? '切换回全部客服可查看其他队列' : '当前队列没有符合条件的待接管会话'}</span></div>}</div>
    </section>
  )

  return (
    <div className="service-content db-dashboard">
      <section className="db-metrics" aria-label="团队关键指标">
        <article className="db-metric db-metric-online">
          <span className="db-metric-label">在线客服</span>
          <div className="db-metric-value">
            <strong>{team.filter((agent) => agent.state !== '离线').length}<em>/ {team.length}</em></strong>
            <span className="db-avatar-stack">{team.map((agent) => <i key={agent.name} className={agent.tone} title={agent.name}>{agent.name.slice(0, 1)}</i>)}</span>
          </div>
          <small>较昨日 +1</small>
        </article>
        <article className="db-metric">
          <span className="db-metric-label">正在接待</span>
          <strong className="db-metric-value">{activeCount}</strong>
          <small>当前人工会话</small>
        </article>
        <article className="db-metric">
          <span className="db-metric-label">排队等待</span>
          <strong className="db-metric-value">{Math.max(0, queue.length + queueFlux)}</strong>
          <small>售后 {afterSales.length} · 售前 {preSales.length}</small>
        </article>
        <article className="db-metric db-metric-risk">
          <span className="db-metric-label">SLA 风险</span>
          <strong className="db-metric-value">{riskItems.length}</strong>
          <small className={riskDanger.length ? 'db-danger-text' : ''}>已超时 {riskDanger.length} · 即将超时 {riskWarning.length}</small>
        </article>
      </section>

      <div className="db-grid">
        <section className="db-surface db-queue-board">
          <div className="db-surface-head">
            <div><h2>分流接待队列</h2><p>按业务类型分流 · 售后优先保障已购客户，售前聚焦产品与部署</p></div>
            <span className="db-badge">实时队列</span>
          </div>
          <div className="db-queue-toolbar">
            <div className="db-seg" role="group" aria-label="队列筛选">
              {[['all', '全部'], ['after_sales', '售后队列'], ['pre_sales', '售前队列']].map(([value, label]) => (
                <button type="button" key={value} className={queueView === value ? 'active' : ''} onClick={() => setQueueView(value)} aria-pressed={queueView === value}>{label}</button>
              ))}
            </div>
            <span className="db-queue-rule">排序：业务类型 → SLA 到期 → 优先级 → 等待时长</span>
          </div>
          {focusAgent && (
            <div className="db-focus-strip">
              <span className={`db-focus-avatar ${focusAgent.tone}`}>{focusAgent.name.slice(0, 1)}</span>
              <div><strong>{focusAgent.name} · {focusAgent.group}</strong><span>正在查看「{focusAgent.queueLabel}」待办 · {focusAgent.shift}</span></div>
              <button type="button" onClick={() => setAgentFocus(null)}>退出该客服视角</button>
            </div>
          )}
          <div className="db-lanes">{groups.map(renderQueueGroup)}</div>
        </section>

        <aside className="db-surface db-team-board">
          <div className="db-surface-head">
            <div><h2>团队工作负载 <span className="db-team-count">{team.length} 人</span></h2><p>点击客服，联动查看其队列安排</p></div>
            <button type="button" className="db-my-queue" onClick={() => toggleAgentFocus(me)} aria-pressed={agentFocus === me}>我的队列</button>
          </div>
          <div className="db-team-filter">
            <div className="db-seg" role="group" aria-label="客服显示范围">
              <button type="button" className={!showAll ? 'active' : ''} onClick={() => setShowAll(false)} aria-pressed={!showAll}>在线 {onlineTeam.length}</button>
              <button type="button" className={showAll ? 'active' : ''} onClick={() => setShowAll(true)} aria-pressed={showAll}>全部 {team.length}</button>
            </div>
            <span className="db-team-filter-hint">人数多时自动多列 · 区域内滚动</span>
          </div>
          <div className="db-team-grid">
            {visibleTeam.map((agent) => {
              const loadPct = Math.min(100, Math.round((agent.active / agent.maxLoad) * 100))
              const focused = agentFocus === agent.name
              return (
                <button type="button" className={`db-agent-card ${focused ? 'focused' : ''} ${agent.tone}`} key={agent.name} onClick={() => toggleAgentFocus(agent.name)} aria-pressed={focused}>
                  <span className="db-agent-top">
                    <span className={`db-agent-avatar ${agent.tone}`}>{agent.name.slice(0, 1)}<i /></span>
                    <strong>{agent.name}<small>{agent.group}</small></strong>
                    <em className={agent.tone}>{agent.state}</em>
                  </span>
                  <span className={`db-queue-chip ${agent.queueKey}`}>{agent.queueLabel}</span>
                  <span className="db-load-track"><i style={{ width: `${loadPct}%` }} /></span>
                  <span className="db-agent-stats">
                    <span><b>{agent.active}</b>接待中</span>
                    <span><b>{agent.queue}</b>待接管</span>
                    <span><b>{agent.response}</b>首响</span>
                    <span><b>{agent.score}</b>评分</span>
                  </span>
                  <span className="db-agent-shift"><i />{agent.shift}{focused && <em>查看队列中</em>}</span>
                </button>
              )
            })}
          </div>
          {visibleTeam.length === 0 && <div className="db-team-empty"><strong>当前没有在线客服</strong><span>切换「全部」查看离线成员</span></div>}
          <p className="db-team-note">负载 = 接待中 / 可并发上限；点击卡片联动左侧队列</p>
        </aside>
      </div>

      <section className="db-surface db-sla-board">
        <div className="db-surface-head">
          <div><h2>SLA 风险预警 <span className="db-sla-pulse" aria-hidden="true" /></h2><p>已从分流接待队列中独立，集中监控到期风险，避免超时升级</p></div>
          <span className={`db-badge ${riskItems.length ? 'db-badge-risk' : ''}`}>{riskItems.length ? `${riskItems.length} 项待跟进` : '状态正常'}</span>
        </div>
        {riskItems.length === 0
          ? <div className="db-sla-clear"><span>✓</span><div><strong>当前无 SLA 风险</strong><p>所有排队会话均处于安全剩余时间内</p></div></div>
          : <div className="db-sla-list">
            {riskItems.map((conversation) => (
              <article className={`db-sla-card ${liveRiskOf(conversation)}`} key={conversation.id}>
                <span className="db-sla-beacon" aria-hidden="true" />
                <div className="db-sla-main">
                  <strong>{conversation.name}<span className={`db-priority ${conversation.priority}`}>{conversation.priorityText}</span></strong>
                  <span>{conversation.channel} · {conversation.id} · {conversation.preview}</span>
                </div>
                <div className={`db-sla-time ${liveRiskOf(conversation)}`}>
                  <b><SlaCountdown seconds={slaLeftOf(conversation)} fallback={conversation.sla} /></b>
                  <small>{conversation.slaLabel === '已超时' ? '已超出目标时长' : '剩余目标时长'}</small>
                </div>
                <button type="button" className="db-claim" onClick={() => claim(conversation.id)}>立即接管</button>
              </article>
            ))}
          </div>}
      </section>

      {notice && <div className="db-toast" role="status"><span>✓</span>{notice}<button type="button" onClick={() => setNotice('')} aria-label="关闭提示">×</button></div>}
    </div>
  )
}

function KnowledgeBase() {
  const [tab, setTab] = useState('faq')
  const [notice, setNotice] = useState('')
  return <div className="service-content"><section className="metric-row compact">{[['知识条目','286','本月 +24'],['AI 命中率','91.4%','较上周 +2.8%'],['待补充问题','18','来自未命中会话'],['已发布版本','V3.2','今天 10:24']].map(([label,value,note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section><section className="surface knowledge-surface"><div className="surface-head"><div><h2>知识内容</h2><p>FAQ 命中时直接回答，文档命中时由大模型生成答案</p></div><button onClick={() => setNotice('已打开新增知识表单（演示）')}>＋ 新增知识</button></div><div className="knowledge-tabs"><button className={tab === 'faq' ? 'active' : ''} onClick={() => setTab('faq')}>FAQ 常见问题</button><button className={tab === 'docs' ? 'active' : ''} onClick={() => setTab('docs')}>知识文档</button><button>未命中问题 <b>18</b></button></div>{tab === 'faq' ? <div className="faq-list">{knowledge.map((item) => <article key={item.title}><span className="faq-icon">Q</span><div><h3>{item.title}</h3><p>{item.answer}</p><small>{item.category} · 近 30 天命中 {item.hits} 次</small></div><em>{item.status}</em><button onClick={() => setNotice(`正在编辑：${item.title}`)}>编辑</button></article>)}</div> : <div className="doc-cards">{['售后服务说明.pdf','企业版产品手册.docx','账号安全指南.md'].map((name,index) => <article key={name}><span>DOC</span><h3>{name}</h3><p>{[42,68,24][index]} 个知识分片 · 已发布</p><button onClick={() => setNotice(`已打开 ${name}`)}>查看详情</button></article>)}</div>}</section>{notice && <div className="prototype-toast" role="status">✓ {notice}<button onClick={() => setNotice('')}>×</button></div>}</div>
}

function ServiceSettings() {
  const initial = useMemo(() => loadPrototypeConfig(), [])
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [theme, setTheme] = useState(initial.theme)
  const [welcome, setWelcome] = useState(initial.welcome)
  const [aiEnabled, setAiEnabled] = useState(initial.aiEnabled)
  const [dark, setDark] = useState(false)
  const mode = useMemo(() => aiEnabled && resolveServiceMode('20:15', { start, end }) === 'ai' ? 'ai' : 'human', [aiEnabled, start, end])
  const [notice, setNotice] = useState('')
  const publish = () => {
    savePrototypeConfig({ start, end, theme, welcome, aiEnabled })
    setNotice('已发布到 Web Widget 与独立聊天窗口')
  }
  return <div className="service-content settings-grid"><section className="surface settings-form"><div className="surface-head"><div><h2>非工作时间 AI 接管</h2><p>工作时段人工优先，下班后由 AI 基于企业知识库接待</p></div><label className="switch"><input type="checkbox" checked={aiEnabled} onChange={(event) => setAiEnabled(event.target.checked)}/><span/></label></div><div className="time-fields"><label>开始时间<input type="time" value={start} onChange={(e) => setStart(e.target.value)}/></label><span>至</span><label>结束时间<input type="time" value={end} onChange={(e) => setEnd(e.target.value)}/></label></div><div className="mode-note"><span className={mode}>{mode === 'ai' ? 'AI' : '人'}</span><div><strong>当前演示时间 20:15 · {mode === 'ai' ? 'AI 客服接待中' : '人工服务模式'}</strong><p>{mode === 'ai' ? '未解决问题将在下个工作日进入“待跟进”列表。' : '客户咨询将进入人工客服排队队列。'}</p></div></div><div className="setting-divider"/><h2>客户入口界面配置</h2><div className="config-fields"><label>欢迎语<input value={welcome} onChange={(e) => setWelcome(e.target.value)}/></label><label>品牌主题色<input type="color" value={theme} onChange={(e) => setTheme(e.target.value)}/></label><label>窗口位置<select><option>右下角</option><option>左下角</option></select></label><label>入口形态<select><option>气泡展开</option><option>横条展开</option><option>独立窗口</option></select></label></div><div className="theme-toggle"><span>预览主题</span><button className={!dark ? 'active' : ''} onClick={() => setDark(false)}>浅色</button><button className={dark ? 'active' : ''} onClick={() => setDark(true)}>深色</button></div><div className="publish-row"><button className="ghost" onClick={() => setNotice('配置草稿已保存')}>保存草稿</button><button onClick={publish}>发布配置</button></div></section><aside className="surface live-preview"><div className="preview-head"><div><h2>实时预览</h2><p>桌面端 · Web Widget</p></div><a href="/customer/chat" target="_blank" rel="noreferrer">独立窗口 ↗</a></div><div className={`widget-preview ${dark ? 'dark' : ''}`}><header style={{background:theme}}><span className="bot-orb">AI</span><strong>星河智能客服<small><i/>{mode === 'ai' ? 'AI 客服在线' : '人工客服在线'}</small></strong><button>—</button></header><div className="preview-chat"><p className="preview-time">今天 20:15</p><div className="bot-message">{welcome}<small>{mode === 'ai' ? '当前为非工作时间，AI 客服为您服务。' : '人工客服在线，很高兴为您服务。'}</small></div><div className="quick-question"><button>退款多久到账？</button><button>企业版如何部署？</button></div></div><footer><span>输入您的问题...</span><button style={{background:theme}}>➤</button></footer></div><p className="preview-tip">配置保存后，Widget 与独立聊天窗口同步更新。</p></aside>{notice && <div className="prototype-toast" role="status">✓ {notice}<button onClick={() => setNotice('')}>×</button></div>}</div>
}

export function CustomerChat({ onLogout }) {
  const config = useMemo(() => loadPrototypeConfig(), [])
  const serviceMode = config.aiEnabled && resolveServiceMode('20:15', config) === 'ai' ? 'ai' : 'human'
  const [status, setStatus] = useState('welcome')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [rating, setRating] = useState(0)
  const [ratingText, setRatingText] = useState('')
  const [showThanks, setShowThanks] = useState(false)
  const start = (text = '我想咨询退款到账时间') => { if (!text.trim()) return; setMessages([{ from: 'customer', text: text.trim() }, { from: 'system', text: serviceMode === 'ai' ? '当前为非工作时间，AI 客服正在检索企业知识库…' : '正在为您连接在线客服…' }]); setStatus(transitionChat('welcome','start')); window.setTimeout(() => { setMessages((list) => [...list, { from: 'agent', text: serviceMode === 'ai' ? '退款审核通过后通常会在 3–5 个工作日原路到账。若已超过 5 个工作日，我可以为您记录并交由人工客服跟进。' : '您好，我是客服李楠，很高兴为您服务。请问可以提供订单号吗？' }]); setStatus(transitionChat('queued','accept')) }, 700) }
  const send = () => { if (!draft.trim() || status !== 'handling') return; setMessages((list) => [...list, { from: 'customer', text: draft.trim() }]); setDraft('') }
  const finish = () => setStatus(transitionChat('handling','finish'))
  return <main className="customer-page"><div className="customer-backdrop"><div className="customer-copy"><span>星河科技 · 客户服务</span><h1>有问题，随时问我们。</h1><p>人工客服与 AI 助手协同在线，咨询记录会安全地保存在您的服务会话中。</p><div><b>7×24</b> 智能接待 <b>3 分钟</b> 平均响应</div></div></div><section className="customer-chat"><header style={{background:config.theme}}><span className="bot-orb">星</span><strong>星河客户服务<small><i/> {status === 'queued' ? (serviceMode === 'ai' ? 'AI 正在分析问题' : '排队中 · 前方 1 人') : status === 'handling' ? (serviceMode === 'ai' ? 'AI 客服正在为您服务' : '李楠正在为您服务') : (serviceMode === 'ai' ? 'AI 客服在线' : '人工客服在线')}</small></strong><button type="button" onClick={onLogout}>退出登录</button></header><div className="customer-messages"><p className="preview-time">今天 20:15</p>{status === 'welcome' && <><div className="agent-bubble">{config.welcome}。请选择常见问题或直接输入您的问题。</div><div className="customer-quick"><button onClick={() => start('退款多久到账？')}>退款多久到账？</button><button onClick={() => start('企业版支持私有化部署吗？')}>企业版支持私有化部署吗？</button><button onClick={() => start('如何修改登录密码？')}>如何修改登录密码？</button></div></>}{messages.map((message,index) => <div key={index} className={`${message.from}-bubble`}>{message.text}</div>)}{status === 'ended' || status === 'evaluated' ? <div className="rating-card">{status === 'evaluated' && showThanks ? <div className="rating-thanks" role="status"><span>✓</span><strong>感谢您的反馈</strong><p>您的评价已提交，我们将持续改进服务</p></div> : <>{status === 'evaluated' ? <strong>已提交评价，感谢您的反馈</strong> : <strong>本次服务已结束</strong>}<p>这次服务是否解决了您的问题？</p><div>{[1,2,3,4,5].map((star) => <button key={star} className={star <= rating ? 'active' : ''} onClick={() => setRating(star)}>★</button>)}</div><textarea className="rating-text" value={ratingText} onChange={(e) => setRatingText(e.target.value)} placeholder="还有什么想说的？（选填）" /><button className="rating-submit" disabled={!rating || status === 'evaluated'} onClick={() => { setStatus(transitionChat('ended','rate')); setShowThanks(true); window.setTimeout(() => setShowThanks(false), 2000) }}>提交评价</button></>}</div> : null}</div><footer><button aria-label="上传图片">＋</button><input aria-label="输入消息" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (status === 'welcome' ? start(draft) : send())} placeholder="输入您的问题..."/><button className="chat-send" style={{background:config.theme}} onClick={() => status === 'welcome' ? start(draft) : send()}>发送</button></footer>{status === 'handling' && <button className="finish-chat" onClick={finish}>结束本次会话</button>}<p className="privacy-note">由 AI 智能客服系统提供支持 · 隐私数据已加密保护</p></section></main>
}
