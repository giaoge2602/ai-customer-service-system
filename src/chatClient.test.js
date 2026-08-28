import assert from 'node:assert/strict'
import test from 'node:test'

import {
  GUEST_STORAGE_KEY,
  createChatClient,
  ensureGuestSession,
  obtainClientSessionId,
} from './chatClient.js'

function fakeStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
    _map: map,
  }
}

function fakeSocket() {
  const handlers = new Map()
  return {
    connected: true,
    on(name, handler) {
      handlers.set(name, handler)
    },
    emit(name, payload, ack) {
      ack?.({ ok: true, name, payload })
    },
    close() {},
    trigger(name, payload) {
      handlers.get(name)?.(payload)
    },
  }
}

function guestResponse(token = 'guest-token') {
  return {
    data: {
      accessToken: token,
      user: {
        id: 'U-GUEST-1',
        tenantId: 'TENANT-018',
        tenantName: '星河科技',
        email: 'guest@guest.xinghe.invalid',
        name: '访客',
        role: 'customer',
      },
      customer: { id: 'C-GUEST-1', source: 'h5', level: '访客' },
    },
  }
}

test('ensureGuestSession stores only in its own key, not the shared session', async () => {
  const storage = fakeStorage()
  let request
  const fetchImpl = async (url, options) => {
    request = { url, options }
    return { ok: true, json: async () => guestResponse() }
  }

  const session = await ensureGuestSession({
    tenantId: 'TENANT-018',
    channel: 'h5',
    storage,
    fetchImpl,
  })

  assert.equal(session.accessToken, 'guest-token')
  assert.equal(session.user.role, 'customer')
  assert.equal(session.customer.source, 'h5')

  const saved = JSON.parse(storage.getItem(GUEST_STORAGE_KEY))
  assert.equal(saved.accessToken, 'guest-token')
  assert.ok(saved.clientSessionId)
  // 绝不写入共享登录 key —— 覆盖坐席/管理员会话的风险点
  assert.equal(storage.getItem('ai-customer-service-session'), null)

  assert.equal(request.url, '/api/v1/guest/session')
  const body = JSON.parse(request.options.body)
  assert.equal(body.tenantId, 'TENANT-018')
  assert.equal(body.channel, 'h5')
})

test('ensureGuestSession reuses an unexpired cached token', async () => {
  const storage = fakeStorage()
  storage.setItem(
    GUEST_STORAGE_KEY,
    JSON.stringify({
      clientSessionId: 'cid',
      accessToken: 'existing',
      tenantId: 'TENANT-018',
      channel: 'web',
      createdAt: Date.now(),
    }),
  )
  let calls = 0
  const fetchImpl = async () => {
    calls++
    return { ok: true, json: async () => guestResponse('new') }
  }
  const session = await ensureGuestSession({
    tenantId: 'TENANT-018',
    channel: 'web',
    storage,
    fetchImpl,
  })
  assert.equal(session.accessToken, 'existing')
  assert.equal(calls, 0)
})

test('obtainClientSessionId is stable for the same storage', () => {
  const storage = fakeStorage()
  const first = obtainClientSessionId(storage)
  const second = obtainClientSessionId(storage)
  assert.equal(first, second)
  assert.ok(first)
})

test('chat client rest injects bearer and passes the channel', async () => {
  let request
  const client = createChatClient({
    getToken: () => 'tk',
    channel: 'h5',
    fetchImpl: async (url, options) => {
      request = { url, options }
      return { ok: true, json: async () => ({ data: { id: 'C-1', messages: [] } }) }
    },
  })
  await client.rest.createOrResumeConversation({ firstMessage: '你好' })

  assert.equal(request.options.headers.Authorization, 'Bearer tk')
  assert.equal(request.url, '/api/v1/conversations')
  const body = JSON.parse(request.options.body)
  assert.equal(body.channel, 'h5')
  assert.equal(body.firstMessage, '你好')
})

test('openRealtime wires token and reconciles via REST on reconnect', async () => {
  const socket = fakeSocket()
  let reconnectUrl
  const client = createChatClient({
    getToken: () => 'tk',
    ioFactory: () => socket,
    fetchImpl: async (url) => {
      reconnectUrl = url
      return { ok: true, json: async () => ({ data: { id: 'C-1', messages: [] } }) }
    },
  })

  const rt = client.openRealtime('C-1')
  let received = false
  rt.subscribe('message.created', () => {
    received = true
  })

  socket.trigger('connect')
  socket.trigger('connect') // 第二次 connect 才触发 onReconnect
  socket.trigger('message.created', { eventId: 'E-1' })

  assert.equal(received, true)
  assert.equal(reconnectUrl, '/api/v1/conversations/C-1')
})
