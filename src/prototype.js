const WORK_AREAS = new Set(['dashboard', 'knowledge', 'settings'])

const WORKSPACE_NAV_ITEMS = [
  { id: 'conversations', label: '会话工作台', path: '/workbench', icon: 'grid', badge: '12' },
  { id: 'dashboard', label: '客服看板', path: '/workbench/dashboard', icon: 'chart' },
  { id: 'knowledge', label: '知识库', path: '/workbench/knowledge', icon: 'book', roles: ['platform_admin', 'tenant_admin'] },
  { id: 'settings', label: 'AI 与界面配置', path: '/workbench/settings', icon: 'settings', roles: ['platform_admin', 'tenant_admin'] },
]

export function getAgentWorkspaceNav(role) {
  if (!['agent', 'platform_admin', 'tenant_admin'].includes(role)) return []
  return WORKSPACE_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}

export function getWorkArea(pathname) {
  const segment = pathname.split('/').filter(Boolean)[1]
  return WORK_AREAS.has(segment) ? segment : 'conversations'
}

const CHAT_TRANSITIONS = {
  welcome: { start: 'queued' },
  queued: { accept: 'handling' },
  handling: { finish: 'ended' },
  ended: { rate: 'evaluated' },
}

export function transitionChat(status, event) {
  return CHAT_TRANSITIONS[status]?.[event] || status
}

export function resolveServiceMode(time, schedule) {
  return time >= schedule.start && time < schedule.end ? 'human' : 'ai'
}

const CONFIG_KEY = 'ai-customer-service-prototype-config'
const DEFAULT_CONFIG = { welcome: '您好，欢迎咨询星河科技', theme: '#315bea', aiEnabled: true, start: '09:00', end: '18:00' }

export function loadPrototypeConfig(storage = globalThis.localStorage) {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(storage?.getItem(CONFIG_KEY) || '{}') }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function savePrototypeConfig(config, storage = globalThis.localStorage) {
  const next = { ...DEFAULT_CONFIG, ...config }
  storage?.setItem(CONFIG_KEY, JSON.stringify(next))
  return next
}
