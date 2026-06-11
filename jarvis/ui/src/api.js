// API client for the Jarvis core server (jarvis/server/server.js).
// In dev, Vite proxies /api → localhost:7747. In Electron, the same server
// runs locally and serves this bundle, so nothing changes.
const BASE = '/api'

class OfflineError extends Error {
  constructor() {
    super('Jarvis core server is offline. Start it with: node server/server.js')
    this.offline = true
  }
}

async function call(path, options = {}) {
  let res
  try {
    res = await fetch(BASE + path, {
      headers: { 'content-type': 'application/json' },
      ...options,
    })
  } catch {
    throw new OfflineError()
  }
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `${res.status} on ${path}`)
  }
  return res.json()
}

const get = (path) => call(path)
const post = (path, body) => call(path, { method: 'POST', body: JSON.stringify(body || {}) })

export const api = {
  status: () => get('/status'),
  config: () => get('/config'),
  saveConfig: (patch) => post('/config', patch),
  wake: () => post('/wake'),
  ask: (text, viaVoice = false) => post('/ask', { text, viaVoice }),
  dashboard: () => get('/dashboard'),
  memory: () => get('/memory'),
  remember: (note) => post('/memory/remember', { note }),
  builderJobs: () => get('/builder/jobs'),
  builderRun: (body) => post('/builder/run', body),
  gmail: {
    status: () => get('/gmail/status'),
    authUrl: () => get('/gmail/auth-url'),
    inbox: () => get('/gmail/inbox'),
    send: (draft) => post('/gmail/send', draft),
  },
  news: () => get('/news'),
  skill: (name, input) => post(`/skill/${name}`, { input }),
}

export { OfflineError }
