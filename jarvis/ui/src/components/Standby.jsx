import { motion } from 'framer-motion'
import Reactor from './Reactor.jsx'
import Particles from './Particles.jsx'

// Standby — the resting state. Arc reactor breathing in the void,
// particle dust drifting, waiting for clap / wake phrase / click.
export default function Standby({ micStatus, onWake }) {
  return (
    <motion.div
      key="standby"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'brightness(2.2)' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onClick={onWake}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 5,
      }}
    >
      <Particles />

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative' }}
      >
        {/* halo behind the reactor */}
        <div
          style={{
            position: 'absolute',
            inset: '-30%',
            background: 'radial-gradient(circle, rgba(79,195,247,0.16), transparent 65%)',
            animation: 'breathe 4s ease-in-out infinite',
          }}
        />
        <Reactor size={300} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, letterSpacing: '1.4em' }}
        animate={{ opacity: 1, letterSpacing: '0.85em' }}
        transition={{ delay: 0.5, duration: 1.6, ease: 'easeOut' }}
        style={{
          marginTop: 52,
          marginLeft: '0.85em',
          fontFamily: 'var(--display)',
          fontWeight: 300,
          fontSize: 34,
          color: 'var(--holo-bright)',
          textShadow: 'var(--glow-md)',
        }}
      >
        J.A.R.V.I.S
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        style={{ marginTop: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
      >
        <div className="label" style={{ animation: 'flicker 7s linear infinite' }}>
          standby &nbsp;·&nbsp; awaiting wake signal
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.18em' }}>
          {micStatus?.text || 'initialising audio…'}
        </div>
      </motion.div>

      {/* corner frame marks */}
      {[
        { top: 26, left: 26, borderTop: '1px solid', borderLeft: '1px solid' },
        { top: 26, right: 26, borderTop: '1px solid', borderRight: '1px solid' },
        { bottom: 26, left: 26, borderBottom: '1px solid', borderLeft: '1px solid' },
        { bottom: 26, right: 26, borderBottom: '1px solid', borderRight: '1px solid' },
      ].map((pos, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.9 + i * 0.12 }}
          style={{ position: 'absolute', width: 38, height: 38, borderColor: 'var(--holo-40)', ...pos }}
        />
      ))}
    </motion.div>
  )
}
