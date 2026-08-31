import test from 'node:test'
import assert from 'node:assert/strict'
import { createApproval, createInvite, getUserByEmail, listApprovals, revokeInvite, updateApproval, validateInvite } from './approvalData.js'

function freshStorage() {
  const data = {}
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
  }
}

test('createInvite issues a tenant invite that validates once', () => {
  const storage = freshStorage()
  const invite = createInvite({ type: 'tenant', issuedBy: '王敏', description: '测试入驻' }, storage)
  assert.ok(invite.code.startsWith('T-INV-'))
  assert.equal(invite.status, 'valid')
  assert.equal(validateInvite(invite.code, 'tenant', storage).ok, true)
  assert.equal(validateInvite(invite.code, 'agent', storage).ok, false)
  assert.equal(validateInvite('DOES-NOT-EXIST', 'tenant', storage).ok, false)
})

test('an agent invite binds the applicant to the issuing tenant', () => {
  const storage = freshStorage()
  const invite = createInvite({ type: 'agent', tenantId: 'TENANT-018', tenantName: '星河科技', issuedBy: '赵宁' }, storage)
  const created = createApproval({ kind: 'agent', name: '新客服', email: 'new.agent@xinghe.demo', password: 'Demo@2026', inviteCode: invite.code }, storage)
  assert.ok(created.ok)
  assert.equal(created.approval.tenantId, 'TENANT-018')
  assert.equal(created.approval.tenantName, '星河科技')
  // 邀请码已消耗，无法重复提交
  const again = createApproval({ kind: 'agent', name: '重复', email: 'dup@xinghe.demo', password: 'Demo@2026', inviteCode: invite.code }, storage)
  assert.ok(!again.ok)
  assert.ok(again.error.includes('已被使用'))
})

test('tenant approval activates the org admin account in one step', () => {
  const storage = freshStorage()
  const invite = createInvite({ type: 'tenant', issuedBy: '王敏' }, storage)
  const created = createApproval({ kind: 'tenant', tenantName: '远望科技', name: '钱进', email: 'qianjin@yuanwang.demo', password: 'Demo@2026', inviteCode: invite.code }, storage)
  assert.ok(created.ok)
  const result = updateApproval(created.approval.id, { stage: 'platform', decision: 'approved', reviewedBy: '王敏' }, storage)
  assert.equal(result.status, 'active')
  const user = getUserByEmail('qianjin@yuanwang.demo', storage)
  assert.equal(user.role, 'tenant_admin')
  assert.ok(user.tenantId && user.tenantId !== created.approval.tenantId)
  assert.equal(user.tenantName, '远望科技')
})

test('agent approval activates with the org side alone', () => {
  const storage = freshStorage()
  const invite = createInvite({ type: 'agent', tenantId: 'TENANT-018', tenantName: '星河科技', issuedBy: '赵宁' }, storage)
  const created = createApproval({ kind: 'agent', name: '孙小雅', email: 'sunxiaoya@xinghe.demo', password: 'Demo@2026', inviteCode: invite.code }, storage)
  const first = updateApproval(created.approval.id, { stage: 'org', decision: 'approved', reviewedBy: '赵宁' }, storage)
  assert.equal(first.status, 'active')
  const user = getUserByEmail('sunxiaoya@xinghe.demo', storage)
  assert.equal(user.role, 'agent')
  assert.equal(user.tenantId, 'TENANT-018')
  // 平台阶段已不再参与客服审核
  const other = createInvite({ type: 'agent', tenantId: 'TENANT-018', tenantName: '星河科技', issuedBy: '赵宁' }, storage)
  const created2 = createApproval({ kind: 'agent', name: '陈小飞', email: 'chenfei@xinghe.demo', password: 'Demo@2026', inviteCode: other.code }, storage)
  const rejected = updateApproval(created2.approval.id, { stage: 'platform', decision: 'approved', reviewedBy: '王敏' }, storage)
  assert.equal(rejected.error, '客服注册申请仅由机构管理员审核')
})

test('a rejection marks the request rejected and frees the invite', () => {
  const storage = freshStorage()
  const invite = createInvite({ type: 'tenant', issuedBy: '王敏' }, storage)
  const created = createApproval({ kind: 'tenant', tenantName: '不符公司', name: '李四', email: 'lisi@nope.demo', password: 'Demo@2026', inviteCode: invite.code }, storage)
  const result = updateApproval(created.approval.id, { stage: 'platform', decision: 'rejected', reviewedBy: '王敏' }, storage)
  assert.equal(result.status, 'rejected')
  assert.equal(validateInvite(invite.code, 'tenant', storage).ok, true)
})

test('a tenant request can only be reviewed at the platform stage', () => {
  const storage = freshStorage()
  const invite = createInvite({ type: 'tenant', issuedBy: '王敏' }, storage)
  const created = createApproval({ kind: 'tenant', tenantName: '边界公司', name: '王五', email: 'wangwu@edge.demo', password: 'Demo@2026', inviteCode: invite.code }, storage)
  const result = updateApproval(created.approval.id, { stage: 'org', decision: 'approved', reviewedBy: '赵宁' }, storage)
  assert.equal(result.error, '机构入驻申请仅由平台管理员审核')
})

test('legacy pending agent approvals waiting for platform review are migrated to active', () => {
  const storage = freshStorage()
  const approvals = listApprovals({}, storage)
  const tenant = approvals.find((a) => a.id === 'REQ-1001')
  assert.equal(tenant.kind, 'tenant')
  assert.equal(tenant.status, 'pending')
  // 旧数据 REQ-1002（机构已通过、等待平台终审）在单级审核下自动激活
  const agent = approvals.find((a) => a.id === 'REQ-1002')
  assert.equal(agent.status, 'active')
  assert.ok(agent.userId)
  assert.ok(getUserByEmail('sunlei@xinghe.demo', storage))
  // REQ-1003 仍由机构正常审核
  const pending = approvals.find((a) => a.id === 'REQ-1003')
  assert.equal(pending.status, 'pending')
  // 撤销有效邀请码后无法再使用
  const validInvite = createInvite({ type: 'tenant', issuedBy: '王敏' }, storage)
  revokeInvite(validInvite.code, storage)
  assert.equal(validateInvite(validInvite.code, 'tenant', storage).ok, false)
})
