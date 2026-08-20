import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DEMO_PASSWORD,
  INVITE_CODE,
  authenticateDemo,
  demoAccounts,
  resolveHome,
  validateInvitation,
  validateRecoveryEmail,
} from './auth'

const AuthIcon = ({ name, size = 20 }) => {
  const paths = {
    headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4Zm16 0h-3v5h2a1 1 0 0 0 1-1v-4ZM12 21h3"/></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.2-8 10-4.5-1.8-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    spark: <><path d="m12 3 1.3 5.7L19 10l-5.7 1.3L12 17l-1.3-5.7L5 10l5.7-1.3L12 3Z"/><path d="m19 16 .5 2.5L22 19l-2.5.5L19 22l-.5-2.5L16 19l2.5-.5L19 16Z"/></>,
    route: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a6 6 0 0 1 6 6v4M16 18h-4a6 6 0 0 1-6-6V8"/></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.spark}</svg>
}

function Brand() {
  return <div className="auth-brand"><span><AuthIcon name="headset" size={22}/></span><div><strong>AI智能客服系统</strong><small>Enterprise Service Cloud</small></div></div>
}

function AuthStory() {
  return <aside className="auth-story">
    <Brand />
    <div className="auth-story-copy">
      <span className="auth-eyebrow"><i/> AI 优先 · 人工可控</span>
      <h1>让每一次客户咨询，<br/>都得到专业回应。</h1>
      <p>统一会话、知识与人工服务，在安全的租户边界内持续提升客户体验。</p>
      <div className="auth-story-points">
        <span><AuthIcon name="spark" size={17}/><b>知识驱动回答</b><small>RAG 引用溯源与置信度护栏</small></span>
        <span><AuthIcon name="route" size={17}/><b>AI 与人工协同</b><small>完整上下文随转人工同步交接</small></span>
        <span><AuthIcon name="shield" size={17}/><b>企业级安全</b><small>RBAC、租户隔离与审计留痕</small></span>
      </div>
    </div>
    <div className="auth-insight" aria-label="平台运行概览">
      <span><b>24</b><small>在线租户</small></span>
      <span><b>78.4%</b><small>AI 解决率</small></span>
      <span><b>99.95%</b><small>服务可用性</small></span>
    </div>
  </aside>
}

function Field({ label, error, hint, action, children }) {
  return <div className={`auth-field ${error ? 'has-error' : ''}`}>
    <span className="auth-field-label">{label}{action}</span>
    {children}
    {error ? <small className="auth-field-error" role="alert">{error}</small> : hint ? <small className="auth-field-hint">{hint}</small> : null}
  </div>
}

function PasswordInput({ label, value, onChange, placeholder, autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false)
  return <div className="auth-password-wrap">
    <input aria-label={label} type={visible ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}/>
    <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? '隐藏密码' : '显示密码'}><AuthIcon name="eye" size={17}/></button>
  </div>
}

function LoginForm({ onAuthenticated }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@xinghe.demo')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState('')

  const chooseAccount = (account) => {
    setEmail(account.email)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  const submit = (event) => {
    event.preventDefault()
    const result = authenticateDemo(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onAuthenticated(result.session)
    navigate(resolveHome(result.session.role), { replace: true })
  }

  return <>
    <div className="auth-heading"><span>欢迎回来</span><h2>登录工作台</h2><p>使用机构分配的账号继续访问客服系统。</p></div>
    <form className="auth-form" onSubmit={submit} noValidate>
      {error && <div className="auth-form-alert" role="alert"><AuthIcon name="shield" size={16}/>{error}</div>}
      <Field label="账号"><input aria-label="账号" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="请输入邮箱账号" autoComplete="username" required/></Field>
      <Field label="密码" action={<Link to="/forgot-password">忘记密码？</Link>}><PasswordInput label="密码" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入登录密码"/></Field>
      <button className="auth-primary" type="submit">安全登录 <AuthIcon name="arrow" size={17}/></button>
    </form>
    <div className="auth-divider"><span>演示身份快速登录</span></div>
    <div className="demo-account-list">
      {demoAccounts.map((account) => <button type="button" key={account.email} onClick={() => chooseAccount(account)} className={email === account.email ? 'selected' : ''}>
        <span>{account.name.slice(0, 1)}</span><div><b>{account.title}</b><small>{account.description}</small></div><i><AuthIcon name="check" size={13}/></i>
      </button>)}
    </div>
    <p className="auth-switch">收到机构邀请？<Link to="/register">激活账号</Link></p>
  </>
}

function RegisterForm({ onAuthenticated }) {
  const navigate = useNavigate()
  const [values, setValues] = useState({ inviteCode: INVITE_CODE, name: '', email: '', password: '', confirmPassword: '', agreed: false })
  const [errors, setErrors] = useState({})
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = validateInvitation(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const session = {
      userId: 'USR-INVITED-001',
      tenantId: 'TENANT-018',
      role: 'agent',
      permissions: ['conversation:handle', 'customer:read'],
      name: values.name.trim(),
      title: '客服专员',
      email: values.email.trim().toLowerCase(),
    }
    onAuthenticated(session)
    navigate('/workbench', { replace: true })
  }

  return <>
    <div className="auth-heading"><span>机构邀请</span><h2>激活客服账号</h2><p>完成资料与密码设置后，即可加入星河科技客服团队。</p></div>
    <div className="invite-context"><span className="invite-logo">星</span><div><b>星河科技</b><small>TENANT-018 · 华东服务中心</small></div><em>客服专员</em></div>
    <form className="auth-form register" onSubmit={submit} noValidate>
      <Field label="邀请码" error={errors.inviteCode}><input aria-label="邀请码" value={values.inviteCode} onChange={(event) => update('inviteCode', event.target.value)} placeholder="请输入邀请邮件中的邀请码"/></Field>
      <div className="auth-field-grid">
        <Field label="姓名" error={errors.name}><input aria-label="姓名" value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="请输入真实姓名" autoComplete="name"/></Field>
        <Field label="工作邮箱" error={errors.email}><input aria-label="工作邮箱" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} placeholder="name@company.com" autoComplete="email"/></Field>
      </div>
      <Field label="设置密码" error={errors.password} hint="至少 8 位，包含大小写字母和数字"><PasswordInput label="设置密码" value={values.password} onChange={(event) => update('password', event.target.value)} placeholder="请设置登录密码" autoComplete="new-password"/></Field>
      <Field label="确认密码" error={errors.confirmPassword}><PasswordInput label="确认密码" value={values.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} placeholder="请再次输入密码" autoComplete="new-password"/></Field>
      <label className={`auth-agreement ${errors.agreed ? 'has-error' : ''}`}><input type="checkbox" checked={values.agreed} onChange={(event) => update('agreed', event.target.checked)}/><span>我已阅读并同意《服务协议》和《隐私政策》</span></label>
      {errors.agreed && <small className="auth-field-error agreement-error" role="alert">{errors.agreed}</small>}
      <button className="auth-primary" type="submit">激活并进入工作台 <AuthIcon name="arrow" size={17}/></button>
    </form>
    <p className="auth-switch">已有账号？<Link to="/login">返回登录</Link></p>
  </>
}

function RecoveryForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    const nextError = validateRecoveryEmail(email)
    setError(nextError)
    if (!nextError) setSent(true)
  }

  if (sent) return <div className="auth-success"><span><AuthIcon name="mail" size={26}/></span><h2>重置邮件已发送</h2><p>若 <b>{email}</b> 已绑定账号，你将在几分钟内收到密码重置指引。</p><Link className="auth-primary" to="/login">返回登录</Link></div>

  return <>
    <div className="auth-heading"><span>账号安全</span><h2>找回登录密码</h2><p>输入绑定的工作邮箱，我们会发送密码重置指引。</p></div>
    <form className="auth-form" onSubmit={submit} noValidate>
      <Field label="工作邮箱" error={error}><input aria-label="工作邮箱" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" autoComplete="email"/></Field>
      <button className="auth-primary" type="submit">发送重置邮件 <AuthIcon name="arrow" size={17}/></button>
    </form>
    <p className="auth-switch"><Link to="/login">返回登录</Link></p>
  </>
}

export default function AuthPage({ mode = 'login', onAuthenticated }) {
  return <main className="auth-shell">
    <AuthStory />
    <section className="auth-main">
      <div className="auth-mobile-brand"><Brand /></div>
      <div className={`auth-card ${mode === 'register' ? 'wide' : ''}`}>
        {mode === 'login' && <LoginForm onAuthenticated={onAuthenticated}/>} 
        {mode === 'register' && <RegisterForm onAuthenticated={onAuthenticated}/>} 
        {mode === 'recovery' && <RecoveryForm/>}
      </div>
      <p className="auth-security"><AuthIcon name="shield" size={14}/> 演示环境 · 登录状态仅保存在当前浏览器会话</p>
    </section>
  </main>
}
