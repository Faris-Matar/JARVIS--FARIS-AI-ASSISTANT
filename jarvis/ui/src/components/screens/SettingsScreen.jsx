import { useEffect, useState } from 'react'
import Panel from '../Panel.jsx'
import ScreenShell from './ScreenShell.jsx'
import { Pending, Err } from '../Dashboard.jsx'
import { api } from '../../api.js'

// Settings — intelligence layer, connector states, voice, wake tuning.
export default function SettingsScreen({ onBack, micStatus }) {
  const [status, setStatus] = useState(null)
  const [config, setConfig] = useState(null)
  const [err, setErr] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)

  const load = async () => {
    try {
      setStatus(await api.status())
      setConfig(await api.config())
    } catch (e) {
      setErr(e.message)
    }
  }
  useEffect(() => { load() }, [])

  const save = async (patch) => {
    const next = await api.saveConfig(patch)
    setConfig(next)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  const conn = status?.connectors || {}
  const brain = status?.brain || {}

  return (
    <ScreenShell
      id="settings"
      title="Systems"
      subtitle={savedFlash ? 'configuration saved' : 'intelligence · connectors · voice'}
      onBack={onBack}
    >
      {!status && !err && <Pending text="reading system state" />}
      {err && <Err text={err} />}

      {status && config && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
          <Panel title="intelligence layer" live>
            <Row
              label="LOCAL CORE · OLLAMA"
              on={brain.localOnline}
              detail={brain.localOnline ? brain.localModel : 'offline — free tier unavailable until Ollama runs (Mac step)'}
            />
            <Row
              label="FRONTIER · CLAUDE API"
              on={conn.claude === 'configured'}
              detail={conn.claude === 'configured' ? 'key present · used only for heavy work' : 'no key · add ANTHROPIC_API_KEY to jarvis/.env'}
            />
            <Row
              label="FRONTIER · OPENAI"
              on={conn.openai === 'configured'}
              detail={conn.openai === 'configured' ? 'key present · fallback frontier' : 'no key · optional alternative'}
            />
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="hud-btn"
                style={config.brain.allowFrontier ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}
                onClick={() => save({ brain: { ...config.brain, allowFrontier: !config.brain.allowFrontier } })}
              >
                frontier escalation: {config.brain.allowFrontier ? 'enabled' : 'disabled'}
              </button>
              <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                You control when API credits are spent. Disabled = local only, always.
              </span>
            </div>
          </Panel>

          <Panel title="connectors">
            <Row label="GMAIL" on={conn.gmail === 'connected'} warn={conn.gmail === 'configured'} detail={gmailDetail(conn.gmail)} />
            <Row label="NEWS FEEDS" on detail="BBC World · Hacker News · TechCrunch AI · The Verge · Ars Technica" />
            <Row label="WEBSITE BUILDER" on={conn.builder} detail={conn.builder ? '../website-builder · CLI bridge live' : 'website-builder directory not found'} />
            <Row label="FILE SYSTEM" warn detail="architecture ready · activates inside Electron on the Mac" />
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 12, letterSpacing: '0.08em' }}>
              credentials guide: jarvis/docs/CONNECTORS.md
            </div>
          </Panel>

          <Panel title="voice & wake">
            <Row label="AUDIO ARRAY" on={micStatus?.ok} detail={micStatus?.text || 'initialising'} />
            <Row label="TEXT TO SPEECH" on detail="browser speech synthesis · swaps to macOS `say` automatically on the Mac" />
            <Row label="WAKE PHRASE ENGINE" warn detail="web speech (best effort) · whisper.cpp replaces it on the Mac" />
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
              <div className="label" style={{ marginBottom: 8 }}>clap sensitivity</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { v: 0.3, label: 'sensitive' },
                  { v: 0.42, label: 'standard' },
                  { v: 0.55, label: 'strict' },
                ].map((o) => (
                  <button
                    key={o.v}
                    className="hud-btn"
                    style={config.wake.clapPattern.threshold === o.v ? { borderColor: 'var(--holo)', color: 'var(--holo-bright)' } : {}}
                    onClick={() => save({ wake: { ...config.wake, clapPattern: { ...config.wake.clapPattern, threshold: o.v } } })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                Takes effect next standby. Wake phrase: “{config.wake.phrase}”.
              </div>
            </div>
          </Panel>

          <Panel title="session">
            <Row label="MEMORY ARCHIVE" on={!!status.memory} detail={status.memory ? `${status.memory.files} files · log entries this month: ${status.memory.logEntries}` : 'not found'} />
            <Row label="CONVERSATION BUFFER" on detail={`${status.session?.turns ?? 0} turns this session · distilled to memory automatically`} />
            <Row label="CORE SERVER" on detail={`port ${status.port} · uptime ${status.uptime}`} />
          </Panel>
        </div>
      )}
    </ScreenShell>
  )
}

function Row({ label, on, warn, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
      <span className={`dot ${on ? 'on' : warn ? 'warn' : 'off'}`} style={{ marginTop: 5 }} />
      <div>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', color: on ? 'var(--text)' : 'var(--text-dim)' }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{detail}</div>
      </div>
    </div>
  )
}

function gmailDetail(state) {
  if (state === 'connected') return 'authorised · inbox, summaries, drafts, client-form detection live'
  if (state === 'configured') return 'credentials present · authorise from the INBOX screen'
  return 'add GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET to jarvis/.env'
}
