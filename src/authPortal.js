const portalCopy = {
  service: {
    systemName: 'AI 智能客服系统',
    systemSubtitle: 'Service & Customer Cloud',
    eyebrow: '服务接待与在线咨询',
    accentClass: 'auth-portal-service',
    storyTitle: '让每一次客户咨询，\n都得到专业回应。',
    storyDescription: '统一会话、知识与人工服务，在安全的机构边界内持续提升客户体验。',
    loginTitle: '登录服务中心',
    loginDescription: '使用客服或客户账号继续访问服务中心。',
    registerTitle: '加入客服服务中心',
    registerDescription: '使用受邀的客服入口创建服务中心账号。',
    recoveryTitle: '找回服务中心密码',
    recoveryDescription: '输入绑定邮箱，我们会发送密码重置指引。',
    routes: { login: '/service/login', register: '/service/register', recovery: '/service/forgot-password' },
    crossPortal: { href: '/admin/login', label: '前往平台与机构管理系统' },
    metrics: [['78.4%', 'AI 解决率'], ['全天候', '咨询服务'], ['99.95%', '服务可用性']],
  },
  admin: {
    systemName: 'AI 智能客服管理系统',
    systemSubtitle: 'Platform Management Cloud',
    eyebrow: '平台运营与机构管理',
    accentClass: 'auth-portal-admin',
    storyTitle: '让平台运营与机构管理，\n保持清晰可控。',
    storyDescription: '统一管理机构、团队与服务配置，在可审计的边界内稳定运营。',
    loginTitle: '登录管理中心',
    loginDescription: '使用平台或机构管理员账号继续访问管理中心。',
    registerTitle: '注册机构管理账号',
    registerDescription: '使用受控的机构管理员入口创建管理中心账号。',
    recoveryTitle: '找回管理中心密码',
    recoveryDescription: '输入绑定邮箱，我们会发送密码重置指引。',
    routes: { login: '/admin/login', register: '/admin/register', recovery: '/admin/forgot-password' },
    crossPortal: { href: '/service/login', label: '前往客服与用户系统' },
    metrics: [['24', '在线机构'], ['78.4%', 'AI 解决率'], ['99.95%', '服务可用性']],
  },
}

const portalCategories = {
  service: [
    { key: 'agent', role: 'agent', icon: 'headset', title: '客服坐席', loginLabel: '客服登录', description: '加入已有机构，接待客户咨询', table: 'user 表' },
    { key: 'customer', role: 'customer', icon: 'user', title: '客户', loginLabel: '用户登录', description: '注册为机构客户，发起在线咨询', table: 'customer 表' },
  ],
  admin: [
    { key: 'platform', role: 'platform_admin', icon: 'shield', title: '超级管理员', loginLabel: '超级管理员', description: '管理机构、配额与全局配置', table: 'user 表' },
    { key: 'tenant', role: 'tenant_admin', icon: 'building', title: '机构管理员', loginLabel: '机构管理员', description: '管理客服团队与服务配置', table: 'user 表' },
  ],
}

export function getPortalCopy(portal) {
  return portalCopy[portal] || portalCopy.service
}

export function getPortalCategories(portal) {
  return portalCategories[portal] || portalCategories.service
}
