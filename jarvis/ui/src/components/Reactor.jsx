// Arc reactor — pure SVG, used full-size on standby and miniature in the
// top bar. Layered rotating rings, segmented coil, breathing plasma core.
export default function Reactor({ size = 260, intensity = 1 }) {
  const s = size
  const c = s / 2
  const segs = 10
  const segments = Array.from({ length: segs }, (_, i) => {
    const a0 = (i / segs) * Math.PI * 2 - Math.PI / 2 + 0.07
    const a1 = ((i + 1) / segs) * Math.PI * 2 - Math.PI / 2 - 0.07
    const r0 = s * 0.305
    const r1 = s * 0.395
    const p = (a, r) => `${c + Math.cos(a) * r},${c + Math.sin(a) * r}`
    return `M ${p(a0, r0)} L ${p(a0, r1)} A ${r1} ${r1} 0 0 1 ${p(a1, r1)} L ${p(a1, r0)} A ${r0} ${r0} 0 0 0 ${p(a0, r0)} Z`
  })

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <defs>
        <radialGradient id="reactorCore">
          <stop offset="0%" stopColor="#eafaff" />
          <stop offset="35%" stopColor="#9be7ff" />
          <stop offset="70%" stopColor="#4fc3f7" />
          <stop offset="100%" stopColor="rgba(21,101,160,0)" />
        </radialGradient>
        <filter id="reactorGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={s * 0.018} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* outer fine ring with tick marks */}
      <g style={{ transformOrigin: 'center', animation: 'spin 24s linear infinite' }}>
        <circle cx={c} cy={c} r={s * 0.47} fill="none" stroke="rgba(79,195,247,0.3)" strokeWidth="1" />
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2
          const long = i % 5 === 0
          const r0 = s * (long ? 0.435 : 0.45)
          const r1 = s * 0.465
          return (
            <line
              key={i}
              x1={c + Math.cos(a) * r0} y1={c + Math.sin(a) * r0}
              x2={c + Math.cos(a) * r1} y2={c + Math.sin(a) * r1}
              stroke={long ? 'rgba(155,231,255,0.8)' : 'rgba(79,195,247,0.35)'}
              strokeWidth="1"
            />
          )
        })}
      </g>

      {/* dashed counter-rotating ring */}
      <circle
        cx={c} cy={c} r={s * 0.425}
        fill="none" stroke="rgba(79,195,247,0.5)" strokeWidth="1.5"
        strokeDasharray="2 14"
        style={{ transformOrigin: 'center', animation: 'spinR 16s linear infinite' }}
      />

      {/* the coil segments */}
      <g filter="url(#reactorGlow)" style={{ transformOrigin: 'center', animation: 'spin 40s linear infinite' }}>
        {segments.map((d, i) => (
          <path key={i} d={d} fill="rgba(79,195,247,0.16)" stroke="rgba(155,231,255,0.85)" strokeWidth="1.2" />
        ))}
      </g>

      {/* inner triangle hint (mark I motif), very faint */}
      <g style={{ transformOrigin: 'center', animation: 'spinR 60s linear infinite' }} opacity="0.5">
        <polygon
          points={`${c},${c - s * 0.21} ${c + s * 0.185},${c + s * 0.115} ${c - s * 0.185},${c + s * 0.115}`}
          fill="none" stroke="rgba(155,231,255,0.55)" strokeWidth="1"
        />
      </g>

      {/* plasma core */}
      <circle
        cx={c} cy={c} r={s * 0.16}
        fill="url(#reactorCore)"
        style={{
          transformOrigin: 'center',
          animation: 'breathe 2.8s ease-in-out infinite',
          filter: `drop-shadow(0 0 ${s * 0.09 * intensity}px rgba(79,195,247,0.85))`,
        }}
      />
      <circle cx={c} cy={c} r={s * 0.045} fill="#ffffff" opacity="0.95" />
    </svg>
  )
}
