import test from 'node:test'
import assert from 'node:assert/strict'
import { getWorkArea, transitionChat, resolveServiceMode, loadPrototypeConfig, savePrototypeConfig } from './prototype.js'
import * as prototype from './prototype.js'

test('maps workbench routes to the requested prototype area', () => {
  assert.equal(getWorkArea('/workbench/dashboard'), 'dashboard')
  assert.equal(getWorkArea('/workbench/knowledge'), 'knowledge')
  assert.equal(getWorkArea('/workbench/tickets'), 'tickets')
  assert.equal(getWorkArea('/workbench/service-logs'), 'serviceLogs')
  assert.equal(getWorkArea('/workbench/settings'), 'settings')
  assert.equal(getWorkArea('/workbench/CS-240819-018'), 'conversations')
})

test('agent workspace chrome includes service resources with semantic icons', () => {
  const items = prototype.getAgentWorkspaceNav?.('agent')
  assert.deepEqual(items?.map((item) => item.id), ['conversations', 'dashboard', 'tickets', 'serviceLogs'])
  assert.equal(items.find((item) => item.id === 'conversations')?.icon, 'chat')
  assert.equal(items.find((item) => item.id === 'serviceLogs')?.path, '/workbench/service-logs')
  assert.equal(items.find((item) => item.id === 'tickets')?.path, '/workbench/tickets')
})

test('admins see knowledge, tickets, and settings while customers see no workspace nav', () => {
  assert.deepEqual(prototype.getAgentWorkspaceNav?.('tenant_admin').map((item) => item.id), ['conversations', 'dashboard', 'knowledge', 'tickets', 'serviceLogs', 'settings'])
  assert.deepEqual(prototype.getAgentWorkspaceNav?.('customer'), [])
})

test('moves the customer chat through the V1 service flow', () => {
  assert.equal(transitionChat('welcome', 'start'), 'queued')
  assert.equal(transitionChat('queued', 'accept'), 'handling')
  assert.equal(transitionChat('handling', 'finish'), 'ended')
  assert.equal(transitionChat('ended', 'rate'), 'evaluated')
})

test('uses AI outside configured working hours and human service during working hours', () => {
  const schedule = { start: '09:00', end: '18:00' }
  assert.equal(resolveServiceMode('10:30', schedule), 'human')
  assert.equal(resolveServiceMode('20:15', schedule), 'ai')
})

test('published customer configuration can be loaded by the customer entry', () => {
  const values = new Map()
  const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) }
  savePrototypeConfig({ welcome: '欢迎来到测试服务', theme: '#123456', aiEnabled: false }, storage)

  assert.deepEqual(loadPrototypeConfig(storage), {
    welcome: '欢迎来到测试服务',
    theme: '#123456',
    aiEnabled: false,
    start: '09:00',
    end: '18:00',
  })
})
