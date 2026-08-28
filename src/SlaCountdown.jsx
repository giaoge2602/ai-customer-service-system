import { useEffect, useState } from 'react'
import { parseSlaToSeconds, slaRiskByLeft } from './workbenchData'

// SLA 纯逻辑实现下沉至 workbenchData.js（便于 node 测试直接复用），这里保持原导出兼容
export { parseSlaToSeconds, slaRiskByLeft }

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
