// Voice layer — browser implementation, Electron-ready.
//
// WAKE (armed on standby):
//   1. Clap pattern — Web Audio amplitude-transient detection. Fully local,
//      works everywhere, no network. Two sharp peaks inside the window.
//   2. Wake phrase — Web Speech API where the runtime provides it
//      (Chrome: yes; Electron: swap in whisper.cpp via the server, see
//      docs/SETUP-MAC.md — this module's surface doesn't change).
//
// OUTPUT:
//   speak() — Web Speech Synthesis now; on the Mac the server exposes
//   macOS `say` and the app prefers it automatically when available.

let audioCtx = null
let analyser = null
let armed = false
let wakeCb = null
let statusCb = null
let levelCb = null
let clapTimes = []
let raf = 0

const cfg = { claps: 2, windowMs: 1400, threshold: 0.42, phrase: 'wake up jarvis' }

const setStatus = (s) => statusCb && statusCb(s)

export async function initVoice(options = {}) {
  Object.assign(cfg, options)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(stream)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 1024
    source.connect(analyser)
    startWakePhrase()
    watchAudio()
    setStatus({ ok: true, text: `audio armed · clap ×${cfg.claps} or “${cfg.phrase}”` })
    return true
  } catch (err) {
    setStatus({ ok: false, text: `microphone unavailable (${err.name}) · click to wake` })
    return false
  }
}

export const onWake = (cb) => (wakeCb = cb)
export const onStatus = (cb) => (statusCb = cb)
export const onLevel = (cb) => (levelCb = cb) // live amplitude for waveform UI
export const arm = () => { armed = true; clapTimes = [] }
export const disarm = () => (armed = false)

function watchAudio() {
  const data = new Uint8Array(analyser.fftSize)
  let lastPeak = 0
  const tick = () => {
    analyser.getByteTimeDomainData(data)
    let peak = 0
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i] - 128) / 128
      sum += v * v
      if (v > peak) peak = v
    }
    levelCb && levelCb(Math.sqrt(sum / data.length), data)

    const now = performance.now()
    if (armed && peak > cfg.threshold && now - lastPeak > 130) {
      lastPeak = now
      clapTimes.push(now)
      clapTimes = clapTimes.filter((t) => now - t < cfg.windowMs)
      if (clapTimes.length >= cfg.claps) {
        clapTimes = []
        fireWake('clap')
      }
    }
    raf = requestAnimationFrame(tick)
  }
  cancelAnimationFrame(raf)
  tick()
}

function startWakePhrase() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return
  const rec = new SR()
  rec.continuous = true
  rec.interimResults = true
  rec.lang = 'en-GB'
  rec.onresult = (e) => {
    if (!armed) return
    const heard = [...e.results].map((r) => r[0].transcript).join(' ').toLowerCase()
    if (heard.includes(cfg.phrase) || /wake up,? (jarvis|javis|jervis)/.test(heard)) fireWake('phrase')
  }
  rec.onend = () => { try { rec.start() } catch { /* restart races are fine */ } }
  rec.onerror = () => {}
  try { rec.start() } catch { /* unsupported runtime; clap path covers it */ }
}

function fireWake(via) {
  armed = false
  wakeCb && wakeCb(via)
}

// ── Push-to-talk: one utterance → transcript ─────────────────────────
export function listenOnce() {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      return reject(new Error('Speech recognition not available in this runtime. Type instead — whisper.cpp replaces this on the Mac.'))
    }
    const rec = new SR()
    rec.lang = 'en-GB'
    rec.interimResults = false
    let settled = false
    rec.onresult = (e) => { settled = true; resolve(e.results[0][0].transcript) }
    rec.onerror = (e) => { if (!settled) { settled = true; reject(new Error(e.error)) } }
    rec.onend = () => { if (!settled) resolve('') }
    rec.start()
  })
}

// ── Text-to-speech ────────────────────────────────────────────────────
// Engine swap: on the Mac the server config sets voice.tts.engine to "say"
// and speak() routes through /api/speak (macOS native voice). Everywhere
// else, browser speech synthesis.
let ttsEngine = 'webspeech'
export function configureSpeech(engine) {
  ttsEngine = engine || 'webspeech'
}

let voiceCache = null
function pickVoice() {
  if (voiceCache) return voiceCache
  const voices = window.speechSynthesis?.getVoices() || []
  voiceCache =
    voices.find((v) => /Daniel/i.test(v.name) && /GB/i.test(v.lang)) ||
    voices.find((v) => /en-GB/i.test(v.lang)) ||
    voices.find((v) => /en/i.test(v.lang)) ||
    null
  return voiceCache
}
if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => (voiceCache = null)

export function speak(text, { rate = 1.02, pitch = 0.92 } = {}) {
  if (!text) return
  if (ttsEngine === 'say') {
    fetch('/api/speak', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: stripForSpeech(text) }),
    }).catch(() => {})
    return
  }
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(stripForSpeech(text))
  const v = pickVoice()
  if (v) u.voice = v
  u.rate = rate
  u.pitch = pitch
  window.speechSynthesis.speak(u)
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
}

// Don't read markdown furniture aloud.
function stripForSpeech(text) {
  return text
    .replace(/[*_#`>|]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .slice(0, 600)
}
