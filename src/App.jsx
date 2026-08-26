import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AdminConsole from './AdminConsole'
import AgentWorkspaceShell from './AgentWorkspaceShell'
import AuthPage from './AuthPage'
import ServiceWorkspace, { CustomerChat } from './ServiceWorkspace'
import { canAccessPath, resolveHome, resolveLoginPath, resolveLogoutPath } from './auth'
import { getWorkArea } from './prototype'
import { conversationsSeed } from './workbenchData'
import { buildAiSystemNote, requestAiReply } from './aiService'
import EmptyState from './EmptyState'

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



const quickReplies = ['您好，我来帮您查询一下，请稍候。', '感谢您的耐心等待，问题已经记录。', '请问您方便提供一下订单号吗？']

const SESSION_KEY = 'ai-customer-service-session'

function readSession() {
  try {
    return JSON.parse(window.sessionStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

function ProtectedRoute({ session, children }) {
  const location = useLocation()
  if (!session) return <Navigate to={resolveLoginPath(location.pathname)} replace state={{ from: location.pathname }} />
  if (!canAccessPath(session.role, location.pathname)) return <Navigate to={resolveHome(session.role)} replace />
  return children
}

function WorkbenchRoute({ session, onLogout }) {
  const params = useParams()
  const navigate = useNavigate()
  const area = getWorkArea(`/workbench/${params.conversationId || ''}`)
  if (area !== 'conversations') return <ServiceWorkspace area={area} session={session} onLogout={onLogout} />
  return <Workbench routeId={params.conversationId} navigate={navigate} session={session} onLogout={onLogout} />
}

function App() {
  const [session, setSession] = useState(readSession)
  const navigate = useNavigate()
  const authenticate = (nextSession) => {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
  }
  const logout = () => {
    const logoutPath = resolveLogoutPath(session?.role)
    window.sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
    navigate(logoutPath, { replace: true })
  }

  return <Routes>
    <Route path="/" element={<Navigate to={session ? resolveHome(session.role) : '/service/login'} replace />} />
    <Route path="/login" element={<Navigate to="/service/login" replace />} />
    <Route path="/register" element={<Navigate to="/service/register" replace />} />
    <Route path="/forgot-password" element={<Navigate to="/service/forgot-password" replace />} />
    <Route path="/chat" element={<Navigate to="/customer/chat" replace />} />
    <Route path="/service/login" element={session ? <Navigate to={resolveHome(session.role)} replace /> : <AuthPage key="service-login" portal="service" mode="login" onAuthenticated={authenticate} />} />
    <Route path="/service/register" element={session ? <Navigate to={resolveHome(session.role)} replace /> : <AuthPage key="service-register-agent" portal="service" mode="register" registrationTarget="agent" onAuthenticated={authenticate} />} />
    <Route path="/service/register/agent" element={session ? <Navigate to={resolveHome(session.role)} replace /> : <AuthPage key="service-register-agent-canonical" portal="service" mode="register" registrationTarget="agent" onAuthenticated={authenticate} />} />
    <Route path="/service/forgot-password" element={session ? <Navigate to={resolveHome(session.role)} replace /> : <AuthPage key="service-recovery" portal="service" mode="recovery" onAuthenticated={authenticate} />} />
    <Route path="/admin/login" element={session ? <Navigate to={resolveHome(session.role)} replace /> : <AuthPage key="admin-login" portal="admin" mode="login" onAuthenticated={authenticate} />} />
    <Route path="/admin/register" element={session ? <Navigate to={resolveHome(session.role)} replace /> : <AuthPage key="admin-register-tenant" portal="admin" mode="register" registrationTarget="tenant" onAuthenticated={authenticate} />} />
    <Route path="/admin/register/tenant" element={session ? <Navigate to={resolveHome(session.role)} replace /> : <AuthPage key="admin-register-tenant-canonical" portal="admin" mode="register" registrationTarget="tenant" onAuthenticated={authenticate} />} />
    <Route path="/admin/register/platform-admin" element={session ? <Navigate to={resolveHome(session.role)} replace /> : <AuthPage key="admin-register-platform" portal="admin" mode="register" registrationTarget="platform" onAuthenticated={authenticate} />} />
    <Route path="/admin/forgot-password" element={session ? <Navigate to={resolveHome(session.role)} replace /> : <AuthPage key="admin-recovery" portal="admin" mode="recovery" onAuthenticated={authenticate} />} />
    <Route path="/customer/chat" element={<ProtectedRoute session={session}><CustomerChat onLogout={logout} /></ProtectedRoute>} />
    <Route path="/workbench" element={<ProtectedRoute session={session}><WorkbenchRoute session={session} onLogout={logout} /></ProtectedRoute>} />
    <Route path="/workbench/customers" element={<ProtectedRoute session={session}><WorkbenchRoute session={session} onLogout={logout} /></ProtectedRoute>} />
    <Route path="/workbench/:conversationId" element={<ProtectedRoute session={session}><WorkbenchRoute session={session} onLogout={logout} /></ProtectedRoute>} />
    <Route path="/platform" element={<ProtectedRoute session={session}><Navigate to="/platform/overview" replace /></ProtectedRoute>} />
    <Route path="/platform/:module" element={<ProtectedRoute session={session}><AdminConsole mode="platform" session={session} onLogout={logout} /></ProtectedRoute>} />
    <Route path="/organization" element={<ProtectedRoute session={session}><Navigate to="/organization/overview" replace /></ProtectedRoute>} />
    <Route path="/organization/:module" element={<ProtectedRoute session={session}><AdminConsole mode="organization" session={session} onLogout={logout} /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

function Workbench({ routeId, navigate, session, onLogout }) {
  const [conversations, setConversations] = useState(conversationsSeed)
  const [selectedId, setSelectedId] = useState(routeId || conversationsSeed[0].id)
  // 筛选条件写入 URL，刷新 / 切换不丢失（P1-7）
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const statusFilter = params.get('status') || 'all'
  const channelFilter = params.get('channel') || 'all'
  const riskFilter = params.get('risk') || 'all'
  const updateParam = (key, value) => setParams((prev) => {
    const next = new URLSearchParams(prev)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    return next
  }, { replace: true })
  const [draft, setDraft] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [showQuick, setShowQuick] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')
  const [rightOpen, setRightOpen] = useState(true)
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const mobileListButtonRef = useRef(null)

  useEffect(() => {
    if (!mobileListOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileListOpen(false)
        mobileListButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileListOpen])

  const selected = conversations.find((item) => item.id === selectedId) || conversations[0]
  // 按 SLA 风险排序：danger → warning → safe（P0-2）
  const filtered = useMemo(() => {
    const order = { danger: 0, warning: 1, safe: 2 }
    return conversations
      .filter((item) => {
        const textMatch = `${item.name} ${item.id} ${item.preview}`.toLowerCase().includes(query.toLowerCase())
        const statusMatch = statusFilter === 'all' || item.status === statusFilter
        const channelMatch = channelFilter === 'all' || item.channelKey === channelFilter
        const riskMatch = riskFilter === 'all' || item.slaRisk === riskFilter
        return textMatch && statusMatch && channelMatch && riskMatch
      })
      .sort((a, b) => (order[a.slaRisk] ?? 2) - (order[b.slaRisk] ?? 2))
  }, [conversations, query, statusFilter, channelFilter, riskFilter])

  // 一键接下一：自动接入最高优先级的待处理会话（P0-2）
  const claimNext = () => {
    const next = filtered.find((c) => c.status === 'queued') || filtered.find((c) => c.status !== 'ended') || filtered[0]
    if (!next) return
    selectConversation(next.id)
    setConversations((items) => items.map((item) => item.id === next.id ? { ...item, status: 'human', statusText: '处理中', assignee: '李楠', unread: 0 } : item))
    notify(`已接入 ${next.name} 的会话`)
  }

  const selectConversation = (id) => {
    setSelectedId(id)
    setDraft('')
    setAiSuggestion('')
    setNote('')
    setConversations((items) => items.map((item) => item.id === id ? { ...item, unread: 0 } : item))
    navigate(`/workbench/${id}`)
    setMobileListOpen(false)
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

  // AI 一键接管：客服繁忙 / 下班 / 休息时，让 AI 实时接待客户；AI 模式可一键收回人工
  const aiTakeover = async () => {
    if (selected.status === 'ai') {
      updateSelected({ status: 'human', statusText: '处理中', assignee: '李楠', slaLabel: '正常', slaRisk: 'safe' })
      notify('已收回人工接待，发送权限已恢复')
      return
    }
    const sysMsg = { id: Date.now(), from: 'system', text: buildAiSystemNote('ai_takeover', '李楠'), time: '刚刚' }
    const nextMessages = [...selected.messages, sysMsg]
    updateSelected({ status: 'ai', statusText: 'AI 接待', slaLabel: 'AI处理中', slaRisk: 'safe', messages: nextMessages, assignee: 'AI 助手' })
    notify('AI 已一键接管，正在实时回复客户')
    const reply = await requestAiReply({ conversation: selected, reason: 'ai_takeover' })
    if (reply) {
      const aiMsg = { id: Date.now(), from: 'ai', text: reply, time: '刚刚', confidence: 88, citations: ['AI 自动接管'] }
      setConversations((items) => items.map((item) => item.id === selected.id ? { ...item, messages: [...nextMessages, aiMsg], preview: reply } : item))
    }
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
    <>
      <AgentWorkspaceShell active="conversations" session={session} onLogout={onLogout}>
        <main className="workbench-main">
          <section className="conversation-column" aria-label="会话列表">
            <div className="column-header"><div><h1>会话</h1><p>{filtered.length} 个会话 · <em>{filtered.filter((c) => c.status === 'queued').length}</em> 个待接管</p></div><button type="button" className="primary-button compact claim-next" onClick={claimNext} disabled={!filtered.some((c) => c.status === 'queued')} title="按 SLA 优先级自动接入下一条待处理会话"><Icon name="arrow" size={14} />一键接下一</button><button className="icon-button subtle" aria-label="更多会话操作"><Icon name="more" /></button></div>
            <div className="search-box"><Icon name="search" size={17} /><input aria-label="搜索会话" value={query} onChange={(e) => updateParam('q', e.target.value)} placeholder="搜索客户、会话或消息" /></div>
            <div className="filter-row"><label className="sr-only" htmlFor="status-filter">会话状态</label><select id="status-filter" value={statusFilter} onChange={(e) => updateParam('status', e.target.value)}><option value="all">全部状态</option><option value="queued">待接管</option><option value="human">处理中</option><option value="ai">AI接待</option><option value="ended">已结束</option></select><label className="sr-only" htmlFor="channel-filter">渠道</label><select id="channel-filter" value={channelFilter} onChange={(e) => updateParam('channel', e.target.value)}><option value="all">全部渠道</option><option value="wechat">微信</option><option value="web">网页</option><option value="wecom">企业微信</option><option value="h5">H5</option><option value="api">API</option></select><label className="sr-only" htmlFor="risk-filter">SLA风险</label><select id="risk-filter" value={riskFilter} onChange={(e) => updateParam('risk', e.target.value)}><option value="all">SLA 风险</option><option value="warning">即将超时</option><option value="danger">已超时</option><option value="safe">正常</option></select></div>
            <div className="queue-summary"><span><i className="dot danger" />高风险 2</span><span><i className="dot warning" />即将超时 1</span><button onClick={() => setParams({}, { replace: true })}>清除筛选</button></div>
            <div className="conversation-list" role="list">
              {filtered.map((item) => <ConversationItem key={item.id} item={item} selected={selected.id === item.id} onClick={() => selectConversation(item.id)} />)}
              {filtered.length === 0 && <EmptyState icon="search" title="没有找到匹配会话" desc="试试调整筛选条件或搜索关键词" />}
            </div>
          </section>

          <section className="chat-column" aria-label="消息工作区">
            <div className="chat-header"><button ref={mobileListButtonRef} type="button" className="mobile-conversation-button icon-button subtle" aria-label="打开会话列表" aria-expanded={mobileListOpen} onClick={() => setMobileListOpen(true)}><Icon name="chat" size={17} /></button><div className={`customer-avatar ${selected.tone}`}>{selected.initials}</div><div className="chat-heading"><div><h2>{selected.name}</h2><span className="channel-text"><span className="channel-pill">{selected.channel}</span> #{selected.id}</span></div><StatusBadge item={selected} /></div><div className="chat-actions"><div className={`sla-clock ${selected.slaRisk}`}><span>SLA</span><strong>{selected.sla}</strong><small>{selected.slaLabel}</small></div><button type="button" className={`ai-takeover-button ${selected.status === 'ai' ? 'active' : ''}`} onClick={aiTakeover} disabled={selected.status === 'ended'} title={selected.status === 'ai' ? 'AI 正在接待本会话，点击收回人工' : '客服繁忙 / 下班 / 休息时，一键让 AI 接管并实时回复客户'}><Icon name="spark" size={14} />{selected.status === 'ai' ? '收回人工' : 'AI 接管'}</button><button className="secondary-button" onClick={() => setShowTransfer(true)} disabled={selected.status === 'ended'}>转接</button><button className="danger-button" onClick={endConversation} disabled={selected.status === 'ended'}>结束会话</button><button className="icon-button subtle" aria-label="更多会话操作"><Icon name="more" /></button></div></div>
            {selected.status === 'queued' && <HandoffBanner selected={selected} onTakeOver={takeOver} />}
            {selected.status === 'ai' && <div className="ai-active-banner"><span className="ai-active-orb"><Icon name="spark" size={14} /></span><div><strong>AI 正在接待本会话</strong><small>实时回复中 · 客服可随时收回人工接待</small></div><button type="button" onClick={aiTakeover}>收回人工</button></div>}
            {selected.status === 'ended' && <div className="ended-banner"><Icon name="check" size={16} /> 会话已结束 · 客户评价：<strong>{selected.customer.satisfaction === '—' ? '等待评价' : `${selected.customer.satisfaction} 星`}</strong></div>}
            <div className="message-scroll"><div className="date-divider"><span>今天 · 2026年8月19日</span></div>{selected.messages.map((message) => <MessageItem key={message.id} message={message} />)}{aiSuggestion && <AiSuggestionCard suggestion={aiSuggestion} onAccept={acceptSuggestion} onDismiss={() => setAiSuggestion('')} />}</div>
            <div className="composer-wrap"><div className="composer-toolbar"><div className="tool-buttons"><button onClick={() => setAiSuggestion('建议先确认订单 A20260819001 的当前退款状态，并向客户说明预计到账时间。')} className={`ai-trigger-tool ${aiSuggestion ? 'active' : ''}`} disabled={selected.status !== 'human'} title="AI 基于当前会话与知识库生成回复建议"><Icon name="spark" size={16} />AI 辅助</button><button onClick={() => setShowQuick(!showQuick)} className={showQuick ? 'selected' : ''}><Icon name="chat" size={16} />快捷回复</button><button onClick={() => notify('附件功能将在接入文件服务后启用')}><Icon name="paperclip" size={16} />附件</button><button onClick={() => notify('语音录制已开始（演示）')}><Icon name="phone" size={16} />语音</button></div><span className="composer-hint">Enter 发送 · Shift + Enter 换行</span></div>{showQuick && <div className="quick-replies">{quickReplies.map((reply) => <button key={reply} onClick={() => addQuickReply(reply)}>{reply}<Icon name="arrow" size={14} /></button>)}</div>}<div className={`composer ${selected.status !== 'human' ? 'disabled' : ''}`}><textarea aria-label="回复消息" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} disabled={selected.status !== 'human'} placeholder={selected.status === 'ended' ? '会话已结束' : selected.status === 'queued' ? '接管会话后即可回复客户' : selected.status === 'ai' ? 'AI 正在接待客户，无需人工输入' : '输入回复内容...'} /><button className="send-button" onClick={sendMessage} disabled={selected.status !== 'human' || !draft.trim()} aria-label="发送消息"><Icon name="send" size={18} /></button></div></div>
          </section>

          <aside className={`context-column ${rightOpen ? '' : 'collapsed'}`} aria-label="客户与接管上下文"><div className="context-header"><div><h2>客户信息</h2><span>客户与会话上下文</span></div><button className="icon-button subtle" onClick={() => setRightOpen(!rightOpen)} aria-label={rightOpen ? '收起客户信息' : '展开客户信息'}><Icon name="chevron" size={16} /></button></div>{rightOpen && <div className="context-scroll"><CustomerCard selected={selected} /><PanelSection title="AI 接管摘要" icon="spark" open={selected.status !== 'ended'}><div className="summary-card"><div className="summary-label">客户当前诉求</div><p>{selected.handoff?.summary || '当前会话由 AI 正常接待，暂未触发人工接管。'}</p>{selected.handoff && <><div className="summary-divider" /><div className="summary-label">建议下一步</div><p>{selected.handoff.next}</p><div className="confidence-row"><span>AI 置信度</span><strong className={selected.handoff.confidence < 60 ? 'low' : ''}>{selected.handoff.confidence}%</strong></div></>}</div></PanelSection><PanelSection title="转人工原因" icon="headset" open={Boolean(selected.handoff)}>{selected.handoff ? <div className="reason-box"><span className="reason-icon"><Icon name="arrow" size={14} /></span><div><strong>{selected.handoff.reason}</strong><span>触发于 {selected.time === '刚刚' ? '刚刚' : '今天 14:28'}</span></div></div> : <div className="muted-empty">尚未触发人工接管</div>}</PanelSection><PanelSection title="知识引用" icon="book" open={Boolean(selected.handoff?.citations)}>{selected.handoff?.citations?.map((citation) => <div className="citation" key={citation}><Icon name="book" size={14} /><span>{citation}</span><Icon name="chevron" size={13} /></div>) || <div className="muted-empty">暂无引用</div>}</PanelSection><PanelSection title="备注与工单" icon="ticket" open><div className="note-area"><label htmlFor="agent-note">客服备注</label><textarea id="agent-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="记录本次服务要点..." /><button onClick={() => notify(note.trim() ? '备注已保存' : '请输入备注内容')}>保存备注</button></div><button className="create-ticket" onClick={() => setShowTicket(true)}><Icon name="plus" size={15} />创建关联工单 <Icon name="chevron" size={14} /></button></PanelSection></div>}</aside>
        </main>
      </AgentWorkspaceShell>
      {!rightOpen && <button className="mobile-context-toggle" onClick={() => setRightOpen(true)}>查看客户信息</button>}
      {showTransfer && <Dialog title="转接会话" onClose={() => setShowTransfer(false)}><p className="dialog-copy">选择承接本次会话的技能组或客服，转接后你将失去发送权限。</p><label className="field-label" htmlFor="transfer-target">承接对象</label><select className="dialog-select" id="transfer-target"><option>售后支持组 · 3 人在线</option><option>技术支持组 · 2 人在线</option><option>客服主管 · 张宁</option></select><div className="dialog-actions"><button className="secondary-button" onClick={() => setShowTransfer(false)}>取消</button><button className="primary-button" onClick={() => { updateSelected({ status: 'queued', statusText: '已转接', assignee: '售后支持组' }); setShowTransfer(false); notify('会话已转接至售后支持组') }}>确认转接</button></div></Dialog>}
      {showTicket && <Dialog title="创建关联工单" onClose={() => setShowTicket(false)} wide><div className="ticket-form"><label className="field-label" htmlFor="ticket-title">工单标题</label><input id="ticket-title" placeholder="请输入需要协同处理的问题" defaultValue={`${selected.name} · ${selected.preview}`} /><div className="form-grid"><div><label className="field-label" htmlFor="ticket-type">问题分类</label><select className="dialog-select" id="ticket-type"><option>退款与售后</option><option>技术故障</option><option>客户投诉</option></select></div><div><label className="field-label" htmlFor="ticket-level">优先级</label><select className="dialog-select" id="ticket-level"><option>高</option><option>普通</option><option>紧急</option></select></div></div><label className="field-label" htmlFor="ticket-description">问题描述</label><textarea id="ticket-description" placeholder="补充处理背景和期望结果..." defaultValue={selected.handoff?.summary || ''} /></div><div className="dialog-actions"><button className="secondary-button" onClick={() => setShowTicket(false)}>取消</button><button className="primary-button" onClick={() => { setShowTicket(false); notify('工单 TK-20260819-026 已创建') }}>创建工单</button></div></Dialog>}
      <div className="sr-only" aria-live="polite">{toast}</div>{toast && <div className="toast"><span className="toast-check"><Icon name="check" size={14} /></span>{toast}</div>}
      {mobileListOpen && <><button type="button" className="conversation-scrim" aria-label="关闭会话列表" onClick={() => { setMobileListOpen(false); mobileListButtonRef.current?.focus() }} /><div className="mobile-conversation-drawer">{<section className="conversation-column" aria-label="会话列表"><div className="column-header"><div><h1>会话</h1><p>{filtered.length} 个会话 · <em>{filtered.filter((c) => c.status === 'queued').length}</em> 个待接管</p></div></div><div className="search-box"><Icon name="search" size={17} /><input aria-label="搜索会话" value={query} onChange={(e) => updateParam('q', e.target.value)} placeholder="搜索客户、会话或消息" /></div><div className="filter-row"><label className="sr-only" htmlFor="mobile-status-filter">会话状态</label><select id="mobile-status-filter" value={statusFilter} onChange={(e) => updateParam('status', e.target.value)}><option value="all">全部状态</option><option value="queued">待接管</option><option value="human">处理中</option><option value="ai">AI接待</option><option value="ended">已结束</option></select><label className="sr-only" htmlFor="mobile-channel-filter">渠道</label><select id="mobile-channel-filter" value={channelFilter} onChange={(e) => updateParam('channel', e.target.value)}><option value="all">全部渠道</option><option value="wechat">微信</option><option value="web">网页</option><option value="wecom">企业微信</option><option value="h5">H5</option><option value="api">API</option></select><label className="sr-only" htmlFor="mobile-risk-filter">SLA风险</label><select id="mobile-risk-filter" value={riskFilter} onChange={(e) => updateParam('risk', e.target.value)}><option value="all">SLA 风险</option><option value="warning">即将超时</option><option value="danger">已超时</option><option value="safe">正常</option></select></div><div className="conversation-list" role="list">{filtered.map((item) => <ConversationItem key={item.id} item={item} selected={selected.id === item.id} onClick={() => selectConversation(item.id)} />)}</div></section>}</div></>}
    </>
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
