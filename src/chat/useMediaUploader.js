/**
 * 多媒体上传编排：选择文件/完成录音 → 校验 → init → 直传（进度）→ complete → 发送消息。
 * 上传状态机：selected → initializing → uploading → confirming → sending → sent / failed
 * sendMessage 必须由调用方注入（客户 Widget 传访客 SDK 的方法、工作台传坐席会话方法），
 * 避免误用另一个登录态的 token。
 * 失败时保留原始 File/Blob 供用户重试。
 */
import { useCallback, useRef, useState } from 'react'

import { completeAttachment, initAttachment } from '../conversationApi.js'
import { validateFile } from './mediaPolicy.js'
import { uploadAttachmentContent } from './uploadClient.js'

function newUploadId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export function useMediaUploader({ getToken, sendMessage, onNotify, onFinished }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('')
  const failedRef = useRef(null)

  const reset = () => {
    setUploading(false)
    setProgress(0)
    setPhase('')
  }

  const send = useCallback(async ({ conversationId, file, kind, mimeType, durationMs, caption = '' }) => {
    const token = getToken?.() || ''
    const validationError = validateFile(kind, file)
    if (validationError) {
      onNotify?.(validationError, 'error')
      return false
    }
    setUploading(true)
    setProgress(0)
    setPhase('正在初始化上传…')
    try {
      const clientUploadId = newUploadId()
      const init = await initAttachment(conversationId, {
        clientUploadId,
        kind,
        fileName: file.name || `${kind}-${Date.now()}.webm`,
        mimeType: mimeType || file.type || 'application/octet-stream',
        sizeBytes: file.size,
        durationMs,
      }, token)
      setPhase('正在上传 0%')
      await uploadAttachmentContent({
        url: `/api/v1/attachments/${init.attachmentId}/content`,
        blob: file,
        contentType: mimeType || file.type,
        token,
        onProgress: (value) => {
          setProgress(value)
          setPhase(`正在上传 ${value}%`)
        },
      })
      setPhase('正在进行安全检查…')
      await completeAttachment(init.attachmentId, token)
      setPhase('正在发送…')
      await sendMessage(conversationId, {
        clientMessageId: clientUploadId,
        messageType: kind,
        attachmentId: init.attachmentId,
        ...(caption ? { content: caption } : {}),
      })
      failedRef.current = null
      onNotify?.(`${kind === 'audio' ? '语音' : kind === 'image' ? '图片' : '文件'}已发送`)
      onFinished?.()
      return true
    } catch (requestError) {
      failedRef.current = { conversationId, file, kind, mimeType, durationMs }
      onNotify?.(requestError.message, 'error')
      return false
    } finally {
      reset()
    }
  }, [getToken, sendMessage, onNotify, onFinished])

  return { send, uploading, progress, phase }
}
