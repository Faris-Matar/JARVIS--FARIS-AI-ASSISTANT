import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const NAV = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'gmail', label: 'Inbox' },
  { id: 'news', label: 'Intel' },
  { id: 'builder', label: 'Builder' },
  { id: 'business', label: 'Business' },
  { id: 'research', label: 'Research' },
  { id: 'memory', label: 'Memory' },
  { id: 'settings', label: 'Systems' },
]

// One slim rail. Wordmark, navigation, three truths (local, frontier,
// audio), the time. Gold marks the active place — nothing else competes.
export default function TopBar({ screen, setScreen, status, micStatus }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const localOn = status?.brain?.localOnline
  const frontier = status?.brain?.frontierConfigured

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 40,
        padding: '0 28px',
        height: 58,
        borderBottom: '1px solid var(--hairline)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="dot holo" />
        <span
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 400,
            fontSize: 13,
            letterSpacing: '0.5em',
            color: 'var(--text)',
          }}
        >
          JARVIS
        </span>
      </div>

      <nav style={{ display: 'flex', gap: 26 }}>
        {NAV.map((item) => {
          const active = screen === item.id
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className="mono"
              style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                color: active ? 'var(--text)' : 'var(--text-faint)',
                fontSize: 10,
                fontWeight: 400,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                padding: '6px 0',
                cursor: 'pointer',
                transition: 'color 0.5s var(--ease)',
              }}
            >
              {item.label}
              {active && (
                <motion.span
                  layoutId="nav-underline"
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -2,
                    height: 1,
                    background: 'var(--gold)',
                  }}
                />
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Indicator on={localOn} label="local" />
        <Indicator on={frontier} warn={!frontier} label="frontier" />
        <Indicator on={micStatus?.ok} label="audio" />
        <span
          className="mono"
          style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.14em', marginLeft: 8 }}
        >
          {now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
          <span style={{ color: 'var(--text)', marginLeft: 12 }}>
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </span>
      </div>
    </motion.header>
  )
}

function Indicator({ on, warn, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span className={`dot ${on ? 'on' : warn ? 'warn' : 'off'}`} />
      <span className="mono" style={{ fontSize: 8.5, letterSpacing: '0.26em', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
        {label}
      </span>
    </span>
  )
}
