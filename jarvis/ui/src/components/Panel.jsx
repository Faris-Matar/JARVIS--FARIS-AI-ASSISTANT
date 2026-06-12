import { motion } from 'framer-motion'

// A section, not a box. Defined by a single hairline and a quiet label;
// the content does the talking. Liquid entrance, generous air.
export default function Panel({
  title,
  children,
  onExpand,
  accent,
  delay = 0,
  style = {},
  bodyStyle = {},
  live = false,
}) {
  const titleColor = accent && accent !== 'var(--holo)' ? accent : 'var(--text-faint)'
  return (
    <motion.section
      initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={onExpand ? { backgroundColor: 'rgba(255,255,255,0.018)' } : undefined}
      onClick={onExpand}
      style={{
        position: 'relative',
        borderTop: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        cursor: onExpand ? 'pointer' : 'default',
        transition: 'background-color 0.6s var(--ease)',
        ...style,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '16px 4px 14px',
          flexShrink: 0,
        }}
      >
        {live && <span className="dot holo" style={{ width: 4, height: 4 }} />}
        <h2 className="label" style={{ color: titleColor }}>
          {title}
        </h2>
        {onExpand && (
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)', opacity: 0.6 }}>
            ↗
          </span>
        )}
      </header>

      <div style={{ padding: '0 4px 22px', overflowY: 'auto', flex: 1, minHeight: 0, ...bodyStyle }}>
        {children}
      </div>
    </motion.section>
  )
}
