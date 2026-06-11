import { useEffect, useState } from 'react'
import Panel from '../Panel.jsx'
import Md from '../Md.jsx'
import ScreenShell from './ScreenShell.jsx'
import { Pending, Err, Stat, StageRail } from '../Dashboard.jsx'
import { api } from '../../api.js'

// Business skill screen — InteliSite at a glance: pipeline, decisions
// waiting on Faris, revenue ledger (fed by telling Jarvis numbers).
export default function BusinessScreen({ onBack, onAsk }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)

  const load = async () => {
    try {
      setData(await api.skill('business', 'full status'))
    } catch (e) {
      setErr(e.message)
    }
  }
  useEffect(() => { load() }, [])

  const d = data?.data || {}

  return (
    <ScreenShell
      id="business"
      title="Business · InteliSite"
      subtitle="premium web design · uk luxury home improvement"
      onBack={onBack}
      actions={<button className="hud-btn" onClick={load}>↻ refresh</button>}
    >
      {!data && !err && <Pending text="compiling business state" />}
      {err && <Err text={err} />}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <Panel title="active builds" delay={0}>
              <Stat n={d.jobs?.length ?? 0} label="in pipeline" />
            </Panel>
            <Panel title="awaiting your call" accent={d.awaitingFaris ? 'var(--gold)' : 'var(--holo)'} delay={0.06}>
              <Stat n={d.awaitingFaris ?? 0} label="decisions" accent={d.awaitingFaris ? 'var(--gold)' : undefined} />
            </Panel>
            <Panel title="revenue logged" accent="var(--green)" delay={0.12}>
              <Stat n={d.revenue?.total != null ? `£${d.revenue.total.toLocaleString()}` : '—'} label={`${d.revenue?.entries?.length || 0} entries`} accent="var(--green)" />
            </Panel>
            <Panel title="ready to ship" delay={0.18}>
              <Stat n={d.jobs?.filter((j) => j.complete).length ?? 0} label="complete" />
            </Panel>
          </div>

          {d.jobs?.length > 0 && (
            <Panel title="client pipeline" live>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {d.jobs.map((j) => (
                  <div key={j.client}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{j.client}</span>
                      <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', color: j.waitingOnFaris ? 'var(--gold)' : 'var(--holo)' }}>
                        {j.statusLabel?.toUpperCase()}
                      </span>
                    </div>
                    <StageRail stage={j.stage} />
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Panel title="jarvis assessment">
            <Md text={data.reply} />
          </Panel>

          <Panel title="revenue ledger" accent="var(--green)">
            {d.revenue?.entries?.length ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {d.revenue.entries.map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(79,195,247,0.08)' }}>
                      <td className="mono" style={{ padding: '7px 0', fontSize: 10.5, color: 'var(--text-dim)' }}>{e.date}</td>
                      <td style={{ padding: '7px 12px' }}>{e.label}</td>
                      <td className="mono" style={{ padding: '7px 0', textAlign: 'right', color: 'var(--green)' }}>£{e.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                No revenue logged yet. Tell Jarvis when money lands:{' '}
                <button className="hud-btn" style={{ fontSize: 9, padding: '4px 9px' }} onClick={() => onAsk('log revenue 1500 deposit from first client')}>
                  e.g. “log revenue 1500 deposit from first client”
                </button>
              </div>
            )}
          </Panel>
        </div>
      )}
    </ScreenShell>
  )
}
