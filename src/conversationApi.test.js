import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createOrResumeConversation,
  listConversations,
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
