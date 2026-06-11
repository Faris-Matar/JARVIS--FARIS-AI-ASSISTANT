import { useEffect, useRef } from 'react'

// Drifting holographic dust with faint linking lines near the centre.
// Canvas-based, cheap, sits behind the standby reactor.
export default function Particles({ density = 70 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let w, h, raf
    const dots = []

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio
      h = canvas.height = canvas.offsetHeight * devicePixelRatio
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < density; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
        r: (Math.random() * 1.4 + 0.4) * devicePixelRatio,
        a: Math.random() * 0.5 + 0.15,
        tw: Math.random() * Math.PI * 2,
      })
    }

    const frame = (t) => {
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2

      for (const d of dots) {
        d.x += d.vx
        d.y += d.vy
        if (d.x < 0) d.x = w; if (d.x > w) d.x = 0
        if (d.y < 0) d.y = h; if (d.y > h) d.y = 0
        const twinkle = 0.6 + 0.4 * Math.sin(t / 900 + d.tw)
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(124, 210, 250, ${d.a * twinkle})`
        ctx.fill()
      }

      // faint connective lines near the reactor
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.05)'
      ctx.lineWidth = devicePixelRatio * 0.5
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i]
        const da = Math.hypot(a.x - cx, a.y - cy)
        if (da > w * 0.28) continue
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j]
          if (Math.hypot(a.x - b.x, a.y - b.y) < w * 0.07) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [density])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
