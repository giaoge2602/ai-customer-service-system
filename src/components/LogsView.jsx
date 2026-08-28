import { Fragment, useMemo, useState } from 'react'
import { LEVEL_TEXT, countByLevel, filterLogs, operationLogs, serviceLogs, systemLogs } from '../logsData'

const DATASETS = {
  system: { title: '系统日志', subtitle: '平台链路与服务运行事件的可观测性总览 · 演示数据', csv: '系统日志', logs: systemLogs },
  operation: { title: '机构操作日志', subtitle: '机构内关键操作的审计流水，支持追溯操作者与影响范围 · 演示数据', csv: '操作日志', logs: operationLogs },
  service: { title: '服务日志', subtitle: '会话、AI 应答与渠道路径的关键事件流水 · 演示数据', csv: '服务日志', logs: serviceLogs },
}

const TONE = { info: 'muted', warning: 'warning', error: 'danger' }

export default function LogsView({ dataset }) {
  const meta = DATASETS[dataset] || DATASETS.system
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [openId, setOpenId] = useState(null)
  const counts = useMemo(() => countByLevel(meta.logs), [meta])
  const rows = useMemo(() => filterLogs(meta.logs, query, level), [meta, query, level])

  const exportCsv = () => {
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const lines = [['时间', '级别', '来源', '事件', '操作人', '追踪 ID'].map(escape).join(',')]
    rows.forEach((row) => lines.push([row.time, LEVEL_TEXT[row.level], row.scope, row.event, row.actor, row.traceId].map(escape).join(',')))
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${meta.csv}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="logs-view">
      <section className="logs-summary" aria-label="日志级别统计">
        <article><span>日志总数</span><strong>{meta.logs.length}</strong></article>
        <article><span>当前匹配</span><strong>{rows.length}</strong></article>
        <article className="warn"><span>警告事件</span><strong>{counts.warning}</strong></article>
        <article className="err"><span>错误事件</span><strong>{counts.error}</strong></article>
      </section>
      <div className="logs-toolbar">
        <label className="logs-search">⌕<input aria-label="搜索日志" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索事件、来源、操作人或追踪 ID" /></label>
        <select aria-label="日志级别筛选" value={level} onChange={(event) => setLevel(event.target.value)}>
          <option value="all">全部级别</option>
          <option value="info">仅信息</option>
          <option value="warning">仅警告</option>
          <option value="error">仅错误</option>
        </select>
        {level !== 'all' && <button type="button" className="logs-clear" onClick={() => setLevel('all')}>清除筛选</button>}
        <button type="button" className="logs-export" onClick={exportCsv}>导出 CSV</button>
        <span className="logs-count">共 {rows.length} 条</span>
      </div>
      <div className="table-wrap">
        <table className="admin-table logs-table">
          <thead><tr><th>时间</th><th>级别</th><th>来源</th><th>事件</th><th>操作人</th><th>追踪 ID</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <tr className={`log-row ${openId === row.id ? 'open' : ''}`} onClick={() => setOpenId(openId === row.id ? null : row.id)} title="点击展开详情">
                  <td>{row.time}</td>
                  <td><span className={`admin-pill ${TONE[row.level]}`}>{LEVEL_TEXT[row.level]}</span></td>
                  <td><strong className="table-name">{row.scope}<small>{row.id}</small></strong></td>
                  <td className="log-event">{row.event}</td>
                  <td>{row.actor}</td>
                  <td><code className="log-code">{row.traceId}</code></td>
                </tr>
                {openId === row.id && <tr className="log-detail"><td colSpan={6}><p>{row.detail}</p></td></tr>}
              </Fragment>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="log-empty">没有匹配的日志，试试调整关键词或级别筛选</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="logs-note">演示数据 · 点击任意一行展开上下文详情，可按关键词与级别筛选后一键导出 CSV</p>
    </div>
  )
}
