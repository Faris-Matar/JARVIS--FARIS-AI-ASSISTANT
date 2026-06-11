import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Reactor from './Reactor.jsx'

const NAV = [
  { id: 'dashboard', label: 'OVERVIEW' },
  { id: 'gmail', label: 'INBOX' },
  { id: 'news', label: 'INTEL' },
  { id: 'builder', label: 'BUILDER' },
  { id: 'business', label: 'BUSINESS' },
  { id: 'research', label: 'RESEARCH' },
  { id: 'memory', label: 'MEMORY' },
  { id: 'settings', label: 'SYSTEMS' },
]

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
      initial={{ y: -52, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '10px 22px',
        borderBottom: '1px solid rgba(79,195,247,0.16)',
        background: 'linear-gradient(180deg, rgba(8,20,36,0.65), rgba(4,10,20,0.35))',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Reactor size={34} />
        <span
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 500,
            fontSize: 17,
            letterSpacing: '0.5em',
            color: 'var(--holo-bright)',
            textShadow: 'var(--glow-sm)',
          }}
        >
          J.A.R.V.I.S
        </span>
      </div>

      <nav style={{ display: 'flex', gap: 4, marginLeft: 10 }}>
        {NAV.map((item) => {
          const active = screen === item.id
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className="mono"
              style={{
                background: active ? 'var(--holo-15)' : 'transparent',
                border: 'none',
                borderBottom: active ? '1px solid var(--holo)' : '1px solid transparent',
                color: active ? 'var(--holo-bright)' : 'var(--text-dim)',
                textShadow: active ? 'var(--glow-sm)' : 'none',
                fontSize: 10,
                letterSpacing: '0.22em',
                padding: '7px 13px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20 }}>
        <Indicator on={localOn} label={localOn ? 'LOCAL CORE' : 'LOCAL OFFLINE'} />
        <Indicator on={frontier} warn={!frontier} label={frontier ? `FRONTIER · ${(status?.brain?.frontier || '').toUpperCase()}` : 'FRONTIER STANDBY'} />
        <Indicator on={micStatus?.ok} label="AUDIO" />
        <span className="mono" style={{ fontSize: 12, color: 'var(--holo)', letterSpacing: '0.12em', textShadow: 'var(--glow-sm)' }}>
          {now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
          {'  '}
          {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </motion.header>
  )
}

function Indicator({ on, warn, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span className={`dot ${on ? 'on' : warn ? 'warn' : 'off'}`} />
      <span className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-dim)' }}>{label}</span>
    </span>
  )
}
