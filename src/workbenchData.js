export const conversationsSeed = [
  { customerId: 'CUST-018', tenantId: 'TENANT-018', id: 'CS-240819-018', name: '林晓雨', initials: '林', channel: '微信', channelKey: 'wechat', status: 'queued', statusText: '待接管', priority: 'high', priorityText: '高优先级', unread: 2, time: '刚刚', sla: '03:42', slaLabel: '即将超时', slaRisk: 'warning', preview: '我想确认一下退款什么时候到账…', tone: 'blue', customer: { level: 'VIP 客户', source: '微信公众号', phone: '138****8000', email: 'lin.x***@mail.com', lastSeen: '今天 14:28', satisfaction: '—', tags: ['VIP客户', '退款咨询'] }, handoff: { reason: '连续 2 次未命中知识库', confidence: 42, summary: '客户希望确认订单 A20260819001 的退款到账时间。AI 已尝试查询退款规则，但缺少订单系统实时数据。', next: '核对订单状态后告知预计到账时间。', citations: ['退款到账规则 v3.2', '售后服务说明'] }, messages: [{ id: 1, from: 'system', text: 'AI 已将会话转入人工队列', time: '14:25' }, { id: 2, from: 'customer', text: '你好，我想确认一下退款什么时候能到账？', time: '14:25' }, { id: 3, from: 'ai', text: '您好，退款到账时间通常为 3–5 个工作日。为了帮您确认具体进度，可以提供订单号吗？', time: '14:26', confidence: 86, citations: ['退款到账规则 v3.2'] }, { id: 4, from: 'customer', text: '订单号是 A20260819001，已经等了四天了。', time: '14:27' }, { id: 5, from: 'ai', text: '我暂时无法查询该订单的实时状态，正在为您转接人工客服。', time: '14:28', confidence: 42 }] },
  { customerId: 'CUST-017', tenantId: 'TENANT-018', id: 'CS-240819-017', name: '周明远', initials: '周', channel: '网页', channelKey: 'web', status: 'human', statusText: '处理中', priority: 'normal', priorityText: '普通', unread: 1, time: '2 分钟前', sla: '08:15', slaLabel: '正常', slaRisk: 'safe', preview: '好的，那我需要准备哪些材料？', tone: 'purple', customer: { level: '普通客户', source: '官网 Widget', phone: '139****4218', email: 'zhou.m***@mail.com', lastSeen: '今天 14:21', satisfaction: '—', tags: ['售前咨询'] }, handoff: { reason: '客户主动要求人工', confidence: 78, summary: '客户正在咨询企业版部署所需材料，已完成基础产品介绍。', next: '发送企业版资料清单。', citations: ['企业版产品手册'] }, messages: [{ id: 1, from: 'customer', text: '你们的企业版支持私有化部署吗？', time: '14:17' }, { id: 2, from: 'agent', text: '支持的，我们提供独立部署和混合部署两种模式。', time: '14:19' }, { id: 3, from: 'customer', text: '好的，那我需要准备哪些材料？', time: '14:21' }] },
  { customerId: 'CUST-016', tenantId: 'TENANT-018', id: 'CS-240819-016', name: '赵可欣', initials: '赵', channel: '企业微信', channelKey: 'wecom', status: 'queued', statusText: '排队中', priority: 'urgent', priorityText: '紧急', unread: 4, time: '5 分钟前', sla: '00:58', slaLabel: '已超时', slaRisk: 'danger', preview: '这个问题已经影响到我们的业务了！', tone: 'orange', customer: { level: '高价值客户', source: '企业微信', phone: '186****0932', email: 'zhao.k***@corp.cn', lastSeen: '今天 14:18', satisfaction: '—', tags: ['投诉客户', '高价值'] }, handoff: { reason: '命中投诉与高风险规则', confidence: 31, summary: '客户反馈 API 消息延迟，已影响生产业务，并多次表达不满。', next: '优先安抚客户，创建技术工单并升级主管。', citations: ['服务 SLA 说明', '故障应急预案'] }, messages: [{ id: 1, from: 'customer', text: 'API 消息延迟已经超过 20 分钟了。', time: '14:15' }, { id: 2, from: 'ai', text: '非常抱歉给您带来不便。我将为您转接专属技术支持。', time: '14:16', confidence: 31 }, { id: 3, from: 'customer', text: '这个问题已经影响到我们的业务了！', time: '14:18' }] },
  { customerId: 'CUST-015', tenantId: 'TENANT-018', id: 'CS-240819-015', name: '陈思远', initials: '陈', channel: 'H5', channelKey: 'h5', status: 'ai', statusText: 'AI 接待', priority: 'normal', priorityText: '普通', unread: 0, time: '12 分钟前', sla: '—', slaLabel: 'AI处理中', slaRisk: 'safe', preview: '谢谢，问题已经解决了。', tone: 'green', customer: { level: '新客户', source: 'H5 页面', phone: '177****1182', email: 'chen.s***@mail.com', lastSeen: '今天 14:09', satisfaction: '—', tags: ['新客户'] }, handoff: null, messages: [{ id: 1, from: 'customer', text: '怎么修改登录密码？', time: '14:05' }, { id: 2, from: 'ai', text: '您可以在“设置 > 安全中心 > 修改密码”中完成操作。', time: '14:06', confidence: 96, citations: ['账号安全指南'] }, { id: 3, from: 'customer', text: '谢谢，问题已经解决了。', time: '14:09' }] },
  { customerId: 'CUST-014', tenantId: 'TENANT-018', id: 'CS-240819-014', name: '王若琳', initials: '王', channel: 'API', channelKey: 'api', status: 'ended', statusText: '已结束', priority: 'normal', priorityText: '普通', unread: 0, time: '今天 13:42', sla: '已完成', slaLabel: '已评价', slaRisk: 'safe', preview: '服务很专业，谢谢。', tone: 'pink', customer: { level: '普通客户', source: '第三方 API', phone: '133****6012', email: 'wang.r***@mail.com', lastSeen: '今天 13:42', satisfaction: '5.0', tags: ['售后咨询'] }, handoff: null, messages: [{ id: 1, from: 'customer', text: '发票抬头可以修改吗？', time: '13:34' }, { id: 2, from: 'agent', text: '可以的，请在订单详情中提交发票信息变更申请。', time: '13:36' }, { id: 3, from: 'system', text: '客户已提交 5 星评价：服务很专业，谢谢。', time: '13:42' }] },
  { customerId: 'CUST-013', tenantId: 'TENANT-018', id: 'CS-240819-013', name: '高子涵', initials: '高', channel: '微信', channelKey: 'wechat', status: 'human', statusText: '处理中', priority: 'normal', priorityText: '普通', unread: 0, time: '今天 13:28', sla: '11:20', slaLabel: '正常', slaRisk: 'safe', preview: '我看到啦，感谢你的帮助。', tone: 'teal', customer: { level: '普通客户', source: '微信小程序', phone: '150****7721', email: 'gao.z***@mail.com', lastSeen: '今天 13:28', satisfaction: '—', tags: ['功能咨询'] }, handoff: { reason: '低置信度转人工', confidence: 58, summary: '客户咨询数据导出权限，已确认账户身份。', next: '确认租户套餐与导出权限。', citations: ['权限管理说明'] }, messages: [{ id: 1, from: 'customer', text: '我想导出上个月的会话记录。', time: '13:22' }, { id: 2, from: 'agent', text: '我来帮您确认一下账户权限。', time: '13:25' }, { id: 3, from: 'customer', text: '我看到啦，感谢你的帮助。', time: '13:28' }] },
  { customerId: 'CUST-012', tenantId: 'TENANT-018', id: 'CS-240819-019', name: '周雨桐', initials: '周', channel: '微信', channelKey: 'wechat', status: 'queued', statusText: '待接管', priority: 'normal', priorityText: '普通', unread: 1, time: '8 分钟前', sla: '12:40', slaLabel: '正常', slaRisk: 'safe', preview: '我们想了解企业版私有化部署的报价和部署周期…', tone: 'indigo', customer: { level: '新客户', source: '官网 Widget', phone: '158****3009', email: 'zhou.yt***@corp.cn', lastSeen: '今天 14:10', satisfaction: '—', tags: ['售前咨询', '企业版'] }, handoff: { reason: '售前意向确认', confidence: 66, summary: '客户咨询企业版私有化部署的报价、部署周期与配套服务清单。', next: '发送企业版部署方案与报价区间，预约售前顾问回访。', citations: ['企业版产品手册', '私有化部署清单'] }, messages: [{ id: 1, from: 'customer', text: '你好，我们公司想了解企业版私有化部署的方案。', time: '14:08' }, { id: 2, from: 'ai', text: '您好，企业版支持独立部署与混合部署，我可以为您介绍大致流程和所需材料。', time: '14:09', confidence: 66, citations: ['企业版产品手册'] }, { id: 3, from: 'customer', text: '好的，麻烦发一份部署清单给我。', time: '14:10' }] },
]

const assignmentByConversation = {
  'CS-240819-017': '李楠',
  'CS-240819-016': '张宁',
  'CS-240819-015': '陈哲',
  'CS-240819-014': '李楠',
  'CS-240819-013': '张宁',
  'CS-240819-019': '陈哲',
}

export function getConversationAssignment(conversation) {
  return conversation.assignee || assignmentByConversation[conversation.id] || null
}

/**
 * 客服团队队列选项模型（用于客服看板「团队工作负载 ↔ 分流接待队列」联调）。
 * queueKey 表示该客服承接的分流队列：
 *   - after_sales：售后队列（已购客户优先保障）
 *   - pre_sales ：售前队列（未注册客户产品咨询）
 *   - escalation：投诉升级专线（承接售后队列中的高风险会话）
 */
export const teamSeed = [
  { name: '李楠', group: '售后支持', queueKey: 'after_sales', queueLabel: '售后队列', state: '空闲', tone: 'ready', response: '38 秒', score: '4.9', shift: '早班 09:00-18:00', maxLoad: 6 },
  { name: '张宁', group: '技术支持', queueKey: 'after_sales', queueLabel: '售后队列 · 技术支持', state: '忙碌', tone: 'busy', response: '51 秒', score: '4.8', shift: '早班 09:00-18:00', maxLoad: 6 },
  { name: '陈哲', group: '售前咨询', queueKey: 'pre_sales', queueLabel: '售前队列', state: '忙碌', tone: 'busy', response: '45 秒', score: '4.7', shift: '晚班 13:00-22:00', maxLoad: 5 },
  { name: '王悦', group: '投诉升级', queueKey: 'escalation', queueLabel: '投诉专线', state: '离线', tone: 'offline', response: '—', score: '4.9', shift: '休息中', maxLoad: 4 },
]

/** 按客服的队列选项过滤分流队列，返回该客服「可承接 + 名下已有」的会话 */
export function filterQueueByAgent(queue, agent) {
  if (!agent) return queue
  const mine = queue.filter((conversation) => conversation.assignee === agent.name)
  if (agent.queueKey === 'escalation') return [...queue.filter((conversation) => conversation.queueType === 'after_sales' && conversation.slaRisk !== 'safe'), ...mine]
  return [...queue.filter((conversation) => conversation.queueType === agent.queueKey), ...mine]
}

const afterSalesTerms = ['退款', '订单', '售后', '故障', '投诉', '发票', '到账', '延迟']
const preSalesTerms = ['企业版', '部署', '支持', '产品', '如何', '功能']

export function getQueueType(conversation) {
  const customer = conversation.customer || {}
  const text = `${customer.level || ''} ${customer.source || ''} ${(customer.tags || []).join(' ')} ${conversation.preview || ''}`
  if (customer.level?.includes('VIP') || customer.level?.includes('高价值') || afterSalesTerms.some((term) => text.includes(term))) {
    return { key: 'after_sales', label: '售后队列', reason: '已注册/已购买客户服务' }
  }
  if (preSalesTerms.some((term) => text.includes(term)) || customer.level?.includes('新客户')) {
    return { key: 'pre_sales', label: '售前队列', reason: '未注册客户产品咨询' }
  }
  return { key: 'pre_sales', label: '售前队列', reason: '临时客户待确认' }
}

export function deriveQueue(conversations) {
  const priorityScore = { urgent: 3, high: 2, normal: 1 }
  const riskScore = { danger: 3, warning: 2, safe: 1 }
  return conversations
    .filter((conversation) => conversation.status === 'queued')
    .map((conversation) => {
      const queueType = getQueueType(conversation)
      return { ...conversation, ...queueType, assignee: getConversationAssignment(conversation), waitLabel: conversation.time, queueScore: (queueType.key === 'after_sales' ? 100 : 0) + (riskScore[conversation.slaRisk] || 1) * 10 + (priorityScore[conversation.priority] || 1) }
    })
    .sort((a, b) => b.queueScore - a.queueScore || b.unread - a.unread)
}

export function deriveAgentWorkload(conversations, agentName) {
  const assigned = conversations.filter((conversation) => getConversationAssignment(conversation) === agentName)
  return { active: assigned.filter((conversation) => ['human', 'ai'].includes(conversation.status)).length, queue: assigned.filter((conversation) => conversation.status === 'queued').length, conversations: assigned }
}

export function deriveCustomerDirectory(conversations, tenantId = null) {
  const scoped = tenantId ? conversations.filter((conversation) => conversation.tenantId === tenantId || !conversation.tenantId) : conversations
  const grouped = new Map()
  scoped.forEach((conversation) => {
    const customerId = conversation.customerId || `CUSTOMER-${conversation.id}`
    const current = grouped.get(customerId)
    const customer = conversation.customer || {}
    const next = {
      id: customerId,
      name: conversation.name,
      initials: conversation.initials,
      tone: conversation.tone,
      level: customer.level || '普通客户',
      source: customer.source || conversation.channel,
      phone: customer.phone || '未提供',
      email: customer.email || '未提供',
      tags: [...new Set(customer.tags || [])],
      channels: [conversation.channel],
      sessionCount: 1,
      satisfaction: customer.satisfaction || '—',
      lastSeen: customer.lastSeen || conversation.time,
      latestConversationId: conversation.id,
      latestStatus: conversation.status,
      latestStatusText: conversation.statusText,
      latestPreview: conversation.preview,
      latestTime: conversation.time,
      conversations: [conversation],
    }
    if (!current) {
      grouped.set(customerId, next)
      return
    }
    current.sessionCount += 1
    current.tags = [...new Set([...current.tags, ...next.tags])]
    current.channels = [...new Set([...current.channels, ...next.channels])]
    current.conversations.push(conversation)
    if (current.satisfaction === '—' && next.satisfaction !== '—') current.satisfaction = next.satisfaction
  })
  return [...grouped.values()]
}
