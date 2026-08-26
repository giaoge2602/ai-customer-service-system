/**
 * AI 一键接管 · 服务层
 * ------------------------------------------------------------
 * 职责：为客服会话工作台提供「AI 接管」能力。
 *  - 当前 provider 为 local-mock：本地模拟引擎，开箱即用（演示可跑通）
 *  - 接入真实大模型时：将 AI_TAKEOVER.provider 改为 backend-proxy 或 openai-compatible，
 *    并实现 requestAiReplyRemote() 中的 fetch 调用即可，调用方无需改动。
 */

export const AI_TAKEOVER = {
  /** 总开关：false 时 requestAiReply 直接返回 null，前端按钮可据此禁用 */
  enabled: true,
  /** local-mock（本地模拟） | backend-proxy（走后端 /api/v1/ai/chat 代理） | openai-compatible（直连 OpenAI 兼容协议） */
  provider: 'local-mock',
  /** 预留：后端大模型代理地址（NestJS 侧实现 /api/v1/ai/chat 后放开） */
  apiUrl: '/api/v1/ai/chat',
  /** 模拟回复延迟 ms（接入真实模型后通常由网络耗时决定，可忽略） */
  replyDelay: 900,
}

/** 接管触发原因 → 系统提示文案（会插入消息流告知客户） */
export function buildAiSystemNote(reason = 'ai_takeover', agentName = '') {
  const map = {
    ai_takeover: 'AI 已接管本次会话（客服暂时繁忙），后续消息由 AI 实时回复，您的问题将得到持续跟进。',
    off_hours: '当前为非工作时间，AI 已接管本次会话，您的消息将由 AI 智能助手实时回复。',
    rest: '客服已休息，AI 已接管本次会话，您的消息将由 AI 智能助手实时回复。',
    overload: '客服当前接待繁忙，AI 已临时接管，正在为您实时解答。',
  }
  return map[reason] || map.ai_takeover
}

/** 本地模拟回复：基于接管摘要 / 队列类型 / 优先级生成贴合上下文的回复 */
function mockReply({ conversation, reason }) {
  const next = conversation.handoff?.next || ''
  const summary = conversation.handoff?.summary || conversation.preview || ''
  const priority = conversation.priority
  const queueKey = conversation.queueType
  const name = conversation.name || '您'

  const openers = {
    urgent: `${name}，非常抱歉给您带来不便。`,
    high: `${name}，您好，我已在同步处理您的问题。`,
    normal: `${name}，您好，我是 AI 智能助手。`,
  }
  const opener = openers[priority] || openers.normal

  if (next) {
    const actions = next.split(/[，。；]/).filter(Boolean).slice(0, 2).join('，')
    return `${opener}已为您记录：${actions}。我这边先同步处理，稍后如有进展会第一时间告知您。`
  }

  if (queueKey === 'after_sales') {
    return `${opener}已确认您的售后诉求（${summary.slice(0, 24)}）。我正在为您核对处理进度，会优先保障您的问题尽快解决。`
  }
  if (queueKey === 'pre_sales') {
    return `${opener}正在为您整理产品与部署相关信息（${summary.slice(0, 24)}）。您也可以随时补充具体需求，我会同步给您更详细的方案。`
  }
  return `${opener}已收到您的消息（${summary.slice(0, 24)}），我正在为您跟进处理，请稍候。`
}

/**
 * 获取 AI 接管回复。
 * @param {object} options
 * @param {object} options.conversation 当前会话对象
 * @param {string} [options.reason] 接管原因（ai_takeover / off_hours / rest / overload）
 * @param {string} [options.token] 后端会话 Token（接入后端代理时使用）
 * @returns {Promise<string>} 返回 AI 回复文本；开关关闭时 resolve(null)
 */
export async function requestAiReply({ conversation, reason = 'ai_takeover', token = '' }) {
  if (!AI_TAKEOVER.enabled) return null

  if (AI_TAKEOVER.provider === 'backend-proxy') {
    return requestAiReplyRemote({ conversation, reason, token })
  }
  // local-mock：模拟网络延迟，返回本地生成的回复
  await new Promise((resolve) => setTimeout(resolve, AI_TAKEOVER.replyDelay))
  return mockReply({ conversation, reason })
}

/**
 * 真实大模型接入示例（后端代理方式）：
 * 后端 NestJS 需提供 POST /api/v1/ai/chat，转发到 DeepSeek / 通义千问等大模型，
 * 并携带会话历史与系统提示词。接入时把 AI_TAKEOVER.provider 改为 'backend-proxy'。
 */
async function requestAiReplyRemote({ conversation, reason, token }) {
  const messages = (conversation.messages || [])
    .filter((message) => ['customer', 'agent', 'ai'].includes(message.from))
    .map((message) => ({
      role: message.from === 'customer' ? 'user' : 'assistant',
      content: message.text,
    }))
  const response = await fetch(AI_TAKEOVER.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      conversationId: conversation.id,
      reason,
      messages,
      system: '你是星河智能客服系统的 AI 客服，请基于上下文与知识库实时回复客户。',
    }),
  })
  if (!response.ok) throw new Error(`AI 接管接口异常：HTTP ${response.status}`)
  const data = await response.json()
  return data.reply || data.content || '抱歉，我暂时无法回答，正在为您转接人工客服。'
}
