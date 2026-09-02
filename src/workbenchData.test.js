import test from 'node:test'
import assert from 'node:assert/strict'
import { adaptConversation, adaptTeamMember, appendAgentMessage, canReplyTo, conversationsSeed, deriveQueue, deriveAgentWorkload, filterQueueByAgent, formatSlaSeconds, getQueueType, initialSlaTimers, relativeTimeText, sortConversationsByStage, stopSlaTimer, teamSeed, tickSlaTimers, visibleConversations } from './workbenchData.js'

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

// ---------- 真实后端会话 → 看板/工作台视图形状 ----------

/** 一条贴近 GET /api/v1/conversations 真实返回的行 */
const backendRow = (overrides = {}) => ({
  id: 'CONV-abc',
  tenantId: 'TENANT-018',
  customerId: 'C-900',
  channel: 'h5',
  status: 'queued',
  priority: 'high',
  unreadCount: 3,
  lastMessageAt: '2026-09-01T09:59:30.000Z',
  createdAt: '2026-09-01T09:50:00.000Z',
  customerReplyDeadlineAt: '2026-09-01T10:02:00.000Z',
  preview: '我的退款什么时候到账',
  queueType: 'after_sales',
  queueReason: '命中售后业务关键词',
  queueScore: 121,
  agent: null,
  customer: { id: 'C-900', name: '陈斌', level: '访客', source: 'h5', tags: ['退款咨询'], phone: null, email: null },
  ...overrides,
})

test('adaptConversation maps a real backend row into the workbench view shape', () => {
  const now = new Date('2026-09-01T10:00:00.000Z')
  const row = adaptConversation(backendRow(), now)
  assert.equal(row.name, '陈斌')
  assert.equal(row.initials, '陈')
  assert.equal(row.channel, 'H5')
  assert.equal(row.channelKey, 'h5')
  assert.equal(row.statusText, '待接管')
  assert.equal(row.priorityText, '高优先级')
  assert.equal(row.unread, 3)
  assert.equal(row.time, '刚刚')
  assert.equal(row.slaSeconds, 120)
  assert.equal(row.sla, '02:00')
  assert.equal(row.slaLabel, '即将超时')
  assert.equal(row.preview, '我的退款什么时候到账')
  assert.equal(row.assignee, null)
  // 分流字段直接沿用后端，不再本地重算
  assert.equal(row.queueType, 'after_sales')
  assert.equal(row.queueScore, 121)
  assert.deepEqual(row.customer.tags, ['退款咨询'])
})

test('adaptConversation degrades gracefully when optional fields are missing', () => {
  const now = new Date('2026-09-01T10:00:00.000Z')
  const row = adaptConversation(
    backendRow({
      status: 'ai_handling',
      customerReplyDeadlineAt: null,
      preview: '',
      customer: { name: '', level: '访客', source: 'h5', tags: null },
      lastMessageAt: null,
      createdAt: '2026-08-29T10:00:00.000Z',
    }),
    now,
  )
  assert.equal(row.name, '未命名客户')
  assert.equal(row.slaSeconds, null)
  assert.equal(row.sla, '—')
  assert.equal(row.slaRisk, 'safe')
  assert.equal(row.slaLabel, 'AI处理中')
  assert.deepEqual(row.customer.tags, [])
  assert.equal(row.time, '8/29 18:00')
  assert.equal(adaptConversation(null), null)
})

test('adaptConversation normalizes transferred conversations back into the queued lane', () => {
  const row = adaptConversation(backendRow({ status: 'transferred' }), new Date('2026-09-01T10:00:00.000Z'))
  assert.equal(row.status, 'queued')
  assert.equal(row.statusText, '已转接')
})

test('getQueueType prefers the backend queueType over local keyword derivation', () => {
  // 客户等级是 VIP（本地规则会判成售后），但后端权威归类是售前，必须听后端的
  const backendSaysPreSales = getQueueType({
    queueType: 'pre_sales',
    queueReason: '未注册客户产品咨询',
    customer: { level: 'VIP客户', tags: ['退款咨询'] },
    preview: '退款到账没到',
  })
  assert.equal(backendSaysPreSales.key, 'pre_sales')
  assert.equal(backendSaysPreSales.label, '售前队列')
  assert.equal(backendSaysPreSales.reason, '未注册客户产品咨询')
  // 没有后端字段时（演示种子）退回本地派生
  assert.equal(getQueueType({ customer: { level: 'VIP客户' } }).key, 'after_sales')
})

test('deriveQueue exposes queueType on the row so lane filtering actually works', () => {
  const queue = deriveQueue([
    adaptConversation(backendRow({ id: 'A', queueType: 'after_sales', queueScore: 121 })),
    adaptConversation(backendRow({ id: 'B', queueType: 'pre_sales', queueScore: 21, preview: '企业版怎么部署' })),
  ])
  assert.deepEqual(queue.map((row) => row.id), ['A', 'B'])
  // 回归：queueType 曾经只以 key 落在行上，导致看板的售前/售后分栏永远为空
  assert.deepEqual(queue.map((row) => row.queueType), ['after_sales', 'pre_sales'])
  assert.equal(queue.filter((row) => row.queueType === 'after_sales').length, 1)
  assert.equal(queue.filter((row) => row.queueType === 'pre_sales').length, 1)
  // 后端给了 queueScore 就直接用
  assert.deepEqual(queue.map((row) => row.queueScore), [121, 21])
})

test('filterQueueByAgent narrows to the agent lane, and to their own rows without a skill group', () => {
  const queue = deriveQueue([
    adaptConversation(backendRow({ id: 'A', queueType: 'after_sales', queueScore: 121 })),
    adaptConversation(backendRow({ id: 'B', queueType: 'pre_sales', queueScore: 21 })),
    adaptConversation(backendRow({ id: 'C', queueType: 'pre_sales', queueScore: 11, agent: { name: '李楠' } })),
  ])
  const preLane = filterQueueByAgent(queue, { name: '张宁', queueKey: 'pre_sales' })
  assert.deepEqual(preLane.map((row) => row.id), ['B', 'C'])
  // 后端没有技能组时 queueKey 为空，只回该客服名下的会话
  const noSkillGroup = filterQueueByAgent(queue, { name: '李楠', queueKey: null })
  assert.deepEqual(noSkillGroup.map((row) => row.id), ['C'])
})

test('adaptTeamMember maps backend load into the dashboard team row', () => {
  assert.deepEqual(adaptTeamMember({ id: 'U1', name: '李楠', status: 'active', load: 2, maxLoad: 5, tone: 'working', isMe: true }), {
    id: 'U1', name: '李楠', group: '未配置技能组', queueKey: null, queueLabel: '全部队列',
    state: '接待中', tone: 'ready', response: '—', score: '—', shift: '—',
    maxLoad: 5, active: 2, queue: 0, isMe: true,
  })
  assert.equal(adaptTeamMember({ name: '张宁', tone: 'busy', load: 6, maxLoad: 6 }).state, '忙碌')
  assert.equal(adaptTeamMember({ name: '王悦', tone: 'offline', load: 0, maxLoad: 4 }).state, '离线')
  assert.equal(adaptTeamMember({ name: '陈哲', tone: 'ready', load: 0, maxLoad: 5 }).state, '空闲')
})

test('relativeTimeText renders 刚刚 / 分钟前 / 今天 / 月日', () => {
  const now = new Date('2026-09-01T20:00:00')
  assert.equal(relativeTimeText(new Date('2026-09-01T19:59:30').toISOString(), now), '刚刚')
  assert.equal(relativeTimeText(new Date('2026-09-01T19:30:00').toISOString(), now), '30 分钟前')
  assert.equal(relativeTimeText(new Date('2026-09-01T08:05:00').toISOString(), now), '今天 08:05')
  assert.equal(relativeTimeText(new Date('2026-08-25T18:20:00').toISOString(), now), '8/25 18:20')
  assert.equal(relativeTimeText(null, now), '—')
  assert.equal(relativeTimeText('nope', now), '—')
})
