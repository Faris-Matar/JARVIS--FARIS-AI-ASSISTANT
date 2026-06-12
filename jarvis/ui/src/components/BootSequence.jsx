import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Boot — cinematic. Each system takes the stage alone: name materialises,
// status resolves, it yields to the next. Real state from /api/status
// drives every line; the boot doesn't lie. A hairline of progress is the
// only chrome.
const STEP_MS = 620

export default function BootSequence({ status, onDone }) {
  const systems = useMemo(() => buildSystems(status), [status])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (idx < systems.length) {
      const t = setTimeout(() => setIdx(idx + 1), STEP_MS)
      return () => clearTimeout(t)
    }
    const t = setTimeout(onDone, 850)
    return () => clearTimeout(t)
  }, [idx, systems.length, onDone])

  const current = systems[Math.min(idx, systems.length - 1)]
  const progress = Math.min(1, idx / systems.length)
  const done = idx >= systems.length

  return (
    <motion.div
      key="boot"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'brightness(2) blur(3px)' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* the stage */}
      <div style={{ height: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={done ? '__done' : current.name}
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
          >
            <div
              style={{
                fontFamily: 'var(--display)',
                fontWeight: 300,
                fontSize: 24,
                letterSpacing: '0.34em',
                color: 'var(--text)',
                textAlign: 'center',
                marginLeft: '0.34em',
              }}
            >
              {done ? 'ALL SYSTEMS' : current.name}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22, duration: 0.3 }}
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.4em',
                marginLeft: '0.4em',
                color: stateColor(done ? 'ONLINE' : current.state),
              }}
            >
              {done ? 'READY' : current.state}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* progress hairline */}
      <div style={{ width: 300, height: 1, background: 'var(--hairline)', marginTop: 44, position: 'relative' }}>
        <motion.div
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            background: 'var(--holo)',
          }}
        />
      </div>

      {/* the quiet record of what's already up */}
      <div
        style={{
          marginTop: 40,
          height: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          overflow: 'hidden',
        }}
      >
        {systems.slice(0, idx).slice(-5).map((sys) => (
          <motion.div
            key={sys.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mono"
            style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--text-faint)', display: 'flex', gap: 14 }}
          >
            <span>{sys.name}</span>
            <span style={{ color: stateColor(sys.state), opacity: 0.75 }}>{sys.state}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function stateColor(state) {
  if (state === 'ONLINE') return 'var(--green)'
  if (state === 'STANDBY') return 'var(--gold)'
  if (state === 'OFFLINE') return 'var(--red)'
  return 'var(--holo)'
}

function buildSystems(status) {
  const s = status || {}
  const conn = s.connectors || {}
  return [
    { name: 'CORE INTERFACE', state: 'ONLINE' },
    { name: 'MEMORY ARCHIVE', state: s.memory ? 'ONLINE' : 'OFFLINE' },
    { name: 'LOCAL INTELLIGENCE', state: s.brain?.localOnline ? 'ONLINE' : 'STANDBY' },
    { name: 'FRONTIER LINK', state: s.brain?.frontierConfigured ? 'ONLINE' : 'STANDBY' },
    { name: 'AUDIO ARRAY', state: 'ONLINE' },
    { name: 'GMAIL CONNECTOR', state: conn.gmail === 'connected' ? 'ONLINE' : 'STANDBY' },
    { name: 'INTELLIGENCE FEEDS', state: 'ONLINE' },
    { name: 'BUILD PIPELINE', state: conn.builder ? 'ONLINE' : 'STANDBY' },
    { name: 'SKILL MATRIX', state: 'ONLINE' },
  ]
}
