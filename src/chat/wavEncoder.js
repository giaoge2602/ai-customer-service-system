/**
 * 浏览器端音频转码：把 MediaRecorder 产出的 webm/opus（或 mp4/aac）解码后
 * 重采样为 16kHz、16bit、单声道的 WAV —— 讯飞语音听写要求的格式。
 * 解码失败时返回 null，由调用方回退原始音频（Whisper/mock 仍可处理）。
 */
export async function blobToWav16kMono(blob) {
  try {
    const arrayBuffer = await blob.arrayBuffer()
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass || typeof window.OfflineAudioContext === 'undefined') return null
    const decodeContext = new AudioContextClass()
    let decoded
    try {
      decoded = await decodeContext.decodeAudioData(arrayBuffer.slice(0))
    } finally {
      decodeContext.close?.()
    }
    const frames = Math.max(1, Math.ceil(decoded.duration * 16000))
    const offline = new OfflineAudioContext(1, frames, 16000)
    const source = offline.createBufferSource()
    source.buffer = decoded
    source.connect(offline.destination)
    source.start()
    const rendered = await offline.startRendering()
    return encodeWavPcm16(rendered.getChannelData(0), 16000)
  } catch {
    return null
  }
}

function encodeWavPcm16(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeText = (offset, text) => {
    for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index))
  }
  writeText(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeText(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  let offset = 44
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }
  return new Blob([buffer], { type: 'audio/wav' })
}
