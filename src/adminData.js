export const platformStats = [
  { label: '机构总数', value: '28', delta: '+3 本月', tone: 'blue', icon: 'building' },
  { label: '在线租户', value: '24', delta: '85.7% 在线率', tone: 'green', icon: 'pulse' },
  { label: '今日会话', value: '18,426', delta: '+12.8% 较昨日', tone: 'purple', icon: 'chat' },
  { label: '全局 AI 解决率', value: '78.4%', delta: '+4.2% 本周', tone: 'orange', icon: 'spark' },
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
