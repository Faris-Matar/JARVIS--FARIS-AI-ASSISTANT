import { useEffect, useState } from 'react'
import Panel from '../Panel.jsx'
import Md from '../Md.jsx'
import ScreenShell from './ScreenShell.jsx'
import { Pending, Err, Stat } from '../Dashboard.jsx'
import { api } from '../../api.js'

// Gmail skill screen: connector state, flagged items, client form
// submissions, and reply drafting with explicit send approval.
export default function GmailScreen({ onBack, onAsk }) {
  const [state, setState] = useState(null)
  const [inbox, setInbox] = useState(null)
  const [drafting, setDrafting] = useState(null) // message being replied to
  const [draft, setDraft] = useState(null)

  const load = async () => {
    try {
      const s = await api.gmail.status()
      setState(s)
      if (s.connected) setInbox(await api.gmail.inbox())
    } catch (e) {
      setState({ error: e.message })
    }
  }
  useEffect(() => { load() }, [])

  const connect = async () => {
    const { url } = await api.gmail.authUrl()
    window.open(url, '_blank')
  }

  const draftReply = async (msg) => {
    setDrafting(msg.id)
    setDraft(null)
    try {
      const res = await api.skill('gmail', `draft a reply to the email from ${msg.from} with subject "${msg.subject}"`)
      setDraft({ to: msg.from, subject: `Re: ${msg.subject}`, body: res.reply, threadId: msg.threadId })
    } catch (e) {
      setDraft({ error: e.message })
    }
  }

  const send = async () => {
    await api.gmail.send(draft)
    setDraft(null)
    setDrafting(null)
    load()
  }

  return (
    <ScreenShell
      id="gmail"
      title="Inbox"
      subtitle="gmail connector · faris@intelisite.space"
      onBack={onBack}
      actions={<button className="hud-btn" onClick={load}>↻ refresh</button>}
    >
      {!state && <Pending text="querying connector" />}
      {state?.error && <Err text={state.error} />}

      {state && !state.error && !state.connected && (
        <Panel title="connector standby" accent="var(--gold)">
          <div style={{ fontSize: 13.5, lineHeight: 1.7, maxWidth: 560 }}>
            <p style={{ marginBottom: 12 }}>
              The Gmail connector is built and waiting on credentials.
              {state.hasClientId
                ? ' Credentials found — authorise access below.'
                : ' Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to jarvis/.env (Google Cloud Console → Gmail API → OAuth Desktop credentials), restart the server, then authorise here.'}
            </p>
            <button className="hud-btn primary" onClick={connect} disabled={!state.hasClientId}>
              authorise gmail access
            </button>
            <p className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 12, letterSpacing: '0.1em' }}>
              full setup: jarvis/docs/CONNECTORS.md
            </p>
          </div>
        </Panel>
      )}

      {inbox && !inbox.error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 34 }}>
            <Stat n={inbox.unread} label="unread" />
            <Stat n={inbox.flagged?.length || 0} label="flagged urgent" accent="var(--gold)" />
            <Stat n={inbox.clientForms?.length || 0} label="client forms" accent="var(--green)" />
          </div>

          {inbox.clientForms?.length > 0 && (
            <Panel title="client form submissions" accent="var(--green)" live>
              {inbox.clientForms.map((m) => (
                <MessageRow key={m.id} msg={m} highlight onAction={() => onAsk(`brief me on the client form submission from ${m.from}`)} actionLabel="brief me" />
              ))}
            </Panel>
          )}

          {inbox.flagged?.length > 0 && (
            <Panel title="flagged — needs you" accent="var(--gold)">
              {inbox.flagged.map((m) => (
                <MessageRow key={m.id} msg={m} onAction={() => draftReply(m)} actionLabel="draft reply" />
              ))}
            </Panel>
          )}

          <Panel title="summary">
            <Md text={inbox.summary || 'Nothing of note.'} />
          </Panel>

          {inbox.messages?.length > 0 && (
            <Panel title={`unread (${inbox.messages.length})`}>
              {inbox.messages.map((m) => (
                <MessageRow key={m.id} msg={m} onAction={() => draftReply(m)} actionLabel="draft reply" busy={drafting === m.id && !draft} />
              ))}
            </Panel>
          )}

          {draft && (
            <Panel title="draft reply — your approval required" accent="var(--gold)">
              {draft.error ? (
                <Err text={draft.error} />
              ) : (
                <>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                    to: {draft.to} · {draft.subject}
                  </div>
                  <textarea
                    className="hud-input"
                    style={{ minHeight: 150, resize: 'vertical', fontFamily: 'var(--display)' }}
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button className="hud-btn primary" onClick={send}>send it</button>
                    <button className="hud-btn danger" onClick={() => { setDraft(null); setDrafting(null) }}>discard</button>
                  </div>
                </>
              )}
            </Panel>
          )}
        </div>
      )}
      {inbox?.error && <Err text={inbox.error} />}
    </ScreenShell>
  )
}

function MessageRow({ msg, onAction, actionLabel, highlight, busy }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '9px 4px',
        borderBottom: '1px solid rgba(79,195,247,0.08)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: highlight ? 'var(--green)' : 'var(--text)' }}>
            {cleanFrom(msg.from)}
          </span>
          <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>{msg.date || ''}</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {msg.subject}
        </div>
        {msg.snippet && (
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {msg.snippet}
          </div>
        )}
      </div>
      {onAction && (
        <button className="hud-btn" style={{ flexShrink: 0, fontSize: 9.5, padding: '6px 11px' }} onClick={onAction} disabled={busy}>
          {busy ? '…' : actionLabel}
        </button>
      )}
    </div>
  )
}

const cleanFrom = (f = '') => f.replace(/<.*>/, '').replace(/"/g, '').trim() || f
