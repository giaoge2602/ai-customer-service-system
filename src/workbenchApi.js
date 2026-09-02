import { authRequest } from './api.js'

/**
 * 客服看板（/workbench/dashboard）数据接口。
 *
 * 与 dashboardApi 的区别：这里是坐席作用域——只回我的负载、团队负载、
 * 售前/售后分流队列与满意度，不含机构级告警与经营指标。
 */
export async function fetchWorkbenchOverview(params = {}) {
  const query = new URLSearchParams()
  if (params.tenantId) query.set('tenantId', params.tenantId)
  const suffix = query.toString() ? `?${query}` : ''
  return authRequest(`/workbench/overview${suffix}`)
}

/** 团队负载卡：把后端成员行折叠成看板需要的汇总数字 */
export function summarizeTeam(overview) {
  const team = overview?.team
  if (!team) return null
  return {
    totalAgents: team.totalAgents ?? 0,
    onlineAgents: team.onlineAgents ?? 0,
    totalLoad: team.totalLoad ?? 0,
    totalCapacity: team.totalCapacity ?? 0,
    utilization: team.utilization ?? 0,
  }
}

/** 分流队列卡：售前/售后/超时拆分，缺字段一律按 0 处理 */
export function summarizeQueue(overview) {
  const queue = overview?.queue
  if (!queue) return null
  return {
    total: queue.total ?? 0,
    preSales: queue.preSales ?? 0,
    afterSales: queue.afterSales ?? 0,
    overdue: queue.overdue ?? 0,
  }
}
