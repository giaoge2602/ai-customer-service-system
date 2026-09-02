/**
 * 免登录悬浮客服窗口
 * ------------------------------------------------------------
 * 任意页面通过 `tenantId` + `channel`（可选主题/欢迎语）即可挂载右下角客服气泡。
 * 客户无需注册：打开即 `ensureGuestSession` 换取访客 token，直接建会话、实时收发、评价。
 * 复用 `chatClient.js` SDK，与门户登录态（SESSION_KEY）完全隔离。
 *
 * DESIGN CONTRACT — rw-manual-acetate-tab-board（seed 06d61a5b，决策页锁定，code-led）
 * THESIS: 咨询是一本可追踪的服务手册——对话逐条编入手册，状态由右缘阶梯页签与勘误条管理；
 *   拒绝品类默认的「蓝头 + 圆气泡」聊天窗。
 * OWN-WORLD: 牛奶纸 #fafaf6 + 印刷墨 #16130d；章节板色满强度（咨询=主题色 / 排队=氧化橙 /
 *   人工=青 / 评价=铬黄 / 完结=赭石），朱红仅作勘误条；打孔申请单、铰链醋酸酯输入页、
 *   mono 机械语气、黑体标题宋体正文、硬 1px 分区线。
 * STORY: 访客打开即在「咨询」分区：读前言、点 § 条目或提交申请单；回复逐条印出；
 *   出错读勘误条并可重试；完成后盖「已完结」章。
 * FIRST VIEWPORT: 376px 手册面板——右缘五段页签（当前段延伸且其色即板色），板色满强度头部
 *   （星环印 + mono 回执号），醋酸酯洗白阅读场承载前言与 § 条目，底缘输入页 + 墨块发送钮。
 * FORM: 挑战者 rw-manual-acetate-tab-board 经用户锁定；一切状态变化 90ms steps(2) 两帧步进，无缓动。
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
 *   the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */
import { useEffect, useRef, useState } from 'react'

import { createChatClient, ensureGuestSession, newClientSessionId, readGuestConversationId, selectGuestConversationToRestore, writeGuestConversationId } from '../chatClient.js'
import { MessageContent } from './MessageContent.jsx'
import VoiceRecorder from './VoiceRecorder.jsx'
import { useMediaUploader } from './useMediaUploader.js'
import './chat-widget.css'

const QUICK_QUESTIONS = ['退款多久到账？', '企业版支持私有化部署吗？', '如何修改登录密码？']
const RATING_OPTIONS = [
  ['very_satisfied', '非常满意'],
  ['satisfied', '满意'],
  ['neutral', '一般'],
  ['dissatisfied', '不满意'],
]

/* 手册的五个分区：右缘阶梯页签；当前分区的颜色即整窗板色 */
const STAGES = [
  ['consult', '咨询'],
  ['queue', '排队'],
  ['human', '人工'],
  ['review', '评价'],
  ['done', '完结'],
]
const STAGE_HUES = { queue: '#d96c2c', human: '#1f7a78', review: '#e6b800', done: '#8c5a3c' }

/* ---------- 醋酸酯页 alpha 求解（世界的 web leverage） ----------
 * 纸色叠在章节板色上做 sRGB source-over 合成，二分求 alpha 直到阅读场
 * 相对亮度落入固定带——无论嵌入方把主题色改成什么，正文都落在同一亮度。 */
const PAPER_RGB = [250, 250, 246]
const FIELD_TARGET_LUMA = 0.88

function hexToRgb(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim())
  if (!match) return null
  const value = parseInt(match[1], 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function relLuminance([r, g, b]) {
  const channel = (v) => {
    v /= 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function solveLeafAlpha(boardHex) {
  const board = hexToRgb(boardHex)
  if (!board) return 0.86
  if (relLuminance(board) >= FIELD_TARGET_LUMA) return 0
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2
    const mixed = board.map((v, k) => v * (1 - mid) + PAPER_RGB[k] * mid)
    if (relLuminance(mixed) < FIELD_TARGET_LUMA) lo = mid
    else hi = mid
  }
  return Math.round(((lo + hi) / 2) * 100) / 100
}

function onBoardColor(boardHex) {
  const board = hexToRgb(boardHex)
  if (!board) return '#fafaf6'
  /* 阈值 0.2：氧化橙板 (#d96c2c, L≈0.26) 也翻为墨字（5.1:1），深蓝仍用纸字（5.3:1） */
  return relLuminance(board) > 0.2 ? '#16130d' : '#fafaf6'
}

/* 客户只看人话：状态码与后端原始报错留控制台，窗口内给问题与恢复路径 */
function describeError(raw) {
  const text = String(raw || '')
  console.warn('[customer-chat] 请求失败详情:', text)
  if (/请求失败 \(\d+\)/.test(text)) return '服务暂时没有响应，请稍后重试'
  if (/网络|network|failed to fetch/i.test(text)) return '网络连接不稳定，请检查网络后重试'
  return '出了点问题，暂时无法完成，请稍后重试'
}

/* 手册语法的描线图标（禁 emoji 充当图标） */
function IconImage() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="5.4" cy="6.2" r="1.3" fill="currentColor" />
      <path d="M3 12l3.2-3.4 2.2 2.2 2.4-2.6 2.6 2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}
function IconClip() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path
        d="M11.5 7.2 7 11.7a2.7 2.7 0 0 1-3.8-3.8l5.6-5.6a1.9 1.9 0 0 1 2.7 2.7l-5.3 5.3a1 1 0 0 1-1.4-1.4l4.6-4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconClose() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
      <path d="M1.5 1.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function CustomerChatWidget({
  tenantId,
  channel = 'web',
  theme = '#315bea',
  welcome = '您好，欢迎咨询星河科技',
  autoOpen = false,
  // 访客昵称：嵌入方可传入已知身份（如宿主页面的登录名），客服侧会看到名字而不是「访客」
  visitorName,
}) {
  const [open, setOpen] = useState(autoOpen)
  const [connected, setConnected] = useState(false)
  const [client, setClient] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rating, setRating] = useState('')
  const [ratingText, setRatingText] = useState('')
  const [playingId, setPlayingId] = useState('')
  const [notice, setNotice] = useState('')
  const clientRef = useRef(null)
  const uploaderRef = useRef(null)
  const bodyRef = useRef(null)
  const followLatestMessageRef = useRef(true)

  const loadCurrent = async (conversationId) => {
    const c = clientRef.current
    if (!c) return
    try {
      const detail = await c.rest.getConversation(conversationId)
      setConversation(detail)
      writeGuestConversationId({ tenantId, channel, conversationId: detail.id })
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const conversationRef = useRef(null)
  conversationRef.current = conversation
  const uploader = useMediaUploader({
    getToken: () => clientRef.current?.getToken?.() || '',
    sendMessage: (conversationId, input) => clientRef.current?.rest.sendConversationMessage(conversationId, input),
    onNotify: (message, tone) => { if (tone === 'error') setError(message); else setNotice(message) },
    onFinished: () => { if (conversationRef.current?.id) loadCurrent(conversationRef.current.id) },
  })
  uploaderRef.current = uploader
  const uploadView = { uploading: uploader.uploading, progress: uploader.progress, phase: uploader.phase }

  useEffect(() => {
    let alive = true
    const boot = async () => {
      clientRef.current = null
      setError('')
      try {
        const session = await ensureGuestSession({ tenantId, channel, name: visitorName })
        const c = createChatClient({ getToken: () => session.accessToken, channel })
        clientRef.current = c
        if (alive) setClient(c)
        // 刷新恢复顺序：本机记住的会话 → 当前活动会话 → 本渠道最近历史会话。
        let detail = null
        const rememberedId = readGuestConversationId({ tenantId, channel })
        if (rememberedId) {
          try {
            detail = await c.rest.getConversation(rememberedId)
          } catch {
            // 记忆可能已失效或不再可见，继续使用服务端列表恢复。
          }
        }
        if (!detail) {
          const result = await c.rest.listConversations({ pageSize: 20, channel })
          const resumable = selectGuestConversationToRestore(result.items)
          if (resumable) detail = await c.rest.getConversation(resumable.id)
        }
        if (alive && detail) {
          setConversation(detail)
          writeGuestConversationId({ tenantId, channel, conversationId: detail.id })
        }
      } catch (requestError) {
        if (alive) setError(requestError.message)
      } finally {
        if (alive) setLoading(false)
      }
    }
    boot()
    return () => {
      alive = false
    }
  }, [tenantId, channel, visitorName])

  useEffect(() => {
    if (!client || !conversation?.id) {
      if (client) setConnected(false)
      return undefined
    }
    const realtime = client.openRealtime(conversation.id)
    setConnected(realtime.isConnected())
    const refresh = () => loadCurrent(conversation.id)
    const handlers = [
      'message.created',
      'conversation.claimed',
      'conversation.released',
      'conversation.ended',
      'conversation.reopened',
      'evaluation.visible',
      'evaluation.submitted',
      'attachment.updated',
      'transcription.updated',
    ]
    const unsubscribers = handlers.map((name) => realtime.subscribe(name, refresh))
    realtime.join(conversation.id).then(() => setConnected(true))
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      realtime.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, conversation?.id])

  useEffect(() => {
    if (open) followLatestMessageRef.current = true
  }, [open, conversation?.id])

  useEffect(() => {
    if (!open || !followLatestMessageRef.current) return undefined
    const frame = window.requestAnimationFrame(() => {
      const body = bodyRef.current
      if (body) body.scrollTop = body.scrollHeight
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open, conversation?.id, conversation?.messages])

  const send = async (text = draft) => {
    const content = text.trim()
    if (!client || !content || sending || conversation?.status === 'evaluated') return
    followLatestMessageRef.current = true
    setSending(true)
    setError('')
    try {
      if (!conversation) {
        const created = await client.rest.createOrResumeConversation({
          firstMessage: content,
          clientMessageId: newClientSessionId(),
          channel,
        })
        const detail = await client.rest.getConversation(created.id)
        writeGuestConversationId({ tenantId, channel, conversationId: detail.id })
        setConversation(detail)
      } else {
        await client.rest.sendConversationMessage(conversation.id, {
          content,
          clientMessageId: newClientSessionId(),
        })
        setConversation(await client.rest.getConversation(conversation.id))
      }
      setDraft('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSending(false)
    }
  }

  // 多媒体发送：尚无会话时先以文本建立会话，再发送附件消息；失败项保留可重试
  const sendMedia = async (file, kind, durationMs) => {
    const uploader2 = uploaderRef.current
    if (!client || isReadOnly || !uploader2 || uploader2.uploading) return
    followLatestMessageRef.current = true
    setError('')
    try {
      let conversationId = conversation?.id
      if (!conversationId) {
        const created = await client.rest.createOrResumeConversation({
          firstMessage: '（客户发送了多媒体消息）',
          clientMessageId: newClientSessionId(),
          channel,
        })
        conversationId = created.id
        writeGuestConversationId({ tenantId, channel, conversationId })
        setConversation(created)
      }
      const ok = await uploader2.send({ conversationId, file, kind, mimeType: file.type, durationMs })
      if (ok) await loadCurrent(conversationId)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const recognizeVoice = async (messageId) => {
    if (!client || !conversation?.id) return
    followLatestMessageRef.current = true
    await client.rest.recognizeTranscription(messageId)
    await loadCurrent(conversation.id)
  }

  const finish = async () => {
    if (!conversation) return
    try {
      await client.rest.endConversation(conversation.id)
      setConversation(await client.rest.getConversation(conversation.id))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const submitRating = async () => {
    if (!conversation || !rating) return
    try {
      await client.rest.submitConversationEvaluation(conversation.id, {
        rating,
        ...(ratingText.trim() ? { comment: ratingText.trim() } : {}),
      })
      setConversation(await client.rest.getConversation(conversation.id))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const isReadOnly = conversation?.status === 'evaluated'
  const statusText = !conversation
    ? 'AI 客服即时响应 · 人工客服工作时段在线'
    : conversation.status === 'queued'
      ? '正在排队等待客服'
      : conversation.status === 'human'
        ? `${conversation.agent?.name || '客服'} 正在为您服务`
        : conversation.status === 'ai_handling'
          ? 'AI 助手正在为您服务'
          : '本次会话已结束'
  const evaluationVisible = Boolean(conversation?.evaluationPresentedAt) && !isReadOnly

  /* 手册分区：无会话=咨询；排队/人工/已评价/已结束各归其位 */
  const stage = loading || !conversation
    ? 'consult'
    : conversation.status === 'queued'
      ? 'queue'
      : conversation.status === 'human'
        ? 'human'
        : conversation.status === 'evaluated'
          ? 'done'
          : evaluationVisible
            ? 'review'
            : conversation.status === 'ended'
              ? 'done'
              : 'consult'
  const board = stage === 'consult' ? theme : STAGE_HUES[stage]
  /* 纸字板（深色）上 mono 行需要全强度才达 4.5:1；墨字板留 0.9 的层级 */
  const headMonoOpacity = onBoardColor(board) === '#fafaf6' ? 1 : 0.9
  const refNo = conversation
    ? (String(conversation.id).replace(/[^0-9a-z]/gi, '').slice(-6).toUpperCase() || '——')
    : ''

  return (
    <div
      className="csw-container"
      style={{
        '--csw-theme': theme,
        '--csw-board': board,
        '--csw-field-a': solveLeafAlpha(board),
        '--csw-on-board': onBoardColor(board),
        '--csw-head-mono-o': headMonoOpacity,
      }}
    >
      <button
        type="button"
        className="csw-orb"
        aria-label="打开客服窗口"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="csw-orb-star" aria-hidden="true">星</span>
      </button>

      {open && (
        <section className="csw-panel" data-design-contract="rw-manual-acetate-tab-board · seed 06d61a5b">
          <aside className="csw-rail" aria-hidden="true">
            {STAGES.map(([key, label]) => (
              <span
                key={key}
                className={`csw-tab ${stage === key ? 'csw-tab-active' : ''}`}
                style={{ '--csw-tab-hue': key === 'consult' ? theme : STAGE_HUES[key] }}
              >
                {label}
              </span>
            ))}
          </aside>

          <div className="csw-spread">
            <header className="csw-head">
              <span className="csw-seal" aria-hidden="true">星</span>
              <div className="csw-title">
                <strong>星河客户服务</strong>
                <small className="csw-mono">
                  SERVICE DESK{refNo ? ` · NO.${refNo}` : ''} · {connected ? 'LINK OK' : conversation ? 'LINKING' : 'READY'}
                </small>
                <small className="csw-status">{statusText}</small>
              </div>
              <button type="button" className="csw-close" onClick={() => setOpen(false)} aria-label="收起窗口">
                <IconClose />
              </button>
            </header>

            <div
              ref={bodyRef}
              className="csw-body"
              onScroll={(event) => {
                const body = event.currentTarget
                followLatestMessageRef.current = body.scrollHeight - body.scrollTop - body.clientHeight < 80
              }}
            >
              {loading && <div className="csw-pending">正在调取历史记录…</div>}

              {!loading && !conversation && (
                <>
                  <div className="csw-foreword">
                    <span className="csw-tag">前言 · FOREWORD</span>
                    <p>{welcome}。请选择常见问题条目，或直接在下方提交您的问题。</p>
                  </div>
                  <nav className="csw-refs" aria-label="常见问题">
                    {QUICK_QUESTIONS.map((question, index) => (
                      <button key={question} type="button" onClick={() => send(question)}>
                        <span className="csw-mono">§{index + 1}</span>
                        {question}
                      </button>
                    ))}
                  </nav>
                  <div className="csw-footnote">本机已记住当前会话 · 历史记录由服务端安全同步</div>
                </>
              )}

              {conversation?.messages?.map((message) => {
                const isCustomer = message.senderType === 'customer'
                const isSystem = message.senderType === 'system'
                const hasMedia = Boolean(message.messageType && message.messageType !== 'text')
                const lineClass = [
                  'csw-line',
                  isSystem ? 'csw-line-system' : isCustomer ? 'csw-line-customer' : 'csw-line-agent',
                  hasMedia ? 'csw-line-media' : '',
                ].filter(Boolean).join(' ')
                return (
                  <div key={message.id} className={lineClass}>
                    {!isCustomer && !isSystem && !hasMedia && (
                      <span className="csw-who">
                        {message.senderType === 'ai' ? 'AI 助手' : message.sender?.name || '客服'}
                      </span>
                    )}
                    {hasMedia
                      ? <MessageContent
                          message={message}
                          tokenGetter={() => clientRef.current?.getToken?.() || ''}
                          onRecognizeTranscription={recognizeVoice}
                          canRecognizeTranscription
                          playingId={playingId}
                          onPlayStateChange={setPlayingId}
                        />
                      : message.content}
                  </div>
                )
              })}

              {error && (
                <div className="csw-slip csw-slip-errata" role="alert">
                  <span className="csw-slip-tag">勘误 ERRATA</span>
                  <span className="csw-slip-msg">{describeError(error)}。内容没有丢失，可直接重试。</span>
                  <button
                    type="button"
                    className="csw-slip-act"
                    onClick={() => { setError(''); if (draft.trim()) send() }}
                  >
                    重试
                  </button>
                  <button type="button" className="csw-x" aria-label="关闭提示" onClick={() => setError('')}>×</button>
                </div>
              )}
              {notice && !error && (
                <div className="csw-slip csw-slip-notice" role="status">
                  <span className="csw-slip-msg">{notice}</span>
                  <button type="button" className="csw-x" aria-label="关闭提示" onClick={() => setNotice('')}>×</button>
                </div>
              )}
              {uploadView.uploading && (
                <div className="csw-slip csw-slip-progress">
                  <span className="csw-slip-msg">{uploadView.phase || '正在处理…'}</span>
                  <span className="csw-meter"><i style={{ transform: `scaleX(${(uploadView.progress || 0) / 100})` }} /></span>
                  <span className="csw-pct">{uploadView.progress}%</span>
                </div>
              )}

              {evaluationVisible && (
                <div className="csw-receipt">
                  <span className="csw-tag">服务回执 · RECEIPT</span>
                  <strong>请评价本次服务</strong>
                  <p className="csw-hint">您的评价将直接结束本次会话。</p>
                  <div className="csw-options">
                    {RATING_OPTIONS.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={rating === value ? 'csw-checked' : ''}
                        onClick={() => setRating(value)}
                      >
                        <span className="csw-box" aria-hidden="true" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="csw-remark"
                    maxLength={200}
                    value={ratingText}
                    onChange={(event) => setRatingText(event.target.value)}
                    placeholder="还有什么想说的？（选填）"
                  />
                  <button
                    type="button"
                    className="csw-submit"
                    disabled={!rating}
                    onClick={submitRating}
                  >
                    提交评价并结束
                  </button>
                </div>
              )}

              {isReadOnly && (
                <div className="csw-thanks">
                  <span className="csw-stamp">已完结</span>
                  <span className="csw-tag">SERVICE COMPLETED</span>
                  <strong>感谢您的反馈</strong>
                  <p>评价已提交，本次会话已经结束</p>
                </div>
              )}
            </div>

            <footer className="csw-inputbar">
              <div className="csw-media-row">
                <label className={`csw-media-btn ${isReadOnly || uploadView.uploading ? 'csw-disabled' : ''}`} title="发送图片">
                  <IconImage />
                  图片
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    hidden
                    disabled={isReadOnly || uploadView.uploading}
                    onChange={(event) => {
                      const files = Array.from(event.target.files || [])
                      event.target.value = ''
                      void (async () => {
                        for (const file of files) await sendMedia(file, 'image')
                      })()
                    }}
                  />
                </label>
                <label className={`csw-media-btn ${isReadOnly || uploadView.uploading ? 'csw-disabled' : ''}`} title="发送文件">
                  <IconClip />
                  文件
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                    hidden
                    disabled={isReadOnly || uploadView.uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (file) sendMedia(file, 'file')
                    }}
                  />
                </label>
                <VoiceRecorder
                  disabled={isReadOnly || uploadView.uploading || sending}
                  onSend={({ blob, mimeType, durationMs }) => sendMedia(
                    new File([blob], `语音-${Date.now()}.wav`, { type: mimeType }),
                    'audio',
                    durationMs,
                  )}
                />
              </div>
              <div className="csw-input-row">
                <input
                  aria-label="输入消息"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') send()
                  }}
                  disabled={sending || isReadOnly}
                  placeholder={isReadOnly ? '评价已完成，会话只读' : conversation?.status === 'ended' ? '发送新消息将重新开启会话' : '输入您的问题…'}
                />
                <button
                  type="button"
                  className="csw-send"
                  disabled={sending || !draft.trim() || isReadOnly}
                  onClick={() => send()}
                >
                  发送
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}
    </div>
  )
}
