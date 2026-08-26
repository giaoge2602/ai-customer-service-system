import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAgentWorkspaceNav } from './prototype'

function ShellIcon({ name, size = 18 }) {
  const paths = {
    headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4ZM20 14h-3v5h2a1 1 0 0 1 1-1v-4ZM12 21h3" /></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.4-.7L4 20l1.7-3.4A7.3 7.3 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" strokeLinecap="round" /></>,
    chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>,
    ticket: <><path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16V7H4Z" /><path d="M14 7v10" strokeDasharray="2 2" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M16 11a3 3 0 1 0 0-6M17 15c2.5.3 4 2 4 5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.4h.8a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.1h2.4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0 1.6 1h.1V14H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.chat}</svg>
}

const PAGE_TITLES = {
  conversations: '会话工作台',
  dashboard: '客服看板',
  knowledge: '知识库',
  tickets: '工单协同',
  settings: 'AI 与界面配置',
}

export default function AgentWorkspaceShell({ active, session, onLogout, children }) {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButtonRef = useRef(null)
  // 客服在线状态下拉（P2-9）+ 移动端左滑手势关闭（P2-12）
  const [presence, setPresence] = useState('online')
  const [presenceOpen, setPresenceOpen] = useState(false)
  const presenceRef = useRef(null)
  const touchStartX = useRef(0)
  const items = getAgentWorkspaceNav(session.role)
  const primary = items.filter((item) => item.group === 'workspace')
  const resources = items.filter((item) => item.group === 'resources')
  const settings = items.find((item) => item.group === 'settings')
  const organizationLabel = session.role === 'platform_admin' ? '全平台视图' : session.tenantName || session.tenantId || '机构信息未返回'

  useEffect(() => {
    if (!mobileOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  useEffect(() => {
    if (!presenceOpen) return undefined
    const onClick = (event) => {
      if (presenceRef.current && !presenceRef.current.contains(event.target)) setPresenceOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [presenceOpen])

  const presenceLabels = { online: '在线接待', busy: '忙碌', offline: '离线' }
  const onTouchStart = (event) => { touchStartX.current = event.touches[0].clientX }
  const onTouchEnd = (event) => {
    const dx = touchStartX.current - event.changedTouches[0].clientX
    if (dx > 80) { setMobileOpen(false); menuButtonRef.current?.focus() }
  }

  const go = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  const renderItem = (item) => <button
    key={item.id}
    type="button"
    className={`rail-item ${active === item.id ? 'active' : ''}`}
    onClick={() => go(item.path)}
    aria-current={active === item.id ? 'page' : undefined}
  >
    <ShellIcon name={item.icon} />
    <span>{item.label}</span>
    {item.badge && <b className={item.id === 'tickets' ? 'muted-count' : ''}>{item.badge}</b>}
  </button>

  const renderNav = (className = '') => <nav className={`rail ${className}`} aria-label="主导航">
    <div className="rail-group"><div className="rail-label">工作台</div>{primary.map(renderItem)}</div>
    {resources.length > 0 && <div className="rail-group"><div className="rail-label">服务资源</div>{resources.map(renderItem)}</div>}
    {settings && <div className="rail-bottom">{renderItem(settings)}</div>}
  </nav>

  return <div className="app-shell">
    <header className="topbar">
      <button ref={menuButtonRef} type="button" className="mobile-menu-button icon-button" aria-label={mobileOpen ? '关闭主导航' : '打开主导航'} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}><ShellIcon name={mobileOpen ? 'close' : 'menu'} /></button>
      <div className="brand-lockup"><div className="brand-mark"><ShellIcon name="headset" size={20} /></div><div><strong>AI智能客服系统</strong><span>客服工作台</span></div></div>
      <div className="workspace-title"><span className="live-dot" /><span className="workspace-organization">{organizationLabel}</span><span className="workspace-divider" />华东服务中心 <span className="workspace-divider" />{PAGE_TITLES[active] || '客服工作台'}</div>
      <div className="topbar-actions"><div className="presence-select" ref={presenceRef}><button type="button" className="presence-trigger" aria-haspopup="listbox" aria-expanded={presenceOpen} aria-label={`当前状态：${presenceLabels[presence]}`} onClick={() => setPresenceOpen((open) => !open)}><span className={`online-dot presence-${presence}`} />{presenceLabels[presence]}<i className="presence-caret">▾</i></button>{presenceOpen && <ul className="presence-menu" role="listbox"><li><button type="button" role="option" aria-selected={presence === 'online'} onClick={() => { setPresence('online'); setPresenceOpen(false) }}><span className="online-dot presence-online" /><span><strong>在线接待</strong><small>正常分配新会话</small></span></button></li><li><button type="button" role="option" aria-selected={presence === 'busy'} onClick={() => { setPresence('busy'); setPresenceOpen(false) }}><span className="online-dot presence-busy" /><span><strong>忙碌</strong><small>不分配新会话</small></span></button></li><li><button type="button" role="option" aria-selected={presence === 'offline'} onClick={() => { setPresence('offline'); setPresenceOpen(false) }}><span className="online-dot presence-offline" /><span><strong>离线</strong><small>不再接收新会话</small></span></button></li></ul>}</div><button type="button" className="icon-button" aria-label="查看待办工单" onClick={() => go('/workbench/tickets')}><ShellIcon name="bell" /></button><div className="agent-avatar">{session.name.slice(0, 1)}</div><div className="agent-meta"><strong>{session.name}</strong><span>{session.title}</span></div><button type="button" className="logout-button" onClick={onLogout}>退出</button></div>
    </header>
    <div className="workbench-layout">
      {renderNav()}
      {children}
    </div>
    {mobileOpen && <><button type="button" className="rail-scrim" aria-label="关闭主导航" onClick={() => { setMobileOpen(false); menuButtonRef.current?.focus() }} /><div className="mobile-rail-drawer" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>{renderNav('mobile-rail')}</div></>}
  </div>
}
