import { useEffect, useState } from 'react'
import { createCustomer, deleteCustomer, fetchCustomer, fetchCustomers, fetchTenants, updateCustomer } from '../api'
import { getConversation, listConversations } from '../conversationApi'

const LEVELS = ['普通客户', 'VIP 客户', '高价值客户', '新客户']
const SOURCES = ['web', 'wechat', 'wecom', 'h5', 'api']
const SOURCE_TEXT = { web: '网页', wechat: '微信', wecom: '企业微信', h5: 'H5', api: 'API' }
const STATUS_PILL = { queued: ['warning', '待接管'], human: ['success', '处理中'], ended: ['muted', '已结束'], evaluated: ['muted', '已评价'] }
const EMPTY_FORM = { name: '', phone: '', email: '', source: 'web', level: '普通客户', tags: '' }

const fmtTime = (iso) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return String(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
}

/** 平台端 · 客户管理中心：跨机构查询客户档案，支持增删改查与历史会话追溯 */
export default function CustomerCenter({ onNotify }) {
  const [tenants, setTenants] = useState([])
  const [tenantId, setTenantId] = useState('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(null)      // null | { mode, customer?, name, phone, email, source, level, tags }
  const [detail, setDetail] = useState(null)  // 详情弹层中的客户（含详情接口补全的字段）
  const [conversations, setConversations] = useState([])
  const [convLoading, setConvLoading] = useState(false)
  const [openConv, setOpenConv] = useState(null) // { id, messages | null }

  const pageSize = 10

  useEffect(() => {
    fetchTenants({ page: 1, pageSize: 50 })
      .then((result) => {
        setTenants(result.items || [])
        if (result.items?.length) setTenantId((current) => current || result.items[0].id)
      })
      .catch((err) => onNotify(err.message))
  }, [])

  const loadCustomers = (targetPage = page, keyword = appliedSearch, targetTenant = tenantId) => {
    if (!targetTenant) return
    setLoading(true)
    fetchCustomers({ tenantId: targetTenant, page: targetPage, pageSize, search: keyword || undefined })
      .then((result) => {
        setRows(result.items || [])
        setTotal(result.total || 0)
      })
      .catch((err) => onNotify(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCustomers(page, appliedSearch) }, [tenantId, page, appliedSearch])

  const runSearch = () => { setPage(1); setAppliedSearch(search.trim()) }

  const resetSearch = () => { setSearch(''); setAppliedSearch(''); setPage(1) }

  /** 打开详情弹层：拉取完整档案 + 该客户的全部历史会话 */
  const openDetail = (row) => {
    setDetail(row)
    setOpenConv(null)
    setConversations([])
    setConvLoading(true)
    fetchCustomer(row.id, tenantId)
      .then((full) => setDetail((current) => (current?.id === row.id ? full : current)))
      .catch((err) => onNotify(err.message))
    listConversations({ tenantId, customerId: row.id, page: 1, pageSize: 20 })
      .then((result) => setConversations(result.items || []))
      .catch((err) => onNotify(err.message))
      .finally(() => setConvLoading(false))
  }

  const openConversationMessages = async (conv) => {
    if (openConv?.id === conv.id) { setOpenConv(null); return }
    setOpenConv({ id: conv.id, messages: null })
    try {
      const convDetail = await getConversation(conv.id, tenantId)
      setOpenConv({ id: conv.id, messages: convDetail.messages || [] })
    } catch (err) {
      onNotify(err.message)
      setOpenConv(null)
    }
  }

  const submitForm = async () => {
    if (!form) return
    if (!form.name.trim()) { onNotify('请填写客户姓名'); return }
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      source: form.source,
      level: form.level,
      tags: form.tags.split(/[,，\s]+/).filter(Boolean),
      tenantId,
    }
    try {
      if (form.mode === 'create') {
        await createCustomer(payload)
        onNotify('客户已创建')
      } else {
        const { tenantId: _scoped, ...patch } = payload
        await updateCustomer(form.customer.id, patch, tenantId)
        onNotify('客户信息已更新')
      }
      setForm(null)
      loadCustomers()
    } catch (err) {
      onNotify(err.message)
    }
  }

  const removeCustomer = async (row) => {
    if (!window.confirm(`确认删除客户「${row.name}」吗？档案将隐藏（软删除），历史会话仍可追溯。`)) return
    try {
      await deleteCustomer(row.id, tenantId)
      onNotify('客户已删除（软删除）')
      if (rows.length === 1 && page > 1) setPage(page - 1)
      else loadCustomers()
    } catch (err) {
      onNotify(err.message)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="customer-center">
      <div className="cc-toolbar">
        <label className="cc-org">机构
          <select value={tenantId} onChange={(event) => { setTenantId(event.target.value); setPage(1) }}>
            {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name || tenant.id}</option>)}
          </select>
        </label>
        <div className="admin-search">⌕<input aria-label="搜索客户" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runSearch()} placeholder="搜索姓名、手机号或邮箱" /></div>
        <button type="button" className="admin-primary-btn" onClick={runSearch}>查询</button>
        <button type="button" className="admin-secondary-btn" onClick={resetSearch}>重置</button>
        <span className="cc-gap" />
        <button type="button" className="admin-primary-btn" onClick={() => setForm({ mode: 'create', ...EMPTY_FORM })}>＋ 新增客户</button>
      </div>
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>客户</th><th>联系方式</th><th>等级</th><th>来源</th><th>标签</th><th>最近联系</th><th>操作</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><strong className="table-name">{row.name}<small>{row.id}</small></strong></td>
                <td><strong className="table-name">{row.phone || '—'}<small>{row.email || '—'}</small></strong></td>
                <td><span className={`admin-pill ${row.level?.includes('VIP') || row.level?.includes('高价值') ? 'purple' : 'muted'}`}>{row.level || '普通客户'}</span></td>
                <td>{SOURCE_TEXT[row.source] || row.source}</td>
                <td><div className="tag-inline">{(row.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div></td>
                <td>{fmtTime(row.lastContactAt || row.updatedAt)}</td>
                <td><span className="table-actions">
                  <button type="button" className="table-action" onClick={() => openDetail(row)}>详情</button>
                  <button type="button" className="table-action" onClick={() => setForm({ mode: 'edit', customer: row, name: row.name || '', phone: row.phone || '', email: row.email || '', source: row.source || 'web', level: row.level || '普通客户', tags: (row.tags || []).join(', ') })}>编辑</button>
                  <button type="button" className="table-action" onClick={() => removeCustomer(row)}>删除</button>
                </span></td>
              </tr>
            ))}
            {(loading || rows.length === 0) && <tr><td colSpan={7} className="cc-empty">{loading ? '正在加载客户…' : `没有匹配的客户${appliedSearch ? `（关键词：${appliedSearch}）` : ''}`}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="cc-pagination">
        <span>共 {total} 位客户 · 第 {page}/{totalPages} 页</span>
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
      </div>

      {form && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setForm(null)}>
          <section className="admin-modal" role="dialog" aria-modal="true" aria-label={form.mode === 'create' ? '新增客户' : '编辑客户'}>
            <div className="admin-modal-head"><h2>{form.mode === 'create' ? '新增客户' : '编辑客户'}</h2><button type="button" className="admin-icon-btn" aria-label="关闭" onClick={() => setForm(null)}>×</button></div>
            <div className="cc-form-grid">
              <label>客户姓名 *<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="客户姓名" /></label>
              <label>手机号<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="13800000000" /></label>
              <label>邮箱<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" /></label>
              <label>客户等级<select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>{LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
              <label>来源渠道<select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>{SOURCES.map((source) => <option key={source} value={source}>{SOURCE_TEXT[source]}</option>)}</select></label>
              <label>标签（逗号分隔）<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="VIP客户, 售前咨询" /></label>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-secondary-btn" onClick={() => setForm(null)}>取消</button>
              <button type="button" className="admin-primary-btn" onClick={submitForm}>{form.mode === 'create' ? '创建客户' : '保存修改'}</button>
            </div>
          </section>
        </div>
      )}

      {detail && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}>
          <section className="admin-modal cc-detail" role="dialog" aria-modal="true" aria-label="客户详情">
            <div className="admin-modal-head"><h2>客户详情 · {detail.name}</h2><button type="button" className="admin-icon-btn" aria-label="关闭" onClick={() => setDetail(null)}>×</button></div>
            <div className="cc-detail-grid">
              <div><span>客户 ID</span><strong>{detail.id}</strong></div>
              <div><span>客户等级</span><strong>{detail.level || '—'}</strong></div>
              <div><span>来源渠道</span><strong>{SOURCE_TEXT[detail.source] || detail.source || '—'}</strong></div>
              <div><span>手机号</span><strong>{detail.phone || '—'}</strong></div>
              <div><span>邮箱</span><strong>{detail.email || '—'}</strong></div>
              <div><span>隐私授权</span><strong>{detail.consentStatus === 'granted' ? '已授权' : detail.consentStatus || '—'}</strong></div>
              <div><span>注册时间</span><strong>{fmtTime(detail.createdAt)}</strong></div>
              <div><span>最近联系</span><strong>{fmtTime(detail.lastContactAt || detail.updatedAt)}</strong></div>
              <div><span>历史会话</span><strong>{convLoading ? '加载中…' : `${conversations.length} 条`}</strong></div>
              <div className="cc-span"><span>客户标签</span><strong>{(detail.tags || []).join('、') || '—'}</strong></div>
            </div>
            <h3>历史会话记录 <small>点击「查看消息」定位到该客户的具体对话内容</small></h3>
            <div className="cc-convs">
              {convLoading && <p className="cc-hint">正在加载会话记录…</p>}
              {!convLoading && conversations.length === 0 && <p className="cc-hint">该客户暂无会话记录</p>}
              {conversations.map((conv) => (
                <div className="cc-conv-block" key={conv.id}>
                  <div className="cc-conv-row">
                    <div className="cc-conv-main">
                      <strong>{conv.id}</strong>
                      <span>{SOURCE_TEXT[conv.channel] || conv.channel || '未知渠道'} · {conv.agent?.name ? `接待客服 ${conv.agent.name}` : '未分配客服'} · {conv.messages?.length ? `${conv.messages.length} 条消息` : '未加载消息'}</span>
                    </div>
                    <span className={`admin-pill ${STATUS_PILL[conv.status]?.[0] || 'muted'}`}>{STATUS_PILL[conv.status]?.[1] || conv.status}</span>
                    <span className="cc-conv-time">{fmtTime(conv.lastMessageAt || conv.updatedAt)}</span>
                    <button type="button" className="table-action" onClick={() => openConversationMessages(conv)}>{openConv?.id === conv.id ? '收起消息' : '查看消息'}</button>
                  </div>
                  {openConv?.id === conv.id && (
                    <div className="cc-conv-msgs">
                      {openConv.messages === null && <p>正在加载消息…</p>}
                      {openConv.messages?.length === 0 && <p>该会话暂无消息</p>}
                      {openConv.messages?.map((message) => <p key={message.id}><b>{message.senderType === 'customer' ? '客户' : message.senderType === 'agent' ? '客服' : message.senderType === 'ai' ? 'AI 助手' : '系统'} {fmtTime(message.createdAt)}</b>{message.content}</p>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
