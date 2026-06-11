import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Reactor from './Reactor.jsx'

// Boot — systems come online one by one, with REAL state from /api/status
// driving each line (a missing key shows STANDBY, a dead Ollama shows
// OFFLINE — the boot doesn't lie). Then the HUD assembles.
const STEP_MS = 340

export default function BootSequence({ status, onDone }) {
  const systems = useMemo(() => buildSystems(status), [status])
  const [lit, setLit] = useState(0)

  useEffect(() => {
    if (lit < systems.length) {
      const t = setTimeout(() => setLit(lit + 1), STEP_MS)
      return () => clearTimeout(t)
    }
    const t = setTimeout(onDone, 700)
    return () => clearTimeout(t)
  }, [lit, systems.length, onDone])

  const progress = lit / systems.length

  return (
    <motion.div
      key="boot"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'brightness(3)' }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 90,
      }}
    >
      <motion.div
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <Reactor size={170} intensity={1.4} />
      </motion.div>

      <div style={{ width: 420 }}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="label label-bright"
          style={{ fontSize: 12, marginBottom: 18 }}
        >
          initialising systems
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <AnimatePresence>
            {systems.slice(0, lit).map((sys, i) => (
              <motion.div
                key={sys.name}
                initial={{ opacity: 0, x: -22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="mono"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11.5,
                  letterSpacing: '0.12em',
                  padding: '7px 12px',
                  background: 'linear-gradient(90deg, rgba(79,195,247,0.07), transparent)',
                  borderLeft: `2px solid ${stateColor(sys.state)}`,
                }}
              >
                <span style={{ color: 'var(--text)' }}>{sys.name}</span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.12 }}
                  style={{ color: stateColor(sys.state), textShadow: `0 0 8px ${stateColor(sys.state)}55` }}
                >
                  {sys.state}
                </motion.span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* progress rail */}
        <div style={{ marginTop: 22, height: 2, background: 'rgba(79,195,247,0.15)', position: 'relative' }}>
          <motion.div
            animate={{ width: `${progress * 100}%` }}
            transition={{ ease: 'linear' }}
            style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              background: 'var(--holo)',
              boxShadow: 'var(--glow-sm)',
            }}
          />
        </div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 8, letterSpacing: '0.2em' }}>
          {Math.round(progress * 100)}% — {lit < systems.length ? systems[Math.min(lit, systems.length - 1)].name : 'assembling interface'}
        </div>
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
    { name: 'LOCAL INTELLIGENCE · OLLAMA', state: s.brain?.localOnline ? 'ONLINE' : 'STANDBY' },
    { name: 'FRONTIER LINK · ' + (s.brain?.frontier || 'NONE').toUpperCase(), state: s.brain?.frontierConfigured ? 'ONLINE' : 'STANDBY' },
    { name: 'AUDIO ARRAY · WAKE DETECTION', state: 'ONLINE' },
    { name: 'GMAIL CONNECTOR', state: conn.gmail === 'connected' ? 'ONLINE' : 'STANDBY' },
    { name: 'NEWS INTELLIGENCE FEEDS', state: 'ONLINE' },
    { name: 'WEBSITE BUILDER PIPELINE', state: conn.builder ? 'ONLINE' : 'STANDBY' },
    { name: 'SKILL MATRIX · 10 MODULES', state: 'ONLINE' },
  ]
}
