import { useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import AdminConsole from './AdminConsole'

const Icon = ({ name, size = 18, stroke = 1.8 }) => {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.4-.7L4 20l1.7-3.4A7.3 7.3 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" strokeLinecap="round" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>,
    chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.4h.8a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.1h2.4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1V14H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" strokeLinecap="round" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    down: <path d="m6 9 6 6 6-6" />,
    paperclip: <path d="m20.5 11.5-8.7 8.7a5 5 0 0 1-7.1-7.1l9.2-9.2a3.4 3.4 0 0 1 4.8 4.8l-9.3 9.3a1.8 1.8 0 1 1-2.5-2.5l8.6-8.6" />,
    send: <><path d="m21 3-7.2 18-3.3-7.5L3 10.2 21 3Z" /><path d="M10.5 13.5 21 3" /></>,
    spark: <><path d="m12 3 1.3 5.7L19 10l-5.7 1.3L12 17l-1.3-5.7L5 10l5.7-1.3L12 3Z" /><path d="m19 16 .5 2.5L22 19l-2.5.5L19 22l-.5-2.5L16 19l2.5-.5L19 16Z" /></>,
    headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4ZM20 14h-3v5h2a1 1 0 0 0 1-1v-4ZM12 21h3" /></>,
    ticket: <><path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16V7H4Z" /><path d="M14 7v10" strokeDasharray="2 2" /></>,
    phone: <path d="M6.5 4.5 9 4l2 5-2 1.5a14 14 0 0 0 4.5 4.5L15 13l5 2-.5 2.5c-.3 1.5-1.7 2.5-3.2 2.2C9.4 18.3 5.7 14.6 4.3 7.7 4 6.2 5 4.8 6.5 4.5Z" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.grid}</svg>
}

const conversationsSeed = [
  { id: 'CS-240819-018', name: '林晓雨', initials: '林', channel: '微信', channelKey: 'wechat', status: 'queued', statusText: '待接管', priority: 'high', priorityText: '高优先级', unread: 2, time: '刚刚', sla: '03:42', slaLabel: '即将超时', slaRisk: 'warning', preview: '我想确认一下退款什么时候到账…', tone: 'blue', customer: { level: 'VIP 客户', source: '微信公众号', phone: '138****8000', email: 'lin.x***@mail.com', lastSeen: '今天 14:28', satisfaction: '—', tags: ['VIP客户', '退款咨询'] }, handoff: { reason: '连续 2 次未命中知识库', confidence: 42, summary: '客户希望确认订单 A20260819001 的退款到账时间。AI 已尝试查询退款规则，但缺少订单系统实时数据。', next: '核对订单状态后告知预计到账时间。', citations: ['退款到账规则 v3.2', '售后服务说明'] }, messages: [{ id: 1, from: 'system', text: 'AI 已将会话转入人工队列', time: '14:25' }, { id: 2, from: 'customer', text: '你好，我想确认一下退款什么时候能到账？', time: '14:25' }, { id: 3, from: 'ai', text: '您好，退款到账时间通常为 3–5 个工作日。为了帮您确认具体进度，可以提供订单号吗？', time: '14:26', confidence: 86, citations: ['退款到账规则 v3.2'] }, { id: 4, from: 'customer', text: '订单号是 A20260819001，已经等了四天了。', time: '14:27' }, { id: 5, from: 'ai', text: '我暂时无法查询该订单的实时状态，正在为您转接人工客服。', time: '14:28', confidence: 42 }] },
  { id: 'CS-240819-017', name: '周明远', initials: '周', channel: '网页', channelKey: 'web', status: 'human', statusText: '处理中', priority: 'normal', priorityText: '普通', unread: 1, time: '2 分钟前', sla: '08:15', slaLabel: '正常', slaRisk: 'safe', preview: '好的，那我需要准备哪些材料？', tone: 'purple', customer: { level: '普通客户', source: '官网 Widget', phone: '139****4218', email: 'zhou.m***@mail.com', lastSeen: '今天 14:21', satisfaction: '—', tags: ['售前咨询'] }, handoff: { reason: '客户主动要求人工', confidence: 78, summary: '客户正在咨询企业版部署所需材料，已完成基础产品介绍。', next: '发送企业版资料清单。', citations: ['企业版产品手册'] }, messages: [{ id: 1, from: 'customer', text: '你们的企业版支持私有化部署吗？', time: '14:17' }, { id: 2, from: 'agent', text: '支持的，我们提供独立部署和混合部署两种模式。', time: '14:19' }, { id: 3, from: 'customer', text: '好的，那我需要准备哪些材料？', time: '14:21' }] },
  { id: 'CS-240819-016', name: '赵可欣', initials: '赵', channel: '企业微信', channelKey: 'wecom', status: 'queued', statusText: '排队中', priority: 'urgent', priorityText: '紧急', unread: 4, time: '5 分钟前', sla: '00:58', slaLabel: '已超时', slaRisk: 'danger', preview: '这个问题已经影响到我们的业务了！', tone: 'orange', customer: { level: '高价值客户', source: '企业微信', phone: '186****0932', email: 'zhao.k***@corp.cn', lastSeen: '今天 14:18', satisfaction: '—', tags: ['投诉客户', '高价值'] }, handoff: { reason: '命中投诉与高风险规则', confidence: 31, summary: '客户反馈 API 消息延迟，已影响生产业务，并多次表达不满。', next: '优先安抚客户，创建技术工单并升级主管。', citations: ['服务 SLA 说明', '故障应急预案'] }, messages: [{ id: 1, from: 'customer', text: 'API 消息延迟已经超过 20 分钟了。', time: '14:15' }, { id: 2, from: 'ai', text: '非常抱歉给您带来不便。我将为您转接专属技术支持。', time: '14:16', confidence: 31 }, { id: 3, from: 'customer', text: '这个问题已经影响到我们的业务了！', time: '14:18' }] },
  { id: 'CS-240819-015', name: '陈思远', initials: '陈', channel: 'H5', channelKey: 'h5', status: 'ai', statusText: 'AI 接待', priority: 'normal', priorityText: '普通', unread: 0, time: '12 分钟前', sla: '—', slaLabel: 'AI处理中', slaRisk: 'safe', preview: '谢谢，问题已经解决了。', tone: 'green', customer: { level: '新客户', source: 'H5 页面', phone: '177****1182', email: 'chen.s***@mail.com', lastSeen: '今天 14:09', satisfaction: '—', tags: ['新客户'] }, handoff: null, messages: [{ id: 1, from: 'customer', text: '怎么修改登录密码？', time: '14:05' }, { id: 2, from: 'ai', text: '您可以在“设置 > 安全中心 > 修改密码”中完成操作。', time: '14:06', confidence: 96, citations: ['账号安全指南'] }, { id: 3, from: 'customer', text: '谢谢，问题已经解决了。', time: '14:09' }] },
  { id: 'CS-240819-014', name: '王若琳', initials: '王', channel: 'API', channelKey: 'api', status: 'ended', statusText: '已结束', priority: 'normal', priorityText: '普通', unread: 0, time: '今天 13:42', sla: '已完成', slaLabel: '已评价', slaRisk: 'safe', preview: '服务很专业，谢谢。', tone: 'pink', customer: { level: '普通客户', source: '第三方 API', phone: '133****6012', email: 'wang.r***@mail.com', lastSeen: '今天 13:42', satisfaction: '5.0', tags: ['售后咨询'] }, handoff: null, messages: [{ id: 1, from: 'customer', text: '发票抬头可以修改吗？', time: '13:34' }, { id: 2, from: 'agent', text: '可以的，请在订单详情中提交发票信息变更申请。', time: '13:36' }, { id: 3, from: 'system', text: '客户已提交 5 星评价：服务很专业，谢谢。', time: '13:42' }] },
  { id: 'CS-240819-013', name: '高子涵', initials: '高', channel: '微信', channelKey: 'wechat', status: 'human', statusText: '处理中', priority: 'normal', priorityText: '普通', unread: 0, time: '今天 13:28', sla: '11:20', slaLabel: '正常', slaRisk: 'safe', preview: '我看到啦，感谢你的帮助。', tone: 'teal', customer: { level: '普通客户', source: '微信小程序', phone: '150****7721', email: 'gao.z***@mail.com', lastSeen: '今天 13:28', satisfaction: '—', tags: ['功能咨询'] }, handoff: { reason: '低置信度转人工', confidence: 58, summary: '客户咨询数据导出权限，已确认账户身份。', next: '确认租户套餐与导出权限。', citations: ['权限管理说明'] }, messages: [{ id: 1, from: 'customer', text: '我想导出上个月的会话记录。', time: '13:22' }, { id: 2, from: 'agent', text: '我来帮您确认一下账户权限。', time: '13:25' }, { id: 3, from: 'customer', text: '我看到啦，感谢你的帮助。', time: '13:28' }] },
]

const quickReplies = ['您好，我来帮您查询一下，请稍候。', '感谢您的耐心等待，问题已经记录。', '请问您方便提供一下订单号吗？']

function WorkbenchRoute() {
  const params = useParams()
  const navigate = useNavigate()
  return <Workbench routeId={params.conversationId} navigate={navigate} />
}

function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/workbench" replace />} />
    <Route path="/workbench" element={<WorkbenchRoute />} />
    <Route path="/workbench/:conversationId" element={<WorkbenchRoute />} />
    <Route path="/platform" element={<Navigate to="/platform/overview" replace />} />
    <Route path="/platform/:module" element={<AdminConsole mode="platform" />} />
    <Route path="/organization" element={<Navigate to="/organization/overview" replace />} />
    <Route path="/organization/:module" element={<AdminConsole mode="organization" />} />
    <Route path="*" element={<Navigate to="/workbench" replace />} />
  </Routes>
}

function Workbench({ routeId, navigate }) {
  const [conversations, setConversations] = useState(conversationsSeed)
  const [selectedId, setSelectedId] = useState(routeId || conversationsSeed[0].id)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [draft, setDraft] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [showQuick, setShowQuick] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')
  const [rightOpen, setRightOpen] = useState(true)

  const selected = conversations.find((item) => item.id === selectedId) || conversations[0]
  const filtered = useMemo(() => conversations.filter((item) => {
    const textMatch = `${item.name} ${item.id} ${item.preview}`.toLowerCase().includes(query.toLowerCase())
    const statusMatch = statusFilter === 'all' || item.status === statusFilter
    const channelMatch = channelFilter === 'all' || item.channelKey === channelFilter
    const riskMatch = riskFilter === 'all' || item.slaRisk === riskFilter
    return textMatch && statusMatch && channelMatch && riskMatch
  }), [conversations, query, statusFilter, channelFilter, riskFilter])

  const selectConversation = (id) => {
    setSelectedId(id)
    setDraft('')
    setAiSuggestion('')
    setNote('')
    setConversations((items) => items.map((item) => item.id === id ? { ...item, unread: 0 } : item))
    navigate(`/workbench/${id}`)
  }

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const updateSelected = (patch) => setConversations((items) => items.map((item) => item.id === selected.id ? { ...item, ...patch } : item))

  const takeOver = () => {
    updateSelected({ status: 'human', statusText: '处理中', assignee: '李楠' })
    notify('已成功接管会话，发送权限已开启')
  }

  const sendMessage = () => {
    if (!draft.trim() || selected.status !== 'human') return
    const next = { id: Date.now(), from: 'agent', text: draft.trim(), time: '刚刚' }
    updateSelected({ messages: [...selected.messages, next], preview: draft.trim(), time: '刚刚' })
    setDraft('')
    notify('消息已发送')
  }

  const acceptSuggestion = () => {
    setDraft(aiSuggestion || '您好，我来帮您核对订单状态，请稍候。')
    setAiSuggestion('')
    notify('AI 建议已加入草稿，请确认后发送')
  }

  const addQuickReply = (text) => {
    setDraft(text)
    setShowQuick(false)
  }

  const endConversation = () => {
    if (window.confirm('确认结束当前会话吗？结束后将无法继续发送消息。')) {
      updateSelected({ status: 'ended', statusText: '已结束', slaLabel: '已完成' })
      notify('会话已结束，等待客户评价')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Icon name="headset" size={20} /></div>
          <div><strong>AI智能客服系统</strong><span>客服工作台</span></div>
        </div>
        <div className="workspace-title"><span className="live-dot" />华东服务中心 <span className="workspace-divider" />今日运营概览</div>
        <div className="topbar-actions">
          <div className="online-state"><span className="online-dot" />在线接待 <Icon name="down" size={13} /></div>
          <button className="icon-button" aria-label="查看通知"><Icon name="bell" /></button>
          <div className="agent-avatar">李</div>
          <div className="agent-meta"><strong>李楠</strong><span>客服专员</span></div>
        </div>
      </header>

      <div className="workbench-layout">
        <nav className="rail" aria-label="主导航">
          <div className="rail-group">
            <div className="rail-label">工作台</div>
            <button className="rail-item active"><Icon name="grid" /><span>会话工作台</span><b>12</b></button>
            <button className="rail-item"><Icon name="chart" /><span>运营看板</span></button>
          </div>
          <div className="rail-group">
            <div className="rail-label">服务资源</div>
            <button className="rail-item"><Icon name="book" /><span>知识库</span></button>
            <button className="rail-item"><Icon name="ticket" /><span>工单协同</span><b className="muted-count">3</b></button>
          </div>
          <div className="rail-bottom"><button className="rail-item"><Icon name="settings" /><span>系统设置</span></button></div>
        </nav>

        <main className="workbench-main">
          <section className="conversation-column" aria-label="会话列表">
            <div className="column-header"><div><h1>会话</h1><p>{filtered.length} 个会话 · <em>12</em> 个待处理</p></div><button className="icon-button subtle" aria-label="更多会话操作"><Icon name="more" /></button></div>
            <div className="search-box"><Icon name="search" size={17} /><input aria-label="搜索会话" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索客户、会话或消息" /></div>
            <div className="filter-row"><label className="sr-only" htmlFor="status-filter">会话状态</label><select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">全部状态</option><option value="queued">待接管</option><option value="human">处理中</option><option value="ai">AI接待</option><option value="ended">已结束</option></select><label className="sr-only" htmlFor="channel-filter">渠道</label><select id="channel-filter" value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}><option value="all">全部渠道</option><option value="wechat">微信</option><option value="web">网页</option><option value="wecom">企业微信</option><option value="h5">H5</option><option value="api">API</option></select><label className="sr-only" htmlFor="risk-filter">SLA风险</label><select id="risk-filter" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}><option value="all">SLA 风险</option><option value="warning">即将超时</option><option value="danger">已超时</option><option value="safe">正常</option></select></div>
            <div className="queue-summary"><span><i className="dot danger" />高风险 2</span><span><i className="dot warning" />即将超时 1</span><button onClick={() => { setStatusFilter('all'); setChannelFilter('all'); setRiskFilter('all'); setQuery('') }}>清除筛选</button></div>
            <div className="conversation-list" role="list">
              {filtered.map((item) => <ConversationItem key={item.id} item={item} selected={selected.id === item.id} onClick={() => selectConversation(item.id)} />)}
              {filtered.length === 0 && <div className="empty-list"><div className="empty-icon"><Icon name="search" /></div><strong>没有找到匹配会话</strong><span>试试调整筛选条件或搜索关键词</span></div>}
            </div>
          </section>

          <section className="chat-column" aria-label="消息工作区">
            <div className="chat-header"><div className={`customer-avatar ${selected.tone}`}>{selected.initials}</div><div className="chat-heading"><div><h2>{selected.name}</h2><span className="channel-text"><span className="channel-pill">{selected.channel}</span> #{selected.id}</span></div><StatusBadge item={selected} /></div><div className="chat-actions"><div className={`sla-clock ${selected.slaRisk}`}><span>SLA</span><strong>{selected.sla}</strong><small>{selected.slaLabel}</small></div><button className="secondary-button" onClick={() => setShowTransfer(true)} disabled={selected.status === 'ended'}>转接</button><button className="danger-button" onClick={endConversation} disabled={selected.status === 'ended'}>结束会话</button><button className="icon-button subtle" aria-label="更多会话操作"><Icon name="more" /></button></div></div>
            {selected.status === 'queued' && <HandoffBanner selected={selected} onTakeOver={takeOver} />}
            {selected.status === 'ended' && <div className="ended-banner"><Icon name="check" size={16} /> 会话已结束 · 客户评价：<strong>{selected.customer.satisfaction === '—' ? '等待评价' : `${selected.customer.satisfaction} 星`}</strong></div>}
            <div className="message-scroll"><div className="date-divider"><span>今天 · 2026年8月19日</span></div>{selected.messages.map((message) => <MessageItem key={message.id} message={message} />)}{selected.status === 'human' && !aiSuggestion && <button className="ai-trigger" onClick={() => setAiSuggestion('建议先确认订单 A20260819001 的当前退款状态，并向客户说明预计到账时间。')}><Icon name="spark" size={15} /> AI 辅助回复 <span>为你生成建议</span><Icon name="chevron" size={14} /></button>}{aiSuggestion && <AiSuggestionCard suggestion={aiSuggestion} onAccept={acceptSuggestion} onDismiss={() => setAiSuggestion('')} />}</div>
            <div className="composer-wrap"><div className="composer-toolbar"><div className="tool-buttons"><button onClick={() => setShowQuick(!showQuick)} className={showQuick ? 'selected' : ''}><Icon name="chat" size={16} />快捷回复</button><button onClick={() => notify('附件功能将在接入文件服务后启用')}><Icon name="paperclip" size={16} />附件</button><button onClick={() => notify('语音录制已开始（演示）')}><Icon name="phone" size={16} />语音</button></div><span className="composer-hint">Enter 发送 · Shift + Enter 换行</span></div>{showQuick && <div className="quick-replies">{quickReplies.map((reply) => <button key={reply} onClick={() => addQuickReply(reply)}>{reply}<Icon name="arrow" size={14} /></button>)}</div>}<div className={`composer ${selected.status !== 'human' ? 'disabled' : ''}`}><textarea aria-label="回复消息" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} disabled={selected.status !== 'human'} placeholder={selected.status === 'ended' ? '会话已结束' : selected.status === 'queued' ? '接管会话后即可回复客户' : '输入回复内容...'} /><button className="send-button" onClick={sendMessage} disabled={selected.status !== 'human' || !draft.trim()} aria-label="发送消息"><Icon name="send" size={18} /></button></div></div>
          </section>

          <aside className={`context-column ${rightOpen ? '' : 'collapsed'}`} aria-label="客户与接管上下文"><div className="context-header"><div><h2>客户信息</h2><span>客户与会话上下文</span></div><button className="icon-button subtle" onClick={() => setRightOpen(!rightOpen)} aria-label={rightOpen ? '收起客户信息' : '展开客户信息'}><Icon name="chevron" size={16} /></button></div>{rightOpen && <div className="context-scroll"><CustomerCard selected={selected} /><PanelSection title="AI 接管摘要" icon="spark" open={selected.status !== 'ended'}><div className="summary-card"><div className="summary-label">客户当前诉求</div><p>{selected.handoff?.summary || '当前会话由 AI 正常接待，暂未触发人工接管。'}</p>{selected.handoff && <><div className="summary-divider" /><div className="summary-label">建议下一步</div><p>{selected.handoff.next}</p><div className="confidence-row"><span>AI 置信度</span><strong className={selected.handoff.confidence < 60 ? 'low' : ''}>{selected.handoff.confidence}%</strong></div></>}</div></PanelSection><PanelSection title="转人工原因" icon="headset" open={Boolean(selected.handoff)}>{selected.handoff ? <div className="reason-box"><span className="reason-icon"><Icon name="arrow" size={14} /></span><div><strong>{selected.handoff.reason}</strong><span>触发于 {selected.time === '刚刚' ? '刚刚' : '今天 14:28'}</span></div></div> : <div className="muted-empty">尚未触发人工接管</div>}</PanelSection><PanelSection title="知识引用" icon="book" open={Boolean(selected.handoff?.citations)}>{selected.handoff?.citations?.map((citation) => <div className="citation" key={citation}><Icon name="book" size={14} /><span>{citation}</span><Icon name="chevron" size={13} /></div>) || <div className="muted-empty">暂无引用</div>}</PanelSection><PanelSection title="备注与工单" icon="ticket" open><div className="note-area"><label htmlFor="agent-note">客服备注</label><textarea id="agent-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="记录本次服务要点..." /><button onClick={() => notify(note.trim() ? '备注已保存' : '请输入备注内容')}>保存备注</button></div><button className="create-ticket" onClick={() => setShowTicket(true)}><Icon name="plus" size={15} />创建关联工单 <Icon name="chevron" size={14} /></button></PanelSection></div>}</aside>
        </main>
      </div>
      {!rightOpen && <button className="mobile-context-toggle" onClick={() => setRightOpen(true)}>查看客户信息</button>}
      {showTransfer && <Dialog title="转接会话" onClose={() => setShowTransfer(false)}><p className="dialog-copy">选择承接本次会话的技能组或客服，转接后你将失去发送权限。</p><label className="field-label" htmlFor="transfer-target">承接对象</label><select className="dialog-select" id="transfer-target"><option>售后支持组 · 3 人在线</option><option>技术支持组 · 2 人在线</option><option>客服主管 · 张宁</option></select><div className="dialog-actions"><button className="secondary-button" onClick={() => setShowTransfer(false)}>取消</button><button className="primary-button" onClick={() => { updateSelected({ status: 'queued', statusText: '已转接', assignee: '售后支持组' }); setShowTransfer(false); notify('会话已转接至售后支持组') }}>确认转接</button></div></Dialog>}
      {showTicket && <Dialog title="创建关联工单" onClose={() => setShowTicket(false)} wide><div className="ticket-form"><label className="field-label" htmlFor="ticket-title">工单标题</label><input id="ticket-title" placeholder="请输入需要协同处理的问题" defaultValue={`${selected.name} · ${selected.preview}`} /><div className="form-grid"><div><label className="field-label" htmlFor="ticket-type">问题分类</label><select className="dialog-select" id="ticket-type"><option>退款与售后</option><option>技术故障</option><option>客户投诉</option></select></div><div><label className="field-label" htmlFor="ticket-level">优先级</label><select className="dialog-select" id="ticket-level"><option>高</option><option>普通</option><option>紧急</option></select></div></div><label className="field-label" htmlFor="ticket-description">问题描述</label><textarea id="ticket-description" placeholder="补充处理背景和期望结果..." defaultValue={selected.handoff?.summary || ''} /></div><div className="dialog-actions"><button className="secondary-button" onClick={() => setShowTicket(false)}>取消</button><button className="primary-button" onClick={() => { setShowTicket(false); notify('工单 TK-20260819-026 已创建') }}>创建工单</button></div></Dialog>}
      <div className="sr-only" aria-live="polite">{toast}</div>{toast && <div className="toast"><span className="toast-check"><Icon name="check" size={14} /></span>{toast}</div>}
      <div className="mobile-warning">当前为 PC 客服工作台原型，请使用更宽的窗口获得完整三栏体验。</div>
    </div>
  )
}

function ConversationItem({ item, selected, onClick }) { return <button className={`conversation-item ${selected ? 'selected' : ''}`} onClick={onClick} role="listitem"><div className={`customer-avatar small ${item.tone}`}>{item.initials}</div><div className="conversation-content"><div className="conversation-top"><strong>{item.name}</strong><span>{item.time}</span></div><div className="conversation-preview">{item.preview}</div><div className="conversation-meta"><span className="channel-pill">{item.channel}</span><span className={`status-mini ${item.status}`}>{item.statusText}</span>{item.priority !== 'normal' && <span className={`priority-mini ${item.priority}`}>{item.priorityText}</span>}{item.unread > 0 && <b className="unread-count">{item.unread}</b>}</div></div><div className={`sla-mini ${item.slaRisk}`}><strong>{item.sla}</strong><span>{item.slaLabel}</span></div></button> }
function StatusBadge({ item }) { return <span className={`status-badge ${item.status}`}><i />{item.statusText}</span> }
function HandoffBanner({ selected, onTakeOver }) { return <div className="handoff-banner"><div className="handoff-icon"><Icon name="headset" size={18} /></div><div className="handoff-copy"><strong>AI 已请求人工协助</strong><span>{selected.handoff?.reason} · 当前置信度 <b>{selected.handoff?.confidence}%</b></span></div><button className="text-button">查看接管摘要</button><button className="primary-button compact" onClick={onTakeOver}>立即接管 <Icon name="arrow" size={14} /></button></div> }
function MessageItem({ message }) { const label = message.from === 'customer' ? '客户' : message.from === 'ai' ? 'AI 助手' : message.from === 'agent' ? '李楠 · 客服' : '系统'; return <div className={`message-row ${message.from}`}><div className={`message-avatar ${message.from}`}>{message.from === 'ai' ? <Icon name="spark" size={14} /> : message.from === 'agent' ? '李' : message.from === 'customer' ? '林' : <Icon name="check" size={13} />}</div><div className="message-body"><div className="message-author"><strong>{label}</strong><span>{message.time}</span>{message.confidence && <em className={message.confidence < 60 ? 'low' : ''}>置信度 {message.confidence}%</em>}</div><div className="message-bubble">{message.text}</div>{message.citations && <div className="message-citation"><Icon name="book" size={13} />引用：{message.citations.join('、')} <Icon name="chevron" size={12} /></div>}</div></div> }
function AiSuggestionCard({ suggestion, onAccept, onDismiss }) { return <div className="ai-suggestion"><div className="suggestion-top"><div><span className="ai-label"><Icon name="spark" size={14} /> AI 建议回复</span><span className="suggestion-confidence">基于当前会话与知识库</span></div><button className="icon-button subtle" onClick={onDismiss} aria-label="关闭 AI 建议"><Icon name="close" size={15} /></button></div><p>{suggestion}</p><div className="suggestion-bottom"><span><Icon name="book" size={13} />已引用 2 条知识</span><button className="primary-button compact" onClick={onAccept}>采纳到草稿</button></div></div> }
function CustomerCard({ selected }) { return <div className="customer-card"><div className="customer-card-top"><div className={`customer-avatar medium ${selected.tone}`}>{selected.initials}</div><div><h3>{selected.name}</h3><span className="customer-level">{selected.customer.level}</span></div><button className="icon-button subtle" aria-label="更多客户操作"><Icon name="more" /></button></div><div className="customer-fields"><div><span>来源渠道</span><strong>{selected.customer.source}</strong></div><div><span>手机号 <small>已脱敏</small></span><strong>{selected.customer.phone}</strong></div><div><span>最近咨询</span><strong>{selected.customer.lastSeen}</strong></div><div><span>满意度</span><strong>{selected.customer.satisfaction === '—' ? '暂无评价' : `${selected.customer.satisfaction} / 5.0`}</strong></div></div><div className="tag-list">{selected.customer.tags.map((tag) => <span key={tag}>{tag}</span>)}<button className="add-tag" aria-label="添加标签"><Icon name="plus" size={13} /></button></div><button className="profile-link">查看完整客户档案 <Icon name="arrow" size={14} /></button></div> }
function PanelSection({ title, icon, open = false, children }) { return <details className="panel-section" open={open}><summary><span><Icon name={icon} size={15} />{title}</span><Icon name="down" size={14} /></summary><div className="panel-content">{children}</div></details> }
function Dialog({ title, children, onClose, wide = false }) { return <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><section className={`dialog ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="dialog-header"><h2 id="dialog-title">{title}</h2><button className="icon-button subtle" onClick={onClose} aria-label="关闭"><Icon name="close" /></button></div>{children}</section></div> }

export default App
