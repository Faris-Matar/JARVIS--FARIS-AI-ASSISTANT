// Voice layer: passive listening for the wake signal, plus push-to-talk STT.
//
// Wake paths (both always armed while on standby):
//   1. CLAP PATTERN — fully local, Web Audio amplitude-spike detection
//      (two sharp peaks within the configured window). Works with no
//      network and no model. Tony Stark style.
//   2. WAKE PHRASE — "wake up jarvis" via the Web Speech API where the
//      runtime supports it. Upgrade path: whisper.cpp streaming for fully
//      local phrase detection (see docs/ARCHITECTURE.md → Voice).
//
// Exposes window.JarvisVoice = { init, onWake, listenOnce, status }
(() => {
  let audioCtx, analyser, micStream
  let wakeCallback = null
  let statusCallback = null
  let armed = true
  let clapTimes = []
  let config = { claps: 2, windowMs: 1200, threshold: 0.45, phrase: 'wake up jarvis' }

  const setStatus = (s) => statusCallback && statusCallback(s)

  async function init(cfg = {}) {
    Object.assign(config, cfg)
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(micStream)
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      watchClaps()
      startWakePhrase()
      setStatus('mic: listening (clap ×' + config.claps + ' or wake phrase)')
    } catch (err) {
      setStatus('mic: unavailable — ' + err.message)
    }
  }

  // ── Clap detection: short, loud transients ───────────────────────────
  function watchClaps() {
    const data = new Uint8Array(analyser.fftSize)
    let lastPeak = 0
    const tick = () => {
      analyser.getByteTimeDomainData(data)
      let peak = 0
      for (let i = 0; i < data.length; i++) {
        const v = Math.abs(data[i] - 128) / 128
        if (v > peak) peak = v
      }
      const now = performance.now()
      // a clap is a sharp spike with at least 120ms separation from the last
      if (armed && peak > config.threshold && now - lastPeak > 120) {
        lastPeak = now
        clapTimes.push(now)
        clapTimes = clapTimes.filter((t) => now - t < config.windowMs)
        if (clapTimes.length >= config.claps) {
          clapTimes = []
          fireWake('clap')
        }
      }
      requestAnimationFrame(tick)
    }
    tick()
  }

  // ── Wake phrase via Web Speech API (best-effort; clap always works) ──
  function startWakePhrase() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-AU'
    rec.onresult = (e) => {
      if (!armed) return
      const heard = [...e.results].map((r) => r[0].transcript).join(' ').toLowerCase()
      if (heard.includes(config.phrase) || heard.includes('wake up javis')) fireWake('phrase')
    }
    rec.onend = () => { try { armed && rec.start() } catch { /* already started */ } }
    rec.onerror = () => {} // network-dependent; clap path covers us
    try { rec.start() } catch { /* not available in this runtime */ }
  }

  function fireWake(via) {
    armed = false // stop watching once awake; re-arm if standby returns
    wakeCallback && wakeCallback(via)
  }

  // ── Push-to-talk: one utterance → text ───────────────────────────────
  function listenOnce() {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) return reject(new Error('Speech recognition not available in this runtime — type instead, or wire whisper.cpp (see docs).'))
      const rec = new SR()
      rec.lang = 'en-AU'
      rec.interimResults = false
      rec.onresult = (e) => resolve(e.results[0][0].transcript)
      rec.onerror = (e) => reject(new Error(e.error))
      rec.onend = () => resolve('')
      rec.start()
    })
  }

  window.JarvisVoice = {
    init,
    onWake: (cb) => (wakeCallback = cb),
    onStatus: (cb) => (statusCallback = cb),
    listenOnce,
    rearm: () => { armed = true; clapTimes = [] },
  }
})()
