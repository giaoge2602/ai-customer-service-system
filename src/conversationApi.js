import { API_BASE, authRequest, readAccessToken } from './api.js'

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  return query.size ? `${path}?${query}` : path
}

export function normalizeMessage(message) {
  const sourceAttachment = message.attachment
  const attachment = sourceAttachment
    ? {
        id: sourceAttachment.id,
        kind: sourceAttachment.kind,
        status: sourceAttachment.status,
        fileName: sourceAttachment.fileName || sourceAttachment.originalName || '未命名附件',
        sizeBytes: Number(sourceAttachment.sizeBytes ?? 0),
        mimeType: sourceAttachment.mimeType,
        durationMs: sourceAttachment.durationMs ?? null,
        rejectReason: sourceAttachment.rejectReason ?? null,
      }
    : null
  const transcription = message.transcription
    ? {
        status: message.transcription.status,
        text: message.transcription.text ?? '',
        language: message.transcription.language ?? null,
        confidence: message.transcription.confidence ?? null,
        provider: message.transcription.provider ?? null,
        errorCode: message.transcription.errorCode ?? null,
        attemptCount: message.transcription.attemptCount ?? 0,
      }
    : null
  return {
    id: message.id,
    sequence: message.sequence,
    clientMessageId: message.clientMessageId,
    senderType: message.senderType,
    messageType: message.messageType || 'text',
    content: message.content || '',
    attachmentId: message.attachmentId || attachment?.id || null,
    attachment,
    transcription,
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
      ...(input.messageType ? { messageType: input.messageType } : {}),
      content: input.content,
      ...(input.attachmentId ? { attachmentId: input.attachmentId } : {}),
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

// ==================== 多媒体附件（语音 / 图片 / 文件） ====================

/** 初始化附件上传：返回 { attachmentId, status, kind, fileName, sizeBytes } */
export async function initAttachment(conversationId, input, token = readAccessToken()) {
  let response
  try {
    response = await fetch(`${API_BASE}/conversations/${conversationId}/attachments/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(input),
    })
  } catch {
    throw new Error('服务暂时不可用，请稍后重试')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || `请求失败 (${response.status})`)
  return body.data ?? body
}

/** 通知后端附件内容上传完成（后端会核对存储并执行安全检查） */
export async function completeAttachment(attachmentId, token = readAccessToken()) {
  let response
  try {
    response = await fetch(`${API_BASE}/attachments/${attachmentId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
  } catch {
    throw new Error('服务暂时不可用，请稍后重试')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || `请求失败 (${response.status})`)
  return body.data ?? body
}

/** 鉴权拉取附件内容并转为本地对象 URL（图片预览 / 音频播放 / 文件下载共用） */
export async function fetchAttachmentBlobUrl(attachmentId, token = readAccessToken(), fetchImpl = globalThis.fetch) {
  let response
  try {
    response = await fetchImpl(`${API_BASE}/attachments/${attachmentId}/content`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  } catch {
    throw new Error('服务暂时不可用，请稍后重试')
  }
  if (!response.ok) throw new Error(`附件获取失败 (${response.status})`)
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/** 重试失败的语音转写任务 */
export async function retryTranscription(messageId) {
  return authRequest(`/messages/${messageId}/transcription/retry`, { method: 'POST' })
}

/** 用户主动提交语音消息进行识别；服务端立即返回 pending，结果通过实时事件同步。 */
export async function recognizeTranscription(messageId) {
  return authRequest(`/messages/${messageId}/transcription/recognize`, { method: 'POST' })
}
