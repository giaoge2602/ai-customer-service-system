import assert from 'node:assert/strict'
import test from 'node:test'

import { decorateChannelShare, fetchDashboardOverview, normalizeAlertTrend } from './dashboardApi.js'

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
