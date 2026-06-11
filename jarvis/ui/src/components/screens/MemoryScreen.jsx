import { useEffect, useState } from 'react'
import Panel from '../Panel.jsx'
import Md from '../Md.jsx'
import ScreenShell from './ScreenShell.jsx'
import { Pending, Err } from '../Dashboard.jsx'
import { api } from '../../api.js'

const TABS = [
  { id: 'profile', label: 'WHO I AM' },
  { id: 'preferences', label: 'HOW I WORK' },
  { id: 'projects', label: 'PROJECTS & GOALS' },
  { id: 'log', label: 'RECENT LEARNINGS' },
]

// Memory screen — browse everything Jarvis knows, teach it something new.
export default function MemoryScreen({ onBack }) {
  const [mem, setMem] = useState(null)
  const [err, setErr] = useState(null)
  const [tab, setTab] = useState('profile')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const load = async () => {
    try {
      setMem(await api.memory())
    } catch (e) {
      setErr(e.message)
    }
  }
  useEffect(() => { load() }, [])

  const remember = async (e) => {
    e.preventDefault()
    if (!note.trim()) return
    await api.remember(note.trim())
    setNote('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
    load()
  }

  return (
    <ScreenShell
      id="memory"
      title="Memory Archive"
      subtitle="persistent · committed to the repo · survives every machine change"
      onBack={onBack}
    >
      {!mem && !err && <Pending text="opening archive" />}
      {err && <Err text={err} />}

      {mem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
          <Panel title="teach jarvis" accent="var(--green)">
            <form onSubmit={remember} style={{ display: 'flex', gap: 10 }}>
              <input
                className="hud-input"
                placeholder="Remember that… (written straight into the memory log)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button className="hud-btn primary" disabled={!note.trim()}>
                {saved ? 'remembered ✓' : 'remember'}
              </button>
            </form>
          </Panel>

          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="mono"
                style={{
                  background: tab === t.id ? 'var(--holo-15)' : 'transparent',
                  border: '1px solid',
                  borderColor: tab === t.id ? 'var(--holo)' : 'var(--panel-border)',
                  color: tab === t.id ? 'var(--holo-bright)' : 'var(--text-dim)',
                  fontSize: 9.5,
                  letterSpacing: '0.2em',
                  padding: '7px 14px',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Panel title={TABS.find((t) => t.id === tab).label} style={{ flex: 1, minHeight: 0 }} bodyStyle={{ padding: '16px 22px' }}>
            {tab === 'log' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(mem.log || []).length === 0 && <Err text="Nothing in the log yet — it fills as you talk to Jarvis." warn />}
                {(mem.log || []).slice().reverse().map((line, i) => (
                  <div key={i} className="mono" style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--text)', userSelect: 'text' }}>
                    <span style={{ color: 'var(--holo-deep)' }}>▸</span> {line.replace(/^- /, '')}
                  </div>
                ))}
              </div>
            ) : (
              <Md text={mem[tab] || '(empty)'} />
            )}
          </Panel>
        </div>
      )}
    </ScreenShell>
  )
}
