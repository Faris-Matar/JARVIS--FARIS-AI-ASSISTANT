import { motion } from 'framer-motion'

// HUD panel chrome: clipped corners, bracket accents, title rail, glow on
// hover. Every dashboard module and screen section is built from this.
export default function Panel({
  title,
  children,
  onExpand,
  accent = 'var(--holo)',
  delay = 0,
  style = {},
  bodyStyle = {},
  live = false,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={onExpand ? { scale: 1.008 } : undefined}
      onClick={onExpand}
      style={{
        position: 'relative',
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        backdropFilter: 'blur(8px)',
        clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        cursor: onExpand ? 'pointer' : 'default',
        boxShadow: 'inset 0 0 38px rgba(21,101,160,0.10)',
        ...style,
      }}
    >
      {/* corner brackets */}
      <Corner pos={{ top: -1, left: -1 }} border={{ borderTop: `1px solid ${accent}`, borderLeft: `1px solid ${accent}` }} />
      <Corner pos={{ bottom: -1, right: -1 }} border={{ borderBottom: `1px solid ${accent}`, borderRight: `1px solid ${accent}` }} />

      {/* title rail */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 16px 9px',
          borderBottom: '1px solid rgba(79,195,247,0.12)',
          flexShrink: 0,
        }}
      >
        <span style={{ width: 5, height: 5, background: accent, boxShadow: `0 0 7px ${accent}`, ...(live ? { animation: 'dotPulse 2.2s ease-in-out infinite' } : {}) }} />
        <h2 className="label" style={{ color: accent === 'var(--holo)' ? 'var(--holo)' : accent, fontSize: 10.5 }}>
          {title}
        </h2>
        {onExpand && (
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)' }}>
            ⤢
          </span>
        )}
      </header>

      <div style={{ padding: '12px 16px 14px', overflowY: 'auto', flex: 1, minHeight: 0, ...bodyStyle }}>
        {children}
      </div>
    </motion.section>
  )
}

function Corner({ pos, border }) {
  return (
    <span
      style={{
        position: 'absolute',
        width: 16,
        height: 16,
        opacity: 0.85,
        pointerEvents: 'none',
        ...pos,
        ...border,
      }}
    />
  )
}
