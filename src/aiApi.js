import { authRequest } from './api.js'

export const listAiModels = () => authRequest('/platform/ai-models')
export const createAiModel = (input) => authRequest('/platform/ai-models', { method: 'POST', body: JSON.stringify(input) })
export const updateAiModel = (id, input) => authRequest(`/platform/ai-models/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
export const disableAiModel = (id) => authRequest(`/platform/ai-models/${id}`, { method: 'DELETE' })
export const testAiModel = (id) => authRequest(`/platform/ai-models/${id}/test`, { method: 'POST' })
export const getPlatformAiUsage = () => authRequest('/platform/ai-models/usage/summary')

export const listTenantAiModels = () => authRequest('/tenant/ai/models')
export const getTenantAiPolicy = () => authRequest('/tenant/ai/policy')
export const updateTenantAiPolicy = (input) => authRequest('/tenant/ai/policy', { method: 'PUT', body: JSON.stringify(input) })
export const getTenantAiUsage = () => authRequest('/tenant/ai/usage')

export const takeoverConversationByAi = (id) => authRequest(`/conversations/${id}/ai/takeover`, { method: 'POST' })
export const reclaimConversationFromAi = (id) => authRequest(`/conversations/${id}/ai/reclaim`, { method: 'POST' })
