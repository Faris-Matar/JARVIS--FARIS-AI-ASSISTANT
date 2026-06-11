// Gmail skill — reads inbox, summarises what Faris missed, flags what
// matters, drafts replies in his voice.
//
// Setup (one-time): create OAuth credentials in Google Cloud Console
// (Gmail API, Desktop app), set GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET in
// .env, then run: node core/skills/gmail-auth.js  → stores config/token.json
const fs = require('node:fs')
const path = require('node:path')

const TOKEN_PATH = path.join(__dirname, '..', '..', 'config', 'token.json')

module.exports = {
  name: 'gmail',
  description: 'Inbox summaries, flags what matters, drafts replies in your voice',
  triggers: [/\b(inbox|gmail|emails?|unread)\b/i],

  async execute(input, ctx) {
    if (!configured()) {
      return {
        reply:
          'Gmail isn\'t connected yet. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in jarvis/.env, ' +
          'then run `node core/skills/gmail-auth.js` once to authorise. After that I can read and summarise your inbox.',
      }
    }

    const messages = await fetchUnread(20)
    if (messages.length === 0) return { reply: 'Inbox zero on unread, Faris. Nothing waiting.' }

    const listing = messages
      .map((m, i) => `${i + 1}. From: ${m.from} — Subject: ${m.subject}\n   ${m.snippet}`)
      .join('\n')

    if (/draft|reply|respond/i.test(input)) {
      const res = await ctx.brain.think(
        `Faris asked: "${input}". Unread emails:\n${listing}\n\nDraft the reply he needs, in his voice (see his profile). Output only the draft.`,
        { system: ctx.memory.contextBlock() }
      )
      return { reply: res.text }
    }

    const res = await ctx.brain.think(
      `Summarise these unread emails for Faris: what he missed, what actually matters (flag those first), what can be ignored. Brief and scannable.\n\n${listing}`,
      { system: 'You are JARVIS summarising an inbox. Lead with what matters.' }
    )
    return { reply: res.text, spoken: `You have ${messages.length} unread. ${firstLine(res.text)}`, data: { count: messages.length } }
  },

  // Used by the web-builder skill to find client form submissions.
  fetchUnread,
  configured,
}

function configured() {
  return fs.existsSync(TOKEN_PATH) && process.env.GMAIL_CLIENT_ID
}

async function accessToken() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
  if (token.expiry && Date.now() < token.expiry - 60_000) return token.access_token
  // refresh
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Gmail token refresh failed: ${res.status}`)
  const fresh = await res.json()
  token.access_token = fresh.access_token
  token.expiry = Date.now() + fresh.expires_in * 1000
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2))
  return token.access_token
}

async function fetchUnread(max = 20, query = 'is:unread category:primary') {
  const auth = { authorization: `Bearer ${await accessToken()}` }
  const list = await (
    await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&q=${encodeURIComponent(query)}`,
      { headers: auth }
    )
  ).json()
  const out = []
  for (const m of list.messages || []) {
    const msg = await (
      await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
        { headers: auth }
      )
    ).json()
    const header = (name) => msg.payload.headers.find((h) => h.name === name)?.value || ''
    out.push({ id: m.id, from: header('From'), subject: header('Subject'), snippet: msg.snippet })
  }
  return out
}
