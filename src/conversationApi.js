import { authRequest } from './api.js'

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  return query.size ? `${path}?${query}` : path
}

export function normalizeMessage(message) {
  return {
    id: message.id,
    sequence: message.sequence,
    clientMessageId: message.clientMessageId,
    senderType: message.senderType,
    content: message.content || '',
    createdAt: message.createdAt,
  }
}

export function normalizeConversation(conversation) {
  return {
    ...conversation,
    messages: (conversation.messages || []).map(normalizeMessage),
  }
}

export async function listConversations(params = {}) {
  const result = await authRequest(withQuery('/conversations', params))
  return { ...result, items: (result.items || []).map(normalizeConversation) }
}

/** 按总量自动翻页，拉取机构内全部会话（工作台「全部状态」视图使用） */
export async function listAllConversations(params = {}) {
  const pageSize = params.pageSize || 100
  const first = await listConversations({ ...params, page: 1, pageSize })
  const items = [...first.items]
  const totalPages = Math.ceil((first.total || items.length) / pageSize)
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await listConversations({ ...params, page, pageSize })
    items.push(...next.items)
  }
  return { ...first, items }
}

export async function createOrResumeConversation(input) {
  const result = await authRequest('/conversations', {
    method: 'POST',
    body: JSON.stringify({
      channel: input.channel || 'web',
      priority: input.priority || 'normal',
      clientMessageId: input.clientMessageId || crypto.randomUUID(),
      firstMessage: input.firstMessage,
    }),
  })
  return normalizeConversation(result)
}

export async function getConversation(id, tenantId) {
  const result = await authRequest(withQuery(`/conversations/${id}`, { tenantId }))
  return normalizeConversation(result)
}

export async function sendConversationMessage(id, input) {
  const result = await authRequest(`/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      clientMessageId: input.clientMessageId || crypto.randomUUID(),
      content: input.content,
    }),
  })
  return normalizeMessage(result)
}

export function markConversationRead(id, lastReadSequence) {
  return authRequest(`/conversations/${id}/read`, {
    method: 'POST',
    body: JSON.stringify({ lastReadSequence }),
  })
}

export function claimConversation(id) {
  return authRequest(`/conversations/${id}/claim`, { method: 'POST' })
}

export function releaseConversation(id) {
  return authRequest(`/conversations/${id}/release`, { method: 'POST' })
}

export function assignConversation(id, agentId) {
  return authRequest(`/conversations/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ agentId }),
  })
}

export function requestConversationEvaluation(id) {
  return authRequest(`/conversations/${id}/evaluation/request`, { method: 'POST' })
}

export function submitConversationEvaluation(id, input) {
  return authRequest(`/conversations/${id}/evaluation`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function endConversation(id, reason) {
  return authRequest(`/conversations/${id}/end`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  })
}
