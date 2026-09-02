/**
 * 多媒体消息渲染：按 messageType 渲染图片 / 文件 / 语音 / 文本。
 * 气泡的发送方、时间、已读等仍由外层统一处理；本组件只负责消息体。
 * 附件内容通过鉴权接口换取 Blob URL，不使用永久公开地址。
 */
import { useEffect, useRef, useState } from 'react'

import { fetchAttachmentBlobUrl } from '../conversationApi.js'
import { formatBytes, formatDuration } from './mediaPolicy.js'

/** 通用 blob 加载钩子：组件卸载时释放 objectURL，避免内存泄漏 */
export function useAttachmentBlob(attachmentId, tokenGetter) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const urlRef = useRef('')
  useEffect(() => {
    let alive = true
    setUrl('')
    setError('')
    fetchAttachmentBlobUrl(attachmentId, tokenGetter?.())
      .then((blobUrl) => {
        if (!alive) { URL.revokeObjectURL(blobUrl); return }
        urlRef.current = blobUrl
        setUrl(blobUrl)
      })
      .catch((requestError) => {
        if (alive) setError(requestError.message)
      })
    return () => {
      alive = false
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = ''
    }
  }, [attachmentId, reloadKey])
  return { url, error, reload: () => setReloadKey((key) => key + 1) }
}

function ImageMessage({ attachment, tokenGetter }) {
  const { url, error, reload } = useAttachmentBlob(attachment.id, tokenGetter)
  const [zoom, setZoom] = useState(false)
  if (error) {
    return (
      <div className="mm-media-fallback">
        <span>图片加载失败 · {attachment.fileName}</span>
        <button type="button" onClick={reload}>重新获取</button>
      </div>
    )
  }
  return (
    <div className="mm-image">
      {url
        ? <button type="button" className="mm-image-btn" onClick={() => setZoom(true)} aria-label="查看大图">
            <img src={url} alt={attachment.fileName} />
          </button>
        : <div className="mm-image-loading">图片加载中…</div>}
      <small>{formatBytes(attachment.sizeBytes)}</small>
      {zoom && url && (
        <div className="mm-lightbox" role="dialog" aria-modal="true" aria-label="图片大图查看" onClick={() => setZoom(false)}>
          <img src={url} alt={attachment.fileName} />
          <div className="mm-lightbar">
            <span>{attachment.fileName} · {formatBytes(attachment.sizeBytes)}</span>
            <a href={url} download={attachment.fileName} onClick={(event) => event.stopPropagation()}>下载</a>
            <button type="button" onClick={() => setZoom(false)}>关闭 (Esc)</button>
          </div>
        </div>
      )}
    </div>
  )
}

function FileMessage({ attachment, tokenGetter }) {
  const { url } = useAttachmentBlob(attachment.id, tokenGetter)
  return (
    <div className="mm-file">
      <span className="mm-file-icon">{extensionLabel(attachment.fileName)}</span>
      <div className="mm-file-main">
        <strong>{attachment.fileName}</strong>
        <small>{formatBytes(attachment.sizeBytes)}{attachment.status !== 'ready' ? ' · 处理中' : ''}</small>
      </div>
      {url
        ? <a className="mm-file-download" href={url} download={attachment.fileName}>下载</a>
        : <button type="button" className="mm-file-download" disabled>获取中…</button>}
    </div>
  )
}

function extensionLabel(fileName) {
  const match = /\.([a-z0-9]+)$/i.exec(fileName || '')
  return (match ? match[1] : 'file').toUpperCase().slice(0, 4)
}

/** 语音消息：播放/时长/进度 + 转写文本；列表级单音频播放由播放事件上报父级处理 */
export function VoiceMessage({ messageId, attachment, transcription, tokenGetter, onRecognize, canRecognize = false, playingId, onPlayStateChange }) {
  const { url, error, reload } = useAttachmentBlob(attachment.id, tokenGetter)
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showText, setShowText] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const [recognitionError, setRecognitionError] = useState('')

  useEffect(() => {
    if (playingId && playingId !== attachment.id && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
    }
  }, [playingId, attachment.id])

  useEffect(() => {
    if (!recognizing) return
    if (transcription?.status === 'succeeded') {
      setRecognizing(false)
      setShowText(true)
    } else if (transcription?.status === 'failed') {
      setRecognizing(false)
    }
  }, [recognizing, transcription?.status])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      onPlayStateChange?.(attachment.id)
      audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }

  const status = transcription?.status
  const confidence = typeof transcription?.confidence === 'number'
    ? (transcription.confidence > 1 ? transcription.confidence / 100 : transcription.confidence)
    : null
  const lowConfidence = confidence !== null && confidence < 0.6
  const isRealResult = transcription?.provider?.startsWith('xfyun-')
  const canStartRecognition = canRecognize && (!transcription || status === 'failed' || (status === 'succeeded' && !isRealResult))
  const processing = recognizing || status === 'pending' || status === 'processing'

  const recognize = async () => {
    if (!onRecognize || recognizing) return
    setRecognitionError('')
    setRecognizing(true)
    try {
      await onRecognize(messageId)
    } catch (requestError) {
      setRecognizing(false)
      setRecognitionError(requestError.message || '语音识别请求失败，请重试')
    }
  }

  return (
    <div className="mm-voice">
      <div className="mm-voice-main">
        <button
          type="button"
          className={`mm-voice-play ${playing ? 'playing' : ''}`}
          onClick={togglePlay}
          disabled={!url}
          aria-label={playing ? '暂停语音' : '播放语音'}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <div className="mm-voice-track">
          <div className="mm-voice-wave"><i style={{ width: `${progress}%` }} /></div>
          <small>{formatDuration(attachment.durationMs || 0)} · {formatBytes(attachment.sizeBytes)}</small>
        </div>
        {url && <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setProgress(0) }}
          onTimeUpdate={(event) => {
            const audio = event.currentTarget
            if (audio.duration) setProgress(Math.round((audio.currentTime / audio.duration) * 100))
          }}
        />}
      </div>
      {error && (
        <div className="mm-voice-transcription failed">
          语音加载失败
          <button type="button" onClick={reload}>重新获取</button>
        </div>
      )}
      {processing && (
        <div className="mm-voice-transcription pending" role="status">讯飞正在识别语音…</div>
      )}
      {!processing && canStartRecognition && status !== 'failed' && (
        <div className="mm-voice-transcription mm-transcribe-ready">
          <button type="button" className="mm-transcribe-action" onClick={recognize}>
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M2 9.5V6.5M5 12V4M8 14V2M11 11V5M14 9V7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {transcription ? '使用讯飞重新识别' : '识别语音'}
          </button>
          <small>点击后将语音提交至讯飞中英识别大模型</small>
        </div>
      )}
      {status === 'succeeded' && !processing && (
        <div className={`mm-voice-transcription ${lowConfidence ? 'low' : ''}`}>
          <button type="button" className="mm-voice-toggle" onClick={() => setShowText((value) => !value)}>
            {showText ? '收起文字' : '查看文字'}
          </button>
          {showText && <p>{transcription.text}</p>}
          {showText && lowConfidence && <small>识别结果可能不准确，请以语音为准</small>}
        </div>
      )}
      {status === 'failed' && !processing && (
        <div className="mm-voice-transcription failed">
          未能识别此段语音（语音仍可播放）
          {canStartRecognition && <button type="button" className="mm-transcribe-action" onClick={recognize}>重新识别</button>}
        </div>
      )}
      {recognitionError && <div className="mm-voice-transcription failed" role="alert">{recognitionError}</div>}
    </div>
  )
}

export function MessageContent({ message, tokenGetter, onRecognizeTranscription, canRecognizeTranscription = false, playingId, onPlayStateChange }) {
  const attachment = message.attachment
  if (['image', 'file', 'audio'].includes(message.messageType) && !attachment?.id) {
    return (
      <div className="mm-media-fallback" role="status">
        <span>{message.content || message.text || '附件信息正在同步，请稍候…'}</span>
      </div>
    )
  }
  switch (message.messageType) {
    case 'image':
      return <ImageMessage attachment={attachment} tokenGetter={tokenGetter} />
    case 'file':
      return <FileMessage attachment={attachment} tokenGetter={tokenGetter} />
    case 'audio':
      return <VoiceMessage
        messageId={message.id}
        attachment={attachment}
        transcription={message.transcription}
        tokenGetter={tokenGetter}
        onRecognize={onRecognizeTranscription}
        canRecognize={canRecognizeTranscription}
        playingId={playingId}
        onPlayStateChange={onPlayStateChange}
      />
    default:
      return <span className="mm-text">{message.content ?? message.text ?? ''}</span>
  }
}
