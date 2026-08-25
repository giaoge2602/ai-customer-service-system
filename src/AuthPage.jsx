import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchTenantOptions,
  loginWithDemoFallback,
  canCommitRequest,
  registerAgent,
  registerCustomer,
  registerPlatformAdmin,
  registerTenant,
  resolveHome,
  roleMatchesPortal,
  validateAgentRegister,
  validateCustomerRegister,
  validatePlatformAdminRegister,
  validateRecoveryEmail,
  validateTenantRegister,
} from './auth'
import { getPortalCategories, getPortalCopy } from './authPortal'

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
        <span><AuthIcon name="shield" size={17}/><b>企业级安全</b><small>RBAC、租户隔离与审计留痕</small></span>
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

function LoginForm({ portal, mode, copy, categories, onAuthenticated }) {
  const navigate = useNavigate()
  const [identity, setIdentity] = useState(categories[0].key)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [portalMismatch, setPortalMismatch] = useState(false)
  const [loading, setLoading] = useState(false)
  const requestGenerationRef = useRef(0)
  const mountedRef = useRef(true)
  const portalRef = useRef(portal)
  const selectedIdentity = categories.find((item) => item.key === identity) || categories[0]

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
    setIdentity(categories[0].key)
    setEmail('')
    setPassword('')
    setError('')
    setPortalMismatch(false)
    setLoading(false)
  }, [portal, mode, categories])

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
    <div className="auth-heading"><span>{selectedIdentity.loginLabel}</span><h2>{copy.loginTitle}</h2><p>{copy.loginDescription}</p></div>
    <div className="auth-identity-tabs" role="tablist" aria-label="登录身份">{categories.map((item) => <button type="button" key={item.key} role="tab" aria-selected={identity === item.key} className={identity === item.key ? 'selected' : ''} onClick={() => setIdentity(item.key)}>{item.loginLabel}</button>)}</div>
    <form className="auth-form" onSubmit={submit} noValidate>
      {error && <div className="auth-form-alert" role="alert"><AuthIcon name="shield" size={16}/><span>{error}{portalMismatch && <> <Link to={copy.crossPortal.href}>{copy.crossPortal.label}</Link></>}</span></div>}
      <Field label="账号"><input aria-label="账号" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="请输入邮箱账号" autoComplete="username" required/></Field>
      <Field label="密码" action={<Link to={copy.routes.recovery}>忘记密码？</Link>}><PasswordInput label="密码" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入登录密码"/></Field>
      <button className="auth-primary" type="submit" disabled={loading}>{loading ? '登录中...' : '安全登录'} {!loading && <AuthIcon name="arrow" size={17}/>}</button>
    </form>
    <p className="auth-switch">还没有账号？<Link to={copy.routes.register}>立即注册</Link></p>
  </>
}

function RegisterForm({ portal, mode, copy, categories }) {
  const [category, setCategory] = useState(categories[0].key)
  const [tenantOptions, setTenantOptions] = useState([])
  const [values, setValues] = useState({ name: '', email: '', phone: '', source: '', tenantId: '', password: '', confirmPassword: '', agreed: false })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const mountedRef = useRef(true)
  const tenantRequestGenerationRef = useRef(0)
  const registerRequestGenerationRef = useRef(0)
  const selectedCategory = categories.find((item) => item.key === category) || categories[0]

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      tenantRequestGenerationRef.current += 1
      registerRequestGenerationRef.current += 1
    }
  }, [])

  useEffect(() => {
    const requestGeneration = ++tenantRequestGenerationRef.current
    fetchTenantOptions()
      .then((items) => {
        if (canCommitRequest(mountedRef.current, tenantRequestGenerationRef.current, requestGeneration)) setTenantOptions(Array.isArray(items) ? items : [])
      })
      .catch(() => {
        if (canCommitRequest(mountedRef.current, tenantRequestGenerationRef.current, requestGeneration)) setTenantOptions([])
      })
    return () => { tenantRequestGenerationRef.current += 1 }
  }, [portal, mode, category])

  useEffect(() => {
    registerRequestGenerationRef.current += 1
    setCategory(categories[0].key)
    setValues({ name: '', email: '', phone: '', source: '', tenantId: '', password: '', confirmPassword: '', agreed: false })
    setErrors({})
    setApiError('')
    setLoading(false)
    setSuccess(null)
  }, [portal, mode, categories])
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const validate = () => category === 'platform' ? validatePlatformAdminRegister(values) : category === 'tenant' ? validateTenantRegister(values) : category === 'agent' ? validateAgentRegister(values) : validateCustomerRegister(values)
  const selectCategory = (nextCategory) => {
    registerRequestGenerationRef.current += 1
    setCategory(nextCategory)
    setErrors({})
    setApiError('')
    setLoading(false)
  }

  const submit = async (event) => {
    event.preventDefault()
    setApiError('')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const requestGeneration = ++registerRequestGenerationRef.current
    setLoading(true)
    try {
      let result
      if (category === 'platform') result = await registerPlatformAdmin({ name: values.name, email: values.email, password: values.password })
      else if (category === 'tenant') result = await registerTenant({ tenantId: values.tenantId, name: values.name, email: values.email, password: values.password })
      else if (category === 'agent') result = await registerAgent({ name: values.name, email: values.email, password: values.password, tenantId: values.tenantId })
      else result = await registerCustomer({ name: values.name, email: values.email, password: values.password, phone: values.phone || undefined, source: values.source, tenantId: values.tenantId })
      if (!canCommitRequest(mountedRef.current, registerRequestGenerationRef.current, requestGeneration)) return
      setSuccess(`${selectedCategory.title}「${result.name}」注册成功，请登录`)
    } catch (err) {
      if (!canCommitRequest(mountedRef.current, registerRequestGenerationRef.current, requestGeneration)) return
      setApiError(err.message || '注册失败，请重试')
    } finally {
      if (canCommitRequest(mountedRef.current, registerRequestGenerationRef.current, requestGeneration)) setLoading(false)
    }
  }

  if (success) return <div className="auth-success"><span><AuthIcon name="check" size={26}/></span><h2>注册成功</h2><p>{success}</p><Link className="auth-primary" to={copy.routes.login}>前往登录</Link></div>
  return <>
    <div className="auth-heading"><span>创建账号</span><h2>{copy.registerTitle}</h2><p>{copy.registerDescription}</p></div>
    <div className="register-category-grid">{categories.map((item) => <button type="button" key={item.key} className={`register-category-card ${category === item.key ? 'selected' : ''}`} onClick={() => selectCategory(item.key)}><span className="register-category-icon"><AuthIcon name={item.icon} size={18}/></span><div><b>{item.title}</b><small>{item.description}</small></div><i className="register-category-check"><AuthIcon name="check" size={12}/></i></button>)}</div>
    <div className="register-table-hint"><AuthIcon name="shield" size={13}/><span>数据将保存到 <b>{selectedCategory.table}</b></span></div>
    <form className="auth-form register" onSubmit={submit} noValidate>
      {apiError && <div className="auth-form-alert" role="alert"><AuthIcon name="shield" size={16}/>{apiError}</div>}
      {category !== 'platform' && <Field label="选择公司" error={errors.tenantId} hint="仅可选择已在本平台入驻的机构"><select aria-label="选择公司" className="auth-select" value={values.tenantId} onChange={(event) => update('tenantId', event.target.value)}><option value="">请选择所属公司</option>{tenantOptions.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></Field>}
      <div className="auth-field-grid"><Field label={category === 'tenant' || category === 'platform' ? '管理员姓名' : '姓名'} error={errors.name}><input aria-label="姓名" value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="请输入真实姓名" autoComplete="name"/></Field><Field label="邮箱" error={errors.email}><input aria-label="邮箱" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} placeholder="name@company.com" autoComplete="email"/></Field></div>
      {category === 'customer' && <div className="auth-field-grid"><Field label="手机号" error={errors.phone}><input aria-label="手机号" value={values.phone} onChange={(event) => update('phone', event.target.value)} placeholder="选填"/></Field><Field label="来源渠道" error={errors.source}><select aria-label="来源渠道" className="auth-select" value={values.source} onChange={(event) => update('source', event.target.value)}><option value="">请选择</option><option value="微信">微信</option><option value="网页">网页</option><option value="企业微信">企业微信</option><option value="APP">APP</option><option value="电话">电话</option></select></Field></div>}
      <Field label="设置密码" error={errors.password} hint="至少 8 位"><PasswordInput label="设置密码" value={values.password} onChange={(event) => update('password', event.target.value)} placeholder="请设置登录密码" autoComplete="new-password"/></Field>
      <Field label="确认密码" error={errors.confirmPassword}><PasswordInput label="确认密码" value={values.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} placeholder="请再次输入密码" autoComplete="new-password"/></Field>
      <label className={`auth-agreement ${errors.agreed ? 'has-error' : ''}`}><input type="checkbox" checked={values.agreed} onChange={(event) => update('agreed', event.target.checked)}/><span>我已阅读并同意《服务协议》和《隐私政策》</span></label>
      {errors.agreed && <small className="auth-field-error agreement-error" role="alert">{errors.agreed}</small>}
      <button className="auth-primary" type="submit" disabled={loading}>{loading ? '提交中...' : '注册'} {!loading && <AuthIcon name="arrow" size={17}/>}</button>
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

export default function AuthPage({ portal = 'service', mode = 'login', onAuthenticated }) {
  const copy = getPortalCopy(portal)
  const categories = getPortalCategories(portal)
  return <main className={`auth-shell ${copy.accentClass}`}>
    <AuthStory copy={copy}/>
    <section className="auth-main">
      <div className="auth-mobile-brand"><Brand copy={copy}/></div>
      <div className={`auth-card ${mode === 'register' ? 'wide' : ''}`}>
        {mode === 'login' && <LoginForm key={`${portal}-${mode}`} portal={portal} mode={mode} copy={copy} categories={categories} onAuthenticated={onAuthenticated}/>}
        {mode === 'register' && <RegisterForm key={`${portal}-${mode}`} portal={portal} mode={mode} copy={copy} categories={categories}/>}
        {mode === 'recovery' && <RecoveryForm key={`${portal}-${mode}`} copy={copy}/>}
      </div>
      <Link className="auth-portal-switch" to={copy.crossPortal.href}>{copy.crossPortal.label} <AuthIcon name="arrow" size={14}/></Link>
      <p className="auth-security"><AuthIcon name="shield" size={14}/> 安全加密传输 · 数据按租户隔离存储</p>
    </section>
  </main>
}
