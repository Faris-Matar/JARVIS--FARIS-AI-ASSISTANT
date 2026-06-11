import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from './api.js'
import { initVoice, onWake, onStatus, arm, listenOnce, speak, configureSpeech } from './voice.js'
import Standby from './components/Standby.jsx'
import BootSequence from './components/BootSequence.jsx'
import TopBar from './components/TopBar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Conversation from './components/Conversation.jsx'
import GmailScreen from './components/screens/GmailScreen.jsx'
import NewsScreen from './components/screens/NewsScreen.jsx'
import BuilderScreen from './components/screens/BuilderScreen.jsx'
import BusinessScreen from './components/screens/BusinessScreen.jsx'
import ResearchScreen from './components/screens/ResearchScreen.jsx'
import MemoryScreen from './components/screens/MemoryScreen.jsx'
import SettingsScreen from './components/screens/SettingsScreen.jsx'

// Jarvis state machine: STANDBY → BOOT → MAIN.
// Wake via clap pattern, wake phrase, or click. Everything flows.
let msgId = 0

export default function App() {
  const [phase, setPhase] = useState('standby')
  const [screen, setScreen] = useState('dashboard')
  const [status, setStatus] = useState(null)
  const [micStatus, setMicStatus] = useState(null)
  const [dash, setDash] = useState(null)
  const [messages, setMessages] = useState([])
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const wokenRef = useRef(false)

  // ── Voice + status bootstrap ────────────────────────────────────────
  useEffect(() => {
    onStatus(setMicStatus)
    onWake(() => wake())
    api
      .config()
      .then((cfg) => {
        configureSpeech(cfg.voice?.tts?.engine)
        initVoice({ ...cfg.wake.clapPattern, phrase: cfg.wake.phrase })
      })
      .catch(() => initVoice({}))
    api.status().then(setStatus).catch(() => setStatus({ offline: true }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refreshDashboard = useCallback(async () => {
    try {
      setDash(await api.dashboard())
    } catch {
      setDash({ offline: true })
    }
  }, [])

  // ── Wake flow ───────────────────────────────────────────────────────
  const wake = useCallback(async () => {
    if (wokenRef.current) return
    wokenRef.current = true
    setPhase('boot')
    try {
      const [s, w] = await Promise.all([api.status(), api.wake()])
      setStatus(s)
      // greet during the boot sequence — Jarvis talks while systems light up
      speak(w.greeting)
      pushMessage('jarvis', w.greeting, { old: false })
    } catch {
      const fallback = greetingFallback()
      speak(fallback)
      pushMessage('jarvis', fallback)
    }
    refreshDashboard()
  }, [refreshDashboard])

  const bootDone = useCallback(() => {
    setPhase('main')
    const id = setInterval(refreshDashboard, 5 * 60_000)
    return () => clearInterval(id)
  }, [refreshDashboard])

  // ── Conversation ────────────────────────────────────────────────────
  function pushMessage(role, text, extra = {}) {
    setMessages((m) => [...m.map((x) => ({ ...x, old: true })), { id: ++msgId, role, text, ...extra }])
  }

  const ask = useCallback(async (text, viaVoice = false) => {
    pushMessage('user', text)
    setBusy(true)
    try {
      const res = await api.ask(text, viaVoice)
      pushMessage('jarvis', res.reply, { skills: res.skills, tier: res.tier })
      if (viaVoice) speak(res.spoken || res.reply)
      if (res.skills?.some((s) => ['business', 'web-builder', 'life', 'memory'].includes(s))) refreshDashboard()
    } catch (e) {
      pushMessage('jarvis', e.offline ? e.message : `Hit a problem: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }, [refreshDashboard])

  const mic = useCallback(async () => {
    if (listening) return
    setListening(true)
    try {
      const heard = await listenOnce()
      if (heard) await ask(heard, true)
    } catch (e) {
      pushMessage('jarvis', e.message)
    } finally {
      setListening(false)
    }
  }, [listening, ask])

  // return to standby with ⌘. / Ctrl+.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        setPhase('standby')
        wokenRef.current = false
        arm()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const askFromScreen = useCallback((text) => {
    setScreen('dashboard')
    ask(text)
  }, [ask])

  return (
    <>
      <div className="atmosphere" />
      <div className="scanlines" />

      <AnimatePresence mode="wait">
        {phase === 'standby' && <Standby key="standby" micStatus={micStatus} onWake={wake} />}
        {phase === 'boot' && <BootSequence key="boot" status={status} onDone={bootDone} />}

        {phase === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 2 }}
          >
            <TopBar screen={screen} setScreen={setScreen} status={status} micStatus={micStatus} />

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(360px, 30%) 1fr', gap: 14, padding: 14, minHeight: 0 }}>
              {/* conversation: always present, the spine of the product */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: 'var(--panel-bg)',
                  border: '1px solid var(--panel-border)',
                  clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
                  padding: 16,
                  minHeight: 0,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="label label-bright" style={{ marginBottom: 10 }}>conversation</div>
                <div style={{ height: 'calc(100% - 26px)' }}>
                  <Conversation messages={messages} busy={busy} listening={listening} onSend={(t) => ask(t, false)} onMic={mic} />
                </div>
              </motion.div>

              {/* right region: dashboard ⇄ skill screens */}
              <div style={{ minHeight: 0, position: 'relative' }}>
                <AnimatePresence mode="wait">
                  {screen === 'dashboard' && <Dashboard key="dash" data={dash} setScreen={setScreen} />}
                  {screen === 'gmail' && <GmailScreen key="gmail" onBack={() => setScreen('dashboard')} onAsk={askFromScreen} />}
                  {screen === 'news' && <NewsScreen key="news" onBack={() => setScreen('dashboard')} />}
                  {screen === 'builder' && <BuilderScreen key="builder" onBack={() => setScreen('dashboard')} onAsk={askFromScreen} />}
                  {screen === 'business' && <BusinessScreen key="business" onBack={() => setScreen('dashboard')} onAsk={askFromScreen} />}
                  {screen === 'research' && <ResearchScreen key="research" onBack={() => setScreen('dashboard')} />}
                  {screen === 'memory' && <MemoryScreen key="memory" onBack={() => setScreen('dashboard')} />}
                  {screen === 'settings' && <SettingsScreen key="settings" onBack={() => setScreen('dashboard')} micStatus={micStatus} />}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function greetingFallback() {
  const h = new Date().getHours()
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, Faris. Interface online. The core server isn't responding — start it with node server/server.js and I'll bring everything else up.`
}
