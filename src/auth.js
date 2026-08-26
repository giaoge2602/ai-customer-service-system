import { findApprovalByEmail, getUserByEmail } from './approvalData.js'

const API_BASE = '/api/v1'
const SERVICE_UNAVAILABLE_STATUSES = new Set([502, 503, 504])

// ==================== 后端 API 调用 ====================

async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
  } catch (cause) {
    const error = new Error('服务暂时不可用，请稍后重试')
    error.code = cause?.name === 'AbortError' ? 'REQUEST_ABORTED' : 'SERVICE_UNAVAILABLE'
    throw error
  }
  let body = {}
  try {
    body = await response.json()
  } catch {
    const contentType = response.headers.get('content-type') || ''
    const proxyUnavailable = response.status === 500 && !contentType.includes('application/json')
    const error = new Error(response.ok ? '服务返回格式异常' : `请求失败 (${response.status})`)
    error.code = isServiceUnavailableResponse(response.status) || proxyUnavailable ? 'SERVICE_UNAVAILABLE' : 'AUTH_REJECTED'
    throw error
  }
  if (!response.ok) {
    const error = new Error(body.message || `请求失败 (${response.status})`)
    error.code = isServiceUnavailableResponse(response.status, body) ? 'SERVICE_UNAVAILABLE' : 'AUTH_REJECTED'
    throw error
  }
  return body.data ?? body
}

export function isServiceUnavailableResponse(status, body = {}) {
  return SERVICE_UNAVAILABLE_STATUSES.has(status) || body?.code === 'SERVICE_UNAVAILABLE' || body?.errorCode === 'SERVICE_UNAVAILABLE'
}

/** 调用后端登录接口 */
export async function apiLogin(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return data
}

/** 注册客服坐席（写入 user 表） */
export async function registerAgent(payload) {
  return apiRequest('/auth/register/agent', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** 注册超级管理员（写入 user 表，无机构归属） */
export async function registerPlatformAdmin(payload) {
  return apiRequest('/auth/register/platform-admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** 注册机构管理员（选择已有机构，写入 user 表） */
export async function registerTenant(payload) {
  return apiRequest('/auth/register/tenant', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** 获取已入驻的机构列表（公开接口，供注册页选择） */
export async function fetchTenantOptions() {
  return apiRequest('/auth/tenants')
}

/** 注册客户（写入 customer 表） */
export async function registerCustomer(payload) {
  return apiRequest('/auth/register/customer', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ==================== 前端工具函数 ====================

export const DEMO_PASSWORD = 'Demo@2026'
export const INVITE_CODE = 'XH-2026-INVITE'
export const PASSWORD_RULE_MESSAGE = '密码需包含大小写字母和数字，且不少于 8 位'

export function validatePassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password) ? '' : PASSWORD_RULE_MESSAGE
}

export function isCurrentRequestGeneration(activeGeneration, requestGeneration) {
  return activeGeneration === requestGeneration
}

export function canCommitRequest(isMounted, activeGeneration, requestGeneration) {
  return isMounted && isCurrentRequestGeneration(activeGeneration, requestGeneration)
}

export const demoAccounts = [
  {
    userId: 'USR-PLATFORM-001',
    tenantId: null,
    role: 'platform_admin',
    permissions: ['platform:manage', 'tenant:switch'],
    name: '王敏',
    title: '超级管理员',
    email: 'admin@ai-service.demo',
    description: '管理机构、模型、配额与全局安全策略',
  },
  {
    userId: 'USR-TENANT-001',
    tenantId: 'TENANT-018',
    tenantName: '星河科技',
    role: 'tenant_admin',
    permissions: ['tenant:manage', 'service:operate'],
    name: '赵宁',
    title: '机构管理员',
    email: 'admin@xinghe.demo',
    description: '管理客服团队、知识库、渠道和运营规则',
  },
  {
    userId: 'USR-AGENT-001',
    tenantId: 'TENANT-018',
    tenantName: '星河科技',
    role: 'agent',
    permissions: ['conversation:handle', 'customer:read'],
    name: '李楠',
    title: '客服专员',
    email: 'lina@xinghe.demo',
    description: '接待会话、使用 AI 辅助并处理客户问题',
  },
  {
    userId: 'USR-CUSTOMER-001',
    tenantId: 'TENANT-018',
    tenantName: '星河科技',
    role: 'customer',
    permissions: ['customer:consult'],
    name: '陈晨',
    title: '客户',
    email: 'customer@xinghe.demo',
    description: '登录后发起在线咨询并查看自己的服务记录',
  },
]

export function authenticateDemo(email, password) {
  const account = demoAccounts.find((item) => item.email === email.trim().toLowerCase())
  if (account) {
    if (password !== DEMO_PASSWORD) {
      return { ok: false, error: '账号或密码错误，请检查后重试' }
    }
    const { description: _description, ...session } = account
    return { ok: true, session }
  }

  // 审核通过后激活的注册账号（机构管理员 / 客服）
  const user = getUserByEmail(email)
  if (user) {
    if (user.status !== 'active') {
      return { ok: false, error: '账号尚未激活，请等待审核通过后登录' }
    }
    if (password !== user.password) {
      return { ok: false, error: '账号或密码错误，请检查后重试' }
    }
    const { password: _password, status: _status, ...session } = user
    return { ok: true, session }
  }

  // 已提交但尚未激活的注册申请
  const approval = findApprovalByEmail(email)
  if (approval) {
    const error = approval.status === 'rejected'
      ? '注册申请已被驳回，请联系管理员后重新申请'
      : '账号尚未激活，请等待审核通过后登录'
    return { ok: false, error }
  }

  return { ok: false, error: '账号或密码错误，请检查后重试' }
}

export async function loginWithDemoFallback(email, password, request = apiLogin) {
  try {
    const data = await request(email, password)
    return {
      accessToken: data.accessToken,
      userId: data.user.id,
      tenantId: data.user.tenantId,
      tenantName: data.user.tenantName,
      role: data.user.role,
      name: data.user.name,
      email: data.user.email,
      title: data.user.role === 'platform_admin' ? '超级管理员' : data.user.role === 'tenant_admin' ? '机构管理员' : data.user.role === 'customer' ? '客户' : '客服专员',
      permissions: [],
    }
  } catch (error) {
    if (error.code !== 'SERVICE_UNAVAILABLE') throw error
    const demo = authenticateDemo(email, password)
    if (demo.ok) return demo.session
    throw error
  }
}

export const PORTAL_ROLES = {
  service: ['agent', 'customer'],
  admin: ['platform_admin', 'tenant_admin'],
}

export function resolvePortal(role) {
  return PORTAL_ROLES.admin.includes(role) ? 'admin' : 'service'
}

export function roleMatchesPortal(role, portal) {
  return PORTAL_ROLES[portal]?.includes(role) || false
}

export function resolveLoginPath(pathname) {
  return pathname.startsWith('/platform') || pathname.startsWith('/organization') || pathname.startsWith('/admin')
    ? '/admin/login'
    : '/service/login'
}

export function resolveLogoutPath(role) {
  return role === 'platform_admin' || role === 'tenant_admin' ? '/admin/login' : '/service/login'
}

export function resolveHome(role) {
  if (role === 'platform_admin') return '/platform/overview'
  if (role === 'tenant_admin') return '/organization/overview'
  if (role === 'customer') return '/customer/chat'
  return '/workbench'
}

export function canAccessPath(role, pathname) {
  if (pathname.startsWith('/platform')) return role === 'platform_admin'
  if (pathname.startsWith('/organization')) return role === 'platform_admin' || role === 'tenant_admin'
  if (pathname.startsWith('/customer')) return role === 'customer'
  if (pathname.startsWith('/workbench/customers')) return ['platform_admin', 'tenant_admin', 'agent'].includes(role)
  if (pathname.startsWith('/workbench/tickets')) return ['platform_admin', 'tenant_admin', 'agent'].includes(role)
  if (['/workbench/knowledge', '/workbench/settings'].some((path) => pathname.startsWith(path))) {
    return role === 'platform_admin' || role === 'tenant_admin'
  }
  if (pathname.startsWith('/workbench')) return ['platform_admin', 'tenant_admin', 'agent'].includes(role)
  return true
}

export function validateInvitation(values) {
  const errors = {}
  if (values.inviteCode.trim() !== INVITE_CODE) errors.inviteCode = '邀请码无效或已失效'
  if (!values.name.trim()) errors.name = '请输入姓名'
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = '请输入有效的工作邮箱'
  const passwordError = validatePassword(values.password)
  if (passwordError) errors.password = passwordError
  if (values.confirmPassword !== values.password) errors.confirmPassword = '两次输入的密码不一致'
  if (!values.agreed) errors.agreed = '请阅读并同意服务协议与隐私政策'
  return errors
}

export function validateRecoveryEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email.trim()) ? '' : '请输入有效的工作邮箱'
}

// ==================== 注册表单验证 ====================

export function validatePlatformAdminRegister(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = '请输入姓名'
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = '请输入有效的邮箱地址'
  const passwordError = validatePassword(values.password)
  if (passwordError) errors.password = passwordError
  if (values.confirmPassword !== values.password) errors.confirmPassword = '两次输入的密码不一致'
  if (!values.agreed) errors.agreed = '请阅读并同意服务协议'
  return errors
}

export function validateAgentRegister(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = '请输入姓名'
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = '请输入有效的邮箱地址'
  const passwordError = validatePassword(values.password)
  if (passwordError) errors.password = passwordError
  if (values.confirmPassword !== values.password) errors.confirmPassword = '两次输入的密码不一致'
  if (!values.inviteCode.trim()) errors.inviteCode = '请输入邀请码'
  if (!values.agreed) errors.agreed = '请阅读并同意服务协议'
  return errors
}

export function validateTenantRegister(values) {
  const errors = {}
  if (!values.tenantName.trim()) errors.tenantName = '请输入机构名称'
  if (!values.name.trim()) errors.name = '请输入管理员姓名'
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = '请输入有效的邮箱地址'
  const passwordError = validatePassword(values.password)
  if (passwordError) errors.password = passwordError
  if (values.confirmPassword !== values.password) errors.confirmPassword = '两次输入的密码不一致'
  if (!values.inviteCode.trim()) errors.inviteCode = '请输入邀请码'
  if (!values.agreed) errors.agreed = '请阅读并同意服务协议'
  return errors
}

export function validateCustomerRegister(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = '请输入姓名'
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = '请输入有效的邮箱地址'
  const passwordError = validatePassword(values.password)
  if (passwordError) errors.password = passwordError
  if (values.confirmPassword !== values.password) errors.confirmPassword = '两次输入的密码不一致'
  if (!values.source.trim()) errors.source = '请选择来源渠道'
  if (!values.tenantId.trim()) errors.tenantId = '请输入机构 ID'
  if (!values.agreed) errors.agreed = '请阅读并同意服务协议'
  return errors
}
