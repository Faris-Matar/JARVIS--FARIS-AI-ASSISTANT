import { useEffect, useState } from 'react'
import Panel from '../Panel.jsx'
import Md from '../Md.jsx'
import ScreenShell from './ScreenShell.jsx'
import { Pending, Err, StageRail } from '../Dashboard.jsx'
import { api } from '../../api.js'

// Website builder skill screen — every job's pipeline visualised stage by
// stage, direction approval right here, artifacts readable in place.
export default function BuilderScreen({ onBack, onAsk }) {
  const [jobs, setJobs] = useState(null)
  const [err, setErr] = useState(null)
  const [open, setOpen] = useState(null) // client slug whose artifact is open
  const [artifact, setArtifact] = useState(null)
  const [approval, setApproval] = useState({}) // slug → {direction, notes}

  const load = async () => {
    try {
      setJobs(await api.builderJobs())
    } catch (e) {
      setErr(e.message)
    }
  }
  useEffect(() => {
    load()
    const id = setInterval(load, 12000) // live monitor while jobs run
    return () => clearInterval(id)
  }, [])

  const viewArtifact = async (slug, name) => {
    setOpen(`${slug}/${name}`)
    setArtifact(null)
    const res = await fetch(`/api/builder/artifact?client=${slug}&name=${name}`)
    setArtifact(res.ok ? await res.text() : `Could not load ${name}`)
  }

  const approve = async (slug) => {
    const a = approval[slug]
    if (!a?.direction) return
    await api.builderRun({ slug, direction: a.direction, notes: a.notes || '' })
    setApproval({ ...approval, [slug]: undefined })
    load()
  }

  return (
    <ScreenShell
      id="builder"
      title="Website Builder"
      subtitle="client pipeline · intake → brief → design → copy → code → qc → ship"
      onBack={onBack}
      actions={
        <>
          <button className="hud-btn" onClick={() => onAsk('check my inbox for a new client form submission')}>
            scan inbox for forms
          </button>
          <button className="hud-btn" onClick={load}>↻</button>
        </>
      }
    >
      {!jobs && !err && <Pending text="reading pipeline state" />}
      {err && <Err text={err} />}
      {jobs?.length === 0 && (
        <Panel title="no active jobs" accent="var(--gold)">
          <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>
            Nothing in the pipeline. Start one by scanning the inbox for a client form,
            or from the terminal: <code className="mono" style={{ color: 'var(--gold)' }}>cd website-builder && node cli.js new &lt;client&gt;</code>
          </div>
        </Panel>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {jobs?.map((j, i) => (
          <Panel
            key={j.client}
            title={j.client}
            accent={j.waitingOnFaris ? 'var(--gold)' : j.complete ? 'var(--green)' : 'var(--holo)'}
            live={!j.complete && !j.waitingOnFaris}
            delay={i * 0.07}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ flex: 1 }}>
                  <StageRail stage={j.stage} />
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    color: j.waitingOnFaris ? 'var(--gold)' : j.complete ? 'var(--green)' : 'var(--text-dim)',
                    flexShrink: 0,
                  }}
                >
                  {j.statusLabel?.toUpperCase()}
                </span>
              </div>

              {/* artifacts */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {j.artifacts?.map((a) => (
                  <button key={a} className="hud-btn" style={{ fontSize: 9, padding: '5px 10px' }} onClick={() => viewArtifact(j.client, a)}>
                    {a.replace('.md', '')}
                  </button>
                ))}
              </div>

              {/* direction approval — the human gate, surfaced in the HUD */}
              {j.waitingOnFaris && (
                <div style={{ border: '1px solid var(--gold-35)', padding: 14, background: 'rgba(200,169,110,0.04)' }}>
                  <div className="label" style={{ color: 'var(--gold)', marginBottom: 10 }}>
                    your call — choose the design direction
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        className="hud-btn"
                        style={
                          approval[j.client]?.direction === n
                            ? { background: 'var(--gold-15)', borderColor: 'var(--gold)', color: 'var(--gold)' }
                            : {}
                        }
                        onClick={() => setApproval({ ...approval, [j.client]: { ...approval[j.client], direction: n } })}
                      >
                        direction {n}
                      </button>
                    ))}
                    <button className="hud-btn" onClick={() => viewArtifact(j.client, '02-design-directions.md')}>
                      read directions
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="hud-input"
                      placeholder="Notes to carry into copy and build (optional)"
                      value={approval[j.client]?.notes || ''}
                      onChange={(e) => setApproval({ ...approval, [j.client]: { ...approval[j.client], notes: e.target.value } })}
                    />
                    <button className="hud-btn primary" disabled={!approval[j.client]?.direction} onClick={() => approve(j.client)}>
                      approve & build
                    </button>
                  </div>
                </div>
              )}

              {open?.startsWith(j.client + '/') && (
                <div style={{ border: '1px solid var(--panel-border)', padding: 16, maxHeight: 340, overflowY: 'auto', background: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="label label-bright">{open.split('/')[1]}</span>
                    <button className="hud-btn" style={{ fontSize: 9, padding: '3px 9px' }} onClick={() => setOpen(null)}>close</button>
                  </div>
                  {artifact === null ? <Pending text="loading artifact" /> : <Md text={artifact} size={12.5} />}
                </div>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </ScreenShell>
  )
}
