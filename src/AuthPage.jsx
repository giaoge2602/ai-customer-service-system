import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  loginWithDemoFallback,
  canCommitRequest,
  registerPlatformAdmin,
  resolveHome,
  roleMatchesPortal,
  validateAgentRegister,
  validatePlatformAdminRegister,
  validateRecoveryEmail,
  validateTenantRegister,
} from './auth'
import { getPortalCopy } from './authPortal'
import { createApproval, validateInvite } from './approvalData.js'

const AuthIcon = ({ name, size = 20 }) => {
  const paths = {
    headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4Zm16 0h-3v5h2a1 1 0 0 0 1-1v-4ZM12 21h3"/></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.2-8 10-4.5-1.8-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    spark: <path d="m12 3 1.3 5.7L19 10l-5.7 1.3L12 17l-1.3-5.7L5 10l5.7-1.3L12 3Z"/>,
    route: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a6 6 0 0 1 6 6v4M16 18h-4a6 6 0 0 1-6-6V8"/></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    building: <><path d="M4 21V5l8-3 8 3v16M2 21h20M8 8h1M15 8h1M8 12h1M15 12h1M8 16h1M15 16h1"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.spark}</svg>
}

function Brand({ copy }) {
  return <div className="auth-brand"><span><AuthIcon name="headset" size={22}/></span><div><strong>{copy.systemName}</strong><small>{copy.systemSubtitle}</small></div></div>
}

function AuthStory({ copy }) {
  const [firstLine, secondLine] = copy.storyTitle.split('\n')
  return <aside className="auth-story">
    <Brand copy={copy}/>
    <div className="auth-story-copy">
      <span className="auth-eyebrow"><i/> {copy.eyebrow}</span>
      <h1>{firstLine}<br/>{secondLine}</h1>
      <p>{copy.storyDescription}</p>
      <div className="auth-story-points">
        <span><AuthIcon name="spark" size={17}/><b>知识驱动回答</b><small>服务信息与业务配置统一管理</small></span>
        <span><AuthIcon name="route" size={17}/><b>角色边界清晰</b><small>不同入口只展示对应身份与权限</small></span>
        <span><AuthIcon name="shield" size={17}/><b>企业级安全</b><small>RBAC、机构隔离与审计留痕</small></span>
      </div>
    </div>
    <div className="auth-insight" aria-label="系统运行概览">{copy.metrics.map(([value, label]) => <span key={label}><b>{value}</b><small>{label}</small></span>)}</div>
  </aside>
}

function Field({ label, error, hint, action, children }) {
  return <div className={`auth-field ${error ? 'has-error' : ''}`}><span className="auth-field-label">{label}{action}</span>{children}{error ? <small className="auth-field-error" role="alert">{error}</small> : hint ? <small className="auth-field-hint">{hint}</small> : null}</div>
}

function PasswordInput({ label, value, onChange, placeholder, autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false)
  return <div className="auth-password-wrap"><input aria-label={label} type={visible ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}/><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? '隐藏密码' : '显示密码'}><AuthIcon name="eye" size={17}/></button></div>
}

function LoginForm({ portal, mode, copy, onAuthenticated }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [portalMismatch, setPortalMismatch] = useState(false)
  const [loading, setLoading] = useState(false)
  const requestGenerationRef = useRef(0)
  const mountedRef = useRef(true)
  const portalRef = useRef(portal)

  if (portalRef.current !== portal) {
    portalRef.current = portal
    requestGenerationRef.current += 1
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      requestGenerationRef.current += 1
    }
  }, [])

  useEffect(() => {
    requestGenerationRef.current += 1
    setEmail('')
    setPassword('')
    setError('')
    setPortalMismatch(false)
    setLoading(false)
  }, [portal, mode])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setPortalMismatch(false)
    if (!email.trim() || !password) {
      setError('请输入邮箱和密码')
      return
    }
    const requestGeneration = ++requestGenerationRef.current
    setLoading(true)
    try {
      const session = await loginWithDemoFallback(email, password)
      if (!canCommitRequest(mountedRef.current, requestGenerationRef.current, requestGeneration)) return
      if (!roleMatchesPortal(session.role, portal)) {
        setError('该账号不属于当前系统，请从正确入口登录。')
        setPortalMismatch(true)
        return
      }
      onAuthenticated(session)
      navigate(resolveHome(session.role), { replace: true })
    } catch (err) {
      if (!canCommitRequest(mountedRef.current, requestGenerationRef.current, requestGeneration)) return
      setError(err.message || '登录失败，请检查账号和密码')
    } finally {
      if (canCommitRequest(mountedRef.current, requestGenerationRef.current, requestGeneration)) setLoading(false)
    }
  }

  return <>
    <div className="auth-heading"><span>{portal === 'admin' ? '管理中心账号' : '服务中心账号'}</span><h2>{copy.loginTitle}</h2><p>{copy.loginDescription} 登录后将自动进入与你的账号权限匹配的工作区。</p></div>
    <form className="auth-form" onSubmit={submit} noValidate>
      {error && <div className="auth-form-alert" role="alert"><AuthIcon name="shield" size={16}/><span>{error}{portalMismatch && <> <Link to={copy.crossPortal.href}>{copy.crossPortal.label}</Link></>}</span></div>}
      <Field label="账号"><input aria-label="账号" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="请输入邮箱账号" autoComplete="username" required/></Field>
      <Field label="密码" action={<Link to={copy.routes.recovery}>忘记密码？</Link>}><PasswordInput label="密码" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入登录密码"/></Field>
      <button className="auth-primary" type="submit" disabled={loading}>{loading ? '登录中...' : '安全登录'} {!loading && <AuthIcon name="arrow" size={17}/>}</button>
    </form>
    <p className="auth-switch">还没有账号？<Link to={copy.routes.register}>立即注册</Link></p>
  </>
}

const registrationTargets = {
  agent: { role: 'agent', portal: 'service', title: '客服账号注册', description: '使用机构派发的邀请码提交入职申请，机构审核通过后即激活。', requiresInvite: true, inviteType: 'agent' },
  tenant: { role: 'tenant_admin', portal: 'admin', title: '机构入驻申请', description: '使用平台派发的邀请码提交入驻申请，审核通过后机构与账号一同激活。', requiresInvite: true, inviteType: 'tenant' },
  platform: { role: 'platform_admin', portal: 'admin', title: '平台管理员初始化', description: '仅用于受控的平台初始化或邀请流程。', requiresInvite: false },
}

function RegisterForm({ portal, mode, copy, targetKey }) {
  const target = registrationTargets[targetKey] || registrationTargets[portal === 'admin' ? 'tenant' : 'agent']
  const role = target.role
  const [values, setValues] = useState({ name: '', email: '', phone: '', source: '', tenantName: '', inviteCode: '', password: '', confirmPassword: '', agreed: false })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const mountedRef = useRef(true)
  const registerRequestGenerationRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      registerRequestGenerationRef.current += 1
    }
  }, [])

  useEffect(() => {
    registerRequestGenerationRef.current += 1
    setValues({ name: '', email: '', phone: '', source: '', tenantName: '', inviteCode: '', password: '', confirmPassword: '', agreed: false })
    setErrors({})
    setApiError('')
    setLoading(false)
    setSuccess(null)
  }, [portal, mode, targetKey])
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const validate = () => role === 'platform_admin' ? validatePlatformAdminRegister(values) : role === 'tenant_admin' ? validateTenantRegister(values) : validateAgentRegister(values)

  const submit = async (event) => {
    event.preventDefault()
    setApiError('')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    // 邀请码有效性校验（存在、未使用、类型匹配、未过期）
    const check = target.requiresInvite ? validateInvite(values.inviteCode, target.inviteType) : { ok: true }
    if (!check.ok) {
      setErrors({ inviteCode: check.reason })
      return
    }
    const requestGeneration = ++registerRequestGenerationRef.current
    setLoading(true)
    try {
      let result
      if (role === 'platform_admin') {
        result = await registerPlatformAdmin({ name: values.name, email: values.email, password: values.password })
      } else {
        result = createApproval({
          kind: role === 'tenant_admin' ? 'tenant' : 'agent',
          name: values.name,
          email: values.email,
          phone: values.phone || '',
          password: values.password,
          tenantName: values.tenantName,
          inviteCode: values.inviteCode,
        })
      }
      if (!canCommitRequest(mountedRef.current, registerRequestGenerationRef.current, requestGeneration)) return
      if (result && result.error) {
        setApiError(result.error)
        return
      }
      if (role === 'platform_admin') {
        setSuccess(`平台管理员「${result.name}」初始化成功，请登录`)
      } else {
        setSuccess(role === 'tenant_admin'
          ? `机构入驻申请「${values.tenantName}」已提交，请等待平台管理员审核。审核通过后，机构与管理员账号将一同激活。`
          : '客服注册申请已提交，请等待机构管理员审核。审核通过后，账号即可激活登录。')
      }
    } catch (err) {
      if (!canCommitRequest(mountedRef.current, registerRequestGenerationRef.current, requestGeneration)) return
      setApiError(err.message || '提交失败，请重试')
    } finally {
      if (canCommitRequest(mountedRef.current, registerRequestGenerationRef.current, requestGeneration)) setLoading(false)
    }
  }

  if (success) return <div className="auth-success"><span><AuthIcon name="check" size={26}/></span><h2>{role === 'tenant_admin' ? '入驻申请已提交' : role === 'platform_admin' ? '初始化成功' : '注册申请已提交'}</h2><p>{success}</p><Link className="auth-primary" to={copy.routes.login}>返回登录</Link></div>
  return <>
    <div className="auth-heading"><span>{target.title}</span><h2>{target.title}</h2><p>{target.description}</p></div>
    <div className="register-target-hint"><AuthIcon name="shield" size={13}/><span>当前注册入口已固定为对应账号权限</span></div>
    <form className="auth-form register" onSubmit={submit} noValidate>
      {apiError && <div className="auth-form-alert" role="alert"><AuthIcon name="shield" size={16}/>{apiError}</div>}
      {role === 'tenant_admin' && <Field label="机构名称" error={errors.tenantName} hint="入驻审核通过后，将创建独立的机构运营空间"><input aria-label="机构名称" value={values.tenantName} onChange={(event) => update('tenantName', event.target.value)} placeholder="请输入机构全称" /></Field>}
      <div className="auth-field-grid"><Field label={role === 'tenant_admin' || role === 'platform_admin' ? '管理员姓名' : '姓名'} error={errors.name}><input aria-label="姓名" value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="请输入真实姓名" autoComplete="name"/></Field><Field label="邮箱" error={errors.email}><input aria-label="邮箱" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} placeholder="name@company.com" autoComplete="email"/></Field></div>
      {target.requiresInvite && <Field label="邀请码" error={errors.inviteCode} hint="由平台 / 机构管理员派发，一个邀请码仅可使用一次"><input aria-label="邀请码" value={values.inviteCode} onChange={(event) => update('inviteCode', event.target.value)} placeholder={role === 'tenant_admin' ? '请输入平台派发的机构邀请码' : '请输入机构派发的客服邀请码'} autoComplete="off"/></Field>}
      <Field label="设置密码" error={errors.password} hint="至少 8 位"><PasswordInput label="设置密码" value={values.password} onChange={(event) => update('password', event.target.value)} placeholder="请设置登录密码" autoComplete="new-password"/></Field>
      <Field label="确认密码" error={errors.confirmPassword}><PasswordInput label="确认密码" value={values.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} placeholder="请再次输入密码" autoComplete="new-password"/></Field>
      <label className={`auth-agreement ${errors.agreed ? 'has-error' : ''}`}><input type="checkbox" checked={values.agreed} onChange={(event) => update('agreed', event.target.checked)}/><span>我已阅读并同意《服务协议》和《隐私政策》</span></label>
      {errors.agreed && <small className="auth-field-error agreement-error" role="alert">{errors.agreed}</small>}
      <button className="auth-primary" type="submit" disabled={loading}>{loading ? '提交中...' : role === 'tenant_admin' ? '提交入驻申请' : '提交注册申请'} {!loading && <AuthIcon name="arrow" size={17}/>}</button>
    </form>
    <p className="auth-switch">已有账号？<Link to={copy.routes.login}>返回登录</Link></p>
  </>
}

function RecoveryForm({ copy }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const submit = (event) => {
    event.preventDefault()
    const nextError = validateRecoveryEmail(email)
    setError(nextError)
    if (!nextError) setSent(true)
  }
  if (sent) return <div className="auth-success"><span><AuthIcon name="mail" size={26}/></span><h2>重置邮件已发送</h2><p>若 <b>{email}</b> 已绑定账号，你将在几分钟内收到密码重置指引。</p><Link className="auth-primary" to={copy.routes.login}>返回登录</Link></div>
  return <><div className="auth-heading"><span>账号安全</span><h2>{copy.recoveryTitle}</h2><p>{copy.recoveryDescription}</p></div><form className="auth-form" onSubmit={submit} noValidate><Field label="工作邮箱" error={error}><input aria-label="工作邮箱" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" autoComplete="email"/></Field><button className="auth-primary" type="submit">发送重置邮件 <AuthIcon name="arrow" size={17}/></button></form><p className="auth-switch"><Link to={copy.routes.login}>返回登录</Link></p></>
}

export default function AuthPage({ portal = 'service', mode = 'login', registrationTarget = portal === 'admin' ? 'tenant' : 'agent', onAuthenticated }) {
  const copy = getPortalCopy(portal)
  return <main className={`auth-shell ${copy.accentClass}`}>
    <AuthStory copy={copy}/>
    <section className="auth-main">
      <div className="auth-mobile-brand"><Brand copy={copy}/></div>
      <div className={`auth-card ${mode === 'register' ? 'wide' : ''}`}>
        {mode === 'login' && <LoginForm key={`${portal}-${mode}`} portal={portal} mode={mode} copy={copy} onAuthenticated={onAuthenticated}/>}
        {mode === 'register' && <RegisterForm key={`${portal}-${mode}-${registrationTarget}`} portal={portal} mode={mode} copy={copy} targetKey={registrationTarget}/>}
        {mode === 'recovery' && <RecoveryForm key={`${portal}-${mode}`} copy={copy}/>}
      </div>
      <Link className="auth-portal-switch" to={copy.crossPortal.href}>{copy.crossPortal.label} <AuthIcon name="arrow" size={14}/></Link>
      <p className="auth-security"><AuthIcon name="shield" size={14}/> 安全加密传输 · 数据按机构隔离存储</p>
    </section>
  </main>
}
