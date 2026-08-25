import test from 'node:test'
import assert from 'node:assert/strict'

import { getPortalCategories, getPortalCopy } from './authPortal.js'

test('service portal only exposes the agent and customer identities', () => {
  assert.deepEqual(getPortalCategories('service').map((item) => item.key), ['agent', 'customer'])
})

test('admin portal only exposes the platform and tenant identities', () => {
  assert.deepEqual(getPortalCategories('admin').map((item) => item.key), ['platform', 'tenant'])
})

test('each portal has its own login heading', () => {
  assert.equal(getPortalCopy('service').loginTitle, '登录服务中心')
  assert.equal(getPortalCopy('admin').loginTitle, '登录管理中心')
})

test('each portal keeps every auth mode and cross-portal link in the correct namespace', () => {
  assert.deepEqual(getPortalCopy('service').routes, {
    login: '/service/login',
    register: '/service/register',
    recovery: '/service/forgot-password',
  })
  assert.equal(getPortalCopy('service').crossPortal.href, '/admin/login')
  assert.deepEqual(getPortalCopy('admin').routes, {
    login: '/admin/login',
    register: '/admin/register',
    recovery: '/admin/forgot-password',
  })
  assert.equal(getPortalCopy('admin').crossPortal.href, '/service/login')
})
