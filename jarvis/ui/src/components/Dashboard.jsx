import { motion } from 'framer-motion'
import Panel from './Panel.jsx'

// The overview. Not a grid of boxes: one intelligence band with a clear
// lead, then four quiet columns divided by hairlines. Hierarchy first,
// chrome nowhere.
export default function Dashboard({ data, setScreen }) {
  const d = data || {}
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(3px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'grid',
        gridTemplateRows: 'minmax(0, 1.05fr) minmax(0, 1fr)',
        gap: 0,
        height: '100%',
        minHeight: 0,
      }}
    >
      <Panel title="intelligence" live onExpand={() => setScreen('news')} delay={0.05} bodyStyle={{ paddingTop: 4 }}>
        <Briefing data={d.news} />
      </Panel>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1.15fr 0.85fr',
          minHeight: 0,
        }}
      >
        <Col delay={0.14}>
          <Panel title="inbox" live onExpand={() => setScreen('gmail')} style={{ height: '100%' }}>
            <InboxSummary data={d.inbox} />
          </Panel>
        </Col>
        <Col delay={0.2} divider>
          <Panel title="business" live onExpand={() => setScreen('business')} style={{ height: '100%' }}>
            <BusinessSummary data={d.business} />
          </Panel>
        </Col>
        <Col delay={0.26} divider>
          <Panel title="build pipeline" live onExpand={() => setScreen('builder')} style={{ height: '100%' }}>
            <BuilderSummary jobs={d.builderJobs} />
          </Panel>
        </Col>
        <Col delay={0.32} divider>
          <Panel title="tasks" style={{ height: '100%' }}>
            <Tasks tasks={d.tasks} />
          </Panel>
        </Col>
      </div>
    </motion.div>
  )
}

function Col({ children, divider, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        minHeight: 0,
        paddingLeft: divider ? 26 : 0,
        paddingRight: 26,
        borderLeft: divider ? '1px solid var(--hairline)' : 'none',
      }}
    >
      {children}
    </motion.div>
  )
}

/* ── Intelligence band: one lead, the rest recede ──────────────────── */

function Briefing({ data }) {
  if (!data) return <Pending text="aggregating feeds" />
  if (data.error) return <Err text={data.error} />
  const items = data.items || []
  if (!items.length) return <Err text={data.summary || 'No briefing available.'} warn />
  const [lead, ...rest] = items

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px 48px', alignItems: 'start' }}>
      <div>
        <div
          style={{
            fontSize: 21,
            fontWeight: 400,
            lineHeight: 1.35,
            color: 'var(--text)',
            letterSpacing: '0.005em',
            marginBottom: 10,
          }}
        >
          {lead.headline}
        </div>
        {lead.summary && (
          <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 8 }}>{lead.summary}</div>
        )}
        <div className="label" style={{ fontSize: 8.5 }}>
          {lead.category} · {lead.source}
        </div>
      </div>

      {[rest.slice(0, 4), rest.slice(4, 8)].map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {col.map((it, i) => (
            <div key={i}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 400,
                  color: 'var(--text-dim)',
                  lineHeight: 1.45,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {it.headline}
              </div>
              <div className="label" style={{ fontSize: 8, marginTop: 3, opacity: 0.7 }}>
                {it.category} · {it.source}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ── Columns ───────────────────────────────────────────────────────── */

function InboxSummary({ data }) {
  if (!data) return <Pending text="querying" />
  if (data.status === 'unconfigured') return <Err text="Connector on standby. Open Inbox to connect." warn />
  if (data.error) return <Err text={data.error} />
  return (
    <div>
      <div style={{ display: 'flex', gap: 30, marginBottom: 16 }}>
        <Stat n={data.unread ?? 0} label="unread" />
        <Stat n={data.flagged?.length ?? 0} label="flagged" gold={Boolean(data.flagged?.length)} />
        <Stat n={data.clientForms?.length ?? 0} label="forms" gold={Boolean(data.clientForms?.length)} />
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--text-dim)' }}>{clip(data.summary, 200)}</div>
    </div>
  )
}

function BusinessSummary({ data }) {
  if (!data) return <Pending text="reading state" />
  if (data.error) return <Err text={data.error} />
  return (
    <div>
      <div style={{ display: 'flex', gap: 30, marginBottom: 16 }}>
        <Stat n={data.activeJobs ?? 0} label="builds" />
        <Stat n={data.awaitingFaris ?? 0} label="your call" gold={Boolean(data.awaitingFaris)} />
        {data.revenue?.total ? <Stat n={`£${(data.revenue.total / 1000).toFixed(1)}k`} label="logged" /> : null}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>
        {clip(data.summary, 160)}
      </div>
    </div>
  )
}

function BuilderSummary({ jobs }) {
  if (!jobs) return <Pending text="scanning" />
  if (!jobs.length) {
    return <Err text="Pipeline clear. Ask me to check the inbox for a client form when one lands." warn />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {jobs.slice(0, 3).map((j) => (
        <div key={j.client}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text)' }}>{j.client}</span>
            <span
              className="mono"
              style={{
                fontSize: 8.5,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: j.waitingOnFaris ? 'var(--gold)' : 'var(--text-faint)',
              }}
            >
              {j.waitingOnFaris ? 'your call' : j.complete ? 'complete' : 'building'}
            </span>
          </div>
          <StageRail stage={j.stage} waiting={j.waitingOnFaris} />
        </div>
      ))}
    </div>
  )
}

export function StageRail({ stage, waiting }) {
  const stages = ['Brief', 'Design', 'Copy', 'Code', 'QC', 'Ship']
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {stages.map((s, i) => {
        const done = stage >= i + 2
        const isGate = waiting && i === 1
        return (
          <div key={s} style={{ flex: 1 }}>
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isGate ? 'rgba(200,169,110,0.9)' : done ? 'rgba(106,193,232,0.75)' : 'rgba(255,255,255,0.07)',
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: 2 }}
            />
            <div
              className="mono"
              style={{
                fontSize: 7.5,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isGate ? 'var(--gold)' : done ? 'var(--text-dim)' : 'var(--text-faint)',
                marginTop: 5,
                opacity: done || isGate ? 1 : 0.6,
              }}
            >
              {s}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Tasks({ tasks }) {
  if (!tasks?.length) return <Err text="Nothing open. Say “remind me to …” to add one." warn />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {tasks.slice(0, 6).map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--holo)', flexShrink: 0, position: 'relative', top: -3 }} />
          <span>{t}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Shared ────────────────────────────────────────────────────────── */

export function Stat({ n, label, gold, accent }) {
  return (
    <div>
      <div className="value-lg" style={{ color: gold ? 'var(--gold-bright)' : accent || 'var(--text)' }}>{n}</div>
      <div className="label" style={{ fontSize: 8, marginTop: 6 }}>{label}</div>
    </div>
  )
}

export function Pending({ text }) {
  return (
    <motion.div
      animate={{ opacity: [0.35, 0.7, 0.35] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      className="mono"
      style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}
    >
      {text}
    </motion.div>
  )
}

export function Err({ text, warn }) {
  return (
    <div style={{ fontSize: 12.5, color: warn ? 'var(--text-faint)' : 'var(--gold)', lineHeight: 1.6 }}>
      {text}
    </div>
  )
}

const clip = (s, n) => (s && s.length > n ? s.slice(0, n) + '…' : s || '')
