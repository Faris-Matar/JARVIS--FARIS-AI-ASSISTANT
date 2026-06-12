import { useEffect, useRef } from 'react'

// Sparse dust, drifting almost imperceptibly. Quiet depth behind the
// reactor — felt more than seen.
export default function Particles({ density = 38 }) {
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
        vx: (Math.random() - 0.5) * 0.045 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.045 * devicePixelRatio,
        r: (Math.random() * 1.1 + 0.35) * devicePixelRatio,
        a: Math.random() * 0.3 + 0.06,
        tw: Math.random() * Math.PI * 2,
      })
    }

    const frame = (t) => {
      ctx.clearRect(0, 0, w, h)
      for (const d of dots) {
        d.x += d.vx
        d.y += d.vy
        if (d.x < 0) d.x = w; if (d.x > w) d.x = 0
        if (d.y < 0) d.y = h; if (d.y > h) d.y = 0
        const twinkle = 0.65 + 0.35 * Math.sin(t / 2400 + d.tw)
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(140, 200, 230, ${d.a * twinkle})`
        ctx.fill()
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
