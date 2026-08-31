import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchServiceLogs, normalizeServiceLogRows } from './serviceLogApi.js'

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

test('fetchServiceLogs builds the scoped query with bearer token', async () => {
  const request = mockApi({ items: [], total: 0 })
  await fetchServiceLogs({ page: 2, pageSize: 50, conversationId: '6f0c9d1e-0000-0000-0000-000000000000' })
  assert.equal(request().url, '/api/v1/logs/service?page=2&pageSize=50&conversationId=6f0c9d1e-0000-0000-0000-000000000000')
  assert.equal(request().options.headers.Authorization, 'Bearer token')
})

test('normalizeServiceLogRows formats time and keeps backend scope', () => {
  const rows = normalizeServiceLogRows([
    { id: 'ev-1', time: '2026-08-30T16:19:46.374Z', level: 'warning', scope: '会话 · 访客（H5）', event: '退回队列', actor: '张善', traceId: 'ev-c784792b…', detail: 'd' },
    { id: 'ai-2', time: 'not-a-date', level: 'fatal', scope: '会话 · 访客（网页）', event: 'AI 调用失败', traceId: 'ai-0001' },
  ])
  assert.match(rows[0].time, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  assert.equal(rows[0].level, 'warning')
  assert.equal(rows[0].scope, '会话 · 访客（H5）')
  assert.equal(rows[1].level, 'info')
  assert.equal(rows[1].actor, '系统')
  assert.ok(rows[1].sortKey > 0)
})
