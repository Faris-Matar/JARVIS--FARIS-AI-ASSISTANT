import { motion } from 'framer-motion'
import Reactor from './Reactor.jsx'
import Particles from './Particles.jsx'

// Standby — the resting state. One reactor, one wordmark, silence.
export default function Standby({ micStatus, onWake }) {
  return (
    <motion.div
      key="standby"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'brightness(1.8) blur(2px)' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
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
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative' }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-40%',
            background: 'radial-gradient(circle, rgba(106,193,232,0.07), transparent 62%)',
          }}
        />
        <Reactor size={280} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.6, ease: 'easeOut' }}
        style={{ marginTop: 64, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <motion.h1
          initial={{ letterSpacing: '1.1em' }}
          animate={{ letterSpacing: '0.72em' }}
          transition={{ delay: 0.8, duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginLeft: '0.72em',
            fontFamily: 'var(--display)',
            fontWeight: 300,
            fontSize: 26,
            color: 'var(--text)',
          }}
        >
          JARVIS
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.6, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: 56, height: 1, background: 'var(--gold)', opacity: 0.6, marginTop: 26 }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1.4 }}
        style={{ marginTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
      >
        <div className="label">standby</div>
        <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-faint)', letterSpacing: '0.16em' }}>
          {micStatus?.text || 'initialising audio'}
        </div>
      </motion.div>
    </motion.div>
  )
}
