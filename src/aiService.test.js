import test from 'node:test'
import assert from 'node:assert/strict'
import { AI_TAKEOVER, buildAiSystemNote, requestAiReply } from './aiService.js'
import { conversationsSeed } from './workbenchData.js'

test('builds a contextual system note for each takeover reason', () => {
  assert.ok(buildAiSystemNote('ai_takeover').includes('AI 已接管'))
  assert.ok(buildAiSystemNote('off_hours').includes('非工作时间'))
  assert.ok(buildAiSystemNote('rest').includes('休息'))
  assert.equal(buildAiSystemNote('unknown-reason'), buildAiSystemNote('ai_takeover'))
})

test('local mock replies are non-empty and context-aware', async () => {
  const delay = AI_TAKEOVER.replyDelay
  AI_TAKEOVER.replyDelay = 0
  try {
    const refund = conversationsSeed.find((c) => c.id === 'CS-240819-018')
    const reply1 = await requestAiReply({ conversation: refund, reason: 'ai_takeover' })
    assert.ok(typeof reply1 === 'string' && reply1.length > 0)
    assert.ok(reply1.includes('林晓雨') || reply1.includes('已为您记录'))

    const preSales = conversationsSeed.find((c) => c.id === 'CS-240819-019')
    const reply2 = await requestAiReply({ conversation: preSales, reason: 'ai_takeover' })
    assert.ok(reply2.length > 0)
    assert.notEqual(reply1, reply2)
  } finally {
    AI_TAKEOVER.replyDelay = delay
  }
})

test('disabled takeover returns null so the UI can disable the button', async () => {
  const enabled = AI_TAKEOVER.enabled
  AI_TAKEOVER.enabled = false
  try {
    const reply = await requestAiReply({ conversation: conversationsSeed[0] })
    assert.equal(reply, null)
  } finally {
    AI_TAKEOVER.enabled = enabled
  }
})
