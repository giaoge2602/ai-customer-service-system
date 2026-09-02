import assert from 'node:assert/strict'
import test from 'node:test'

import { buildOrganizationMetricCards, decorateChannelShare, fetchDashboardOverview, fetchTenantChannels, formatChannelActiveAt, normalizeAlertTrend, normalizeTenantChannels } from './dashboardApi.js'

function mockApi(responseData) {
  globalThis.window = {
    sessionStorage: {
      getItem: () => JSON.stringify({ accessToken: 'token' }),
    },
  }
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return {
      ok: true,
      json: async () => ({ data: responseData }),
    }
  }
  return () => request
}

test('fetchDashboardOverview hits the dashboard endpoint with bearer token', async () => {
  const request = mockApi({ scope: 'organization', metrics: {} })
  await fetchDashboardOverview()
  assert.equal(request().url, '/api/v1/dashboard/overview')
  assert.equal(request().options.headers.Authorization, 'Bearer token')
})

test('decorateChannelShare fills color and change for backend slices', () => {
  const slices = decorateChannelShare([
    { label: 'Web Widget', value: 5 },
    { label: 'H5', value: 3, change: 1.2 },
  ])
  assert.equal(slices[0].color, '#4163cb')
  assert.equal(slices[0].change, 0)
  assert.equal(slices[1].change, 1.2)
})

test('normalizeAlertTrend keeps a full day shape with zero fallbacks', () => {
  const days = normalizeAlertTrend([{ label: '今天', warnings: 2 }])
  assert.deepEqual(days, [{ label: '今天', warnings: 2, errors: 0, resolved: 0 }])
})

test('fetchTenantChannels hits the tenant channels endpoint and passes tenantId for platform admins', async () => {
  const request = mockApi({ channels: [] })
  await fetchTenantChannels()
  assert.equal(request().url, '/api/v1/tenant/channels')
  await fetchTenantChannels({ tenantId: 'TENANT-018' })
  assert.equal(request().url, '/api/v1/tenant/channels?tenantId=TENANT-018')
})

const SUMMARY = {
  todayConversations: 2846,
  yesterdayConversations: 2528,
  conversationsDelta: 12.6,
  aiHandled: 2351,
  aiRate: 82.6,
  aiRateDelta: 5.8,
  sla: { attainment: 96.8, attainmentDelta: 1.8, targetSeconds: 60, sampled: 250, attained: 242, missed: 8 },
  satisfaction: 4.7,
  satisfactionCount: 1204,
  satisfactionDelta: 0.2,
}

test('buildOrganizationMetricCards maps the backend summary into four metric cards', () => {
  const cards = buildOrganizationMetricCards({ summary: SUMMARY })
  assert.equal(cards.length, 4)
  assert.deepEqual(cards.map((card) => card.label), ['今日会话', 'AI 自助解决率', '首响 SLA 达成率', '客户满意度'])
  assert.equal(cards[0].value, '2,846')
  assert.equal(cards[0].sub.rate, '较昨日 +12.6%')
  assert.equal(cards[1].value, '82.6%')
  assert.equal(cards[1].sub.rate, '较昨日 +5.8pt')
  assert.equal(cards[2].value, '96.8%')
  assert.equal(cards[2].sub.value, '242 / 250')
  assert.equal(cards[2].sub.label, '目标 ≤ 60 秒')
  assert.equal(cards[3].value, '4.7')
  assert.equal(cards[3].sub.rate, '较前 7 日 +0.2 分')
})

test('buildOrganizationMetricCards returns null when the backend has no summary block', () => {
  assert.equal(buildOrganizationMetricCards(null), null)
  assert.equal(buildOrganizationMetricCards({ today: {} }), null)
})

test('buildOrganizationMetricCards shows 暂无可比基期 instead of a fake delta', () => {
  const cards = buildOrganizationMetricCards({
    summary: { ...SUMMARY, conversationsDelta: null, aiRateDelta: null, satisfactionDelta: null },
  })
  assert.equal(cards[0].sub.rate, '暂无可比基期')
  assert.equal(cards[1].sub.rate, '暂无可比基期')
  assert.equal(cards[3].sub.rate, '暂无可比基期')
})

test('buildOrganizationMetricCards degrades SLA and satisfaction cards when there is no sample', () => {
  const cards = buildOrganizationMetricCards({
    summary: { ...SUMMARY, sla: { ...SUMMARY.sla, sampled: 0, attained: 0, attainment: 0 }, satisfactionCount: 0 },
  })
  assert.equal(cards[2].value, '—')
  assert.equal(cards[2].sub.value, '近 7 日无样本')
  assert.equal(cards[3].value, '—')
  assert.equal(cards[3].sub.rate, '暂无客户评价')
})

test('formatChannelActiveAt renders today as 今天 and other days as month/day', () => {
  const now = new Date('2026-09-01T20:00:00')
  assert.equal(formatChannelActiveAt(new Date('2026-09-01T14:28:00').toISOString(), now), '今天 14:28')
  assert.equal(formatChannelActiveAt(new Date('2026-08-29T18:20:00').toISOString(), now), '8/29 18:20')
  assert.equal(formatChannelActiveAt(null, now), '—')
  assert.equal(formatChannelActiveAt('not-a-date', now), '—')
})

test('normalizeTenantChannels shapes backend rows for the channel cards', () => {
  const now = new Date('2026-09-01T20:00:00')
  const rows = normalizeTenantChannels({
    channels: [
      { key: 'web', name: 'Web Widget', description: '官网嵌入式客服', known: true, connected: true, todayConversations: 3, conversations7d: 12, activeConversations: 5, lastActiveAt: new Date('2026-09-01T14:28:00').toISOString() },
      { key: 'douyin', name: 'douyin', known: false, connected: false, lastActiveAt: null },
    ],
  }, now)
  assert.equal(rows[0].statusText, '已接入')
  assert.equal(rows[0].lastActiveText, '今天 14:28')
  assert.equal(rows[1].statusText, '未接入')
  assert.equal(rows[1].known, false)
  assert.equal(rows[1].conversations7d, 0)
  assert.equal(rows[1].lastActiveText, '—')
})

test('normalizeTenantChannels returns null when the payload has no channel list', () => {
  assert.equal(normalizeTenantChannels(null), null)
  assert.equal(normalizeTenantChannels({ summary: {} }), null)
})
