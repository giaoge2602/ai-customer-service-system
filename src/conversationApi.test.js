import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createOrResumeConversation,
  listAllConversations,
  listConversations,
  normalizeMessage,
  recognizeTranscription,
  sendConversationMessage,
} from './conversationApi.js'

function mockApi(responseData) {
  globalThis.window = {
    sessionStorage: {
      getItem: () => JSON.stringify({ accessToken: 'token' }),
    },
  }
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return {
      ok: true,
      json: async () => ({ data: responseData }),
    }
  }
  return () => request
}

test('listConversations builds a scoped query', async () => {
  const request = mockApi({ items: [], total: 0 })
  await listConversations({ tenantId: 'TENANT-018', status: 'queued', page: 2 })
  assert.equal(
    request().url,
    '/api/v1/conversations?tenantId=TENANT-018&status=queued&page=2',
  )
})

test('create and message calls keep the supplied clientMessageId', async () => {
  let request = mockApi({ id: 'C-1', messages: [] })
  await createOrResumeConversation({
    firstMessage: '你好',
    clientMessageId: '11111111-1111-4111-8111-111111111111',
  })
  assert.equal(
    JSON.parse(request().options.body).clientMessageId,
    '11111111-1111-4111-8111-111111111111',
  )

  request = mockApi({ id: 'M-1', sequence: 2, senderType: 'customer' })
  await sendConversationMessage('C-1', {
    content: '继续咨询',
    clientMessageId: '22222222-2222-4222-8222-222222222222',
  })
  assert.equal(
    JSON.parse(request().options.body).clientMessageId,
    '22222222-2222-4222-8222-222222222222',
  )
})

test('normalizeMessage keeps multimedia metadata when called more than once', () => {
  const raw = {
    id: 'M-1',
    senderType: 'customer',
    messageType: 'file',
    attachmentId: 'ATT-1',
    attachment: {
      id: 'ATT-1',
      kind: 'file',
      status: 'ready',
      originalName: '报价单.pdf',
      sizeBytes: 2048,
      mimeType: 'application/pdf',
    },
  }
  const once = normalizeMessage(raw)
  const twice = normalizeMessage(once)

  assert.equal(twice.attachmentId, 'ATT-1')
  assert.equal(twice.attachment.fileName, '报价单.pdf')
  assert.equal(twice.attachment.sizeBytes, 2048)
  assert.equal(twice.attachment.mimeType, 'application/pdf')
})

test('sendConversationMessage forwards multimedia type and attachment id', async () => {
  const request = mockApi({
    id: 'M-2',
    senderType: 'customer',
    messageType: 'image',
    attachmentId: 'ATT-2',
  })
  await sendConversationMessage('C-1', {
    clientMessageId: '33333333-3333-4333-8333-333333333333',
    messageType: 'image',
    attachmentId: 'ATT-2',
  })

  const body = JSON.parse(request().options.body)
  assert.equal(body.messageType, 'image')
  assert.equal(body.attachmentId, 'ATT-2')
})

test('recognizeTranscription submits the message to the on-demand recognition endpoint', async () => {
  const request = mockApi({ status: 'pending' })
  await recognizeTranscription('MSG-AUDIO-1')
  assert.equal(request().url, '/api/v1/messages/MSG-AUDIO-1/transcription/recognize')
  assert.equal(request().options.method, 'POST')
})

test('listAllConversations loads every page required by the total count', async () => {
  globalThis.window = { sessionStorage: { getItem: () => JSON.stringify({ accessToken: 'token' }) } }
  const urls = []
  globalThis.fetch = async (url) => {
    urls.push(url)
    const page = new URL(url, 'http://local').searchParams.get('page')
    const items = page === '2' ? [{ id: 'C-3' }] : [{ id: 'C-1' }, { id: 'C-2' }]
    return { ok: true, json: async () => ({ data: { items, total: 3 } }) }
  }
  const result = await listAllConversations({ pageSize: 2 })
  assert.deepEqual(result.items.map((item) => item.id), ['C-1', 'C-2', 'C-3'])
  assert.equal(urls.length, 2)
})
