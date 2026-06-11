import { useEffect, useRef } from 'react'
import { onLevel } from '../voice.js'

// Live audio waveform — mirrored bars driven by the shared analyser feed.
// Shown while Jarvis is listening; idles as a calm flat pulse otherwise.
export default function Waveform({ active, height = 44 }) {
  const ref = useRef(null)
  const live = useRef({ level: 0, data: null })

  useEffect(() => {
    onLevel((level, data) => {
      live.current.level = level
      live.current.data = data
    })
  }, [])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let raf
    const draw = (t) => {
      const w = (canvas.width = canvas.offsetWidth * devicePixelRatio)
      const h = (canvas.height = height * devicePixelRatio)
      ctx.clearRect(0, 0, w, h)
      const bars = 48
      const bw = w / bars
      const mid = h / 2
      const data = live.current.data

      for (let i = 0; i < bars; i++) {
        let amp
        if (active && data) {
          const idx = Math.floor((i / bars) * data.length)
          amp = Math.abs(data[idx] - 128) / 128
          amp = Math.min(1, amp * 3.2)
        } else {
          amp = 0.05 + 0.03 * Math.sin(t / 700 + i * 0.6)
        }
        const bh = Math.max(2 * devicePixelRatio, amp * mid * 1.7)
        const x = i * bw + bw * 0.25
        const grad = ctx.createLinearGradient(0, mid - bh, 0, mid + bh)
        grad.addColorStop(0, 'rgba(155,231,255,0.95)')
        grad.addColorStop(0.5, active ? 'rgba(79,195,247,0.9)' : 'rgba(79,195,247,0.45)')
        grad.addColorStop(1, 'rgba(155,231,255,0.95)')
        ctx.fillStyle = grad
        ctx.shadowColor = 'rgba(79,195,247,0.8)'
        ctx.shadowBlur = active ? 7 * devicePixelRatio : 0
        ctx.fillRect(x, mid - bh, bw * 0.5, bh * 2)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [active, height])

  return <canvas ref={ref} style={{ width: '100%', height, display: 'block' }} />
}
