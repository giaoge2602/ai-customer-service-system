import { useEffect, useState } from 'react'

import {
  createAiModel,
  disableAiModel,
  getPlatformAiUsage,
  getTenantAiPolicy,
  getTenantAiUsage,
  listAiModels,
  listTenantAiModels,
  testAiModel,
  updateAiModel,
  updateTenantAiPolicy,
} from '../aiApi'

const providerDefaults = {
  custom: { displayName: '', modelKey: '', baseUrl: '' },
  deepseek: { displayName: 'DeepSeek', modelKey: 'deepseek-chat', baseUrl: 'https://api.deepseek.com' },
  longcat: { displayName: 'LongCat 私有模型', modelKey: 'longcat', baseUrl: '' },
}
const PROVIDER_LABEL = { custom: '自定义', deepseek: 'DeepSeek', longcat: 'LongCat' }
const PROVIDER_LOGO = { custom: '自', deepseek: 'D', longcat: 'L' }

const emptyUsage = { summary: { total: 0, succeeded: 0, failed: 0, successRate: 0, totalTokens: 0, averageLatencyMs: 0 }, items: [] }

export function AiModelCenter({ onNotify }) {
  const [models, setModels] = useState([])
  const [usage, setUsage] = useState(emptyUsage)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState({ provider: 'custom', ...providerDefaults.custom, apiKey: '', timeoutMs: 30000, maxRetries: 2 })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [modelRows, usageData] = await Promise.all([listAiModels(), getPlatformAiUsage()])
      setModels(modelRows)
      setUsage(usageData)
      setError('')
    } catch (requestError) { setError(requestError.message) }
  }
  useEffect(() => { load() }, [])

  const changeProvider = (provider) => setForm((current) => ({ ...current, provider, ...providerDefaults[provider] }))
  const reset = () => { setEditingId(''); setForm({ provider: 'custom', ...providerDefaults.custom, apiKey: '', timeoutMs: 30000, maxRetries: 2 }) }
  const save = async (event) => {
    event.preventDefault()
    try {
      const payload = { ...form, timeoutMs: Number(form.timeoutMs), maxRetries: Number(form.maxRetries) }
      if (!payload.displayName || !payload.displayName.trim()) delete payload.displayName
      if (editingId && !payload.apiKey) delete payload.apiKey
      if (editingId) await updateAiModel(editingId, payload)
      else await createAiModel(payload)
      onNotify(editingId ? '模型配置已更新并写入审计' : '模型已接入并写入审计')
      reset(); await load()
    } catch (requestError) { setError(requestError.message) }
  }
  const edit = (model) => {
    setEditingId(model.id)
    setForm({ provider: model.provider, displayName: model.displayName, modelKey: model.modelKey, baseUrl: model.baseUrl, apiKey: '', timeoutMs: model.timeoutMs, maxRetries: model.maxRetries })
  }

  return <div className="ai-management">
    <div className="ai-usage-grid">
      {[['累计调用', usage.summary.total], ['成功率', `${usage.summary.successRate}%`], ['Token 用量', usage.summary.totalTokens.toLocaleString()], ['平均耗时', `${usage.summary.averageLatencyMs} ms`]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
    </div>
    {error && <div className="admin-demo-notice danger">{error}</div>}
    <div className="ai-management-grid">
      <section className="admin-surface ai-model-list"><div className="surface-head"><div><h2>已接入模型</h2><p>任意 OpenAI 兼容接口（DeepSeek 云端、LongCat 私有化、聚合平台均可）</p></div></div>
        {models.length === 0 && <div className="ai-empty">尚未配置模型，请在右侧填写接口地址与密钥。</div>}
        {models.map((model) => <article className="ai-model-row" key={model.id}><div className="model-logo">{PROVIDER_LOGO[model.provider] || '自'}</div><div><strong>{model.displayName}</strong><span>{PROVIDER_LABEL[model.provider] || model.provider} · {model.modelKey}</span><small>{model.baseUrl} · 密钥 {model.apiKeyMasked}</small></div><span className={`ai-status ${model.status}`}>{model.status === 'active' ? '已启用' : '已停用'}</span><div className="table-actions"><button className="table-action" onClick={() => edit(model)}>编辑</button><button className="table-action" onClick={async () => { try { const result = await testAiModel(model.id); onNotify(`连接成功，耗时 ${result.latencyMs} ms`) } catch (e) { setError(e.message) } }}>测试</button>{model.status === 'active' && <button className="table-action danger-text" onClick={async () => { await disableAiModel(model.id); onNotify('模型已停用'); load() }}>停用</button>}</div></article>)}
      </section>
      <form className="admin-surface ai-config-form" onSubmit={save}><div className="surface-head"><div><h2>{editingId ? '编辑模型' : '接入自定义模型'}</h2><p>与编程 Agent 的自定义模型接入一致：填接口地址、密钥、模型 ID 三项即可</p></div></div>
        <label>接口类型<select value={form.provider} onChange={(e) => changeProvider(e.target.value)}><option value="custom">自定义（任意 OpenAI 兼容接口）</option><option value="deepseek">DeepSeek（快速填充）</option><option value="longcat">LongCat 私有化（快速填充）</option></select></label>
        <label>API 地址（Base URL）<input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.deepseek.com" required /></label>
        <label>模型 ID<input value={form.modelKey} onChange={(e) => setForm({ ...form, modelKey: e.target.value })} placeholder="deepseek-chat / gpt-4o-mini / 内网模型名" required /></label>
        <label>API Key<input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder={editingId ? '留空表示不更换' : 'sk-… 密钥加密存储，仅显示末四位'} required={!editingId} /></label>
        <label>显示名称（留空则使用模型 ID）<input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="例如：DeepSeek 主力模型" /></label>
        <div className="ai-form-pair"><label>超时（毫秒）<input type="number" min="1000" max="120000" value={form.timeoutMs} onChange={(e) => setForm({ ...form, timeoutMs: e.target.value })}/></label><label>失败重试<input type="number" min="0" max="5" value={form.maxRetries} onChange={(e) => setForm({ ...form, maxRetries: e.target.value })}/></label></div>
        <div className="dialog-actions">{editingId && <button type="button" className="admin-secondary-btn" onClick={reset}>取消</button>}<button className="admin-primary-btn" type="submit">{editingId ? '保存修改' : '接入模型'}</button></div>
      </form>
    </div>
  </div>
}

export function TenantAiCenter({ onNotify }) {
  const [models, setModels] = useState([])
  const [usage, setUsage] = useState(emptyUsage)
  const [policy, setPolicy] = useState(null)
  const [error, setError] = useState('')
  const load = async () => {
    try {
      const [available, current, usageData] = await Promise.all([listTenantAiModels(), getTenantAiPolicy(), getTenantAiUsage()])
      setModels(available); setUsage(usageData)
      setPolicy({ ...current, temperature: Number(current.temperature), handoffKeywordsText: (current.handoffKeywords || []).join('，') })
      setError('')
    } catch (requestError) { setError(requestError.message) }
  }
  useEffect(() => { load() }, [])
  if (!policy) return <div className="ai-empty">{error || '正在加载 AI 客服策略…'}</div>
  const save = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        enabled: policy.enabled,
        ...(policy.modelId ? { modelId: policy.modelId } : {}),
        systemPrompt: policy.systemPrompt,
        knowledgeRules: policy.knowledgeRules,
        temperature: Number(policy.temperature),
        maxTokens: Number(policy.maxTokens),
        handoffKeywords: policy.handoffKeywordsText.split(/[，,]/).map((item) => item.trim()).filter(Boolean),
        perMinuteLimit: Number(policy.perMinuteLimit),
        maxConcurrent: Number(policy.maxConcurrent),
      }
      await updateTenantAiPolicy(payload); onNotify('AI 客服策略已保存并写入审计'); await load()
    } catch (requestError) { setError(requestError.message) }
  }
  return <div className="ai-management">
    <div className="ai-usage-grid">{[['本机构调用', usage.summary.total], ['成功率', `${usage.summary.successRate}%`], ['Token 用量', usage.summary.totalTokens.toLocaleString()], ['失败调用', usage.summary.failed]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    {error && <div className="admin-demo-notice danger">{error}</div>}
    <div className="ai-management-grid tenant">
      <form className="admin-surface ai-config-form" onSubmit={save}><div className="surface-head"><div><h2>AI 客服策略</h2><p>配置机构使用的模型、回答边界与转人工规则</p></div><label className="ai-switch"><input type="checkbox" checked={policy.enabled} onChange={(e) => setPolicy({ ...policy, enabled: e.target.checked })}/><span>{policy.enabled ? '已启用' : '未启用'}</span></label></div>
        <label>接待模型<select value={policy.modelId || ''} onChange={(e) => setPolicy({ ...policy, modelId: e.target.value })}><option value="">请选择平台已启用模型</option>{models.map((model) => <option value={model.id} key={model.id}>{model.displayName} · {model.provider}</option>)}</select></label>
        <label>系统提示词<textarea rows="5" value={policy.systemPrompt} onChange={(e) => setPolicy({ ...policy, systemPrompt: e.target.value })}/></label>
        <label>机构知识规则<textarea rows="6" value={policy.knowledgeRules} onChange={(e) => setPolicy({ ...policy, knowledgeRules: e.target.value })} placeholder="填写产品政策、服务流程和可确认的业务知识；AI 只会据此回答。"/></label>
        <label>强制转人工关键词<input value={policy.handoffKeywordsText} onChange={(e) => setPolicy({ ...policy, handoffKeywordsText: e.target.value })} placeholder="退款执行，修改订单，投诉升级"/></label>
        <div className="ai-form-pair"><label>温度<input type="number" min="0" max="1" step="0.1" value={policy.temperature} onChange={(e) => setPolicy({ ...policy, temperature: e.target.value })}/></label><label>最大输出 Token<input type="number" min="64" max="4000" value={policy.maxTokens} onChange={(e) => setPolicy({ ...policy, maxTokens: e.target.value })}/></label></div>
        <div className="ai-form-pair"><label>每分钟上限<input type="number" min="1" max="300" value={policy.perMinuteLimit} onChange={(e) => setPolicy({ ...policy, perMinuteLimit: e.target.value })}/></label><label>最大并发<input type="number" min="1" max="20" value={policy.maxConcurrent} onChange={(e) => setPolicy({ ...policy, maxConcurrent: e.target.value })}/></label></div>
        <button className="admin-primary-btn" type="submit">保存 AI 客服策略</button>
      </form>
      <section className="admin-surface ai-model-list"><div className="surface-head"><div><h2>实时调用记录</h2><p>最近100次模型调用，不显示客户完整问题</p></div></div>{usage.items.length === 0 && <div className="ai-empty">暂无模型调用记录</div>}{usage.items.slice(0, 12).map((item) => <article className="ai-invocation-row" key={item.id}><div><strong>{item.model?.displayName || '模型调用'}</strong><span>会话 {item.conversationId.slice(0, 8)}…</span></div><span className={`ai-status ${item.status}`}>{item.status}</span><small>{item.totalTokens} tokens · {item.latencyMs ?? '—'} ms</small></article>)}</section>
    </div>
  </div>
}
