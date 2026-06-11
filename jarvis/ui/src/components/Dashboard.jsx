import { motion } from 'framer-motion'
import Panel from './Panel.jsx'

// Main dashboard — the modular panel grid. Each panel is a live module;
// clicking one expands into its full skill screen.
export default function Dashboard({ data, setScreen }) {
  const d = data || {}
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 0.9fr)',
        gridTemplateAreas: `"intel intel" "inbox business" "builder tasks"`,
        gap: 14,
        height: '100%',
        minHeight: 0,
      }}
    >
      <Panel title="intelligence briefing" live onExpand={() => setScreen('news')} delay={0.05} style={{ gridArea: 'intel' }}>
        <Briefing data={d.news} />
      </Panel>

      <Panel title="inbox" live onExpand={() => setScreen('gmail')} delay={0.12} style={{ gridArea: 'inbox' }}>
        <InboxSummary data={d.inbox} />
      </Panel>

      <Panel title="business · intelisite" live onExpand={() => setScreen('business')} delay={0.18} style={{ gridArea: 'business' }}>
        <BusinessSummary data={d.business} />
      </Panel>

      <Panel title="website builder pipeline" live onExpand={() => setScreen('builder')} delay={0.24} style={{ gridArea: 'builder' }}>
        <BuilderSummary jobs={d.builderJobs} />
      </Panel>

      <Panel title="active tasks" delay={0.3} style={{ gridArea: 'tasks' }}>
        <Tasks tasks={d.tasks} />
      </Panel>
    </motion.div>
  )
}

/* ── Panel content modules ─────────────────────────────────────────── */

function Briefing({ data }) {
  if (!data) return <Pending text="aggregating intelligence feeds" />
  if (data.error) return <Err text={data.error} />
  const items = data.items || []
  if (!items.length) return <Err text={data.summary || 'No briefing available.'} />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 22px' }}>
      {items.slice(0, 8).map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline', minWidth: 0 }}>
          <span className="mono" style={{ fontSize: 9, color: 'var(--holo-deep)', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {it.headline}
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.14em' }}>
              {it.category?.toUpperCase()} · {it.source}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function InboxSummary({ data }) {
  if (!data) return <Pending text="querying gmail connector" />
  if (data.status === 'unconfigured') return <Err text="Gmail connector on standby. Open INBOX to connect." warn />
  if (data.error) return <Err text={data.error} />
  return (
    <div>
      <div style={{ display: 'flex', gap: 26, marginBottom: 10 }}>
        <Stat n={data.unread ?? 0} label="unread" />
        <Stat n={data.flagged?.length ?? 0} label="flagged" accent="var(--gold)" />
        <Stat n={data.clientForms?.length ?? 0} label="client forms" accent="var(--green)" />
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
        {clip(data.summary, 240)}
      </div>
    </div>
  )
}

function BusinessSummary({ data }) {
  if (!data) return <Pending text="reading pipeline state" />
  if (data.error) return <Err text={data.error} />
  return (
    <div>
      <div style={{ display: 'flex', gap: 26, marginBottom: 10 }}>
        <Stat n={data.activeJobs ?? 0} label="active builds" />
        <Stat n={data.awaitingFaris ?? 0} label="need your call" accent={data.awaitingFaris ? 'var(--gold)' : undefined} />
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{clip(data.summary, 220)}</div>
    </div>
  )
}

function BuilderSummary({ jobs }) {
  if (!jobs) return <Pending text="scanning jobs" />
  if (!jobs.length) {
    return <Err text="No active pipeline jobs. Say “check my inbox for a client form submission” to start one." warn />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {jobs.slice(0, 3).map((j) => (
        <div key={j.client}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{j.client}</span>
            <span className="mono" style={{ fontSize: 9, letterSpacing: '0.16em', color: j.waitingOnFaris ? 'var(--gold)' : 'var(--holo)' }}>
              {j.statusLabel?.toUpperCase()}
            </span>
          </div>
          <StageRail stage={j.stage} />
        </div>
      ))}
    </div>
  )
}

export function StageRail({ stage }) {
  const stages = ['BRIEF', 'DESIGN', 'COPY', 'CODE', 'QC', 'SHIP']
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {stages.map((s, i) => {
        const done = stage >= i + 2
        return (
          <div key={s} style={{ flex: 1 }}>
            <div
              style={{
                height: 3,
                background: done ? 'var(--holo)' : 'rgba(79,195,247,0.15)',
                boxShadow: done ? 'var(--glow-sm)' : 'none',
              }}
            />
            <div className="mono" style={{ fontSize: 7.5, letterSpacing: '0.1em', color: done ? 'var(--holo)' : 'var(--text-dim)', marginTop: 3 }}>
              {s}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Tasks({ tasks }) {
  if (!tasks?.length) return <Err text="No open tasks. Say “remind me to …” to add one." warn />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {tasks.slice(0, 6).map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 13 }}>
          <span style={{ color: 'var(--holo)', fontSize: 10 }}>◇</span>
          <span>{t}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Shared bits ───────────────────────────────────────────────────── */
export function Stat({ n, label, accent = 'var(--holo-bright)' }) {
  return (
    <div>
      <div className="value-lg" style={{ color: accent, fontSize: 26 }}>{n}</div>
      <div className="label" style={{ fontSize: 8.5 }}>{label}</div>
    </div>
  )
}

export function Pending({ text }) {
  return (
    <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-dim)', letterSpacing: '0.18em', animation: 'dotPulse 1.6s ease-in-out infinite' }}>
      ▸ {text}…
    </div>
  )
}

export function Err({ text, warn }) {
  return (
    <div style={{ fontSize: 12.5, color: warn ? 'var(--text-dim)' : 'var(--gold)', lineHeight: 1.5 }}>
      {text}
    </div>
  )
}

const clip = (s, n) => (s && s.length > n ? s.slice(0, n) + '…' : s || '')
