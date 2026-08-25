import { useNavigate } from 'react-router-dom'
import { getAgentWorkspaceNav } from './prototype'

function ShellIcon({ name, size = 18 }) {
  const paths = {
    headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4ZM20 14h-3v5h2a1 1 0 0 0 1-1v-4ZM12 21h3" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>,
    ticket: <><path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16V7H4Z" /><path d="M14 7v10" strokeDasharray="2 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.4h.8a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.1h2.4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1V14H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    down: <path d="m6 9 6 6 6-6" />,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.grid}</svg>
}

export default function AgentWorkspaceShell({ active, session, onLogout, children }) {
  const navigate = useNavigate()
  const items = getAgentWorkspaceNav(session.role)
  const primary = items.filter((item) => item.id === 'conversations' || item.id === 'dashboard')
  const resources = items.filter((item) => item.id === 'knowledge')
  const settings = items.find((item) => item.id === 'settings')

  const renderItem = (item) => <button key={item.id} className={`rail-item ${active === item.id ? 'active' : ''}`} onClick={() => navigate(item.path)}><ShellIcon name={item.icon} /><span>{item.label}</span>{item.badge && <b>{item.badge}</b>}</button>

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-lockup"><div className="brand-mark"><ShellIcon name="headset" size={20} /></div><div><strong>AI智能客服系统</strong><span>客服工作台</span></div></div>
      <div className="workspace-title"><span className="live-dot" />华东服务中心 <span className="workspace-divider" />今日运营概览</div>
      <div className="topbar-actions"><div className="online-state"><span className="online-dot" />在线接待 <ShellIcon name="down" size={13} /></div><button className="icon-button" aria-label="查看通知"><ShellIcon name="bell" /></button><div className="agent-avatar">{session.name.slice(0, 1)}</div><div className="agent-meta"><strong>{session.name}</strong><span>{session.title}</span></div><button className="logout-button" onClick={onLogout}>退出</button></div>
    </header>
    <div className="workbench-layout">
      <nav className="rail" aria-label="主导航">
        <div className="rail-group"><div className="rail-label">工作台</div>{primary.map(renderItem)}</div>
        <div className="rail-group"><div className="rail-label">服务资源</div>{resources.map(renderItem)}<button className="rail-item"><ShellIcon name="ticket" /><span>工单协同</span><b className="muted-count">3</b></button></div>
        {settings && <div className="rail-bottom">{renderItem(settings)}</div>}
      </nav>
      {children}
    </div>
  </div>
}
