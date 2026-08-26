/**
 * 注册审核数据层（本地原型）
 * ------------------------------------------------------------
 * 模拟后端三张表：邀请码 / 注册申请 / 激活账号，localStorage 持久化。
 *  - 机构入驻：超管派发 tenant 邀请码 → 申请人填写并提交 → 平台端审核 → 激活机构管理员账号
 *  - 客服入职：机构管理员派发 agent 邀请码（绑定机构）→ 申请人填写并提交 → 机构端 + 平台端两级审核 → 激活客服账号
 * 接入后端后，将各函数实现替换为 API 调用即可，调用方无需改动。
 */

const KEYS = {
  invites: 'ai-customer-service-invites',
  approvals: 'ai-customer-service-approvals',
  users: 'ai-customer-service-users',
}

/** Node 测试环境无 localStorage 时的内存兜底存储 */
let fallbackStore
function resolveStorage(storage) {
  if (storage) return storage
  try {
    if (typeof localStorage !== 'undefined') return localStorage
  } catch { /* ignore */ }
  if (!fallbackStore) {
    fallbackStore = {
      _data: {},
      getItem(key) { return this._data[key] ?? null },
      setItem(key, value) { this._data[key] = String(value) },
      removeItem(key) { delete this._data[key] },
    }
  }
  return fallbackStore
}

function readTable(key, storage) {
  try {
    return JSON.parse(resolveStorage(storage).getItem(key) || '[]')
  } catch {
    return []
  }
}

function writeTable(key, list, storage) {
  try {
    resolveStorage(storage).setItem(key, JSON.stringify(list))
  } catch { /* ignore */ }
}

function nowText() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function daysFromNow(days) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function randomCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)]
  return `${prefix}-${out}`
}

// ==================== 种子数据（首次使用写入，便于演示审核流程） ====================

const seedInvites = [
  { code: 'T-INV-2026A1', type: 'tenant', tenantId: null, tenantName: null, issuedBy: '王敏', description: '华庭酒店入驻', status: 'used', usedBy: 'REQ-1001', createdAt: '2026-08-25 10:12', expiresAt: '2026-09-24' },
  { code: 'T-INV-2026A2', type: 'tenant', tenantId: null, tenantName: null, issuedBy: '王敏', description: '新机构入驻预留', status: 'valid', usedBy: null, createdAt: '2026-08-25 14:30', expiresAt: '2026-09-24' },
  { code: 'A-INV-2026B1', type: 'agent', tenantId: 'TENANT-018', tenantName: '星河科技', issuedBy: '赵宁', description: '孙蕾入职', status: 'used', usedBy: 'REQ-1002', createdAt: '2026-08-25 15:00', expiresAt: '2026-09-24' },
  { code: 'A-INV-2026B2', type: 'agent', tenantId: 'TENANT-018', tenantName: '星河科技', issuedBy: '赵宁', description: '何俊入职', status: 'used', usedBy: 'REQ-1003', createdAt: '2026-08-26 09:20', expiresAt: '2026-09-25' },
  { code: 'A-INV-2026B3', type: 'agent', tenantId: 'TENANT-018', tenantName: '星河科技', issuedBy: '赵宁', description: '客服扩招预留', status: 'valid', usedBy: null, createdAt: '2026-08-26 09:30', expiresAt: '2026-09-25' },
]

const seedApprovals = [
  {
    id: 'REQ-1001', kind: 'tenant', tenantId: null, tenantName: '华庭酒店',
    name: '吴倩', email: 'wuqian@huating.demo', phone: '131****2211', password: 'Demo@2026',
    inviteCode: 'T-INV-2026A1', status: 'pending',
    platformApproval: 'pending', platformReviewedBy: null, platformReviewedAt: null,
    orgApproval: null, orgReviewedBy: null, orgReviewedAt: null,
    createdAt: '2026-08-25 10:15', userId: null,
  },
  {
    id: 'REQ-1002', kind: 'agent', tenantId: 'TENANT-018', tenantName: '星河科技',
    name: '孙蕾', email: 'sunlei@xinghe.demo', phone: '138****7712', password: 'Demo@2026',
    inviteCode: 'A-INV-2026B1', status: 'pending',
    platformApproval: 'pending', platformReviewedBy: null, platformReviewedAt: null,
    orgApproval: 'approved', orgReviewedBy: '赵宁', orgReviewedAt: '2026-08-25 16:40',
    createdAt: '2026-08-25 15:02', userId: null,
  },
  {
    id: 'REQ-1003', kind: 'agent', tenantId: 'TENANT-018', tenantName: '星河科技',
    name: '何俊', email: 'hejun@xinghe.demo', phone: '137****8845', password: 'Demo@2026',
    inviteCode: 'A-INV-2026B2', status: 'pending',
    platformApproval: 'pending', platformReviewedBy: null, platformReviewedAt: null,
    orgApproval: 'pending', orgReviewedBy: null, orgReviewedAt: null,
    createdAt: '2026-08-26 09:31', userId: null,
  },
]

const seedUsers = [
  { userId: 'USR-REG-001', name: '郑洁', email: 'zhengjie@xinghe.demo', password: 'Demo@2026', role: 'agent', tenantId: 'TENANT-018', tenantName: '星河科技', title: '客服专员', status: 'active' },
]

function ensureSeed(storage) {
  if (readTable(KEYS.invites, storage).length === 0) writeTable(KEYS.invites, seedInvites, storage)
  if (readTable(KEYS.approvals, storage).length === 0) writeTable(KEYS.approvals, seedApprovals, storage)
  if (readTable(KEYS.users, storage).length === 0) writeTable(KEYS.users, seedUsers, storage)
}

// ==================== 邀请码 ====================

/** 生成邀请码：type 为 'tenant'（机构入驻）或 'agent'（客服入职） */
export function createInvite({ type, tenantId = null, tenantName = null, issuedBy = '', description = '', days = 30 }, storage) {
  ensureSeed(storage)
  const invites = readTable(KEYS.invites, storage)
  const invite = {
    code: randomCode(type === 'tenant' ? 'T-INV' : 'A-INV'),
    type,
    tenantId,
    tenantName,
    issuedBy,
    description,
    status: 'valid',
    usedBy: null,
    createdAt: nowText(),
    expiresAt: daysFromNow(days),
  }
  invites.push(invite)
  writeTable(KEYS.invites, invites, storage)
  return invite
}

export function revokeInvite(code, storage) {
  ensureSeed(storage)
  const invites = readTable(KEYS.invites, storage).map((invite) => (
    invite.code === code && invite.status === 'valid' ? { ...invite, status: 'revoked' } : invite
  ))
  writeTable(KEYS.invites, invites, storage)
}

/** 校验邀请码：返回 { ok, reason?, invite? } */
export function validateInvite(code, type, storage) {
  ensureSeed(storage)
  const invites = readTable(KEYS.invites, storage)
  const invite = invites.find((item) => item.code === (code || '').trim())
  if (!invite) return { ok: false, reason: '邀请码无效，请核对后重试' }
  if (invite.type !== type) return { ok: false, reason: '邀请码类型不匹配，请使用正确的注册入口' }
  if (invite.status === 'used') return { ok: false, reason: '该邀请码已被使用，请联系管理员获取新邀请码' }
  if (invite.status === 'revoked') return { ok: false, reason: '该邀请码已被撤销，请联系管理员' }
  if (invite.expiresAt && new Date(`${invite.expiresAt}T23:59:59`) < new Date()) return { ok: false, reason: '该邀请码已过期，请联系管理员延期' }
  return { ok: true, invite }
}

export function listInvites(storage) {
  ensureSeed(storage)
  return [...readTable(KEYS.invites, storage)].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

// ==================== 注册申请 ====================

/** 提交注册申请（消耗邀请码，账号进入待审核状态） */
export function createApproval({ kind, name, email, phone = '', password, tenantId = null, tenantName = null, inviteCode }, storage) {
  ensureSeed(storage)
  const check = validateInvite(inviteCode, kind === 'tenant' ? 'tenant' : 'agent', storage)
  if (!check.ok) return { error: check.reason }
  if (kind === 'tenant' && !tenantName.trim()) return { error: '请输入机构名称' }
  if (kind === 'agent' && !check.invite.tenantId) return { error: '该客服邀请码未绑定机构，请联系机构管理员' }

  const approvals = readTable(KEYS.approvals, storage)
  const approval = {
    id: `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    kind,
    tenantId: kind === 'agent' ? check.invite.tenantId : tenantId,
    tenantName: kind === 'agent' ? check.invite.tenantName : tenantName.trim(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone,
    password,
    inviteCode: inviteCode.trim(),
    status: 'pending',
    platformApproval: 'pending', platformReviewedBy: null, platformReviewedAt: null,
    orgApproval: kind === 'agent' ? 'pending' : null, orgReviewedBy: null, orgReviewedAt: null,
    createdAt: nowText(),
    userId: null,
  }
  approvals.push(approval)
  writeTable(KEYS.approvals, approvals, storage)
  // 消耗邀请码，防止重复提交
  writeTable(KEYS.invites, readTable(KEYS.invites, storage).map((invite) => (
    invite.code === approval.inviteCode ? { ...invite, status: 'used', usedBy: approval.id } : invite
  )), storage)
  return { ok: true, approval }
}

export function listApprovals({ kind = null, tenantId = null } = {}, storage) {
  ensureSeed(storage)
  return readTable(KEYS.approvals, storage)
    .filter((approval) => (kind ? approval.kind === kind : true))
    .filter((approval) => (tenantId ? approval.tenantId === tenantId : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function findApprovalByEmail(email, storage) {
  ensureSeed(storage)
  return readTable(KEYS.approvals, storage).find((approval) => approval.email === (email || '').trim().toLowerCase()) || null
}

/**
 * 处理审核（两级审核状态机）
 *  - tenant 申请：仅 platform 端审核；通过即激活
 *  - agent 申请：org + platform 两端都通过才激活；任一端驳回即作废并释放邀请码
 */
export function updateApproval(id, { stage, decision, reviewedBy = '' }, storage) {
  ensureSeed(storage)
  const approvals = readTable(KEYS.approvals, storage)
  const index = approvals.findIndex((approval) => approval.id === id)
  if (index === -1) return { error: '申请不存在或已被处理' }
  const approval = approvals[index]
  if (approval.status !== 'pending') return { error: '该申请已处理，无需重复审核' }
  if (approval.kind === 'tenant' && stage !== 'platform') return { error: '机构入驻申请仅由平台管理员审核' }
  if (approval.kind === 'agent' && !['org', 'platform'].includes(stage)) return { error: '审核阶段不正确' }

  const next = {
    ...approval,
    [`${stage}Approval`]: decision,
    [`${stage}ReviewedBy`]: reviewedBy,
    [`${stage}ReviewedAt`]: nowText(),
  }

  if (decision === 'rejected') {
    next.status = 'rejected'
    // 驳回后释放邀请码，允许重新提交
    writeTable(KEYS.invites, readTable(KEYS.invites, storage).map((invite) => (
      invite.code === approval.inviteCode && invite.status === 'used' ? { ...invite, status: 'valid', usedBy: null } : invite
    )), storage)
  } else {
    const bothApproved = approval.kind === 'tenant' ? next.platformApproval === 'approved' : next.orgApproval === 'approved' && next.platformApproval === 'approved'
    if (bothApproved) {
      const user = activateUser(next, storage)
      next.status = 'active'
      next.userId = user.userId
    }
  }

  approvals[index] = next
  writeTable(KEYS.approvals, approvals, storage)
  return { status: next.status }
}

// ==================== 激活账号 ====================

function activateUser(approval, storage) {
  const users = readTable(KEYS.users, storage)
  const role = approval.kind === 'tenant' ? 'tenant_admin' : 'agent'
  const user = {
    userId: `USR-${approval.kind === 'tenant' ? 'TENANT' : 'AGENT'}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    name: approval.name,
    email: approval.email,
    password: approval.password,
    role,
    tenantId: approval.kind === 'tenant' ? `TENANT-${Math.floor(100 + Math.random() * 900)}` : approval.tenantId,
    tenantName: approval.tenantName,
    title: role === 'tenant_admin' ? '机构管理员' : '客服专员',
    status: 'active',
  }
  users.push(user)
  writeTable(KEYS.users, users, storage)
  return user
}

export function listUsers(storage) {
  ensureSeed(storage)
  return [...readTable(KEYS.users, storage)]
}

export function getUserByEmail(email, storage) {
  ensureSeed(storage)
  return readTable(KEYS.users, storage).find((user) => user.email === (email || '').trim().toLowerCase()) || null
}
