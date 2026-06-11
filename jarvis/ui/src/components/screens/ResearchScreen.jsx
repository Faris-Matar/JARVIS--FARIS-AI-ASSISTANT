import { useState } from 'react'
import Panel from '../Panel.jsx'
import Md from '../Md.jsx'
import ScreenShell from './ScreenShell.jsx'
import { Pending, Err } from '../Dashboard.jsx'
import { api } from '../../api.js'

// Research skill screen — give Jarvis a topic, get a structured deep dive.
export default function ResearchScreen({ onBack }) {
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const run = async (e) => {
    e?.preventDefault()
    const t = topic.trim()
    if (!t || busy) return
    setBusy(true)
    setResult(null)
    try {
      const res = await api.skill('research', `deep dive: ${t}`)
      setResult(res)
      setHistory((h) => [{ topic: t, at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }, ...h].slice(0, 8))
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScreenShell id="research" title="Research" subtitle="structured deep dives · frontier intelligence when available" onBack={onBack}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14, height: '100%', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel title="new deep dive">
            <form onSubmit={run} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                className="hud-input"
                style={{ minHeight: 90, resize: 'vertical' }}
                placeholder="Topic or question… e.g. cold email deliverability for a new domain in 2026"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <button className="hud-btn primary" disabled={busy || !topic.trim()}>
                {busy ? 'researching…' : 'run deep dive'}
              </button>
            </form>
          </Panel>

          {history.length > 0 && (
            <Panel title="this session">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ fontSize: 12, display: 'flex', gap: 9 }}>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)', flexShrink: 0 }}>{h.at}</span>
                    <span>{h.topic}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <Panel title="output" live={busy} style={{ height: '100%' }} bodyStyle={{ padding: '16px 20px' }}>
          {busy && <Pending text="reasoning through it" />}
          {!busy && !result && (
            <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>
              Output lands here: executive summary, organised sections, key takeaways,
              recommendation. Sources cited where the model can; anything needing live
              web data gets flagged rather than guessed.
            </div>
          )}
          {result?.error && <Err text={result.error} />}
          {result && !result.error && (
            <>
              {result.tier && (
                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--holo-deep)', marginBottom: 10 }}>
                  ENGINE: {result.tier.toUpperCase()}
                </div>
              )}
              <Md text={result.reply} />
            </>
          )}
        </Panel>
      </div>
    </ScreenShell>
  )
}
