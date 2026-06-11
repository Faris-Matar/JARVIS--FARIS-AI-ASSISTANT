#!/usr/bin/env node
// JARVIS core server — the brain stem. Hosts the skills, brain, memory and
// connectors behind a local HTTP API, and serves the built UI.
//
//   node server/server.js          → http://localhost:7747
//
// In browser development the Vite dev server proxies /api here. Inside
// Electron on the Mac, the main process starts this exact server and points
// the window at it — zero UI changes. Zero npm dependencies.
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')

const { loadEnv } = require('../core/env')
loadEnv()

const config = require('../core/config')
const memory = require('../core/memory/memory')
const brain = require('../core/brain/router')
const skills = require('../core/skills')
const greetings = require('../core/greetings')
const gmail = require('../core/skills/gmail')
const news = require('../core/skills/news')
const business = require('../core/skills/business')

const PORT = Number(process.env.JARVIS_PORT || 7747)
const UI_DIST = path.join(__dirname, '..', 'ui', 'dist')
const STARTED = Date.now()

/* ── Routing table ─────────────────────────────────────────────────── */

const routes = {
  'GET /api/status': async () => {
    const b = await brain.status()
    return {
      brain: b,
      memory: memory.stats(),
      connectors: {
        claude: process.env.ANTHROPIC_API_KEY ? 'configured' : 'absent',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'absent',
        gmail: gmail.configured() ? 'connected' : process.env.GMAIL_CLIENT_ID ? 'configured' : 'absent',
        builder: fs.existsSync(builderDir()),
      },
      session: { turns: brain.session.turns.length },
      port: PORT,
      uptime: uptime(),
    }
  },

  'GET /api/config': async () => safeConfig(),

  'POST /api/config': async (body) => {
    const current = config.get()
    const next = deepMerge(current, body)
    fs.writeFileSync(config.CONFIG_PATH, JSON.stringify(next, null, 2))
    config.reload()
    return safeConfig()
  },

  'POST /api/wake': async () => {
    let extras = {}
    try {
      const snap = business.snapshot({ memory, config: config.get() })
      extras.awaitingFaris = snap.awaitingFaris
      extras.tasks = memory.currentTasks().length
    } catch { /* greeting must never fail */ }
    const greeting = greetings.greeting(extras)
    memory.logInteraction('(wake)')
    return { greeting }
  },

  'POST /api/ask': async (body) => {
    if (!body?.text?.trim()) throw httpError(400, 'text required')
    return skills.handle(body.text.trim(), { viaVoice: Boolean(body.viaVoice) })
  },

  'GET /api/dashboard': async () => {
    const ctx = { brain, memory, config: config.get() }
    const [newsB, inboxB, businessB] = await Promise.all([
      news.getBriefing(ctx).catch((e) => ({ error: e.message })),
      gmail.configured() ? gmail.inbox(ctx).catch((e) => ({ error: e.message })) : { status: 'unconfigured' },
      Promise.resolve().then(() => business.snapshot(ctx)).catch((e) => ({ error: e.message })),
    ])
    return {
      news: newsB,
      inbox: inboxB,
      business: businessB,
      builderJobs: businessB.jobs || [],
      tasks: memory.currentTasks(),
    }
  },

  'GET /api/memory': async () => memory.snapshot(),
  'POST /api/memory/remember': async (body) => {
    if (!body?.note) throw httpError(400, 'note required')
    return memory.remember(body.note)
  },

  'GET /api/news': async () => news.getBriefing({ brain, memory, config: config.get() }),

  'GET /api/builder/jobs': async () => business.builderJobs(config.get()),

  'POST /api/builder/run': async (body) => {
    if (!body?.slug) throw httpError(400, 'slug required')
    const args = ['run', body.slug]
    if (body.direction) args.push('--direction', String(body.direction))
    if (body.notes) args.push('--notes', body.notes)
    const log = fs.openSync(path.join(builderDir(), 'output', 'jarvis-run.log'), 'a')
    spawn('node', ['cli.js', ...args], { cwd: builderDir(), detached: true, stdio: ['ignore', log, log] }).unref()
    if (body.direction) memory.remember(`(business) approved design direction ${body.direction} for ${body.slug}${body.notes ? ` with notes: ${body.notes}` : ''}`)
    return { started: true, slug: body.slug }
  },

  'GET /api/builder/artifact': async (_body, query) => {
    const client = sanitize(query.get('client'))
    const name = sanitize(query.get('name'))
    const p = path.join(builderDir(), 'output', client, name)
    if (!p.startsWith(path.join(builderDir(), 'output'))) throw httpError(400, 'bad path')
    if (!fs.existsSync(p)) throw httpError(404, 'artifact not found')
    return { _raw: fs.readFileSync(p, 'utf8'), _type: 'text/markdown' }
  },

  'GET /api/gmail/status': async () => ({
    connected: gmail.configured(),
    hasClientId: Boolean(process.env.GMAIL_CLIENT_ID),
  }),

  'GET /api/gmail/auth-url': async () => ({ url: gmailAuthUrl() }),

  'GET /api/gmail/callback': async (_body, query) => {
    const code = query.get('code')
    if (!code) throw httpError(400, 'missing code')
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        redirect_uri: `http://127.0.0.1:${PORT}/api/gmail/callback`,
        grant_type: 'authorization_code',
      }),
    })
    if (!res.ok) throw httpError(500, `token exchange failed: ${await res.text()}`)
    const token = await res.json()
    token.expiry = Date.now() + token.expires_in * 1000
    fs.writeFileSync(path.join(__dirname, '..', 'config', 'token.json'), JSON.stringify(token, null, 2))
    return { _raw: '<body style="background:#04070d;color:#9be7ff;font-family:monospace;padding:40px">Gmail connected. Close this tab. Jarvis is ready.</body>', _type: 'text/html' }
  },

  'GET /api/gmail/inbox': async () => gmail.inbox({ brain, memory, config: config.get() }),

  'POST /api/gmail/send': async (body) => {
    if (!body?.to || !body?.body) throw httpError(400, 'to and body required')
    const out = await gmail.send(body)
    memory.remember(`(gmail) sent reply to ${body.to}: "${body.subject}"`)
    return { sent: true, id: out.id }
  },

  // macOS `say` — activates on the Mac; the UI falls back to browser
  // speech synthesis everywhere else.
  'POST /api/speak': async (body) => {
    if (process.platform !== 'darwin') return { spoke: false, reason: 'not macOS' }
    const { voice, rate } = config.get().voice.tts
    spawn('say', ['-v', voice, '-r', String(rate), String(body.text || '').slice(0, 800)])
    return { spoke: true }
  },
}

// POST /api/skill/:name — direct skill invocation (screens use this)
async function skillRoute(name, body) {
  if (!body?.input) throw httpError(400, 'input required')
  return skills.run(name, body.input)
}

/* ── HTTP plumbing ─────────────────────────────────────────────────── */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  cors(res)
  if (req.method === 'OPTIONS') return res.writeHead(204).end()

  try {
    const skillMatch = url.pathname.match(/^\/api\/skill\/([\w-]+)$/)
    let handler = routes[`${req.method} ${url.pathname}`]
    let result

    if (skillMatch && req.method === 'POST') {
      result = await skillRoute(skillMatch[1], await readBody(req))
    } else if (handler) {
      result = await handler(req.method === 'POST' ? await readBody(req) : null, url.searchParams)
    } else if (!url.pathname.startsWith('/api/')) {
      return serveStatic(url.pathname, res)
    } else {
      throw httpError(404, `no route: ${req.method} ${url.pathname}`)
    }

    if (result?._raw !== undefined) {
      res.writeHead(200, { 'content-type': result._type || 'text/plain' })
      return res.end(result._raw)
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(result))
  } catch (err) {
    const code = err.status || 500
    if (code === 500) console.error(`[server] ${req.method} ${url.pathname}:`, err)
    res.writeHead(code, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
  }
})

function serveStatic(pathname, res) {
  if (!fs.existsSync(UI_DIST)) {
    res.writeHead(200, { 'content-type': 'text/plain' })
    return res.end('JARVIS core online. UI not built yet: cd ui && npm install && npm run build (or use npm run dev).')
  }
  let file = path.join(UI_DIST, pathname === '/' ? 'index.html' : pathname)
  if (!file.startsWith(UI_DIST) || !fs.existsSync(file)) file = path.join(UI_DIST, 'index.html')
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}

/* ── helpers ───────────────────────────────────────────────────────── */

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => {
      data += c
      if (data.length > 2_000_000) reject(httpError(413, 'body too large'))
    })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch { reject(httpError(400, 'invalid JSON')) }
    })
  })
}

function cors(res) {
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS')
  res.setHeader('access-control-allow-headers', 'content-type')
}

function httpError(status, message) {
  const e = new Error(message)
  e.status = status
  return e
}

function safeConfig() {
  // config is safe to expose (keys live in .env, never in config)
  return config.get()
}

function deepMerge(base, patch) {
  const out = { ...base }
  for (const [k, v] of Object.entries(patch || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(base[k] || {}, v) : v
  }
  return out
}

function gmailAuthUrl() {
  if (!process.env.GMAIL_CLIENT_ID) throw httpError(400, 'GMAIL_CLIENT_ID not set in jarvis/.env')
  return (
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      redirect_uri: `http://127.0.0.1:${PORT}/api/gmail/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
      access_type: 'offline',
      prompt: 'consent',
    })
  )
}

const builderDir = () => path.resolve(__dirname, '..', config.get().paths.websiteBuilder)

function uptime() {
  const s = Math.floor((Date.now() - STARTED) / 1000)
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

server.listen(PORT, () => {
  console.log(`◆ JARVIS core online — http://localhost:${PORT}`)
  console.log(`  UI dev:   cd ui && npm run dev   (http://localhost:5173)`)
  console.log(`  UI built: served from ui/dist at the URL above`)
})

module.exports = server
