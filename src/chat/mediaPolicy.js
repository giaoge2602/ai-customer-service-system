/**
 * 多媒体消息公共校验（与后端 attachments 模块的规则保持一致）
 * 前端校验用于即时提示；后端必须再次校验，两侧规则不可单方面放宽。
 */

export const MEDIA_RULES = {
  image: {
    label: '图片',
    maxBytes: 10 * 1024 * 1024,
    maxCount: 9,
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
  file: {
    label: '文件',
    maxBytes: 50 * 1024 * 1024,
    maxCount: 5,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip',
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip'],
  },
  audio: {
    label: '语音',
    maxBytes: 20 * 1024 * 1024,
    maxCount: 1,
    maxDurationMs: 5 * 60 * 1000,
    minDurationMs: 1000,
    accept: 'audio/webm,audio/ogg,audio/mp4,audio/mpeg,audio/wav',
    extensions: ['webm', 'ogg', 'oga', 'm4a', 'mp3', 'wav'],
  },
}

export function fileExtension(fileName) {
  const match = /\.([a-z0-9]+)$/i.exec(String(fileName || ''))
  return match ? match[1].toLowerCase() : ''
}

/** 校验单个文件；返回错误文案或空字符串 */
export function validateFile(kind, file) {
  const rule = MEDIA_RULES[kind]
  if (!rule) return '不支持的消息类型'
  if (!file) return '未选择文件'
  const extension = fileExtension(file.name)
  const mimeOk = rule.extensions.includes(extension)
    || (file.type && rule.accept.split(',').some((item) => {
      const trimmed = item.trim()
      return trimmed.endsWith('/*') ? file.type.startsWith(trimmed.slice(0, -1)) : file.type === trimmed
    }))
  if (!mimeOk) return `不支持的${rule.label}格式（${file.name}）`
  if (file.size > rule.maxBytes) return `${rule.label}超过大小限制（最大 ${Math.round(rule.maxBytes / 1024 / 1024)} MB）`
  if (file.size <= 0) return '文件内容为空'
  return ''
}

export function formatBytes(sizeBytes) {
  if (sizeBytes >= 1024 * 1024) return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
  if (sizeBytes >= 1024) return `${Math.round(sizeBytes / 1024)} KB`
  return `${sizeBytes} B`
}

export function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** 按浏览器支持度选择录音 MIME：WebM/Opus → Ogg/Opus → 浏览器默认 */
export function pickSupportedAudioMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

export function isRecordingSupported() {
  return typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined'
}
