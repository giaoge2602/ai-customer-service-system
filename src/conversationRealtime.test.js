import assert from 'node:assert/strict'
import test from 'node:test'

import { createConversationRealtime } from './conversationRealtime.js'

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

test('realtime client de-duplicates events and reconciles once per reconnect', async () => {
  const socket = fakeSocket()
  let reconnects = 0
  const client = createConversationRealtime({
    token: 'token',
    onReconnect: () => reconnects++,
    ioFactory: () => socket,
  })
  let received = 0
  client.subscribe('message.created', () => received++)

  socket.trigger('connect')
  socket.trigger('connect')
  socket.trigger('message.created', { eventId: 'E-1' })
  socket.trigger('message.created', { eventId: 'E-1' })

  assert.equal(reconnects, 1)
  assert.equal(received, 1)
  assert.deepEqual(await client.join('C-1'), {
    ok: true,
    name: 'conversation:join',
    payload: { conversationId: 'C-1' },
  })
})
