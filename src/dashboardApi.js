import { authRequest } from './api.js'

const DASHBOARD_CHANNEL_COLORS = ['#4163cb', '#22835d', '#7656c9', '#b6791a', '#4d7ea8', '#c04d48']

/** 拉取运营大屏总览数据（机构管理员=本机构，超管=全平台；可传 tenantId 指定单机构；失败由调用方降级为演示数据） */
export async function fetchDashboardOverview(params = {}) {
  const query = new URLSearchParams()
  if (params.tenantId) query.set('tenantId', params.tenantId)
  const suffix = query.toString() ? `?${query}` : ''
  return authRequest(`/dashboard/overview${suffix}`)
}

/** 拉取机构渠道接入总览（按 Conversation.channel 实时聚合；超管需传 tenantId） */
export async function fetchTenantChannels(params = {}) {
  const query = new URLSearchParams()
  if (params.tenantId) query.set('tenantId', params.tenantId)
  const suffix = query.toString() ? `?${query}` : ''
  return authRequest(`/tenant/channels${suffix}`)
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

// ==================== 机构运营总览指标卡 ====================

/** 环比百分比：后端 null 表示无可比基期，不伪造涨幅 */
function formatPercentDelta(delta, baselineLabel = '较昨日') {
  if (delta === null || delta === undefined) return '暂无可比基期'
  const sign = delta > 0 ? '+' : ''
  return `${baselineLabel} ${sign}${delta}%`
}

/** 百分点差值：用于率与率的比较，单位 pt */
function formatPointDelta(delta, baselineLabel = '较昨日') {
  if (delta === null || delta === undefined) return '暂无可比基期'
  const sign = delta > 0 ? '+' : ''
  return `${baselineLabel} ${sign}${delta}pt`
}

/** 评分差值：满意度是 1–5 分制，单位是「分」而不是百分点 */
function formatScoreDelta(delta, baselineLabel = '较前 7 日') {
  if (delta === null || delta === undefined) return '暂无可比基期'
  const sign = delta > 0 ? '+' : ''
  return `${baselineLabel} ${sign}${delta} 分`
}

/**
 * 由后端 overview.summary 构建机构运营总览顶部四张指标卡。
 * 后端未返回 summary（旧版本后端或调用失败）时返回 null，由调用方退回演示数据。
 */
export function buildOrganizationMetricCards(overview) {
  const summary = overview?.summary
  if (!summary) return null
  const sla = summary.sla || {}
  return [
    {
      label: '今日会话',
      value: Number(summary.todayConversations ?? 0).toLocaleString(),
      sub: {
        label: '昨日',
        value: Number(summary.yesterdayConversations ?? 0).toLocaleString(),
        rate: formatPercentDelta(summary.conversationsDelta),
      },
      tone: 'blue',
      icon: 'chat',
    },
    {
      label: 'AI 自助解决率',
      value: `${summary.aiRate ?? 0}%`,
      sub: {
        label: 'AI 接待',
        value: `${summary.aiHandled ?? 0} 个`,
        rate: formatPointDelta(summary.aiRateDelta),
      },
      tone: 'purple',
      icon: 'spark',
    },
    {
      label: '首响 SLA 达成率',
      value: sla.sampled ? `${sla.attainment}%` : '—',
      sub: {
        label: `目标 ≤ ${sla.targetSeconds ?? 60} 秒`,
        value: sla.sampled ? `${sla.attained} / ${sla.sampled}` : '近 7 日无样本',
        rate: sla.sampled ? formatPointDelta(sla.attainmentDelta, '较前 7 日') : '',
      },
      tone: 'green',
      icon: 'clock',
    },
    {
      label: '客户满意度',
      value: summary.satisfactionCount ? Number(summary.satisfaction).toFixed(1) : '—',
      sub: {
        label: '近 7 日评价',
        value: `${summary.satisfactionCount ?? 0} 条`,
        rate: summary.satisfactionCount
          ? formatScoreDelta(summary.satisfactionDelta)
          : '暂无客户评价',
      },
      tone: 'orange',
      icon: 'star',
    },
  ]
}

// ==================== 渠道接入 ====================

/** 最近活跃时间 → 「今天 14:28」/「8/29 18:20」/「—」 */
export function formatChannelActiveAt(iso, now = new Date()) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  if (sameDay) return `今天 ${time}`
  return `${date.getMonth() + 1}/${date.getDate()} ${time}`
}

/**
 * 后端渠道行 → 视图行。
 * 渠道没有配置表，「已接入 / 未接入」由近 7 日会话量与进行中会话量推导，
 * 这里只做展示归一化，不重复判定业务状态。
 */
export function normalizeTenantChannels(payload, now = new Date()) {
  const rows = payload?.channels
  if (!Array.isArray(rows)) return null
  return rows.map((row) => ({
    key: row.key,
    name: row.name || row.key,
    description: row.description || '',
    known: row.known !== false,
    connected: Boolean(row.connected),
    statusText: row.connected ? '已接入' : '未接入',
    todayConversations: row.todayConversations ?? 0,
    conversations7d: row.conversations7d ?? 0,
    activeConversations: row.activeConversations ?? 0,
    lastActiveText: formatChannelActiveAt(row.lastActiveAt, now),
  }))
}
