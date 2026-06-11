import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Waveform from './Waveform.jsx'

// The conversation panel. User and Jarvis messages styled apart; Jarvis
// replies materialise with a decode-style reveal; waveform lights while
// listening.
export default function Conversation({ messages, busy, listening, onSend, onMic }) {
  const [draft, setDraft] = useState('')
  const logRef = useRef(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const submit = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    onSend(text)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div ref={logRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 6, minHeight: 0 }}>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <Message key={m.id} msg={m} />
          ))}
          {busy && (
            <motion.div
              key="busy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mono"
              style={{ fontSize: 11, color: 'var(--holo)', letterSpacing: '0.2em', padding: '4px 2px' }}
            >
              <Thinking />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ flexShrink: 0, marginTop: 10 }}>
        <Waveform active={listening} height={listening ? 44 : 22} />
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className="hud-btn"
            onClick={onMic}
            disabled={busy}
            style={listening ? { color: 'var(--red)', borderColor: 'var(--red)', boxShadow: '0 0 14px rgba(255,94,98,0.4)' } : {}}
            title="Voice input"
          >
            {listening ? '●' : '◉'}
          </button>
          <input
            className="hud-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={listening ? 'Listening…' : 'Talk to me, Faris…'}
            autoFocus
          />
          <button type="submit" className="hud-btn primary" disabled={busy || !draft.trim()}>
            send
          </button>
        </form>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10, x: isUser ? 14 : -14 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '90%',
        padding: '10px 14px',
        fontSize: 14.5,
        fontWeight: 500,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        userSelect: 'text',
        ...(isUser
          ? {
              background: 'rgba(79,195,247,0.12)',
              border: '1px solid var(--panel-border)',
              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
              color: '#eaf7ff',
            }
          : {
              background: 'rgba(4,12,24,0.75)',
              borderLeft: '2px solid var(--holo)',
              boxShadow: 'inset 0 0 24px rgba(21,101,160,0.12)',
              color: 'var(--text)',
            }),
      }}
    >
      {!isUser && (
        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.28em', color: 'var(--holo-deep)', marginBottom: 5 }}>
          JARVIS{msg.skills?.length ? ` · ${msg.skills.join(' + ')}` : ''}
          {msg.tier === 'frontier' ? ' · FRONTIER' : ''}
        </div>
      )}
      {isUser ? msg.text : <Decode text={msg.text} instant={msg.old} />}
    </motion.div>
  )
}

// Decode reveal: text resolves in quick chunks, like the HUD is rendering it.
function Decode({ text, instant }) {
  const [shown, setShown] = useState(instant ? text.length : 0)
  useEffect(() => {
    if (instant) return
    let i = 0
    const step = Math.max(2, Math.round(text.length / 60))
    const id = setInterval(() => {
      i += step
      setShown(i)
      if (i >= text.length) clearInterval(id)
    }, 14)
    return () => clearInterval(id)
  }, [text, instant])
  return (
    <>
      {text.slice(0, shown)}
      {shown < text.length && <span style={{ color: 'var(--holo)', textShadow: 'var(--glow-sm)' }}>▌</span>}
    </>
  )
}

function Thinking() {
  const [dots, setDots] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 350)
    return () => clearInterval(id)
  }, [])
  return <>PROCESSING{'.'.repeat(dots)}</>
}
