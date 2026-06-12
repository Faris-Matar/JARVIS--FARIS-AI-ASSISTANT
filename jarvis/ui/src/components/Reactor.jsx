// Arc reactor — refined. Three elements, nothing more: a fine tick ring
// turning almost imperceptibly, a single open arc in slow counter-rotation,
// and a breathing core. Four gold cardinal marks. Mesmerising through
// restraint, not motion.
export default function Reactor({ size = 260, intensity = 1 }) {
  const s = size
  const c = s / 2

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      <defs>
        <radialGradient id="reactorCore">
          <stop offset="0%" stopColor="#f2fbff" />
          <stop offset="30%" stopColor="#b7e6ff" />
          <stop offset="62%" stopColor="#6ac1e8" />
          <stop offset="100%" stopColor="rgba(56,102,126,0)" />
        </radialGradient>
      </defs>

      {/* outer tick ring — barely turning */}
      <g style={{ transformOrigin: 'center', animation: 'spin 120s linear infinite' }}>
        <circle cx={c} cy={c} r={s * 0.465} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i / 72) * Math.PI * 2
          const long = i % 18 === 0
          const r0 = s * (long ? 0.43 : 0.448)
          const r1 = s * 0.462
          return (
            <line
              key={i}
              x1={c + Math.cos(a) * r0} y1={c + Math.sin(a) * r0}
              x2={c + Math.cos(a) * r1} y2={c + Math.sin(a) * r1}
              stroke={long ? 'rgba(200,169,110,0.75)' : 'rgba(255,255,255,0.12)'}
              strokeWidth="1"
            />
          )
        })}
      </g>

      {/* single open arc — slow, deliberate */}
      <circle
        cx={c} cy={c} r={s * 0.345}
        fill="none"
        stroke="rgba(106,193,232,0.55)"
        strokeWidth="1"
        strokeDasharray={`${s * 0.55} ${s * 1.62}`}
        strokeLinecap="round"
        style={{ transformOrigin: 'center', animation: 'spinR 45s linear infinite' }}
      />
      {/* its faint echo */}
      <circle
        cx={c} cy={c} r={s * 0.345}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
      />

      {/* core — slow breath */}
      <circle
        cx={c} cy={c} r={s * 0.13}
        fill="url(#reactorCore)"
        style={{
          transformOrigin: 'center',
          animation: 'breathe 5.5s var(--ease-soft) infinite',
          filter: `drop-shadow(0 0 ${s * 0.07 * intensity}px rgba(106,193,232,0.6))`,
        }}
      />
      <circle cx={c} cy={c} r={s * 0.028} fill="#ffffff" opacity="0.9" />
    </svg>
  )
}
