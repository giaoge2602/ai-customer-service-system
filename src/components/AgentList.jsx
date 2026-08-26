import { useState } from 'react'
import EmptyState from '../EmptyState'

/**
 * 客服列表（机构/平台复用）+ 批量操作
 * 从 AdminConsole 拆分（P0-3 / P1-8），自包含渲染，不依赖父级私有组件
 */
function Pill({ tone = 'muted', children }) {
  return <span className={`pill tone-${tone}`}>{children}</span>
}

export default function AgentList({ agents = [], onToggle, onNotify }) {
  const [selected, setSelected] = useState(new Set())
  const allChecked = agents.length > 0 && selected.size === agents.length
  const someChecked = selected.size > 0 && !allChecked

  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(agents.map((a) => a.id)))
  const toggleOne = (id) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const bulk = (action) => {
    onNotify(`已${action} ${selected.size} 名客服（演示）`)
    /* TODO: 批量 API — POST /api/v1/agents/bulk */
    setSelected(new Set())
  }

  if (!agents.length) {
    return <EmptyState icon="users" title="暂无客服" desc="邀请客服加入团队后在此查看" />
  }

  return (
    <div className="agent-list">
      <div className="agent-list-table">
        <table>
          <thead>
            <tr>
              <th className="col-check"><input type="checkbox" aria-label="全选客服" checked={allChecked} ref={(el) => { if (el) el.indeterminate = someChecked }} onChange={toggleAll} /></th>
              <th>客服</th><th>角色</th><th>状态</th><th>技能组</th><th>今日会话</th><th>平均首响</th><th>满意度</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((row) => (
              <tr key={row.id} className={selected.has(row.id) ? 'selected' : ''}>
                <td className="col-check"><input type="checkbox" aria-label={`选择 ${row.name}`} checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} /></td>
                <td><strong className="table-name"><span className={`mini-avatar ${row.status}`}>{row.initials}</span>{row.name}<small>{row.id}</small></strong></td>
                <td>{row.role}</td>
                <td><Pill tone={row.status === 'online' ? 'success' : row.status === 'busy' ? 'warning' : 'muted'}>{row.statusText}</Pill></td>
                <td><div className="tag-inline">{row.groups.map((g) => <span key={g}>{g}</span>)}</div></td>
                <td>{row.sessions}</td>
                <td>{row.response}</td>
                <td>{row.satisfaction}</td>
                <td><button className="table-action" onClick={() => onToggle(row.id)}>{row.status === 'offline' ? '启用' : '停用'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected.size > 0 && (
        <div className="bulk-bar" role="region" aria-label="批量操作">
          <span>已选 <b>{selected.size}</b> 项</span>
          <button className="table-action" onClick={() => bulk('批量启用')}>批量启用</button>
          <button className="table-action" onClick={() => bulk('批量停用')}>批量停用</button>
          <button className="table-action" onClick={() => bulk('批量导出')}>批量导出</button>
          <button className="table-action muted" onClick={() => setSelected(new Set())}>取消选择</button>
        </div>
      )}
    </div>
  )
}
