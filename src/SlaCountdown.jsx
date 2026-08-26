import { useEffect, useState } from 'react'

/**
 * SLA 倒计时组件
 * @param {number} seconds 初始剩余秒数（如 222 = 3 分 42 秒）
 * @param {string} [fallback] 无法倒计时时显示的文本（如 '已完成' 'AI处理中'）
 * 每秒递减，剩余 < 60s 标红、< 180s 标黄；到 0 停在 00:00
 */
export default function SlaCountdown({ seconds = 0, fallback = '' }) {
  const [left, setLeft] = useState(() => Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0)

  useEffect(() => {
    if (!Number.isFinite(seconds) || seconds <= 0) return undefined
    const timer = setInterval(() => {
      setLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [seconds])

  if (fallback && left === 0 && (!Number.isFinite(seconds) || seconds <= 0)) return <>{fallback}</>

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return <>{mm}:{ss}</>
}

/** 根据 SLA 剩余秒数推断风险等级，供卡片着色复用 */
export function slaRiskByLeft(left) {
  if (left <= 0) return 'danger'
  if (left < 60) return 'danger'
  if (left < 180) return 'warning'
  return 'safe'
}

/** 将 'mm:ss' 或数字解析为秒数；'—' '已完成' 等返回 0 */
export function parseSlaToSeconds(value) {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  const text = String(value).trim()
  if (!text || text === '—' || /已完成|已评价|AI/i.test(text)) return 0
  const match = text.match(/(\d{1,2}):(\d{2})/)
  if (match) return Math.max(0, Number(match[1]) * 60 + Number(match[2]))
  const num = Number(text.replace(/\D/g, ''))
  return Number.isFinite(num) ? num : 0
}
