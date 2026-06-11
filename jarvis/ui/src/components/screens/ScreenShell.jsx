import { motion } from 'framer-motion'

// Wrapper every expanded skill screen lives in — slides up from the
// dashboard, back control, consistent header.
export default function ScreenShell({ id, title, subtitle, onBack, actions, children }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 26, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.99 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, flexShrink: 0 }}>
        <button className="hud-btn" onClick={onBack} style={{ padding: '6px 12px' }}>
          ◂ overview
        </button>
        <div>
          <div
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 600,
              fontSize: 21,
              letterSpacing: '0.14em',
              color: 'var(--holo-bright)',
              textShadow: 'var(--glow-sm)',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
          {subtitle && <div className="label" style={{ marginTop: 2 }}>{subtitle}</div>}
        </div>
        {actions && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>{children}</div>
    </motion.div>
  )
}
