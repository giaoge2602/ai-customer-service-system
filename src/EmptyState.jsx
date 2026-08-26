/**
 * 统一的表格 / 列表空状态组件
 * 替换各处风格不一的 empty 文案，保持一致视觉与无障碍
 */
const ICONS = {
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" strokeLinecap="round" /></>,
  inbox: <><path d="M4 13a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v5H4z" /><path d="M4 18h16M9 9h6" strokeLinecap="round" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M16 11a3 3 0 1 0 0-6M17 15c2.5.3 4 2 4 5" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>,
}

export default function EmptyState({ icon = 'search', title = '暂无数据', desc = '试试调整筛选条件', action = null, className = '' }) {
  const path = ICONS[icon] || ICONS.search
  return (
    <div className={`empty-state ${className}`} role="status">
      <div className="empty-state-icon">
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
      </div>
      <strong>{title}</strong>
      {desc && <span>{desc}</span>}
      {action}
    </div>
  )
}
