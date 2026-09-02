/**
 * 客服窗口 · 多端对话客户端 SDK（免登录访客）
 * ------------------------------------------------------------
 * 职责：为 Web / H5 / 小程序提供一个与后端独立、可注入 token 的对话客户端。
 *  - 访客 session 存在**独立 localStorage key**，绝不写入共享的 `ai-customer-service-session`，
 *    因此不会覆盖坐席/管理员登录态，也不依赖 `api.js` 的 `readAccessToken`。
 *  - REST 层复用 `conversationApi.js` 导出的纯函数 `normalizeMessage` / `normalizeConversation`
 *    做后端 DTO → 前端视图模型的映射；实时层复用 `conversationRealtime.js`。
 *  - 用法：
 *      const session = await ensureGuestSession({ tenantId, channel })
 *      const client = createChatClient({ getToken: () => session.accessToken, channel: session.channel })
 *      const conv = await client.rest.createOrResumeConversation({ firstMessage })
 *      const rt = client.openRealtime(conv.id)
 *      rt.subscribe('message.created', handler)
 */

import {
  normalizeConversation,
  normalizeMessage,
} from './conversationApi.js'
import { createConversationRealtime } from './conversationRealtime.js'

export const GUEST_STORAGE_KEY = 'ai-customer-service-guest'
const API_BASE = '/api/v1'
const GUEST_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 与后端 JWT 默认 7d 对齐

/** 小程序等无 crypto.randomUUID 环境的 UUID 降级 */
export function newClientSessionId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  return query.size ? `${path}?${query}` : path
}

/** 读访客本地 session（独立 key） */
export function readGuestSession(storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage?.getItem(GUEST_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

/** 写访客本地 session（独立 key） */
export function writeGuestSession(session, storage = globalThis.localStorage) {
  storage?.setItem(GUEST_STORAGE_KEY, JSON.stringify(session))
  return session
}

function conversationScopeKey(tenantId, channel) {
  return `${tenantId}:${channel || 'web'}`
}

/** 按租户与渠道记住当前会话，刷新页面后优先恢复到同一条对话。 */
export function readGuestConversationId(
  { tenantId, channel = 'web' },
  storage = globalThis.localStorage,
) {
  const session = readGuestSession(storage)
  return session?.conversationIds?.[conversationScopeKey(tenantId, channel)] || null
}

export function writeGuestConversationId(
  { tenantId, channel = 'web', conversationId },
  storage = globalThis.localStorage,
) {
  const session = readGuestSession(storage) || {}
  const key = conversationScopeKey(tenantId, channel)
  const conversationIds = { ...(session.conversationIds || {}) }
  if (conversationId) conversationIds[key] = conversationId
  else delete conversationIds[key]
  writeGuestSession({ ...session, conversationIds }, storage)
  return conversationId || null
}

/** 优先恢复仍在服务中的会话；没有活动会话时保留最近一次历史记录。 */
export function selectGuestConversationToRestore(items = []) {
  return items.find((item) => ['queued', 'human', 'ai_handling'].includes(item.status))
    || items[0]
    || null
}

/** 读取或生成并持久化当前设备的 clientSessionId（幂等键） */
export function obtainClientSessionId(storage = globalThis.localStorage) {
  const existing = readGuestSession(storage)?.clientSessionId
  if (existing) return existing
  const next = newClientSessionId()
  writeGuestSession({ clientSessionId: next }, storage)
  return next
}

/**
 * 免登录访客：确保拿到有效的 accessToken。
 * - 已有未到期 token 且机构一致 → 直接复用，不发请求
 * - 否则调 POST /api/v1/guest/session 换取，并写入独立 localStorage
 */
export async function ensureGuestSession(
  { tenantId, channel = 'web', name, storage, fetchImpl = globalThis.fetch, baseUrl = API_BASE },
) {
  const store = storage ?? globalThis.localStorage
  const cached = readGuestSession(store)
  const now = Date.now()
  if (
    cached?.accessToken &&
    cached?.tenantId === tenantId &&
    now - (cached.createdAt || 0) < GUEST_TOKEN_TTL_MS
  ) {
    return cached
  }

  const clientSessionId = cached?.clientSessionId || obtainClientSessionId(store)
  const payload = { clientSessionId, channel, tenantId, ...(name ? { name } : {}) }
  const result = await request('POST', '/guest/session', payload, {
    baseUrl,
    fetchImpl,
  })
  const session = {
    clientSessionId,
    tenantId,
    channel,
    accessToken: result.accessToken,
    user: result.user,
    customer: result.customer,
    conversationIds: cached?.conversationIds || {},
    createdAt: Date.now(),
  }
  writeGuestSession(session, store)
  return session
}

/**
 * 创建可复用对话客户端。
 * @param {{ getToken: () => string, channel?: string, baseUrl?: string, fetchImpl?: typeof fetch }} options
 * @returns {{ rest: object, openRealtime: (conversationId: string) => object }}
 */
export function createChatClient({
  getToken,
  channel = 'web',
  baseUrl = API_BASE,
  fetchImpl = globalThis.fetch,
  ioFactory,
}) {
  const rest = buildRest({ getToken, baseUrl, fetchImpl, defaultChannel: channel })

  const openRealtime = (conversationId) =>
    createConversationRealtime({
      token: getToken(),
      onReconnect: () =>
        conversationId
          ? rest.getConversation(conversationId)
          : rest.listConversations({ pageSize: 20 }),
      ...(ioFactory ? { ioFactory } : {}),
    })

  return { rest, openRealtime, getToken }
}

function buildRest({ getToken, baseUrl, fetchImpl, defaultChannel }) {
  const authed = (method, path, body) =>
    request(method, path, body, { baseUrl, fetchImpl, token: getToken() })

  return {
    async listConversations(params = {}) {
      const result = await authed('GET', withQuery('/conversations', params))
      return { ...result, items: (result.items || []).map(normalizeConversation) }
    },
    async getConversation(id) {
      return normalizeConversation(await authed('GET', `/conversations/${id}`))
    },
    async createOrResumeConversation(input) {
      const result = await authed('POST', '/conversations', {
        channel: input.channel || defaultChannel,
        priority: input.priority || 'normal',
        clientMessageId: input.clientMessageId || newClientSessionId(),
        firstMessage: input.firstMessage,
      })
      return normalizeConversation(result)
    },
    async sendConversationMessage(id, input) {
      return normalizeMessage(
        await authed('POST', `/conversations/${id}/messages`, {
          clientMessageId: input.clientMessageId || newClientSessionId(),
          ...(input.messageType ? { messageType: input.messageType } : {}),
          content: input.content,
          ...(input.attachmentId ? { attachmentId: input.attachmentId } : {}),
        }),
      )
    },
    markConversationRead(id, lastReadSequence) {
      return authed('POST', `/conversations/${id}/read`, { lastReadSequence })
    },
    endConversation(id, reason) {
      return authed('POST', `/conversations/${id}/end`, reason ? { reason } : {})
    },
    submitConversationEvaluation(id, input) {
      return authed('POST', `/conversations/${id}/evaluation`, input)
    },
    recognizeTranscription(messageId) {
      return authed('POST', `/messages/${messageId}/transcription/recognize`)
    },
  }
}

async function request(method, path, body, { baseUrl, fetchImpl, token }) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let response
  try {
    response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('服务暂时不可用，请稍后重试')
  }
  let json = {}
  try {
    json = await response.json()
  } catch {
    throw new Error(response.ok ? '服务返回格式异常' : `请求失败 (${response.status})`)
  }
  if (!response.ok) {
    throw new Error(json.message || `请求失败 (${response.status})`)
  }
  return json.data ?? json
}
