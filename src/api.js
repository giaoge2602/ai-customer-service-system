export const API_BASE = '/api/v1'
const SESSION_KEY = 'ai-customer-service-session'

export function readAccessToken() {
  try {
    const session = JSON.parse(window.sessionStorage.getItem(SESSION_KEY))
    return session?.accessToken || ''
  } catch {
    return ''
  }
}

export async function authRequest(path, options = {}) {
  const token = readAccessToken()
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    })
  } catch {
    throw new Error('服务暂时不可用，请稍后重试')
  }
  let body = {}
  try {
    body = await response.json()
  } catch {
    throw new Error(response.ok ? '服务返回格式异常' : `请求失败 (${response.status})`)
  }
  if (!response.ok) {
    throw new Error(body.message || `请求失败 (${response.status})`)
  }
  return body.data ?? body
}

// ==================== 客服坐席管理（F-006） ====================

export async function fetchAgents(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.pageSize) query.set('pageSize', params.pageSize)
  if (params.search) query.set('search', params.search)
  if (params.tenantId) query.set('tenantId', params.tenantId)
  const suffix = query.toString() ? `?${query}` : ''
  return authRequest(`/agents${suffix}`)
}

export async function updateAgentStatus(id, status) {
  return authRequest(`/agents/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// ==================== 机构管理（F-002） ====================

export async function fetchTenants(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.pageSize) query.set('pageSize', params.pageSize)
  if (params.search) query.set('search', params.search)
  const suffix = query.toString() ? `?${query}` : ''
  return authRequest(`/tenants${suffix}`)
}

export async function updateTenantStatus(id, status) {
  return authRequest(`/tenants/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function createTenant(payload) {
  return authRequest('/tenants', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateTenant(id, payload) {
  return authRequest(`/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ==================== 客户管理中心（超级管理员） ====================

export async function fetchCustomers(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.pageSize) query.set('pageSize', params.pageSize)
  if (params.search) query.set('search', params.search)
  if (params.tenantId) query.set('tenantId', params.tenantId)
  const suffix = query.toString() ? `?${query}` : ''
  return authRequest(`/customers${suffix}`)
}

export async function fetchCustomer(id, tenantId) {
  return authRequest(`/customers/${id}?tenantId=${encodeURIComponent(tenantId)}`)
}

export async function createCustomer(payload) {
  return authRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateCustomer(id, payload, tenantId) {
  return authRequest(`/customers/${id}?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteCustomer(id, tenantId) {
  return authRequest(`/customers/${id}?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'DELETE',
  })
}
