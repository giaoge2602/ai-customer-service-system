import test from 'node:test'
import assert from 'node:assert/strict'

import {
  authenticateDemo,
  canCommitRequest,
  demoAccounts,
  isCurrentRequestGeneration,
  loginWithDemoFallback,
  canAccessPath,
  resolveLoginPath,
  resolveLogoutPath,
  resolveHome,
  resolvePortal,
  roleMatchesPortal,
  validatePassword,
  validateRecoveryEmail,
  validateInvitation,
} from './auth.js'

import { createApproval, createInvite, updateApproval } from './approvalData.js'

async function withFetch(fetchImplementation, run) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = fetchImplementation
  try {
    await run()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('demo login falls back to the local prototype when the API is unavailable', async () => {
  const unavailableApi = async () => { const error = new Error('服务暂时不可用'); error.code = 'SERVICE_UNAVAILABLE'; throw error }
  const session = await loginWithDemoFallback('lina@xinghe.demo', 'Demo@2026', unavailableApi)

  assert.equal(session.role, 'agent')
  assert.equal(session.name, '李楠')
  assert.equal(session.tenantId, 'TENANT-018')
})

test('demo login never bypasses an explicit authentication rejection', async () => {
  const rejectedApi = async () => { const error = new Error('账号已停用'); error.code = 'AUTH_REJECTED'; throw error }
  await assert.rejects(() => loginWithDemoFallback('lina@xinghe.demo', 'Demo@2026', rejectedApi), /账号已停用/)
})

test('a locally registered agent can log in when the backend does not know the account', async () => {
  // 后端在线但用户表没有本地审核激活的账号：返回 401“账号或密码错误”时应降级到本地账号库
  await withFetch(async () => new Response(JSON.stringify({ code: 1001, message: '账号或密码错误' }), { status: 401, headers: { 'Content-Type': 'application/json' } }), async () => {
    const session = await loginWithDemoFallback('lina@xinghe.demo', 'Demo@2026')
    assert.equal(session.role, 'agent')
  })
})

test('a real HTTP 500 login response never triggers the demo fallback', async () => {
  await withFetch(async () => new Response(JSON.stringify({ message: '认证处理异常' }), { status: 500, headers: { 'Content-Type': 'application/json' } }), async () => {
    await assert.rejects(() => loginWithDemoFallback('lina@xinghe.demo', 'Demo@2026'), /认证处理异常/)
  })
})

test('a non-JSON HTTP 500 proxy response triggers the demo fallback', async () => {
  await withFetch(async () => new Response('<!doctype html><title>Vite proxy error</title>', { status: 500, headers: { 'Content-Type': 'text/html' } }), async () => {
    const session = await loginWithDemoFallback('customer@xinghe.demo', 'Demo@2026')
    assert.equal(session.role, 'customer')
  })
})

test('a real HTTP 503 login response triggers the demo fallback', async () => {
  await withFetch(async () => new Response(JSON.stringify({ message: '服务维护中' }), { status: 503, headers: { 'Content-Type': 'application/json' } }), async () => {
    const session = await loginWithDemoFallback('customer@xinghe.demo', 'Demo@2026')
    assert.equal(session.role, 'customer')
  })
})

test('real HTTP 502 and 504 login responses trigger the demo fallback', async () => {
  for (const status of [502, 504]) {
    await withFetch(async () => new Response(JSON.stringify({ message: '服务网关暂不可用' }), { status, headers: { 'Content-Type': 'application/json' } }), async () => {
      const session = await loginWithDemoFallback('customer@xinghe.demo', 'Demo@2026')
      assert.equal(session.role, 'customer')
    })
  }
})

test('an explicit service unavailable response code triggers the demo fallback', async () => {
  await withFetch(async () => new Response(JSON.stringify({ code: 'SERVICE_UNAVAILABLE', message: '服务暂不可用' }), { status: 500, headers: { 'Content-Type': 'application/json' } }), async () => {
    const session = await loginWithDemoFallback('customer@xinghe.demo', 'Demo@2026')
    assert.equal(session.role, 'customer')
  })
})

test('an aborted login request never triggers the demo fallback', async () => {
  await withFetch(async () => { const error = new Error('aborted'); error.name = 'AbortError'; throw error }, async () => {
    await assert.rejects(() => loginWithDemoFallback('customer@xinghe.demo', 'Demo@2026'), /服务暂时不可用/)
  })
})

test('a network failure triggers the demo fallback', async () => {
  await withFetch(async () => { throw new TypeError('fetch failed') }, async () => {
    const session = await loginWithDemoFallback('customer@xinghe.demo', 'Demo@2026')
    assert.equal(session.role, 'customer')
  })
})

test('customer is available as an offline demo identity', () => {
  assert.equal(demoAccounts.find((account) => account.email === 'customer@xinghe.demo')?.role, 'customer')
})

test('shared password rule requires eight characters with upper, lower, and digit', () => {
  assert.equal(validatePassword('simple'), '密码需包含大小写字母和数字，且不少于 8 位')
  assert.equal(validatePassword('alllowercase1'), '密码需包含大小写字母和数字，且不少于 8 位')
  assert.equal(validatePassword('Customer1'), '')
})

test('only the latest login request generation can authenticate', () => {
  assert.equal(isCurrentRequestGeneration(3, 2), false)
  assert.equal(isCurrentRequestGeneration(3, 3), true)
})

test('request commit guard supports the StrictMode mount-cleanup-remount sequence', () => {
  let mounted = true
  let generation = 1
  const firstRequest = generation
  mounted = false
  generation += 1
  mounted = true
  generation += 1
  const secondRequest = generation

  assert.equal(canCommitRequest(mounted, generation, firstRequest), false)
  assert.equal(canCommitRequest(mounted, generation, secondRequest), true)
})

test('request commit guard rejects an old request after a newer request starts', () => {
  const mounted = true
  const oldRequest = 4
  const newRequest = 5

  assert.equal(canCommitRequest(mounted, newRequest, oldRequest), false)
  assert.equal(canCommitRequest(mounted, newRequest, newRequest), true)
  assert.equal(canCommitRequest(false, newRequest, newRequest), false)
})

test('valid demo credentials create the tenant-scoped session for the matching account', () => {
  const result = authenticateDemo('admin@xinghe.demo', 'Demo@2026')

  assert.deepEqual(result, {
    ok: true,
    session: {
      userId: 'USR-TENANT-001',
      tenantId: 'TENANT-018',
      tenantName: '星河科技',
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
  assert.equal(resolvePortal('agent'), 'service')
  assert.equal(resolvePortal('customer'), 'service')
  assert.equal(resolvePortal('platform_admin'), 'admin')
  assert.equal(roleMatchesPortal('tenant_admin', 'service'), false)
  assert.equal(resolveHome('platform_admin'), '/platform/overview')
  assert.equal(resolveHome('tenant_admin'), '/organization/overview')
  assert.equal(resolveHome('agent'), '/workbench')
  assert.equal(resolveHome('customer'), '/customer/chat')
  assert.equal(resolveLoginPath('/platform/overview'), '/admin/login')
  assert.equal(resolveLoginPath('/customer/chat'), '/service/login')
  assert.equal(canAccessPath('agent', '/platform/overview'), false)
  assert.equal(canAccessPath('agent', '/customer/chat'), false)
  assert.equal(canAccessPath('customer', '/customer/chat'), true)
  assert.equal(canAccessPath('tenant_admin', '/organization/knowledge'), true)
  assert.equal(canAccessPath('platform_admin', '/workbench'), true)
  assert.equal(canAccessPath('agent', '/workbench/dashboard'), true)
  assert.equal(canAccessPath('agent', '/workbench/tickets'), true)
  assert.equal(canAccessPath('tenant_admin', '/workbench/tickets'), true)
  assert.equal(canAccessPath('customer', '/workbench/tickets'), false)
  assert.equal(canAccessPath('agent', '/workbench/knowledge'), false)
  assert.equal(canAccessPath('agent', '/workbench/settings'), false)
  assert.equal(canAccessPath('tenant_admin', '/workbench/settings'), true)
})

test('route policy sends each protected namespace to its portal and keeps customer chat customer-only', () => {
  assert.equal(resolveLoginPath('/platform/overview'), '/admin/login')
  assert.equal(resolveLoginPath('/organization/overview'), '/admin/login')
  assert.equal(resolveLoginPath('/workbench'), '/service/login')
  assert.equal(resolveLoginPath('/customer/chat'), '/service/login')
  assert.equal(canAccessPath('customer', '/customer/chat'), true)
  assert.equal(canAccessPath('customer', '/workbench'), false)
  assert.equal(canAccessPath('agent', '/customer/chat'), false)
})

test('logout policy returns each role to its portal login', () => {
  assert.equal(resolveLogoutPath('platform_admin'), '/admin/login')
  assert.equal(resolveLogoutPath('tenant_admin'), '/admin/login')
  assert.equal(resolveLogoutPath('agent'), '/service/login')
  assert.equal(resolveLogoutPath('customer'), '/service/login')
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

test('a registered agent cannot log in until the org approves', () => {
  const invite = createInvite({ type: 'agent', tenantId: 'TENANT-018', tenantName: '星河科技', issuedBy: '赵宁' })
  const created = createApproval({ kind: 'agent', name: '测试客服', email: 'new.agent@xinghe.demo', password: 'Demo@2026', inviteCode: invite.code })
  assert.ok(created.ok)

  // 提交后未审核：不可登录
  const before = authenticateDemo('new.agent@xinghe.demo', 'Demo@2026')
  assert.equal(before.ok, false)
  assert.ok(before.error.includes('尚未激活'))

  // 机构端通过：账号即激活，可登录
  updateApproval(created.approval.id, { stage: 'org', decision: 'approved', reviewedBy: '赵宁' })
  const after = authenticateDemo('new.agent@xinghe.demo', 'Demo@2026')
  assert.equal(after.ok, true)
  assert.equal(after.session.role, 'agent')
  assert.equal(after.session.tenantId, 'TENANT-018')
  assert.equal(after.session.name, '测试客服')
})

test('a rejected registered request tells the user the application was declined', () => {
  const invite = createInvite({ type: 'tenant', issuedBy: '王敏' })
  const created = createApproval({ kind: 'tenant', tenantName: '被拒公司', name: '张三', email: 'zhangsan@rejected.demo', password: 'Demo@2026', inviteCode: invite.code })
  updateApproval(created.approval.id, { stage: 'platform', decision: 'rejected', reviewedBy: '王敏' })
  const result = authenticateDemo('zhangsan@rejected.demo', 'Demo@2026')
  assert.equal(result.ok, false)
  assert.ok(result.error.includes('驳回'))
})
