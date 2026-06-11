// JARVIS dashboard logic: wake flow, chat (text + voice), live panels.
const $ = (id) => document.getElementById(id)

let cfg = null
let awake = false

init()

async function init() {
  cfg = await window.jarvis.config()

  // clock
  const tickClock = () => {
    $('clock').textContent = new Date().toLocaleString('en-AU', {
      weekday: 'short', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
    })
  }
  tickClock()
  setInterval(tickClock, 30_000)

  // voice: arm wake detection on standby
  window.JarvisVoice.onStatus((s) => {
    $('standby-mic').textContent = s
    $('mic-status').textContent = s.startsWith('mic: listening') ? 'mic: armed' : s
  })
  window.JarvisVoice.onWake(() => wake())
  window.JarvisVoice.init(cfg.wake.clapPattern && { ...cfg.wake.clapPattern, phrase: cfg.wake.phrase })

  // click also wakes (practical fallback)
  $('standby').addEventListener('click', wake)

  // chat
  $('chat-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const text = $('chat-text').value.trim()
    if (text) {
      $('chat-text').value = ''
      ask(text, false)
    }
  })

  $('mic-btn').addEventListener('click', async () => {
    $('mic-btn').classList.add('listening')
    try {
      const heard = await window.JarvisVoice.listenOnce()
      if (heard) ask(heard, true)
    } catch (err) {
      addMsg('jarvis', err.message)
    } finally {
      $('mic-btn').classList.remove('listening')
    }
  })
}

// ── Wake: greet, boot the HUD, load live data ───────────────────────────
async function wake() {
  if (awake) return
  awake = true
  const { greeting } = await window.jarvis.wake()
  $('standby').classList.add('hidden')
  $('hud').classList.remove('hidden')
  addMsg('jarvis', greeting)
  refreshDashboard()
  setInterval(refreshDashboard, (cfg.dashboard.refreshMinutes || 15) * 60_000)
  $('chat-text').focus()
}

// ── Conversation ────────────────────────────────────────────────────────
async function ask(text, viaVoice) {
  addMsg('user', text)
  const pending = addMsg('jarvis thinking', '…')
  const res = await window.jarvis.ask(text, viaVoice)
  pending.remove()
  addMsg('jarvis', res.reply, res.skill, res.tier)
  // skills that change live state should reflect on the dashboard
  if (['business', 'web-builder', 'life', 'memory'].includes(res.skill)) refreshDashboard()
}

function addMsg(cls, text, skill, tier) {
  const div = document.createElement('div')
  div.className = `msg ${cls}`
  if (skill && skill !== 'conversation') {
    const meta = document.createElement('span')
    meta.className = 'meta'
    meta.textContent = `▸ ${skill}${tier === 'frontier' ? ' · frontier model' : ''}`
    div.appendChild(meta)
  }
  div.appendChild(document.createTextNode(text))
  $('chat-log').appendChild(div)
  $('chat-log').scrollTop = $('chat-log').scrollHeight
  return div
}

// ── Dashboard panels ────────────────────────────────────────────────────
async function refreshDashboard() {
  const d = await window.jarvis.dashboard()

  $('status-body').textContent = d.status.error
    ? `brain check failed: ${d.status.error}`
    : `local brain   ${d.status.local}\nfrontier      ${d.status.frontier}\nescalation    ${d.status.frontierEnabled ? 'enabled (you control spend)' : 'OFF — local only'}`
  $('brain-status').textContent = `brain: ${d.status.local?.startsWith('ollama') ? 'local online' : 'local offline'}`

  $('inbox-body').textContent = trim(d.inbox.error ? `(${d.inbox.error})` : d.inbox.reply, 700)
  $('news-body').textContent = trim(d.news.error ? `(${d.news.error})` : d.news.reply, 1200)
  $('business-body').textContent = trim(d.business.error ? `(${d.business.error})` : d.business.reply, 700)

  $('tasks-body').textContent = d.tasks.length
    ? d.tasks.map((t) => `◇ ${t}`).join('\n')
    : 'No open tasks. Say “remind me to …” to add one.'
}

const trim = (s, n) => (s && s.length > n ? s.slice(0, n) + '…' : s || '')
