import { useEffect, useRef } from 'react'
import { onLevel } from '../voice.js'

// A single oscilloscope line. Idle: a still hairline with a slow shimmer.
// Listening: the line carries the room's sound. Quiet instrument, not
// an equaliser.
export default function Waveform({ active, height = 32 }) {
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
      const mid = h / 2
      const data = live.current.data
      const points = 120

      ctx.beginPath()
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * w
        let y = mid
        if (active && data) {
          const idx = Math.floor((i / points) * data.length)
          y = mid + ((data[idx] - 128) / 128) * mid * 1.5
        } else {
          y = mid + Math.sin(t / 1600 + i * 0.35) * h * 0.04
        }
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      const grad = ctx.createLinearGradient(0, 0, w, 0)
      grad.addColorStop(0, 'rgba(106,193,232,0)')
      grad.addColorStop(0.15, active ? 'rgba(106,193,232,0.85)' : 'rgba(106,193,232,0.22)')
      grad.addColorStop(0.85, active ? 'rgba(106,193,232,0.85)' : 'rgba(106,193,232,0.22)')
      grad.addColorStop(1, 'rgba(106,193,232,0)')
      ctx.strokeStyle = grad
      ctx.lineWidth = devicePixelRatio
      ctx.shadowColor = 'rgba(106,193,232,0.5)'
      ctx.shadowBlur = active ? 6 * devicePixelRatio : 0
      ctx.stroke()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [active, height])

  return <canvas ref={ref} style={{ width: '100%', height, display: 'block', transition: 'height 0.5s var(--ease)' }} />
}
