import { authRequest } from './api.js'

/** 拉取服务日志（会话流转事件 + AI 调用失败），失败由调用方降级为演示数据 */
export async function fetchServiceLogs(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.pageSize) query.set('pageSize', params.pageSize)
  if (params.conversationId) query.set('conversationId', params.conversationId)
  const suffix = query.toString() ? `?${query}` : ''
  return authRequest(`/logs/service${suffix}`)
}

/** 拉取超管系统日志（全平台审计事件 + AI 调用失败），仅超级管理员可用 */
export async function fetchSystemLogs(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.pageSize) query.set('pageSize', params.pageSize)
  const suffix = query.toString() ? `?${query}` : ''
  return authRequest(`/logs/system${suffix}`)
}

/** 拉取系统运行时诊断（数据库延迟/内存/AI 通道/队列水位），用于崩溃与联调排查 */
export async function fetchSystemDiagnostics() {
  return authRequest('/logs/system/diagnostics')
}

/** 后端行 → LogsView 行结构；时间统一为「YYYY-MM-DD HH:mm」本地格式 */
export function normalizeServiceLogRows(items = [], now = new Date()) {
  return items.map((row, index) => {
    const date = new Date(row.time)
    const valid = !Number.isNaN(date.getTime())
    const stamp = valid
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      : String(row.time ?? '')
    return {
      id: row.id || `sv-real-${index}`,
      time: stamp,
      level: ['info', 'warning', 'error'].includes(row.level) ? row.level : 'info',
      scope: row.scope || '会话',
      event: row.event || '会话事件',
      actor: row.actor || '系统',
      traceId: row.traceId || 'sv-real',
      detail: row.detail || '',
      sortKey: valid ? date.getTime() : now.getTime() + index,
    }
  })
}
