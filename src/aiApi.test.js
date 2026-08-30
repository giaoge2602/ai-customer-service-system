import assert from 'node:assert/strict'
import test from 'node:test'

import { createAiModel, takeoverConversationByAi, updateTenantAiPolicy } from './aiApi.js'

function captureRequest(responseData = {}) {
  globalThis.window = { sessionStorage: { getItem: () => JSON.stringify({ accessToken: 'token' }) } }
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return { ok: true, json: async () => ({ data: responseData }) }
  }
  return () => request
}

test('creates a platform model without changing the supplied secret', async () => {
  const request = captureRequest({ id: 'MODEL-1' })
  await createAiModel({ provider: 'deepseek', apiKey: 'secret', modelKey: 'deepseek-chat' })
  assert.equal(request().url, '/api/v1/platform/ai-models')
  assert.equal(JSON.parse(request().options.body).apiKey, 'secret')
})

test('updates tenant AI policy and starts conversation takeover through scoped endpoints', async () => {
  let request = captureRequest({ enabled: true })
  await updateTenantAiPolicy({ enabled: true })
  assert.equal(request().url, '/api/v1/tenant/ai/policy')
  assert.equal(request().options.method, 'PUT')

  request = captureRequest({ status: 'ai_handling' })
  await takeoverConversationByAi('CONV-1')
  assert.equal(request().url, '/api/v1/conversations/CONV-1/ai/takeover')
})
