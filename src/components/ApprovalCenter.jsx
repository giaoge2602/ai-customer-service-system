import { useEffect, useState } from 'react'
import { createInvite, listApprovals, listInvites, revokeInvite, updateApproval } from '../approvalData.js'

const STAGE_LABEL = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
const STAGE_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' }
const INVITE_STATUS_LABEL = { valid: '有效', used: '已使用', revoked: '已撤销' }
const INVITE_STATUS_TONE = { valid: 'success', used: 'muted', revoked: 'danger' }
const TYPE_LABEL = { tenant: '机构入驻', agent: '客服入职' }

function Pill({ tone = 'muted', children }) {
  return <span className={`admin-pill ${tone}`}>{children}</span>
}

function StatusPill({ value }) {
  return <Pill tone={STAGE_TONE[value] || 'muted'}>{STAGE_LABEL[value] || value}</Pill>
}

function SectionTitle({ title, subtitle }) {
  return <div className="admin-section-head"><div><h2>{title}</h2><p>{subtitle}</p></div></div>
}

function ActionButtons({ approval, isPlatform, onDecide }) {
  const myStage = isPlatform ? 'platform' : 'org'
  const myApproval = approval[`${myStage}Approval`]
  if (approval.status !== 'pending') return <span className="approval-done">已处理</span>
  if (myApproval !== 'pending') return <span className="approval-waiting">等待另一方审核</span>
  return <span className="approval-actions">
    <button type="button" className="approval-approve" onClick={() => onDecide(approval.id, 'approved')}>通过</button>
    <button type="button" className="approval-reject" onClick={() => onDecide(approval.id, 'rejected')}>驳回</button>
  </span>
}

/**
 * 注册审核中心
 * mode='platform'     → 超管：机构入驻审核 + 机构邀请码管理（客服注册由机构单级审核，超管不再参与）
 * mode='organization' → 机构管理员：本机构客服审核（机构端通过即激活）+ 客服邀请码管理
 */
export default function ApprovalCenter({ mode, session, onNotify }) {
  const isPlatform = mode === 'platform'
  const tenantId = session.tenantId || null
  const [tab, setTab] = useState(isPlatform ? 'tenant' : 'agent')
  const [invites, setInvites] = useState([])
  const [approvals, setApprovals] = useState([])
  const [inviteDescription, setInviteDescription] = useState('')

  const reload = () => {
    setInvites(listInvites())
    setApprovals(listApprovals(isPlatform ? { kind: 'tenant' } : { kind: 'agent', tenantId }))
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, tenantId])

  const decide = (id, decision) => {
    const result = updateApproval(id, { stage: isPlatform ? 'platform' : 'org', decision, reviewedBy: session.name })
    if (result.error) {
      onNotify(result.error)
      return
    }
    reload()
    if (result.status === 'active') onNotify('审核通过，账号已激活，可以登录了')
    else if (result.status === 'rejected') onNotify('已驳回该申请，邀请码已释放')
    else onNotify(decision === 'approved' ? '已通过审核' : '已驳回该申请')
  }

  const generateInvite = (event) => {
    event.preventDefault()
    const invite = createInvite({
      type: isPlatform ? 'tenant' : 'agent',
      tenantId: isPlatform ? null : tenantId,
      tenantName: isPlatform ? null : session.tenantName || '',
      issuedBy: session.name,
      description: inviteDescription.trim() || (isPlatform ? '机构入驻' : '客服入职'),
    })
    setInviteDescription('')
    reload()
    onNotify(`已生成邀请码 ${invite.code}，请复制发给申请人`)
  }

  const revoke = (code) => {
    revokeInvite(code)
    reload()
    onNotify('邀请码已撤销')
  }

  const pendingTenants = approvals.filter((a) => a.kind === 'tenant')
  const pendingAgents = approvals.filter((a) => a.kind === 'agent')
  const waitingCount = approvals.filter((a) => a.status === 'pending' && a[`${isPlatform ? 'platform' : 'org'}Approval`] === 'pending').length

  const tabs = isPlatform
    ? [['tenant', `机构入驻审核`, pendingTenants.length], ['invites', '邀请码管理']]
    : [['agent', `客服注册审核`, waitingCount], ['invites', '邀请码管理']]

  return (
    <div className="approval-center">
      <div className="approval-tabs" role="tablist" aria-label="审核中心">
        {tabs.map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`approval-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}{typeof count === 'number' && <b className={count > 0 ? 'hot' : ''}>{count}</b>}
          </button>
        ))}
      </div>

      {tab === 'tenant' && (
        <section className="approval-panel">
          <SectionTitle title="机构入驻申请" subtitle="提交机构信息与平台邀请码后进入审核，通过后创建机构并激活管理员账号" />
          <div className="table-wrap">
            <table className="admin-table approval-table">
              <caption className="sr-only">机构入驻申请列表</caption>
              <thead>
                <tr><th>机构名称</th><th>管理员</th><th>邮箱</th><th>邀请码</th><th>提交时间</th><th>平台审核</th><th>操作</th></tr>
              </thead>
              <tbody>
                {pendingTenants.map((approval) => (
                  <tr key={approval.id}>
                    <td><strong className="table-name">{approval.tenantName}<small>{approval.id}</small></strong></td>
                    <td>{approval.name}</td>
                    <td>{approval.email}</td>
                    <td><code>{approval.inviteCode}</code></td>
                    <td>{approval.createdAt}</td>
                    <td><StatusPill value={approval.platformApproval} /></td>
                    <td><ActionButtons approval={approval} isPlatform onDecide={decide} /></td>
                  </tr>
                ))}
                {pendingTenants.length === 0 && <tr><td colSpan="7"><div className="admin-table-empty">暂无机构入驻申请</div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'agent' && (
        <section className="approval-panel">
          <SectionTitle
            title="本机构客服注册审核"
            subtitle="机构管理员通过后账号即激活，客服即可登录工作台"
          />
          <div className="approval-flow-note">
            <span>审核流程</span>
            <em className={approvals.some((a) => a.status === 'pending' && a.orgApproval === 'pending') ? 'active' : ''}>① 机构管理员审核</em>
            <i>→</i>
            <em>账号激活</em>
          </div>
          <div className="table-wrap">
            <table className="admin-table approval-table">
              <caption className="sr-only">客服注册申请列表</caption>
              <thead>
                <tr><th>姓名</th><th>邮箱</th><th>所属机构</th><th>邀请码</th><th>提交时间</th><th>机构端审核</th><th>操作</th></tr>
              </thead>
              <tbody>
                {pendingAgents.map((approval) => (
                  <tr key={approval.id} className={approval.status !== 'pending' ? 'approval-final' : ''}>
                    <td><strong className="table-name">{approval.name}<small>{approval.id}</small></strong></td>
                    <td>{approval.email}</td>
                    <td>{approval.tenantName || '—'}</td>
                    <td><code>{approval.inviteCode}</code></td>
                    <td>{approval.createdAt}</td>
                    <td><StatusPill value={approval.orgApproval || 'pending'} /></td>
                    <td><ActionButtons approval={approval} isPlatform={false} onDecide={decide} /></td>
                  </tr>
                ))}
                {pendingAgents.length === 0 && <tr><td colSpan="7"><div className="admin-table-empty">暂无客服注册申请</div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'invites' && (
        <section className="approval-panel">
          <SectionTitle
            title={isPlatform ? '机构邀请码管理' : '客服邀请码管理'}
            subtitle={isPlatform
              ? '新机构入驻必须持有平台派发的邀请码；生成后复制发给申请方'
              : '本机构客服注册必须持有机构派发的邀请码；一个邀请码仅可使用一次'}
          />
          <form className="invite-form" onSubmit={generateInvite}>
            <div className="invite-form-main">
              <label htmlFor="invite-description">用途说明</label>
              <input id="invite-description" value={inviteDescription} onChange={(e) => setInviteDescription(e.target.value)} placeholder={isPlatform ? '如：某酒店入驻申请' : '如：新客服入职'} />
            </div>
            <button type="submit" className="admin-primary-btn">{isPlatform ? '生成机构邀请码' : '生成客服邀请码'}</button>
          </form>
          <div className="table-wrap">
            <table className="admin-table approval-table">
              <caption className="sr-only">邀请码列表</caption>
              <thead>
                <tr><th>邀请码</th><th>类型</th><th>用途 / 说明</th><th>状态</th><th>派发人</th><th>创建时间</th><th>有效期至</th><th>操作</th></tr>
              </thead>
              <tbody>
                {invites
                  .filter((invite) => isPlatform ? invite.type === 'tenant' : invite.type === 'agent' && invite.tenantId === tenantId)
                  .map((invite) => (
                    <tr key={invite.code}>
                      <td><code className="invite-code">{invite.code}</code></td>
                      <td>{TYPE_LABEL[invite.type]}</td>
                      <td>{invite.description || '—'}</td>
                      <td><Pill tone={INVITE_STATUS_TONE[invite.status]}>{INVITE_STATUS_LABEL[invite.status]}</Pill></td>
                      <td>{invite.issuedBy}</td>
                      <td>{invite.createdAt}</td>
                      <td>{invite.expiresAt}</td>
                      <td>{invite.status === 'valid' ? <button type="button" className="table-action" onClick={() => revoke(invite.code)}>撤销</button> : '—'}</td>
                    </tr>
                  ))}
                {invites.filter((invite) => isPlatform ? invite.type === 'tenant' : invite.type === 'agent' && invite.tenantId === tenantId).length === 0 && (
                  <tr><td colSpan="8"><div className="admin-table-empty">暂无邀请码，点击上方按钮生成</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
