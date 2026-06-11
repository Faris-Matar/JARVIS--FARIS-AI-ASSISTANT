// Gmail skill — reads the inbox, summarises what matters, flags urgent
// items, spots client form submissions, drafts replies in Faris's voice,
// sends only on his explicit approval.
//
// Connector setup: GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET in jarvis/.env,
// then authorise once via the INBOX screen (or GET /api/gmail/auth-url).
// Token: jarvis/config/token.json (gitignored). Docs: docs/CONNECTORS.md
const fs = require('node:fs')
const path = require('node:path')

const TOKEN_PATH = path.join(__dirname, '..', '..', 'config', 'token.json')
const API = 'https://gmail.googleapis.com/gmail/v1/users/me'

// What marks an email as a client form submission for InteliSite.
const FORM_MARKERS = /website (preferences|enquiry|form)|new (form )?submission|intelisite.*(form|brief)|project enquiry|(kitchen|bathroom|loft).*(website|enquiry)/i
// What earns an urgency flag without needing a model.
const URGENT_MARKERS = /urgent|asap|deadline|today|invoice|payment|overdue|interview|offer|contract|legal/i

module.exports = {
  name: 'gmail',
  description: 'Inbox summaries, urgency flags, client form detection, drafts in your voice, sends on approval',
  triggers: [/\b(inbox|gmail|emails?|unread|missed.*(email|message)|draft (a )?reply)\b/i],

  async execute(input, ctx) {
    if (!configured()) {
      return {
        reply:
          'The Gmail connector is built but not authorised yet. Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to jarvis/.env, then hit authorise on the INBOX screen. Two minutes, then I can read, summarise and draft for you.',
      }
    }

    // "draft a reply to <person/subject>"
    const draftReq = input.match(/draft (?:a )?repl(?:y|ies)(?: to)? (.+)/i)
    if (draftReq) return draftReply(draftReq[1], ctx)

    // default: structured inbox briefing
    const data = await inbox(ctx)
    if (data.error) return { reply: `Gmail problem: ${data.error}` }
    return {
      reply: data.summary,
      spoken: spokenSummary(data),
      data: { inbox: data },
    }
  },

  configured,
  inbox,
  send,
  fetchMessageBody,
  searchMessages,
}

/* ── Structured inbox read ─────────────────────────────────────────── */

async function inbox(ctx) {
  try {
    const messages = await searchMessages('is:unread category:primary', 25)
    const clientForms = messages.filter((m) => FORM_MARKERS.test(`${m.subject} ${m.snippet}`))
    const flagged = messages.filter(
      (m) => !clientForms.includes(m) && URGENT_MARKERS.test(`${m.subject} ${m.snippet}`)
    )

    let summary
    const listing = messages
      .map((m, i) => `${i + 1}. From: ${m.from} | Subject: ${m.subject} | ${m.snippet}`)
      .join('\n')
    const res = messages.length
      ? await ctx.brain.think(
          `Summarise these unread emails for Faris. Lead with what actually matters and what needs action. ` +
            `Group: needs reply, worth knowing, ignorable. Two short paragraphs maximum, scannable. ` +
            `${clientForms.length ? `NOTE: ${clientForms.length} look like InteliSite client form submissions; call that out first.` : ''}\n\n${listing}`,
          { temperature: 0.4 }
        )
      : null

    if (res && res.tier !== 'offline') {
      summary = res.text
    } else {
      // No model reachable: honest rule-based summary, still useful.
      summary = messages.length
        ? [
            clientForms.length ? `${clientForms.length} client form submission${clientForms.length > 1 ? 's' : ''} waiting.` : null,
            flagged.length ? `${flagged.length} flagged urgent: ${flagged.map((m) => cleanFrom(m.from)).join(', ')}.` : null,
            `${messages.length} unread total. Top senders: ${[...new Set(messages.map((m) => cleanFrom(m.from)))].slice(0, 5).join(', ')}.`,
            `(No intelligence engine reachable, so this is the mechanical read. With a model I'd triage these properly.)`,
          ].filter(Boolean).join(' ')
        : 'Inbox zero on unread. Nothing waiting.'
    }

    return {
      unread: messages.length,
      messages,
      flagged,
      clientForms,
      summary,
    }
  } catch (err) {
    return { error: err.message }
  }
}

function spokenSummary(d) {
  if (!d.unread) return 'Inbox is clear, Faris.'
  const bits = [`${d.unread} unread.`]
  if (d.clientForms?.length) bits.push(`${d.clientForms.length} looks like a client form. That's the headline.`)
  else if (d.flagged?.length) bits.push(`${d.flagged.length} flagged as needing you.`)
  return bits.join(' ')
}

/* ── Draft replies in Faris's voice (send is a separate approval) ──── */

async function draftReply(targetDesc, ctx) {
  const messages = await searchMessages('is:unread category:primary', 25)
  const target =
    messages.find((m) => `${m.from} ${m.subject}`.toLowerCase().includes(extractName(targetDesc))) || messages[0]
  if (!target) return { reply: 'Nothing unread to reply to.' }

  const body = await fetchMessageBody(target.id)
  const res = await ctx.brain.think(
    `Draft a reply from Faris to this email. Use his drafting voice rules from memory (short sentences, ` +
      `warm not gushing, first line gets to the point, no corporate filler, sign off "Faris"). ` +
      `Output ONLY the reply body, no subject line, no commentary.\n\n` +
      `FROM: ${target.from}\nSUBJECT: ${target.subject}\n\n${body.slice(0, 3000)}`,
    { temperature: 0.6 }
  )
  if (res.tier === 'offline') return { reply: res.text }
  return {
    reply: res.text,
    data: { draft: { to: target.from, subject: `Re: ${target.subject}`, body: res.text, threadId: target.threadId } },
  }
}

const extractName = (s) =>
  s.replace(/the email from|with subject|["']/gi, '').trim().split(/\s+/).slice(0, 3).join(' ').toLowerCase()

/* ── Gmail REST plumbing ───────────────────────────────────────────── */

function configured() {
  return Boolean(process.env.GMAIL_CLIENT_ID) && fs.existsSync(TOKEN_PATH)
}

async function accessToken() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
  if (token.expiry && Date.now() < token.expiry - 60_000) return token.access_token
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
  if (!res.ok) throw new Error(`token refresh failed (${res.status}) — re-authorise from the INBOX screen`)
  const fresh = await res.json()
  token.access_token = fresh.access_token
  token.expiry = Date.now() + fresh.expires_in * 1000
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2))
  return token.access_token
}

async function gget(pathname) {
  const res = await fetch(`${API}${pathname}`, { headers: { authorization: `Bearer ${await accessToken()}` } })
  if (!res.ok) throw new Error(`Gmail API ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

async function searchMessages(query, max = 20) {
  const list = await gget(`/messages?maxResults=${max}&q=${encodeURIComponent(query)}`)
  const out = []
  for (const m of list.messages || []) {
    const msg = await gget(
      `/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
    )
    const header = (name) => msg.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
    out.push({
      id: m.id,
      threadId: msg.threadId,
      from: header('From'),
      subject: header('Subject'),
      date: shortDate(header('Date')),
      snippet: decodeEntities(msg.snippet || ''),
    })
  }
  return out
}

async function fetchMessageBody(id) {
  const msg = await gget(`/messages/${id}?format=full`)
  return extractText(msg.payload) || decodeEntities(msg.snippet || '')
}

function extractText(part) {
  if (!part) return ''
  if (part.mimeType === 'text/plain' && part.body?.data) return b64decode(part.body.data)
  if (part.parts) {
    for (const p of part.parts) {
      const t = extractText(p)
      if (t) return t
    }
  }
  if (part.mimeType === 'text/html' && part.body?.data) {
    return b64decode(part.body.data).replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ')
  }
  return ''
}

async function send({ to, subject, body, threadId }) {
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n')
  const res = await fetch(`${API}/messages/send`, {
    method: 'POST',
    headers: { authorization: `Bearer ${await accessToken()}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      raw: Buffer.from(raw).toString('base64url'),
      ...(threadId ? { threadId } : {}),
    }),
  })
  if (!res.ok) throw new Error(`send failed (${res.status}): ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

const b64decode = (s) => Buffer.from(s, 'base64url').toString('utf8')
const cleanFrom = (f = '') => f.replace(/<.*>/, '').replace(/"/g, '').trim() || f
const decodeEntities = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
function shortDate(d) {
  const t = new Date(d)
  return isNaN(t) ? '' : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
