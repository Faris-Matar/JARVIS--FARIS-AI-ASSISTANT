import { useEffect, useState } from 'react'
import Panel from '../Panel.jsx'
import ScreenShell from './ScreenShell.jsx'
import { Pending, Err } from '../Dashboard.jsx'
import { api } from '../../api.js'

const CATEGORIES = [
  { id: 'world', label: 'WORLD' },
  { id: 'ai', label: 'AI INDUSTRY' },
  { id: 'tech', label: 'TECH' },
]

// News skill screen — the full curated briefing, grouped by category,
// headline + one-line summary each, sourced from live feeds.
export default function NewsScreen({ onBack }) {
  const [briefing, setBriefing] = useState(null)
  const [err, setErr] = useState(null)

  const load = async () => {
    setBriefing(null)
    setErr(null)
    try {
      setBriefing(await api.news())
    } catch (e) {
      setErr(e.message)
    }
  }
  useEffect(() => { load() }, [])

  return (
    <ScreenShell
      id="news"
      title="Intelligence Briefing"
      subtitle={briefing ? `${briefing.items?.length || 0} items · curated for faris · ${briefing.generatedAt || ''}` : 'aggregating'}
      onBack={onBack}
      actions={<button className="hud-btn" onClick={load}>↻ regenerate</button>}
    >
      {!briefing && !err && <Pending text="pulling feeds and curating" />}
      {err && <Err text={err} />}

      {briefing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {briefing.curatorNote && (
            <Panel title="jarvis assessment" live>
              <div style={{ fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{briefing.curatorNote}</div>
            </Panel>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'start' }}>
            {CATEGORIES.map((cat, ci) => {
              const items = (briefing.items || []).filter((it) => it.category === cat.id)
              return (
                <Panel key={cat.id} title={cat.label} delay={ci * 0.08}>
                  {items.length === 0 && <Err text="No items in this cycle." warn />}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    {items.map((it, i) => (
                      <article key={i}>
                        <a
                          href={it.link || '#'}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', lineHeight: 1.4, display: 'block' }}
                        >
                          {it.headline}
                        </a>
                        {it.summary && (
                          <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, marginTop: 3 }}>
                            {it.summary}
                          </div>
                        )}
                        <div className="mono" style={{ fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.16em', marginTop: 4, opacity: 0.8 }}>
                          {it.source?.toUpperCase()}
                        </div>
                      </article>
                    ))}
                  </div>
                </Panel>
              )
            })}
          </div>
        </div>
      )}
    </ScreenShell>
  )
}
