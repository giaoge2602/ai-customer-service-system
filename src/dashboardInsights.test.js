import test from 'node:test'
import assert from 'node:assert/strict'

import { buildDashboardComparisons, buildOrganizationDashboardComparisons } from './dashboardInsights.js'

test('builds institution activity and agent capacity as part-to-whole comparisons', () => {
  const result = buildDashboardComparisons(
    { orgs: 28, activeOrgs: 24, agents: 156, onlineAgents: 128 },
    { busyAgents: 89, idleAgents: 39 },
    [],
  )

  assert.deepEqual(result.organizations, {
    total: 28,
    active: 24,
    inactive: 4,
    activeRate: 85.7,
  })
  assert.deepEqual(result.agents, {
    total: 156,
    online: 128,
    offline: 28,
    busy: 89,
    idle: 39,
    onlineRate: 82.1,
    loadRate: 69.5,
    idleRate: 30.5,
  })
})

test('ranks channel composition and adds percentage shares', () => {
  const result = buildDashboardComparisons(
    { orgs: 0, activeOrgs: 0, agents: 0, onlineAgents: 0 },
    { busyAgents: 0, idleAgents: 0 },
    [
      { label: '企业微信', value: 25, color: '#7656c9', change: -1.2 },
      { label: 'Web Widget', value: 50, color: '#4163cb', change: 3.4 },
      { label: 'Open API', value: 25, color: '#b6791a', change: 0.8 },
    ],
  )

  assert.deepEqual(result.channels.map(({ label, share, rank, change }) => ({ label, share, rank, change })), [
    { label: 'Web Widget', share: 50, rank: 1, change: 3.4 },
    { label: '企业微信', share: 25, rank: 2, change: -1.2 },
    { label: 'Open API', share: 25, rank: 3, change: 0.8 },
  ])
})

test('returns zero rates when totals are unavailable', () => {
  const result = buildDashboardComparisons(
    { orgs: 0, activeOrgs: 0, agents: 0, onlineAgents: 0 },
    { busyAgents: 0, idleAgents: 0 },
    [],
  )

  assert.equal(result.organizations.activeRate, 0)
  assert.equal(result.agents.onlineRate, 0)
  assert.equal(result.agents.loadRate, 0)
  assert.deepEqual(result.channels, [])
})

test('builds organization conversation and agent capacity relationships', () => {
  const result = buildOrganizationDashboardComparisons(
    { todayConversations: 2846, aiHandled: 2352, handling: 12, queued: 6 },
    { totalAgents: 16, onlineAgents: 12, busyAgents: 8, idleAgents: 4 },
  )

  assert.deepEqual(result.conversations, {
    total: 2846,
    aiHandled: 2352,
    humanHandled: 494,
    aiRate: 82.6,
    handling: 12,
    queued: 6,
  })
  assert.deepEqual(result.agents, {
    total: 16,
    online: 12,
    offline: 4,
    busy: 8,
    idle: 4,
    onlineRate: 75,
    loadRate: 66.7,
    idleRate: 33.3,
  })
})
