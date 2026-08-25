import { useMemo, useState } from 'react'
import AgentWorkspaceShell from './AgentWorkspaceShell'
import { loadPrototypeConfig, resolveServiceMode, savePrototypeConfig, transitionChat } from './prototype'

const team = [
  { name: '李楠', group: '售后支持', state: '空闲', tone: 'ready', active: 1, queue: 0, response: '38 秒', score: '4.9' },
  { name: '张宁', group: '技术支持', state: '忙碌', tone: 'busy', active: 4, queue: 2, response: '51 秒', score: '4.8' },
  { name: '陈哲', group: '售前咨询', state: '忙碌', tone: 'busy', active: 3, queue: 1, response: '45 秒', score: '4.7' },
  { name: '王悦', group: '投诉升级', state: '离线', tone: 'offline', active: 0, queue: 0, response: '—', score: '4.9' },
]

const knowledge = [
  { title: '退款到账需要多久？', category: '退款售后', answer: '审核通过后，原路退回通常需要 3–5 个工作日。', hits: 238, status: '已启用' },
  { title: '企业版支持私有化部署吗？', category: '产品介绍', answer: '支持独立部署与混合部署，可由顾问提供部署清单。', hits: 196, status: '已启用' },
  { title: '如何修改登录密码？', category: '账号安全', answer: '登录后进入个人中心，在账号设置中修改密码。', hits: 154, status: '已启用' },
]

function WorkspaceTop({ title, subtitle, session }) {
  return <header className="service-top"><div><p>华东服务中心 <span>/</span> {subtitle}</p><h1>{title}</h1></div><div className="service-user"><span className="presence" />实时数据已连接<div className="user-orb">{session.name.slice(0, 1)}</div><strong>{session.name}<small>{session.title}</small></strong></div></header>
}

export default function ServiceWorkspace({ area, session, onLogout }) {
  return <AgentWorkspaceShell active={area} session={session} onLogout={onLogout}><main className="service-main workspace-section-main"><WorkspaceTop title={area === 'dashboard' ? '客服团队看板' : area === 'knowledge' ? '企业知识库' : 'AI 与客户入口配置'} subtitle={area === 'dashboard' ? '团队实时负载' : area === 'knowledge' ? '知识运营' : '服务策略'} session={session}/>{area === 'dashboard' ? <TeamDashboard/> : area === 'knowledge' ? <KnowledgeBase/> : <ServiceSettings/>}</main></AgentWorkspaceShell>
}

function TeamDashboard() {
  return <div className="service-content"><section className="metric-row">{[['在线客服','3 / 4','较昨日 +1'],['正在接待','8','2 个高优先级'],['排队客户','3','最长等待 2:16'],['今日满意度','4.86','共 126 份评价']].map(([label,value,note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section><div className="board-grid"><section className="surface team-board"><div className="surface-head"><div><h2>团队工作负载</h2><p>状态与会话分配实时更新</p></div><button>手动分配会话</button></div><div className="team-grid">{team.map((agent) => <article key={agent.name}><div className="agent-line"><span className={`agent-state ${agent.tone}`}>{agent.name.slice(0,1)}</span><strong>{agent.name}<small>{agent.group}</small></strong><em className={agent.tone}>{agent.state}</em></div><div className="load-track"><i style={{width:`${Math.min(100,agent.active*22)}%`}} /></div><div className="agent-numbers"><span>接待中<b>{agent.active}</b></span><span>排队<b>{agent.queue}</b></span><span>首响<b>{agent.response}</b></span><span>满意度<b>{agent.score}</b></span></div></article>)}</div></section><aside className="surface schedule-card"><div className="surface-head"><div><h2>今日安排</h2><p>8 月 24 日 · 周一</p></div></div><div className="shift"><b>早班</b><span>09:00—18:00</span><strong>李楠 · 张宁 · 陈哲</strong></div><div className="shift muted"><b>晚班</b><span>14:00—22:00</span><strong>王悦 · 赵峰</strong></div><h3>交接提醒</h3><ul><li><i className="warn"/>18:00 前跟进 2 个 AI 留言</li><li><i/>技术支持组 17:30 交接</li><li><i/>VIP 客户等待主管回访</li></ul></aside></div></div>
}

function KnowledgeBase() {
  const [tab, setTab] = useState('faq')
  const [notice, setNotice] = useState('')
  return <div className="service-content"><section className="metric-row compact">{[['知识条目','286','本月 +24'],['AI 命中率','91.4%','较上周 +2.8%'],['待补充问题','18','来自未命中会话'],['已发布版本','V3.2','今天 10:24']].map(([label,value,note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section><section className="surface knowledge-surface"><div className="surface-head"><div><h2>知识内容</h2><p>FAQ 命中时直接回答，文档命中时由大模型生成答案</p></div><button onClick={() => setNotice('已打开新增知识表单（演示）')}>＋ 新增知识</button></div><div className="knowledge-tabs"><button className={tab === 'faq' ? 'active' : ''} onClick={() => setTab('faq')}>FAQ 常见问题</button><button className={tab === 'docs' ? 'active' : ''} onClick={() => setTab('docs')}>知识文档</button><button>未命中问题 <b>18</b></button></div>{tab === 'faq' ? <div className="faq-list">{knowledge.map((item) => <article key={item.title}><span className="faq-icon">Q</span><div><h3>{item.title}</h3><p>{item.answer}</p><small>{item.category} · 近 30 天命中 {item.hits} 次</small></div><em>{item.status}</em><button onClick={() => setNotice(`正在编辑：${item.title}`)}>编辑</button></article>)}</div> : <div className="doc-cards">{['售后服务说明.pdf','企业版产品手册.docx','账号安全指南.md'].map((name,index) => <article key={name}><span>DOC</span><h3>{name}</h3><p>{[42,68,24][index]} 个知识分片 · 已发布</p><button onClick={() => setNotice(`已打开 ${name}`)}>查看详情</button></article>)}</div>}</section>{notice && <div className="prototype-toast" role="status">✓ {notice}<button onClick={() => setNotice('')}>×</button></div>}</div>
}

function ServiceSettings() {
  const initial = useMemo(() => loadPrototypeConfig(), [])
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [theme, setTheme] = useState(initial.theme)
  const [welcome, setWelcome] = useState(initial.welcome)
  const [aiEnabled, setAiEnabled] = useState(initial.aiEnabled)
  const [dark, setDark] = useState(false)
  const mode = useMemo(() => aiEnabled && resolveServiceMode('20:15', { start, end }) === 'ai' ? 'ai' : 'human', [aiEnabled, start, end])
  const [notice, setNotice] = useState('')
  const publish = () => {
    savePrototypeConfig({ start, end, theme, welcome, aiEnabled })
    setNotice('已发布到 Web Widget 与独立聊天窗口')
  }
  return <div className="service-content settings-grid"><section className="surface settings-form"><div className="surface-head"><div><h2>非工作时间 AI 接管</h2><p>工作时段人工优先，下班后由 AI 基于企业知识库接待</p></div><label className="switch"><input type="checkbox" checked={aiEnabled} onChange={(event) => setAiEnabled(event.target.checked)}/><span/></label></div><div className="time-fields"><label>开始时间<input type="time" value={start} onChange={(e) => setStart(e.target.value)}/></label><span>至</span><label>结束时间<input type="time" value={end} onChange={(e) => setEnd(e.target.value)}/></label></div><div className="mode-note"><span className={mode}>{mode === 'ai' ? 'AI' : '人'}</span><div><strong>当前演示时间 20:15 · {mode === 'ai' ? 'AI 客服接待中' : '人工服务模式'}</strong><p>{mode === 'ai' ? '未解决问题将在下个工作日进入“待跟进”列表。' : '客户咨询将进入人工客服排队队列。'}</p></div></div><div className="setting-divider"/><h2>客户入口界面配置</h2><div className="config-fields"><label>欢迎语<input value={welcome} onChange={(e) => setWelcome(e.target.value)}/></label><label>品牌主题色<input type="color" value={theme} onChange={(e) => setTheme(e.target.value)}/></label><label>窗口位置<select><option>右下角</option><option>左下角</option></select></label><label>入口形态<select><option>气泡展开</option><option>横条展开</option><option>独立窗口</option></select></label></div><div className="theme-toggle"><span>预览主题</span><button className={!dark ? 'active' : ''} onClick={() => setDark(false)}>浅色</button><button className={dark ? 'active' : ''} onClick={() => setDark(true)}>深色</button></div><div className="publish-row"><button className="ghost" onClick={() => setNotice('配置草稿已保存')}>保存草稿</button><button onClick={publish}>发布配置</button></div></section><aside className="surface live-preview"><div className="preview-head"><div><h2>实时预览</h2><p>桌面端 · Web Widget</p></div><a href="/customer/chat" target="_blank" rel="noreferrer">独立窗口 ↗</a></div><div className={`widget-preview ${dark ? 'dark' : ''}`}><header style={{background:theme}}><span className="bot-orb">AI</span><strong>星河智能客服<small><i/>{mode === 'ai' ? 'AI 客服在线' : '人工客服在线'}</small></strong><button>—</button></header><div className="preview-chat"><p className="preview-time">今天 20:15</p><div className="bot-message">{welcome}<small>{mode === 'ai' ? '当前为非工作时间，AI 客服为您服务。' : '人工客服在线，很高兴为您服务。'}</small></div><div className="quick-question"><button>退款多久到账？</button><button>企业版如何部署？</button></div></div><footer><span>输入您的问题...</span><button style={{background:theme}}>➤</button></footer></div><p className="preview-tip">配置保存后，Widget 与独立聊天窗口同步更新。</p></aside>{notice && <div className="prototype-toast" role="status">✓ {notice}<button onClick={() => setNotice('')}>×</button></div>}</div>
}

export function CustomerChat({ onLogout }) {
  const config = useMemo(() => loadPrototypeConfig(), [])
  const serviceMode = config.aiEnabled && resolveServiceMode('20:15', config) === 'ai' ? 'ai' : 'human'
  const [status, setStatus] = useState('welcome')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [rating, setRating] = useState(0)
  const start = (text = '我想咨询退款到账时间') => { if (!text.trim()) return; setMessages([{ from: 'customer', text: text.trim() }, { from: 'system', text: serviceMode === 'ai' ? '当前为非工作时间，AI 客服正在检索企业知识库…' : '正在为您连接在线客服…' }]); setStatus(transitionChat('welcome','start')); window.setTimeout(() => { setMessages((list) => [...list, { from: 'agent', text: serviceMode === 'ai' ? '退款审核通过后通常会在 3–5 个工作日原路到账。若已超过 5 个工作日，我可以为您记录并交由人工客服跟进。' : '您好，我是客服李楠，很高兴为您服务。请问可以提供订单号吗？' }]); setStatus(transitionChat('queued','accept')) }, 700) }
  const send = () => { if (!draft.trim() || status !== 'handling') return; setMessages((list) => [...list, { from: 'customer', text: draft.trim() }]); setDraft('') }
  const finish = () => setStatus(transitionChat('handling','finish'))
  return <main className="customer-page"><div className="customer-backdrop"><div className="customer-copy"><span>星河科技 · 客户服务</span><h1>有问题，随时问我们。</h1><p>人工客服与 AI 助手协同在线，咨询记录会安全地保存在您的服务会话中。</p><div><b>7×24</b> 智能接待 <b>3 分钟</b> 平均响应</div></div></div><section className="customer-chat"><header style={{background:config.theme}}><span className="bot-orb">星</span><strong>星河客户服务<small><i/> {status === 'queued' ? (serviceMode === 'ai' ? 'AI 正在分析问题' : '排队中 · 前方 1 人') : status === 'handling' ? (serviceMode === 'ai' ? 'AI 客服正在为您服务' : '李楠正在为您服务') : (serviceMode === 'ai' ? 'AI 客服在线' : '人工客服在线')}</small></strong><button type="button" onClick={onLogout}>退出登录</button></header><div className="customer-messages"><p className="preview-time">今天 20:15</p>{status === 'welcome' && <><div className="agent-bubble">{config.welcome}。请选择常见问题或直接输入您的问题。</div><div className="customer-quick"><button onClick={() => start('退款多久到账？')}>退款多久到账？</button><button onClick={() => start('企业版支持私有化部署吗？')}>企业版支持私有化部署吗？</button><button onClick={() => start('如何修改登录密码？')}>如何修改登录密码？</button></div></>}{messages.map((message,index) => <div key={index} className={`${message.from}-bubble`}>{message.text}</div>)}{status === 'ended' || status === 'evaluated' ? <div className="rating-card"><strong>{status === 'evaluated' ? '感谢您的评价' : '本次服务已结束'}</strong><p>这次服务是否解决了您的问题？</p><div>{[1,2,3,4,5].map((star) => <button key={star} className={star <= rating ? 'active' : ''} onClick={() => setRating(star)}>★</button>)}</div><button className="rating-submit" disabled={!rating} onClick={() => setStatus(transitionChat('ended','rate'))}>提交评价</button></div> : null}</div><footer><button aria-label="上传图片">＋</button><input aria-label="输入消息" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (status === 'welcome' ? start(draft) : send())} placeholder="输入您的问题..."/><button className="chat-send" style={{background:config.theme}} onClick={() => status === 'welcome' ? start(draft) : send()}>发送</button></footer>{status === 'handling' && <button className="finish-chat" onClick={finish}>结束本次会话</button>}<p className="privacy-note">由 AI 智能客服系统提供支持 · 隐私数据已加密保护</p></section></main>
}
