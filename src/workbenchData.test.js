import test from 'node:test'
import assert from 'node:assert/strict'
import { conversationsSeed, deriveCustomerDirectory, deriveQueue, deriveAgentWorkload, getQueueType, filterQueueByAgent, teamSeed } from './workbenchData.js'

test('derives a customer directory from conversation records', () => {
  const rows = deriveCustomerDirectory(conversationsSeed, 'TENANT-018')
  assert.equal(rows.length, 7)
  assert.equal(rows[0].sessionCount, 1)
  assert.equal(rows[0].latestConversationId, 'CS-240819-018')
})

test('classifies registered after-sales and temporary pre-sales customers', () => {
  assert.equal(getQueueType(conversationsSeed[0]).key, 'after_sales')
  assert.equal(getQueueType(conversationsSeed[1]).key, 'pre_sales')
  assert.equal(getQueueType(conversationsSeed[3]).label, '售前队列')
})

test('derives a prioritized queue and agent workload', () => {
  const queue = deriveQueue(conversationsSeed)
  assert.ok(queue.every((conversation) => conversation.status === 'queued'))
  assert.equal(queue[0].id, 'CS-240819-016')
  const workload = deriveAgentWorkload(conversationsSeed, '张宁')
  assert.equal(workload.active, 1)
  assert.equal(workload.queue, 1)
})

test('team seed binds agents to their queue options for the dashboard handoff', () => {
  assert.equal(teamSeed.length, 4)
  const after = teamSeed.filter((agent) => agent.queueKey === 'after_sales')
  const pre = teamSeed.filter((agent) => agent.queueKey === 'pre_sales')
  assert.ok(after.some((agent) => agent.name === '李楠'))
  assert.ok(pre.some((agent) => agent.name === '陈哲'))
  assert.ok(teamSeed.every((agent) => agent.queueLabel && agent.maxLoad > 0))
})

test('filtering the queue by agent only surfaces their assignable lanes', () => {
  const queue = deriveQueue(conversationsSeed)
  const preAgent = teamSeed.find((agent) => agent.queueKey === 'pre_sales')
  const filtered = filterQueueByAgent(queue, preAgent)
  assert.ok(filtered.length > 0)
  assert.ok(filtered.every((conversation) => conversation.queueType === 'pre_sales' || conversation.assignee === preAgent.name))
  const escalationAgent = teamSeed.find((agent) => agent.queueKey === 'escalation')
  const escalated = filterQueueByAgent(queue, escalationAgent)
  assert.ok(escalated.every((conversation) => conversation.slaRisk !== 'safe' || conversation.assignee === escalationAgent.name))
})

test('merges repeated customers and deduplicates tags and channels', () => {
  const [base] = conversationsSeed
  const rows = deriveCustomerDirectory([
    base,
    { ...base, id: 'CS-REPEAT', customerId: base.customerId, channel: '网页', preview: '再次咨询', customer: { ...base.customer, source: '网页' } },
  ], 'TENANT-018')
  assert.equal(rows.length, 1)
  const customer = rows.find((row) => row.id === base.customerId)
  assert.equal(customer.sessionCount, 2)
  assert.deepEqual(customer.channels.sort(), ['微信', '网页'].sort())
  assert.deepEqual(customer.tags.sort(), ['VIP客户', '退款咨询'].sort())
  assert.equal(customer.conversations.length, 2)
})
