import { authRequest } from './api.js'

const DASHBOARD_CHANNEL_COLORS = ['#4163cb', '#22835d', '#7656c9', '#b6791a', '#4d7ea8', '#c04d48']

/** 拉取运营大屏总览数据（机构管理员=本机构，超管=全平台；失败由调用方降级为演示数据） */
export async function fetchDashboardOverview() {
  return authRequest('/dashboard/overview')
}

/** 后端只回传 label/value，前端补齐大屏用的颜色与变化幅度字段 */
export function decorateChannelShare(slices = []) {
  return slices.map((slice, index) => ({
    ...slice,
    color: DASHBOARD_CHANNEL_COLORS[index % DASHBOARD_CHANNEL_COLORS.length],
    change: slice.change ?? 0,
  }))
}

/** 后端 alertTrend 只保证 label/warnings/errors/resolved，补齐结构 */
export function normalizeAlertTrend(days = []) {
  return days.map((day) => ({
    label: day.label,
    warnings: day.warnings ?? 0,
    errors: day.errors ?? 0,
    resolved: day.resolved ?? 0,
  }))
}
