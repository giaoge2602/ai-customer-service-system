import test from 'node:test'
import assert from 'node:assert/strict'

import {
  authenticateDemo,
  canAccessPath,
  resolveHome,
  validateRecoveryEmail,
  validateInvitation,
} from './auth.js'

test('valid demo credentials create the tenant-scoped session for the matching account', () => {
  const result = authenticateDemo('admin@xinghe.demo', 'Demo@2026')

  assert.deepEqual(result, {
    ok: true,
    session: {
      userId: 'USR-TENANT-001',
      tenantId: 'TENANT-018',
      role: 'tenant_admin',
      permissions: ['tenant:manage', 'service:operate'],
      name: '赵宁',
      title: '机构管理员',
      email: 'admin@xinghe.demo',
    },
  })
})

test('wrong credentials are rejected without creating a session', () => {
  assert.deepEqual(authenticateDemo('admin@xinghe.demo', 'wrong-password'), {
    ok: false,
    error: '账号或密码错误，请检查后重试',
  })
})

test('role home and protected areas stay aligned with the PRD role boundary', () => {
  assert.equal(resolveHome('platform_admin'), '/platform/overview')
  assert.equal(resolveHome('tenant_admin'), '/organization/overview')
  assert.equal(resolveHome('agent'), '/workbench')
  assert.equal(canAccessPath('agent', '/platform/overview'), false)
  assert.equal(canAccessPath('tenant_admin', '/organization/knowledge'), true)
  assert.equal(canAccessPath('platform_admin', '/workbench'), true)
})

test('invitation registration validates invite code, work email, and password strength', () => {
  assert.deepEqual(validateInvitation({
    inviteCode: 'bad-code',
    name: '',
    email: 'invalid',
    password: 'simple',
    confirmPassword: 'different',
    agreed: false,
  }), {
    inviteCode: '邀请码无效或已失效',
    name: '请输入姓名',
    email: '请输入有效的工作邮箱',
    password: '密码需包含大小写字母和数字，且不少于 8 位',
    confirmPassword: '两次输入的密码不一致',
    agreed: '请阅读并同意服务协议与隐私政策',
  })

  assert.deepEqual(validateInvitation({
    inviteCode: 'XH-2026-INVITE',
    name: '陈晨',
    email: 'chen@xinghe.demo',
    password: 'Secure123',
    confirmPassword: 'Secure123',
    agreed: true,
  }), {})
})

test('password recovery rejects malformed email and accepts a work email', () => {
  assert.equal(validateRecoveryEmail('not-an-email'), '请输入有效的工作邮箱')
  assert.equal(validateRecoveryEmail('agent@xinghe.demo'), '')
})
