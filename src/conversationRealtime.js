import { io } from 'socket.io-client'

const EVENT_NAMES = [
  'conversation.created',
  'conversation.claimed',
  'conversation.released',
  'conversation.assigned',
  'conversation.ended',
  'message.created',
  'message.read',
  'evaluation.scheduled',
  'evaluation.visible',
  'evaluation.submitted',
  'attachment.updated',
  'transcription.updated',
]

export function createConversationRealtime({ token, onReconnect, ioFactory = io }) {
  const socket = ioFactory({
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
  })
  const seen = new Set()
  const order = []
  const subscriptions = new Map()
  let connectedOnce = false

  const remember = (eventId) => {
    if (!eventId || seen.has(eventId)) return false
    seen.add(eventId)
    order.push(eventId)
    if (order.length > 500) seen.delete(order.shift())
    return true
  }

  EVENT_NAMES.forEach((name) => {
    socket.on(name, (event) => {
      if (!remember(event?.eventId)) return
      subscriptions.get(name)?.forEach((handler) => handler(event))
    })
  })
  socket.on('connect', () => {
    if (connectedOnce) onReconnect?.()
    connectedOnce = true
  })

  const emitWithAck = (event, conversationId) =>
    new Promise((resolve) => socket.emit(event, { conversationId }, resolve))

  return {
    subscribe(name, handler) {
      const handlers = subscriptions.get(name) || new Set()
      handlers.add(handler)
      subscriptions.set(name, handlers)
      return () => handlers.delete(handler)
    },
    join: (conversationId) => emitWithAck('conversation:join', conversationId),
    leave: (conversationId) => emitWithAck('conversation:leave', conversationId),
    close: () => socket.close(),
    isConnected: () => socket.connected,
  }
}
