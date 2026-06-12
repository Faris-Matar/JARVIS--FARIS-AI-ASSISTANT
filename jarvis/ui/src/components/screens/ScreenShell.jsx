import { motion } from 'framer-motion'

// Wrapper every expanded skill screen lives in. A quiet header, a hairline,
// the content. Arrives like a page turn, not a popup.
export default function ScreenShell({ id, title, subtitle, onBack, actions, children }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 26, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 26,
          paddingBottom: 18,
          marginBottom: 6,
          borderBottom: '1px solid var(--hairline)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          className="mono"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '6px 0',
            transition: 'color 0.4s var(--ease)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
        >
          ← overview
        </button>
        <div>
          <div
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 300,
              fontSize: 24,
              letterSpacing: '0.12em',
              color: 'var(--text)',
            }}
          >
            {title}
          </div>
          {subtitle && <div className="label" style={{ marginTop: 6 }}>{subtitle}</div>}
        </div>
        {actions && <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>{actions}</div>}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 6 }}>{children}</div>
    </motion.div>
  )
}
