import { Fragment, useEffect, useMemo, useState } from 'react'
import { LEVEL_TEXT, countByLevel, filterLogs, operationLogs, serviceLogs, systemLogs } from '../logsData'
import { fetchServiceLogs, fetchSystemDiagnostics, fetchSystemLogs, normalizeServiceLogRows } from '../serviceLogApi'

const DATASETS = {
  system: { title: '系统日志', subtitle: '全平台审计事件与 AI 调用异常的可观测性总览', csv: '系统日志', demoLogs: systemLogs },
  operation: { title: '机构操作日志', subtitle: '机构内关键操作的审计流水，支持追溯操作者与影响范围 · 演示数据', csv: '操作日志', logs: operationLogs },
  service: { title: '服务日志', subtitle: '会话、AI 应答与渠道路径的关键事件流水', csv: '服务日志', demoLogs: serviceLogs },
}

const TONE = { info: 'muted', warning: 'warning', error: 'danger' }

/** 通用远程日志加载：后端优先，失败降级为演示数据 */
function useRemoteLogs(enabled, fetcher, demoLogs) {
  const [logs, setLogs] = useState(demoLogs)
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const load = async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const result = await fetcher({ pageSize: 100 })
      const rows = normalizeServiceLogRows(result.items)
      rows.sort((a, b) => b.sortKey - a.sortKey)
      setLogs(rows)
      setLive(true)
      setUpdatedAt(new Date())
      setMeta(result)
    } catch {
      setLogs(demoLogs)
      setLive(false)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [enabled])
  return { logs, live, loading, updatedAt, meta, reload: load }
}

/** 系统诊断：15 秒自动轮询，用于崩溃与联调异常排查 */
function useDiagnostics(enabled) {
  const [data, setData] = useState(null)
  const [live, setLive] = useState(false)
  const load = async () => {
    try {
      setData(await fetchSystemDiagnostics())
      setLive(true)
    } catch {
      setLive(false)
    }
  }
  useEffect(() => {
    if (!enabled) return undefined
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [enabled])
  return { data, live, reload: load }
}

function DiagnosticsPanel({ diagnostics, live }) {
  const data = diagnostics.data
  if (!data) {
    return (
      <section className="logs-diag degraded">
        <div className="diag-head">
          <strong>系统诊断</strong>
          <span className={`diag-state ${live ? '' : 'bad'}`}>{live ? '加载中…' : '诊断接口不可用（后端未启动或版本过旧）'}</span>
        </div>
      </section>
    )
  }
  const degraded = data.status !== 'ok'
  const uptimeHours = Math.floor(data.uptimeSeconds / 3600)
  const uptimeText = uptimeHours > 0 ? `${uptimeHours} 小时 ${Math.floor((data.uptimeSeconds % 3600) / 60)} 分` : `${Math.floor(data.uptimeSeconds / 60)} 分 ${data.uptimeSeconds % 60} 秒`
  return (
    <section className={`logs-diag ${degraded ? 'degraded' : ''}`}>
      <div className="diag-head">
        <strong>系统诊断 · 崩溃与联调排查</strong>
        <span className={`diag-state ${degraded ? 'bad' : ''}`}>{degraded ? '⚠ 需要关注' : '✓ 运行正常'}</span>
        <span className="diag-meta">已运行 {uptimeText} · v{data.version} · Node {data.nodeVersion} · {data.platform}</span>
      </div>
      <div className="diag-grid">
        {data.checks.map((check) => (
          <article key={check.key} className={check.ok ? '' : 'bad'}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
            <small>{check.hint}</small>
          </article>
        ))}
        <article className={data.failedInvocations24h > 0 ? 'bad' : ''}>
          <span>AI 调用失败（24h）</span>
          <strong>{data.failedInvocations24h}</strong>
          <small>{data.recentErrors?.length ? `最近：${data.recentErrors.map((error) => error.errorCode).join('、')}` : '无失败记录'}</small>
        </article>
      </div>
      {degraded && <p className="diag-tip">检测到异常项：请优先查看「数据库连接」与「AI 调用通道」，并结合下方错误级别日志定位；前后端联调异常时，可用追踪 ID 在后端日志中检索对应请求。</p>}
    </section>
  )
}

export default function LogsView({ dataset }) {
  const meta = DATASETS[dataset] || DATASETS.system
  const isService = dataset === 'service'
  const isSystem = dataset === 'system'
  const service = useRemoteLogs(isService, fetchServiceLogs, serviceLogs)
  const system = useRemoteLogs(isSystem, fetchSystemLogs, systemLogs)
  const diagnostics = useDiagnostics(isSystem)
  const remote = isService ? service : system
  const logs = isService || isSystem ? remote.logs : meta.logs
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [openId, setOpenId] = useState(null)
  const counts = useMemo(() => countByLevel(logs), [logs])
  const rows = useMemo(() => filterLogs(logs, query, level), [logs, query, level])
  const live = isService || isSystem ? remote.live : false
  const subtitle = isService || isSystem
    ? `${meta.subtitle} · ${remote.live ? '已连接数据库' : '演示数据'}${remote.updatedAt ? ` · 更新于 ${remote.updatedAt.toTimeString().slice(0, 5)}` : ''}`
    : meta.subtitle

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
      {isSystem && <DiagnosticsPanel diagnostics={diagnostics} live={diagnostics.live} />}
      <section className="logs-summary" aria-label="日志级别统计">
        <article><span>日志总数</span><strong>{logs.length}</strong></article>
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
        {(isService || isSystem) && <button type="button" className="logs-export" onClick={remote.reload} disabled={remote.loading}>{remote.loading ? '加载中…' : '↻ 刷新'}</button>}
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
                  <td><strong className="table-name">{row.scope}<small>{row.id.length > 18 ? `${row.id.slice(0, 18)}…` : row.id}</small></strong></td>
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
      <p className="logs-note">{(isService || isSystem)
        ? (live
          ? '数据来自数据库真实事件 · 点击行展开上下文详情，可筛选与导出 CSV；排查联调问题时复制追踪 ID 供后端检索'
          : '后端不可用，正在展示演示数据 · 连接后端后自动切换为真实事件流水')
        : '演示数据 · 点击任意一行展开上下文详情，可按关键词与级别筛选后一键导出 CSV'}</p>
    </div>
  )
}
