/**
 * 免登录悬浮客服窗口
 * ------------------------------------------------------------
 * 任意页面通过 `tenantId` + `channel`（可选主题/欢迎语）即可挂载右下角客服气泡。
 * 客户无需注册：打开即 `ensureGuestSession` 换取访客 token，直接建会话、实时收发、评价。
 * 复用 `chatClient.js` SDK，与门户登录态（SESSION_KEY）完全隔离。
 */
import { useEffect, useRef, useState } from 'react'

import { createChatClient, ensureGuestSession, newClientSessionId } from '../chatClient.js'
import './chat-widget.css'

const QUICK_QUESTIONS = ['退款多久到账？', '企业版支持私有化部署吗？', '如何修改登录密码？']
const RATING_OPTIONS = [
  ['very_satisfied', '非常满意'],
  ['satisfied', '满意'],
  ['neutral', '一般'],
  ['dissatisfied', '不满意'],
]

export default function CustomerChatWidget({
  tenantId,
  channel = 'web',
  theme = '#315bea',
  welcome = '您好，欢迎咨询星河科技',
  autoOpen = false,
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
  const clientRef = useRef(null)

  const loadCurrent = async (conversationId) => {
    const c = clientRef.current
    if (!c) return
    try {
      const detail = await c.rest.getConversation(conversationId)
      setConversation(detail)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  useEffect(() => {
    let alive = true
    const boot = async () => {
      clientRef.current = null
      try {
        const session = await ensureGuestSession({ tenantId, channel })
        const c = createChatClient({ getToken: () => session.accessToken, channel })
        clientRef.current = c
        if (alive) setClient(c)
        // 已有未结束会话则直接进入，避免重复建会
        const result = await c.rest.listConversations({ pageSize: 20 })
        const active = result.items.find((item) =>
          ['queued', 'human'].includes(item.status)
          || (item.status === 'ended' && item.evaluationPresentedAt),
        )
        if (alive && active) {
          const detail = await c.rest.getConversation(active.id)
          setConversation(detail)
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
  }, [tenantId, channel])

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
      'evaluation.visible',
      'evaluation.submitted',
    ]
    const unsubscribers = handlers.map((name) => realtime.subscribe(name, refresh))
    realtime.join(conversation.id).then(() => setConnected(true))
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      realtime.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, conversation?.id])

  const send = async (text = draft) => {
    const content = text.trim()
    if (!client || !content || sending || conversation?.status === 'evaluated') return
    setSending(true)
    setError('')
    try {
      if (!conversation) {
        const created = await client.rest.createOrResumeConversation({
          firstMessage: content,
          clientMessageId: newClientSessionId(),
          channel,
        })
        setConversation(await client.rest.getConversation(created.id))
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
    ? '人工客服在线'
    : conversation.status === 'queued'
      ? '正在排队等待客服'
      : conversation.status === 'human'
        ? `${conversation.agent?.name || '客服'} 正在为您服务`
        : '本次会话已结束'
  const evaluationVisible = Boolean(conversation?.evaluationPresentedAt) && !isReadOnly

  return (
    <div className="csw-container" style={{ '--csw-theme': theme }}>
      <button
        type="button"
        className="csw-orb"
        aria-label="打开客服窗口"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="csw-orb-dot" />
      </button>

      {open && (
        <section className="csw-panel">
          <header
            className="csw-head"
            style={{ background: theme }}
          >
            <span className="csw-orb-btn">星</span>
            <strong>
              星河客户服务
              <small>
                {statusText} · {connected ? '实时已连接' : '正在连接'}
              </small>
            </strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="收起窗口">×</button>
          </header>

          <div className="csw-body">
            {loading && <div className="csw-loading">正在加载历史会话…</div>}

            {!loading && !conversation && (
              <>
                <div className="csw-welcome">{welcome}。请选择常见问题或直接输入您的问题。</div>
                <div className="csw-quick">
                  {QUICK_QUESTIONS.map((question) => (
                    <button key={question} type="button" onClick={() => send(question)}>
                      {question}
                    </button>
                  ))}
                </div>
              </>
            )}

            {conversation?.messages?.map((message) => (
              <div
                key={message.id}
                className={`csw-msg csw-${message.senderType === 'customer' ? 'customer' : message.senderType === 'system' ? 'system' : 'agent'}`}
              >
                {message.content}
              </div>
            ))}

            {error && <div className="csw-error">{error}</div>}

            {evaluationVisible && (
              <div className="csw-rating">
                <strong>请评价本次服务</strong>
                <p>您的评价将直接结束本次会话。</p>
                <div className="csw-options">
                  {RATING_OPTIONS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={rating === value ? 'active' : ''}
                      onClick={() => setRating(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <textarea
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
                <span className="csw-check">✓</span>
                <strong>感谢您的反馈</strong>
                <p>评价已提交，本次会话已经结束</p>
              </div>
            )}

            {!loading && !conversation && <div className="csw-muted">人工会话已持久化 · 断线重连后自动同步</div>}
          </div>

          <footer className="csw-inputbar">
            <input
              aria-label="输入消息"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') send()
              }}
              disabled={sending || isReadOnly}
              placeholder={isReadOnly ? '评价已完成，会话只读' : conversation?.status === 'ended' ? '会话已结束 · 仍可补充消息' : '输入您的问题...'}
            />
            <button
              type="button"
              className={`csw-chat-send ${isReadOnly ? 'csw-nosend' : ''}`}
              style={{ background: isReadOnly ? undefined : theme }}
              disabled={sending || !draft.trim() || isReadOnly}
              onClick={() => send()}
            >
              发送
            </button>
          </footer>
        </section>
      )}
    </div>
  )
}
