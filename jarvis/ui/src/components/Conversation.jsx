import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Waveform from './Waveform.jsx'

// The conversation. No chat bubbles: your words sit right and quiet,
// Jarvis answers as full-width typography that resolves word by word.
// The waveform breathes along the bottom while listening.
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
      <div
        ref={logRef}
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 26, paddingRight: 8, minHeight: 0 }}
      >
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
              transition={{ duration: 0.4 }}
            >
              <Thinking />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ flexShrink: 0, marginTop: 14 }}>
        <Waveform active={listening} height={listening ? 38 : 16} />
        <form onSubmit={submit} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', marginTop: 6 }}>
          <button
            type="button"
            onClick={onMic}
            disabled={busy}
            title="Voice input"
            style={{
              background: 'transparent',
              border: '1px solid',
              borderColor: listening ? 'var(--gold)' : 'var(--hairline-strong)',
              color: listening ? 'var(--gold)' : 'var(--text-dim)',
              width: 36,
              height: 36,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: 11,
              flexShrink: 0,
              transition: 'all 0.5s var(--ease)',
              ...(listening ? { boxShadow: '0 0 16px rgba(200,169,110,0.25)' } : {}),
            }}
          >
            {listening ? '●' : '◦'}
          </button>
          <input
            className="hud-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={listening ? 'Listening' : 'Talk to me, Faris'}
            autoFocus
          />
          <AnimatePresence>
            {draft.trim() && (
              <motion.button
                key="send"
                type="submit"
                className="hud-btn"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                disabled={busy}
                style={{ flexShrink: 0 }}
              >
                send
              </motion.button>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'

  if (isUser) {
    return (
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ alignSelf: 'flex-end', maxWidth: '82%', textAlign: 'right', userSelect: 'text' }}
      >
        <div style={{ fontSize: 13.5, fontWeight: 400, color: 'var(--text-dim)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {msg.text}
        </div>
        <div style={{ width: 18, height: 1, background: 'var(--hairline-strong)', marginLeft: 'auto', marginTop: 8 }} />
      </motion.div>
    )
  }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ alignSelf: 'stretch', userSelect: 'text' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <span
          style={{
            width: 4, height: 4, borderRadius: '50%',
            background: msg.tier === 'frontier' ? 'var(--gold)' : 'var(--holo)',
            boxShadow: msg.tier === 'frontier' ? '0 0 8px rgba(200,169,110,0.5)' : 'var(--glow-sm)',
          }}
        />
        <span className="label" style={{ fontSize: 8 }}>
          jarvis{msg.skills?.length && msg.skills[0] !== 'conversation' ? ` · ${msg.skills.join(' · ')}` : ''}
          {msg.tier === 'frontier' ? ' · frontier' : ''}
        </span>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 300, color: 'var(--text)', lineHeight: 1.75, whiteSpace: 'pre-wrap', letterSpacing: '0.01em' }}>
        {msg.old ? msg.text : <Decode text={msg.text} />}
      </div>
    </motion.div>
  )
}

// Word-level resolve: each word arrives soft and settles. Fast, liquid.
function Decode({ text }) {
  const words = text.split(/(\s+)/)
  return (
    <>
      {words.map((w, i) =>
        /^\s+$/.test(w) ? (
          w
        ) : (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.011, 1.4), ease: 'easeOut' }}
            style={{ display: 'inline-block', whiteSpace: 'pre-wrap' }}
          >
            {w}
          </motion.span>
        )
      )}
    </>
  )
}

function Thinking() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--holo)', boxShadow: 'var(--glow-sm)' }}
      />
      <motion.span
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="label"
        style={{ fontSize: 8 }}
      >
        processing
      </motion.span>
    </div>
  )
}
