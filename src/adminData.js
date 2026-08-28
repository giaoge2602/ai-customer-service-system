export const platformStats = [
  { label: '机构总数', value: '28', sub: { label: '活跃机构', value: '24', rate: '85.7%' }, tone: 'blue', icon: 'building' },
  { label: '客服总数', value: '156', sub: { label: '在线客服', value: '128', rate: '82.1%' }, tone: 'green', icon: 'users' },
  { label: '今日会话', value: '18,426', sub: { label: '长时会话', value: '23', rate: '0.12%' }, tone: 'purple', icon: 'chat' },
  { label: 'AI 接管率', value: '63.5%', sub: { label: 'AI 解决率', value: '78.4%' }, tone: 'orange', icon: 'spark' },
  { key: 'satisfaction', label: '客户满意度', tone: 'blue', icon: 'star' },
]

export const dashboardTrend = [
  { label: '8/20', conversations: 14200, agents: 132, orgs: 26, activeOrgs: 22 },
  { label: '8/21', conversations: 15800, agents: 140, orgs: 27, activeOrgs: 23 },
  { label: '8/22', conversations: 13600, agents: 125, orgs: 27, activeOrgs: 23 },
  { label: '8/23', conversations: 16900, agents: 148, orgs: 27, activeOrgs: 24 },
  { label: '8/24', conversations: 17500, agents: 152, orgs: 28, activeOrgs: 24 },
  { label: '8/25', conversations: 16200, agents: 138, orgs: 28, activeOrgs: 24 },
  { label: '今天', conversations: 18426, agents: 156, orgs: 28, activeOrgs: 24 },
]

export const dashboardAlerts = [
  { label: '8/20', warnings: 3, errors: 1, resolved: 2 },
  { label: '8/21', warnings: 2, errors: 0, resolved: 3 },
  { label: '8/22', warnings: 4, errors: 2, resolved: 3 },
  { label: '8/23', warnings: 1, errors: 0, resolved: 1 },
  { label: '8/24', warnings: 3, errors: 1, resolved: 3 },
  { label: '8/25', warnings: 2, errors: 1, resolved: 2 },
  { label: '今天', warnings: 3, errors: 1, resolved: 1 },
]

export const todayRealtime = { orgs: 28, activeOrgs: 24, newOrgs7d: 3, pendingOrgs: 1, agents: 156, onlineAgents: 128, conversations: 18426, aiHandled: 11682 }

export const channelShare = [
  { label: 'Web Widget', value: 8286, color: '#4163cb', change: 3.4 },
  { label: '微信公众号', value: 5124, color: '#22835d', change: 1.8 },
  { label: '企业微信', value: 3212, color: '#7656c9', change: -1.2 },
  { label: 'Open API', value: 1804, color: '#b6791a', change: 0.8 },
]

export const tokenTrend = [
  { label: '8/20', value: 38.2 },
  { label: '8/21', value: 41.5 },
  { label: '8/22', value: 36.8 },
  { label: '8/23', value: 44.1 },
  { label: '8/24', value: 46.3 },
  { label: '8/25', value: 42.8 },
  { label: '今天', value: 48.6 },
]

export const platformTrend = {
  labels: ['8/20', '8/21', '8/22', '8/23', '8/24', '8/25', '今天'],
  conversations: [14200, 15800, 13600, 16900, 17500, 16200, 18426],
  newOrgs: [1, 0, 1, 0, 1, 0, 3],
  aiRate: [72.4, 73.5, 71.8, 75.0, 76.2, 77.1, 78.4],
}

export const platformTodos = [
  { id: 'todo-1', tag: '入驻审核', text: '远航物流入驻资料待审核', count: '1 条', tone: 'warning' },
  { id: 'todo-2', tag: '停用处理', text: '北辰医疗已停用，配额待释放', count: '1 条', tone: 'danger' },
  { id: 'todo-3', tag: 'SLA 风险', text: '会话即将触发 SLA 超时', count: '2 个', tone: 'danger' },
  { id: 'todo-4', tag: '知识库', text: '知识文档待审核发布', count: '1 篇', tone: 'warning' },
  { id: 'todo-5', tag: '渠道配置', text: 'Open API 渠道待完成配置', count: '1 项', tone: 'muted' },
]

export const monitoredConversations = [
  {
    id: 'CS-240826-001',
    customer: '林晓雨',
    agent: '李楠',
    status: 'abnormal',
    statusText: '超时预警',
    startTime: '10:23',
    duration: '45 分钟',
    messages: 12,
    lastMessage: '客户询问退款进度，客服正在查询...',
    channel: 'Web Widget',
  },
  {
    id: 'CS-240826-002',
    customer: '周明远',
    agent: '张宁',
    status: 'normal',
    statusText: '正常',
    startTime: '11:05',
    duration: '18 分钟',
    messages: 8,
    lastMessage: '客户咨询产品功能，客服已解答',
    channel: '微信公众号',
  },
  {
    id: 'CS-240826-003',
    customer: '赵可欣',
    agent: '周启明',
    status: 'abnormal',
    statusText: '情绪激动',
    startTime: '11:32',
    duration: '28 分钟',
    messages: 15,
    lastMessage: '客户投诉服务态度，要求主管介入',
    channel: '企业微信',
  },
  {
    id: 'CS-240826-004',
    customer: '王若琳',
    agent: '李楠',
    status: 'normal',
    statusText: '正常',
    startTime: '12:10',
    duration: '12 分钟',
    messages: 6,
    lastMessage: '客户咨询订单状态，已处理完成',
    channel: 'Web Widget',
  },
]

export const conversationMessages = {
  'CS-240826-001': [
    { sender: 'customer', name: '林晓雨', text: '你好，我想问一下退款什么时候到账？', time: '10:23' },
    { sender: 'agent', name: '李楠', text: '您好，请稍等，我帮您查询一下。', time: '10:24' },
    { sender: 'agent', name: '李楠', text: '您的退款申请已经在处理中，预计 3-5 个工作日到账。', time: '10:26' },
    { sender: 'customer', name: '林晓雨', text: '可是我已经等了 7 天了，还没收到。', time: '10:28' },
    { sender: 'agent', name: '李楠', text: '非常抱歉给您带来不便，我帮您核实一下具体情况。', time: '10:30' },
    { sender: 'customer', name: '林晓雨', text: '能不能尽快处理？我急需用钱。', time: '10:32' },
    { sender: 'agent', name: '李楠', text: '理解您的心情，我已经加急处理，会尽快给您反馈。', time: '10:35' },
    { sender: 'customer', name: '林晓雨', text: '好的，谢谢。', time: '10:36' },
  ],
  'CS-240826-002': [
    { sender: 'customer', name: '周明远', text: '你好，我想了解一下你们的产品功能。', time: '11:05' },
    { sender: 'agent', name: '张宁', text: '您好！很高兴为您介绍。我们的产品包含会话管理、知识库、AI 辅助等功能。', time: '11:06' },
    { sender: 'customer', name: '周明远', text: 'AI 辅助具体能做什么？', time: '11:08' },
    { sender: 'agent', name: '张宁', text: 'AI 可以自动回答常见问题、辅助客服回复、智能路由分配等。', time: '11:10' },
  ],
  'CS-240826-003': [
    { sender: 'customer', name: '赵可欣', text: '你们的客服态度太差了！', time: '11:32' },
    { sender: 'agent', name: '周启明', text: '非常抱歉给您带来不好的体验，请问具体是什么情况？', time: '11:33' },
    { sender: 'customer', name: '赵可欣', text: '上次咨询问题，客服爱答不理的！', time: '11:35' },
    { sender: 'agent', name: '周启明', text: '我理解您的感受，我会记录并反馈给相关部门。', time: '11:37' },
    { sender: 'customer', name: '赵可欣', text: '我要找你们主管！', time: '11:40' },
  ],
  'CS-240826-004': [
    { sender: 'customer', name: '王若琳', text: '你好，我的订单发货了吗？', time: '12:10' },
    { sender: 'agent', name: '李楠', text: '您好，我帮您查询一下订单状态。', time: '12:11' },
    { sender: 'agent', name: '李楠', text: '您的订单已经发货，预计明天送达。', time: '12:13' },
    { sender: 'customer', name: '王若琳', text: '好的，谢谢！', time: '12:14' },
  ],
}

export const realtimeMetrics = {
  activeConversations: 47,
  queueLength: 3,
  onlineAgents: 128,
  busyAgents: 89,
  idleAgents: 39,
  avgResponseTime: 42,
  todayConversations: 18426,
  aiResolution: 78.4,
  satisfaction: 4.72,
  hourlyTrend: [
    { hour: '08:00', value: 420 },
    { hour: '09:00', value: 680 },
    { hour: '10:00', value: 920 },
    { hour: '11:00', value: 1150 },
    { hour: '12:00', value: 980 },
    { hour: '13:00', value: 1280 },
    { hour: '14:00', value: 1420 },
  ],
}

export const alertList = [
  { id: 'ALT-001', severity: 'critical', title: 'SLA 超时预警', description: 'CS-240826-001 会话已超时 15 分钟', org: '星河科技', time: '2 分钟前', status: 'active' },
  { id: 'ALT-002', severity: 'warning', title: '配额使用告警', description: '北辰医疗 Token 配额使用达到 92%', org: '北辰医疗', time: '18 分钟前', status: 'active' },
  { id: 'ALT-003', severity: 'warning', title: '客服离线告警', description: '客服陈思远已离线超过 30 分钟', org: '星河科技', time: '32 分钟前', status: 'active' },
  { id: 'ALT-004', severity: 'info', title: '系统维护通知', description: '计划于今晚 23:00 进行系统维护', org: '全平台', time: '1 小时前', status: 'active' },
  { id: 'ALT-005', severity: 'critical', title: '客户情绪激动', description: 'CS-240826-003 客户投诉，要求主管介入', org: '星河科技', time: '45 分钟前', status: 'acknowledged' },
  { id: 'ALT-006', severity: 'warning', title: '知识库命中率下降', description: '过去 1 小时命中率降至 85%', org: '云杉零售', time: '1 小时前', status: 'resolved' },
]

export const orgActivityData = [
  { id: 'TENANT-018', name: '星河科技', activity: 92, orderCompletion: 96.8, conversations: 2846, satisfaction: 4.8, reviewCount: 523 },
  { id: 'TENANT-017', name: '云杉零售', activity: 87, orderCompletion: 94.2, conversations: 1920, satisfaction: 4.6, reviewCount: 342 },
  { id: 'TENANT-016', name: '远航物流', activity: 0, orderCompletion: 0, conversations: 0, satisfaction: 0, reviewCount: 0 },
  { id: 'TENANT-015', name: '木棉教育', activity: 78, orderCompletion: 91.5, conversations: 638, satisfaction: 4.5, reviewCount: 198 },
  { id: 'TENANT-014', name: '北辰医疗', activity: 18, orderCompletion: 72.3, conversations: 124, satisfaction: 3.9, reviewCount: 141 },
]

export const organizationStats = [
  { label: '今日会话', value: '2,846', delta: '+12.6% 较昨日', tone: 'blue', icon: 'chat' },
  { label: 'AI 自助解决率', value: '82.6%', delta: '+5.8% 本周', tone: 'purple', icon: 'spark' },
  { label: 'SLA 达成率', value: '96.8%', delta: '高于目标 1.8%', tone: 'green', icon: 'clock' },
  { label: '客户满意度', value: '4.72', delta: '基于 1,204 条评价', tone: 'orange', icon: 'star' },
]

export const tenants = [
  { id: 'TENANT-018', name: '星河科技', industry: '企业软件', plan: '企业版', status: 'active', statusText: '运行中', agents: '48 / 60', conversations: '2,846', usage: 80, lastActive: '刚刚' },
  { id: 'TENANT-017', name: '云杉零售', industry: '零售电商', plan: '专业版', status: 'active', statusText: '运行中', agents: '24 / 30', conversations: '1,920', usage: 72, lastActive: '2 分钟前' },
  { id: 'TENANT-016', name: '远航物流', industry: '物流服务', plan: '专业版', status: 'review', statusText: '待审核', agents: '—', conversations: '—', usage: 0, lastActive: '今天 09:24' },
  { id: 'TENANT-015', name: '木棉教育', industry: '在线教育', plan: '基础版', status: 'active', statusText: '运行中', agents: '12 / 15', conversations: '638', usage: 61, lastActive: '8 分钟前' },
  { id: 'TENANT-014', name: '北辰医疗', industry: '医疗健康', plan: '企业版', status: 'paused', statusText: '已停用', agents: '0 / 40', conversations: '—', usage: 18, lastActive: '昨天 18:42' },
]

export const models = [
  { id: 'model-1', name: 'DeepSeek V3', provider: 'DeepSeek', mode: '云端 API', status: 'active', statusText: '生产中', version: 'v3.1', usage: '42.8M', latency: '1.8s', isDefault: true },
  { id: 'model-2', name: '通义千问 Max', provider: '阿里云', mode: '云端 API', status: 'standby', statusText: '备用模型', version: 'qwen-max', usage: '12.4M', latency: '2.1s', isDefault: false },
  { id: 'model-3', name: '星河私有模型', provider: '星河科技', mode: '私有化部署', status: 'testing', statusText: '灰度测试', version: '2026.08.1', usage: '3.2M', latency: '0.9s', isDefault: false },
]

export const auditLogs = [
  { id: 'AUD-98241', actor: '王敏', role: '超级管理员', action: '更新模型路由策略', target: 'DeepSeek V3', time: '2026-08-19 14:28', risk: 'low', riskText: '正常' },
  { id: 'AUD-98240', actor: '系统', role: '自动策略', action: '拦截敏感内容生成', target: '会话 CS-240819-016', time: '2026-08-19 14:16', risk: 'high', riskText: '高风险' },
  { id: 'AUD-98239', actor: '李楠', role: '客服专员', action: '查看客户脱敏档案', target: '客户 C-01842', time: '2026-08-19 14:02', risk: 'low', riskText: '正常' },
  { id: 'AUD-98238', actor: '赵宁', role: '机构管理员', action: '导出运营报表', target: '星河科技 / 近 7 日', time: '2026-08-19 13:48', risk: 'medium', riskText: '需关注' },
]

export const services = [
  { name: '消息 API', key: 'api', value: '99.99%', status: 'healthy', statusText: '运行正常', latency: '128 ms' },
  { name: 'Socket 实时通道', key: 'socket', value: '99.98%', status: 'healthy', statusText: '运行正常', latency: '46 ms' },
  { name: '知识检索服务', key: 'rag', value: '99.94%', status: 'warning', statusText: '延迟升高', latency: '680 ms' },
  { name: 'Webhook 投递', key: 'webhook', value: '99.97%', status: 'healthy', statusText: '运行正常', latency: '210 ms' },
]

export const agents = [
  { id: 'AG-001', name: '李楠', initials: '李', role: '客服专员', status: 'online', statusText: '在线', groups: ['售后支持', 'VIP客服'], sessions: 28, response: '42s', satisfaction: '4.9' },
  { id: 'AG-002', name: '张宁', initials: '张', role: '客服主管', status: 'online', statusText: '在线', groups: ['技术支持', '投诉处理'], sessions: 21, response: '55s', satisfaction: '4.8' },
  { id: 'AG-003', name: '周启明', initials: '周', role: '客服专员', status: 'busy', statusText: '忙碌', groups: ['售前咨询'], sessions: 34, response: '1m 12s', satisfaction: '4.6' },
  { id: 'AG-004', name: '陈思远', initials: '陈', role: '客服专员', status: 'offline', statusText: '离线', groups: ['售后支持'], sessions: 0, response: '—', satisfaction: '4.7' },
]

export const customers = [
  { id: 'C-01842', name: '林晓雨', level: 'VIP客户', source: '微信', phone: '138****8000', tags: ['退款咨询', '高价值'], sessions: 8, last: '刚刚', privacy: '已授权' },
  { id: 'C-01841', name: '周明远', level: '普通客户', source: '网页', phone: '139****4218', tags: ['售前咨询'], sessions: 3, last: '2 分钟前', privacy: '已授权' },
  { id: 'C-01840', name: '赵可欣', level: '高价值客户', source: '企业微信', phone: '186****0932', tags: ['投诉客户'], sessions: 12, last: '5 分钟前', privacy: '待确认' },
  { id: 'C-01839', name: '王若琳', level: '普通客户', source: 'API', phone: '133****6012', tags: ['售后咨询'], sessions: 2, last: '今天 13:42', privacy: '已授权' },
]

export const knowledgeDocs = [
  { id: 'KB-1042', name: '退款到账规则 v3.2', type: 'FAQ', status: 'published', statusText: '已发布', chunks: 42, hitRate: '94.2%', updated: '今天 11:20' },
  { id: 'KB-1041', name: '企业版产品手册', type: '文档', status: 'published', statusText: '已发布', chunks: 186, hitRate: '88.6%', updated: '昨天 16:45' },
  { id: 'KB-1040', name: '售后服务说明（新版）', type: '网页', status: 'review', statusText: '待审核', chunks: 28, hitRate: '—', updated: '今天 09:12' },
  { id: 'KB-1039', name: 'API 错误码结构化数据', type: '结构化数据', status: 'processing', statusText: '处理中', chunks: 0, hitRate: '—', updated: '刚刚' },
]

export const channels = [
  { id: 'CH-01', name: 'Web Widget', description: '官网嵌入式客服', status: 'connected', statusText: '已连接', conversations: '1,286', updated: '今天 14:28' },
  { id: 'CH-02', name: '微信公众号', description: '公众号消息接入', status: 'connected', statusText: '已连接', conversations: '824', updated: '今天 14:27' },
  { id: 'CH-03', name: '企业微信', description: '外部联系人客服', status: 'connected', statusText: '已连接', conversations: '512', updated: '今天 14:26' },
  { id: 'CH-04', name: 'Open API', description: '第三方系统接入', status: 'warning', statusText: '待配置', conversations: '224', updated: '昨天 18:20' },
]

export const routingRules = [
  { id: 'RT-001', name: '退款与售后', intent: 'refund', group: '售后支持', threshold: 72, fallback: '转人工', enabled: true, hits: '1,248' },
  { id: 'RT-002', name: '技术故障', intent: 'technical', group: '技术支持', threshold: 80, fallback: '创建工单', enabled: true, hits: '682' },
  { id: 'RT-003', name: '投诉与升级', intent: 'complaint', group: '投诉处理', threshold: 65, fallback: '主管接管', enabled: true, hits: '126' },
  { id: 'RT-004', name: '闲聊与其他', intent: 'other', group: '售前咨询', threshold: 55, fallback: '追问澄清', enabled: false, hits: '392' },
]

// ==================== 机构维度实时数据（机构运营大屏） ====================

export const orgRealtime = {
  activeConversations: 23,
  queueLength: 2,
  totalAgents: 16,
  onlineAgents: 12,
  busyAgents: 8,
  idleAgents: 4,
  avgResponseTime: 41,
  aiResolution: 82.6,
}

export const orgTodayRealtime = {
  queued: 6,
  handling: 12,
  todayConversations: 2846,
  aiHandled: 2352,
  aiRate: 82.6,
  avgResponse: '41 秒',
  satisfaction: 4.72,
}

export const orgChannelShare = [
  { label: 'Web Widget', value: 1184, color: '#4163cb', change: 2.6 },
  { label: '微信公众号', value: 742, color: '#22835d', change: 1.1 },
  { label: '企业微信', value: 486, color: '#7656c9', change: -0.9 },
  { label: 'Open API', value: 434, color: '#b6791a', change: 1.4 },
]

export const orgTokenTrend = [
  { label: '8/20', value: 9.2 },
  { label: '8/21', value: 10.5 },
  { label: '8/22', value: 9.6 },
  { label: '8/23', value: 11.4 },
  { label: '8/24', value: 12.1 },
  { label: '8/25', value: 11.0 },
  { label: '今天', value: 12.8 },
]

export const orgRealtimeAlerts = [
  { label: '8/20', warnings: 3, errors: 1, resolved: 2 },
  { label: '8/21', warnings: 2, errors: 0, resolved: 3 },
  { label: '8/22', warnings: 4, errors: 1, resolved: 2 },
  { label: '8/23', warnings: 1, errors: 0, resolved: 2 },
  { label: '8/24', warnings: 3, errors: 1, resolved: 2 },
  { label: '8/25', warnings: 2, errors: 0, resolved: 3 },
  { label: '今天', warnings: 3, errors: 1, resolved: 1 },
]

/** 机构客服负载分布（全屏大屏板块） */
export const orgAgentLoad = [
  { name: '李楠', value: 5, max: 6, tone: 'busy' },
  { name: '张宁', value: 6, max: 6, tone: 'busy' },
  { name: '陈哲', value: 4, max: 5, tone: 'ready' },
  { name: '周启明', value: 3, max: 5, tone: 'ready' },
  { name: '王悦', value: 0, max: 4, tone: 'offline' },
]
