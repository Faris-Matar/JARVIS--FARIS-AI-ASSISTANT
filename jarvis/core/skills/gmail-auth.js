// One-time Gmail OAuth flow (Desktop app / loopback). Run:
//   node core/skills/gmail-auth.js
// Requires GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in jarvis/.env.
// Stores config/token.json (gitignored — re-run on a new machine).
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { loadEnv } = require('../env')

loadEnv()

const PORT = 8765
const REDIRECT = `http://127.0.0.1:${PORT}/callback`
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose'
const TOKEN_PATH = path.join(__dirname, '..', '..', 'config', 'token.json')

const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET } = process.env
if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
  console.error('Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in jarvis/.env first.')
  process.exit(1)
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: GMAIL_CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, REDIRECT)
    if (url.pathname !== '/callback') return res.end()
    const code = url.searchParams.get('code')
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        redirect_uri: REDIRECT,
        grant_type: 'authorization_code',
      }),
    })
    const token = await tokenRes.json()
    token.expiry = Date.now() + token.expires_in * 1000
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2))
    res.end('Gmail connected. You can close this tab — Jarvis is ready.')
    console.log(`Token saved to ${TOKEN_PATH}`)
    process.exit(0)
  })
  .listen(PORT, () => {
    console.log('Open this URL to authorise Gmail:\n\n' + authUrl + '\n')
  })
