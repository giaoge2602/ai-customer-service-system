import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchWorkbenchOverview, summarizeQueue, summarizeTeam } from './workbenchApi.js'

function mockApi(responseData) {
  globalThis.window = {
    sessionStorage: { getItem: () => JSON.stringify({ accessToken: 'token' }) },
  }
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return { ok: true, json: async () => ({ data: responseData }) }
  }
  return () => request
}

test('fetchWorkbenchOverview hits the agent-scoped endpoint with bearer token', async () => {
  const request = mockApi({ queue: {}, team: {} })
  await fetchWorkbenchOverview()
  assert.equal(request().url, '/api/v1/workbench/overview')
  assert.equal(request().options.headers.Authorization, 'Bearer token')
})

test('fetchWorkbenchOverview passes tenantId for platform admins', async () => {
  const request = mockApi({ queue: {}, team: {} })
  await fetchWorkbenchOverview({ tenantId: 'TENANT-018' })
  assert.equal(request().url, '/api/v1/workbench/overview?tenantId=TENANT-018')
})

test('summarizeTeam and summarizeQueue read the backend blocks with zero fallbacks', () => {
  const overview = {
    team: { totalAgents: 4, onlineAgents: 3, totalLoad: 5, totalCapacity: 16, utilization: 31.3 },
    queue: { total: 7, preSales: 5, afterSales: 2, overdue: 1 },
  }
  assert.deepEqual(summarizeTeam(overview), {
    totalAgents: 4, onlineAgents: 3, totalLoad: 5, totalCapacity: 16, utilization: 31.3,
  })
  assert.deepEqual(summarizeQueue(overview), { total: 7, preSales: 5, afterSales: 2, overdue: 1 })

  assert.deepEqual(summarizeTeam({ team: {} }), {
    totalAgents: 0, onlineAgents: 0, totalLoad: 0, totalCapacity: 0, utilization: 0,
  })
  assert.deepEqual(summarizeQueue({ queue: {} }), { total: 0, preSales: 0, afterSales: 0, overdue: 0 })
})

test('summarizeTeam and summarizeQueue return null when the backend block is absent', () => {
  assert.equal(summarizeTeam(null), null)
  assert.equal(summarizeQueue(null), null)
  assert.equal(summarizeTeam({}), null)
  assert.equal(summarizeQueue({}), null)
})
