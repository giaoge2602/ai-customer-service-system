// 三个端的可观测性日志演示数据：平台「系统日志」、机构「操作日志」、工作台「服务日志」。
// 统一行结构便于同一组件渲染与过滤：
//   { id, time, level: 'info'|'warning'|'error', scope, event, actor, traceId, detail }

export const LEVEL_TEXT = { info: '信息', warning: '警告', error: '错误' }

export const systemLogs = [
  { id: 'LOG-90214', time: '2026-08-27 14:31', level: 'info', scope: 'API 网关', event: 'REST 接口 P95 延迟 168ms，处于目标水位', actor: 'gateway', traceId: 'trc-8a21c4', detail: '采样窗口 5 分钟内共转发 24,318 个请求，P95 延迟 168ms，较上一窗口下降 6%；慢请求集中在会话历史分页接口，已加入下轮优化清单。' },
  { id: 'LOG-90211', time: '2026-08-27 13:58', level: 'warning', scope: '知识检索 RAG', event: '向量检索超时已自动重试，未影响应答', actor: 'rag-worker-2', traceId: 'trc-77be05', detail: '“售后服务说明”索引分片响应超过 800ms 触发一次重试后恢复；连续失败计数已清零，无需人工介入。' },
  { id: 'LOG-90209', time: '2026-08-27 13:42', level: 'info', scope: '模型中心', event: 'DeepSeek V3 流式调用成功率 99.4%', actor: 'model-proxy', traceId: 'trc-6cf330', detail: '近 1 小时 18,940 次推理调用，平均首 token 420ms；两次网络抖动由备用连接承接，用户侧无感知。' },
  { id: 'LOG-90204', time: '2026-08-27 12:20', level: 'warning', scope: '配额中心', event: 'TENANT-014 今日 Token 用量达到配额 92%', actor: 'quota-service', traceId: 'trc-59af18', detail: '已向该机构管理员推送预警通知；达到 100% 后将自动降级为缓存优先的应答策略并限制批量任务。' },
  { id: 'LOG-90198', time: '2026-08-27 11:37', level: 'error', scope: 'Webhook 出口', event: '事件投递重试 3 次后仍失败，已进入死信队列', actor: 'webhook-dispatcher', traceId: 'trc-47d902', detail: '目标 https://hooks.xinghe-demo.cn/crm 持续返回 503，共积压 5 条 conversation.ended 事件；可在死信面板排查后手动重放。' },
  { id: 'LOG-90186', time: '2026-08-27 10:52', level: 'info', scope: '数据库', event: '例行备份完成，耗时 214 秒', actor: 'scheduler', traceId: 'trc-35b771', detail: '全量快照写入对象存储 backup/mysql-20260827.sql.zst，校验和一致，按保留策略保存 30 天。' },
  { id: 'LOG-90171', time: '2026-08-27 09:46', level: 'warning', scope: 'Web Widget', event: '旧版本 SDK 加载失败率上升至 1.2%', actor: 'edge-cdn', traceId: 'trc-2ef8a3', detail: '部分接入站点仍引用 widget@2.3 的旧资源路径导致加载失败，建议通知对接方升级至 2.6 并失效旧缓存。' },
  { id: 'LOG-90163', time: '2026-08-27 08:30', level: 'info', scope: '认证服务', event: '登录成功率 98.7%，无锁定风暴', actor: 'auth-service', traceId: 'trc-19c6da', detail: '近 24 小时 1,042 次登录尝试，失败 13 次均为密码错误且分散在不同账号，无撞库特征。' },
  { id: 'LOG-90155', time: '2026-08-26 22:04', level: 'error', scope: 'OCR 解析 Worker', event: '内存溢出重启一次，任务已重新入队', actor: 'ocr-worker-1', traceId: 'trc-08dd49', detail: '处理一份 96 页 PDF 时内存达到上限被终止；容器自动拉起后 2 个解析任务转入重试队列并在 4 分钟内完成。' },
  { id: 'LOG-90140', time: '2026-08-26 20:15', level: 'info', scope: '调度中心', event: '夜间批量质检任务启动', actor: 'scheduler', traceId: 'trc-f0012b', detail: '计划抽取昨日 3% 会话执行质检评分，预计 02:00 前完成，结果将同步到服务运营看板。' },
]

export const operationLogs = [
  { id: 'OP-50812', time: '2026-08-27 14:02', level: 'info', scope: '知识库', event: '发布知识文档《退款到账规则 v3.3》', actor: '王敏 · 机构管理员', traceId: 'op-9d31aa', detail: '变更内容：更新预售订单退款时限说明；发布前已完成敏感词与隐私合规检查。' },
  { id: 'OP-50807', time: '2026-08-27 11:48', level: 'info', scope: '客服团队', event: '审核通过并激活新客服账号 lina@xinghe.demo', actor: '王敏 · 机构管理员', traceId: 'op-88cc54', detail: '入职申请经机构管理员审核通过，账号状态置为 active 并加入售后支持组。' },
  { id: 'OP-50801', time: '2026-08-27 10:33', level: 'info', scope: '报表中心', event: '导出本月会话运营日报（XLSX）', actor: '张宁 · 客服主管', traceId: 'op-72b0e9', detail: '包含会话量、首响达标率与满意度分布三类指标；导出文件带水印并受下载权限保护。' },
  { id: 'OP-50795', time: '2026-08-27 09:57', level: 'warning', scope: '账号安全', event: '登录失败 3 次后被临时锁定 10 分钟', actor: '未知 · IP 203.0.113.87', traceId: 'op-61de73', detail: '目标账号 chenzhe@xinghe.demo 密码连续输错触发防爆破策略；来源 IP 此前无登录历史，建议保持关注。' },
  { id: 'OP-50789', time: '2026-08-26 17:21', level: 'info', scope: '客户中心', event: '为客户 CUST-016 打上「高价值」标签', actor: '李楠 · 客服专员', traceId: 'op-55fa30', detail: '依据为其开通专属技术支持通道的处理记录；该标签将影响后续会话的分配权重。' },
  { id: 'OP-50780', time: '2026-08-26 16:05', level: 'info', scope: '渠道接入', event: '暂停企业微信渠道机器人自动应答', actor: '王敏 · 机构管理员', traceId: 'op-4a71c8', detail: '原因：企业微信后台回调地址迁移；期间该渠道进入人工兜底模式，迁移完成后恢复自动应答。' },
  { id: 'OP-50774', time: '2026-08-26 15:40', level: 'error', scope: '开放能力', event: 'Open API 密钥轮换后出现 4 例鉴权失败', actor: '陈哲 · 客服专员', traceId: 'op-39c867', detail: '第三方对接方仍使用已吊销的旧密钥发起请求；已通知对方更换，新密钥流量占比已达 99%。' },
  { id: 'OP-50766', time: '2026-08-26 14:18', level: 'info', scope: '服务运营', event: '调整售前队列 SLA 首响目标为 45 秒', actor: '张宁 · 客服主管', traceId: 'op-204415', detail: '原目标为 60 秒；变更于次日生效，历史统计数据不受影响。' },
]

export const serviceLogs = [
  { id: 'SL-13025', time: '2026-08-27 14:30', level: 'info', scope: '会话 CS-240819-018', event: '李楠接管会话并向客户核对退款订单', actor: '李楠', traceId: 'sv-a81b20', detail: 'AI 兜底摘要随会话一并转交：客户咨询订单 A20260819001 退款进度，因置信度 42% 低于阈值触发转人工。' },
  { id: 'SL-13023', time: '2026-08-27 14:12', level: 'info', scope: '会话 CS-240819-019', event: 'AI 回答命中知识库《私有化部署清单》', actor: 'AI 助手', traceId: 'sv-93cf71', detail: '客户询问企业版部署报价与周期，模型引用 2 条知识生成答复，置信度 66%，暂无需人工介入。' },
  { id: 'SL-13019', time: '2026-08-27 13:26', level: 'warning', scope: '会话 CS-240819-016', event: '会话排队超出 SLA 目标，已升级提醒', actor: 'dispatch-service', traceId: 'sv-7e10ac', detail: '客户等待 6 分 12 秒仍未被接管；系统已在团队看板标记紧急并向值班主管推送提醒。' },
  { id: 'SL-13017', time: '2026-08-27 12:44', level: 'info', scope: '会话 CS-240819-015', event: '会话结束，客户提交 5 星评价', actor: 'AI 助手', traceId: 'sv-65d384', detail: '全流程由 AI 独立解决（修改密码指引），平均响应间隔 18 秒，客户主动结束会话。' },
  { id: 'SL-13014', time: '2026-08-27 11:03', level: 'error', scope: '会话 CS-240819-017', event: '连续 2 条消息发送失败，已自动补发成功', actor: 'IM 网关', traceId: 'sv-50bb92', detail: '网页端 WebSocket 断线导致 2 条客服消息投递超时；网关改用长轮询通道在 9 秒内补发完成，客户端无丢失。' },
  { id: 'SL-13009', time: '2026-08-27 10:26', level: 'info', scope: '会话 CS-240819-013', event: '客服备注保存并关联工单 TK-20260819-024', actor: '张宁', traceId: 'sv-42a5d0', detail: '备注记录数据导出权限确认结论；工单流转至技术支持组继续跟进部署资料准备。' },
  { id: 'SL-13006', time: '2026-08-27 09:41', level: 'warning', scope: '知识引用', event: '两条咨询未命中任何 FAQ 与文档', actor: 'rag-worker-1', traceId: 'sv-30ce67', detail: '问题围绕「发票抬头跨主体变更」，已加入待补充知识清单；同主题重复提问将直接转人工。' },
  { id: 'SL-13002', time: '2026-08-26 18:55', level: 'info', scope: '渠道路径', event: '微信公众号渠道全日接待结束', actor: 'channel-report', traceId: 'sv-188843', detail: '全天 128 个会话，AI 独立解决 79 个、转人工 49 个；高峰时段消息延迟稳定在 400ms 内。' },
]

export function filterLogs(logs, query = '', level = 'all') {
  const keyword = query.trim().toLowerCase()
  if (level === 'all' && !keyword) return logs
  return logs.filter((row) => {
    if (level !== 'all' && row.level !== level) return false
    if (!keyword) return true
    return `${row.id} ${row.time} ${row.scope} ${row.event} ${row.actor} ${row.traceId} ${row.detail}`.toLowerCase().includes(keyword)
  })
}

export function countByLevel(logs) {
  return logs.reduce((acc, row) => ({ ...acc, [row.level]: acc[row.level] + 1 }), { info: 0, warning: 0, error: 0 })
}
