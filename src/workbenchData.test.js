import test from 'node:test'
import assert from 'node:assert/strict'
import { appendAgentMessage, canReplyTo, conversationsSeed, deriveQueue, deriveAgentWorkload, filterQueueByAgent, formatSlaSeconds, getQueueType, initialSlaTimers, sortConversationsByStage, stopSlaTimer, teamSeed, tickSlaTimers, visibleConversations } from './workbenchData.js'

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

test('permission: agents view all org conversations but only the assignee can reply', () => {
  const cross = { id: 'X', tenantId: 'TENANT-099' }
  const own = { id: 'Y', tenantId: 'TENANT-018' }
  const agentSession = { role: 'agent', tenantId: 'TENANT-018' }
  assert.deepEqual(visibleConversations([cross, own], agentSession).map((row) => row.id), ['Y'])
  assert.equal(visibleConversations([cross], { role: 'platform_admin' }).length, 1)

  assert.equal(canReplyTo({ status: 'human', assignee: '李楠' }, '李楠'), true)
  assert.equal(canReplyTo({ status: 'human', assignee: '张宁' }, '李楠'), false)
  assert.equal(canReplyTo({ status: 'ended', assignee: '李楠' }, '李楠'), true)
  assert.equal(canReplyTo({ status: 'ended', assignee: '张宁' }, '李楠'), false)
  assert.equal(canReplyTo({ status: 'evaluated', assignee: '李楠' }, '李楠'), false)
  assert.equal(canReplyTo({ status: 'queued', assignee: '李楠' }, '李楠'), false)
  assert.equal(canReplyTo({ status: 'human', assignee: '李楠' }, ''), false)
})

test('messaging an ended conversation keeps status and timers untouched', () => {
  const ended = { id: 'CS-1', status: 'ended', assignee: '李楠', endedAt: '2026-08-19 13:42', sla: '已完成', slaLabel: '已评价', preview: '旧预览', messages: [{ id: 3, from: 'customer', text: '谢谢' }] }
  const next = appendAgentMessage(ended, '补充：退款已提交财务复核。', '李楠')
  assert.equal(next.status, 'ended')
  assert.equal(next.endedAt, '2026-08-19 13:42')
  assert.equal(next.sla, '已完成')
  assert.equal(next.slaLabel, '已评价')
  assert.equal(next.messages.length, 2)
  assert.equal(next.messages[1].afterEnd, true)
  assert.equal(next.preview, '补充：退款已提交财务复核。')
  assert.equal(appendAgentMessage(ended, '越权发送', '张宁'), ended)
  const evaluated = { ...ended, status: 'evaluated' }
  assert.equal(appendAgentMessage(evaluated, '再聊一句', '李楠'), evaluated)
})

test('timers: ended conversations are excluded, stop removes entry, tick clamps at zero', () => {
  const rows = [
    { id: 'a', status: 'queued', slaSeconds: 180 },
    { id: 'b', status: 'human', slaSeconds: 330 },
    { id: 'c', status: 'ai', sla: '—' },
    { id: 'd', status: 'ended', slaSeconds: 600 },
    { id: 'e', status: 'evaluated', sla: '已完成' },
  ]
  assert.deepEqual(initialSlaTimers(rows), { a: 180, b: 330 })
  assert.equal(tickSlaTimers({ a: 1, b: 0 }).a, 0)
  const stopped = stopSlaTimer({ a: 10, b: 20 }, 'a')
  assert.deepEqual(stopped, { b: 20 })
  assert.equal(stopSlaTimer(stopped, 'missing'), stopped)
})

test('layered ordering: handling first by remaining reply time, then queued, ended last by recency', () => {
  const list = [
    { id: 'ended-old', status: 'ended', endedAt: '2026-08-18 09:00', slaSeconds: 600 },
    { id: 'queued-b', status: 'queued', slaSeconds: 540 },
    { id: 'human-b', status: 'human', slaSeconds: 300 },
    { id: 'evaluated', status: 'evaluated', endedAt: '2026-08-19 10:00', slaSeconds: 600 },
    { id: 'ended-new', status: 'ended', endedAt: '2026-08-19 12:00', slaSeconds: 600 },
    { id: 'human-a', status: 'human', slaSeconds: 120 },
    { id: 'ai', status: 'ai', sla: '—' },
    { id: 'queued-a', status: 'queued', slaSeconds: 60 },
    { id: 'human-untimed', status: 'human' },
  ]
  const sorted = sortConversationsByStage(list)
  assert.deepEqual(sorted.map((row) => row.id), [
    'human-a', 'human-b', 'human-untimed', 'ai',
    'queued-a', 'queued-b',
    'ended-new', 'evaluated', 'ended-old',
  ])
  assert.equal(formatSlaSeconds(125), '02:05')
})
