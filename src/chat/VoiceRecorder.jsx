/**
 * 语音录制状态机：idle → recording → preview（→ uploading 由父级接管）
 * 覆盖权限拒绝、不支持录音、最短/最长时间、切后台安全停止。
 */
import { useEffect, useRef, useState } from 'react'

import { formatDuration, isRecordingSupported, pickSupportedAudioMimeType } from './mediaPolicy.js'
import { blobToWav16kMono } from './wavEncoder.js'

const MAX_MS = 5 * 60 * 1000
const MIN_MS = 1000

export default function VoiceRecorder({ onSend, onCancel, disabled = false, sendLabel = '发送语音' }) {
  const [state, setState] = useState('idle') // idle | recording | preview | denied
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState('')
  const [blob, setBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const startedAtRef = useRef(0)
  const timerRef = useRef(null)
  const previewUrlRef = useRef('')

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }
  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }
  const resetPreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
    setPreviewUrl('')
    setBlob(null)
  }

  // 切后台 / 组件卸载时安全停止
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && recorderRef.current?.state === 'recording') stopRecording()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearTimer()
      cleanupStream()
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startRecording = async () => {
    setError('')
    resetPreview()
    if (!isRecordingSupported()) {
      setError('当前浏览器不支持录音，可改用文件上传音频')
      setState('denied')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      streamRef.current = stream
      const mimeType = pickSupportedAudioMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const durationMs = Date.now() - startedAtRef.current
        const recorded = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        cleanupStream()
        clearTimer()
        if (durationMs < MIN_MS || recorded.size === 0) {
          setError('录音太短，请长按或点击后稍作停顿再结束')
          setState('idle')
          return
        }
        setBlob(recorded)
        previewUrlRef.current = URL.createObjectURL(recorded)
        setPreviewUrl(previewUrlRef.current)
        setElapsedMs(durationMs)
        setState('preview')
      }
      recorderRef.current = recorder
      startedAtRef.current = Date.now()
      setElapsedMs(0)
      recorder.start(1000)
      setState('recording')
      timerRef.current = setInterval(() => {
        const ms = Date.now() - startedAtRef.current
        setElapsedMs(ms)
        if (ms >= MAX_MS) stopRecording()
      }, 200)
    } catch (requestError) {
      cleanupStream()
      if (requestError?.name === 'NotAllowedError' || requestError?.name === 'SecurityError') {
        setError('无法使用麦克风，请在浏览器设置中允许后重试')
      } else if (requestError?.name === 'NotFoundError') {
        setError('未检测到可用麦克风设备')
      } else {
        setError('录音启动失败，请重试')
      }
      setState('denied')
    }
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  const cancelRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null
      recorderRef.current.stop()
    }
    cleanupStream()
    clearTimer()
    resetPreview()
    recorderRef.current = null
    setState('idle')
    onCancel?.()
  }

  const discardPreview = () => {
    resetPreview()
    setState('idle')
  }

  const send = async () => {
    if (!blob) return
    const durationMs = elapsedMs
    resetPreview()
    setState('idle')
    // 统一转码为 16k 单声道 WAV（讯飞语音听写要求）；解码失败回退原始格式
    const wav = await blobToWav16kMono(blob)
    onSend({ blob: wav ?? blob, mimeType: wav ? 'audio/wav' : blob.type || 'audio/webm', durationMs })
  }

  if (state === 'recording') {
    return (
      <div className="mm-recorder recording" role="status">
        <i className="mm-rec-dot" aria-hidden="true" />
        <span className="mm-rec-time">{formatDuration(elapsedMs)}</span>
        <div className="mm-rec-wave" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <button type="button" className="mm-rec-btn stop" onClick={stopRecording}>完成</button>
        <button type="button" className="mm-rec-btn cancel" onClick={cancelRecording}>取消</button>
      </div>
    )
  }

  if (state === 'preview') {
    return (
      <div className="mm-recorder preview">
        <audio src={previewUrl} controls preload="metadata" style={{ height: 32 }} />
        <span className="mm-rec-time">{formatDuration(elapsedMs)}</span>
        <button type="button" className="mm-rec-btn send" onClick={send} disabled={disabled}>{sendLabel}</button>
        <button type="button" className="mm-rec-btn cancel" onClick={discardPreview}>删除</button>
      </div>
    )
  }

  return (
    <div className="mm-recorder idle">
      <button
        type="button"
        className="mm-voice-trigger"
        onClick={startRecording}
        disabled={disabled}
        title={error || '点击开始录音（最长 5 分钟）'}
      >
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <rect x="6" y="1.5" width="4" height="8" rx="2" fill="currentColor" />
          <path
            d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5M5.8 14.5h4.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        语音
      </button>
      {error && <span className="mm-rec-error" role="alert">{error}</span>}
    </div>
  )
}
