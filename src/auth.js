export const DEMO_PASSWORD = 'Demo@2026'
export const INVITE_CODE = 'XH-2026-INVITE'

export const demoAccounts = [
  {
    userId: 'USR-PLATFORM-001',
    tenantId: null,
    role: 'platform_admin',
    permissions: ['platform:manage', 'tenant:switch'],
    name: '王敏',
    title: '超级管理员',
    email: 'admin@ai-service.demo',
    description: '管理租户、模型、配额与全局安全策略',
  },
  {
    userId: 'USR-TENANT-001',
    tenantId: 'TENANT-018',
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
    role: 'agent',
    permissions: ['conversation:handle', 'customer:read'],
    name: '李楠',
    title: '客服专员',
    email: 'lina@xinghe.demo',
    description: '接待会话、使用 AI 辅助并处理客户问题',
  },
]

export function authenticateDemo(email, password) {
  const account = demoAccounts.find((item) => item.email === email.trim().toLowerCase())
  if (!account || password !== DEMO_PASSWORD) {
    return { ok: false, error: '账号或密码错误，请检查后重试' }
  }

  const { description: _description, ...session } = account
  return { ok: true, session }
}

export function resolveHome(role) {
  if (role === 'platform_admin') return '/platform/overview'
  if (role === 'tenant_admin') return '/organization/overview'
  return '/workbench'
}

export function canAccessPath(role, pathname) {
  if (pathname.startsWith('/platform')) return role === 'platform_admin'
  if (pathname.startsWith('/organization')) return role === 'platform_admin' || role === 'tenant_admin'
  if (pathname.startsWith('/workbench')) return ['platform_admin', 'tenant_admin', 'agent'].includes(role)
  return true
}

export function validateInvitation(values) {
  const errors = {}
  if (values.inviteCode.trim() !== INVITE_CODE) errors.inviteCode = '邀请码无效或已失效'
  if (!values.name.trim()) errors.name = '请输入姓名'
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = '请输入有效的工作邮箱'
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(values.password)) {
    errors.password = '密码需包含大小写字母和数字，且不少于 8 位'
  }
  if (values.confirmPassword !== values.password) errors.confirmPassword = '两次输入的密码不一致'
  if (!values.agreed) errors.agreed = '请阅读并同意服务协议与隐私政策'
  return errors
}

export function validateRecoveryEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email.trim()) ? '' : '请输入有效的工作邮箱'
}
