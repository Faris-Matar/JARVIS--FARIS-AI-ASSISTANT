// The intelligence layer. Local-first by design:
//   - Ollama (free, on-device) handles conversation, summaries, tracking.
//   - Claude API / GPT-4 is called ONLY for genuinely heavy work (deep
//     creative, complex reasoning, the website builder pipeline), and only
//     if allowFrontier is enabled. Faris controls when credits are spent.
//   - No provider at all → Jarvis still answers: skills run on their own
//     logic, and conversational requests get an honest "here's what I'd do
//     with a brain attached" rather than a crash.
//
// Also owns: session conversation memory + automatic distillation of the
// important stuff into the persistent memory log.
const config = require('../config')
const memory = require('../memory/memory')
const ollama = require('./providers/ollama')
const claude = require('./providers/claude')
const openai = require('./providers/openai')

// ── Session conversation memory ───────────────────────────────────────
const session = { turns: [], distilledAt: 0 }

function recordTurn(role, text) {
  session.turns.push({ role, text, at: Date.now() })
  if (session.turns.length > 60) session.turns.splice(0, session.turns.length - 60)
}

function historyBlock(maxTurns = 14) {
  if (!session.turns.length) return ''
  const turns = session.turns.slice(-maxTurns)
  return (
    '\n\n# Conversation so far this session\n' +
    turns.map((t) => `${t.role === 'user' ? 'Faris' : 'Jarvis'}: ${t.text.slice(0, 400)}`).join('\n')
  )
}

// Every ~8 turns, distil durable facts into the memory log (local model
// preferred; skipped silently when no provider is up).
async function distil() {
  const fresh = session.turns.slice(session.distilledAt)
  if (fresh.length < 8) return
  session.distilledAt = session.turns.length
  try {
    const convo = fresh.map((t) => `${t.role}: ${t.text.slice(0, 300)}`).join('\n')
    const res = await completeAny({
      prompt:
        `From this conversation fragment, extract any durable facts about Faris worth remembering long-term ` +
        `(decisions made, new commitments, preferences revealed, dates, names). One per line, telegraphic. ` +
        `If nothing durable, output exactly: NONE\n\n${convo}`,
      maxTokens: 200,
      temperature: 0.2,
      preferLocal: true,
    })
    if (res && !/^\s*NONE/i.test(res.text)) {
      res.text.split('\n').map((l) => l.replace(/^[-*•]\s*/, '').trim()).filter((l) => l.length > 8).slice(0, 5)
        .forEach((fact) => memory.remember(`(distilled) ${fact}`))
    }
  } catch { /* distillation is best-effort */ }
}

// ── Provider selection ────────────────────────────────────────────────
function frontierProvider() {
  const pref = config.get().brain.frontierProvider
  if (pref === 'claude') return claude.available() ? claude : null
  if (pref === 'openai') return openai.available() ? openai : null
  if (claude.available()) return claude
  if (openai.available()) return openai
  return null
}

function needsFrontier(text, opts = {}) {
  if (opts.forceLocal) return false
  if (opts.forceFrontier) return true
  const triggers = config.get().brain.frontierTriggers || []
  const lower = text.toLowerCase()
  return triggers.some((t) => lower.includes(t.toLowerCase()))
}

// Raw completion against best available provider. Returns null if none.
async function completeAny({ prompt, system, maxTokens, temperature, preferLocal }) {
  const order = preferLocal
    ? [ollama, frontierProvider()].filter(Boolean)
    : [frontierProvider(), ollama].filter(Boolean)
  for (const p of order) {
    try {
      if (p === ollama && !(await ollama.available())) continue
      const text = await p.complete({ prompt, system, maxTokens, temperature })
      return { text, provider: p.name, tier: p === ollama ? 'local' : 'frontier' }
    } catch (err) {
      console.error(`[brain] ${p.name} failed: ${err.message}`)
    }
  }
  return null
}

// ── The JARVIS persona ────────────────────────────────────────────────
const PERSONA = `You are JARVIS, Faris's personal AI assistant. Calm, precise,
capable, lightly dry in the spirit of the original. You know Faris well; his
profile, preferences, projects and recent memory follow.

Hard rules for every response:
- Concise and direct. No filler, no preamble, no "great question"
- Never use em dashes
- Natural tone. A real intelligent assistant, not a corporate bot
- Never sycophantic. Push back when Faris is wrong; he wants that
- Lead with the answer. Detail after, only if it earns its place
- Big creative and strategic decisions are his. Present options, take his call
- Address him as Faris when it's natural, not in every line`

// ── Main entry ────────────────────────────────────────────────────────
// think(prompt, { system, forceLocal, forceFrontier, maxTokens, temperature,
//                 persona: true|false (default true), history: true|false })
async function think(prompt, opts = {}) {
  const cfg = config.get().brain
  const usePersona = opts.persona !== false
  const system = [
    usePersona ? PERSONA : null,
    usePersona ? `# What you know about Faris\n${memory.contextBlock()}` : null,
    opts.system || null,
    opts.history !== false ? historyBlock() : null,
  ].filter(Boolean).join('\n\n')

  const wantFrontier = cfg.allowFrontier && needsFrontier(prompt, opts)
  const result = await completeAny({
    prompt,
    system,
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
    preferLocal: !wantFrontier,
  })

  if (!result) {
    return {
      text: noBrainReply(prompt, cfg),
      provider: 'none',
      tier: 'offline',
    }
  }
  return result
}

// Honest, useful answer when no model is reachable.
function noBrainReply(prompt, cfg) {
  const wouldEscalate = cfg.allowFrontier && needsFrontier(prompt)
  return [
    `No intelligence engine is reachable right now, so I can't reason through that.`,
    `Here's what I'd do with one: route this to ${wouldEscalate ? 'the frontier model (it qualifies as heavy work)' : 'the local model (no API spend needed)'}, with your full memory context attached.`,
    `To fix it: add ANTHROPIC_API_KEY or OPENAI_API_KEY to jarvis/.env, or once you're on the Mac, start Ollama (ollama serve) for the free local brain.`,
    `Everything that doesn't need reasoning still works: dashboard, builder pipeline controls, memory, trackers.`,
  ].join(' ')
}

async function status() {
  const localOnline = await ollama.available()
  const frontier = frontierProvider()
  return {
    localOnline,
    localModel: process.env.JARVIS_LOCAL_MODEL || 'llama3.1',
    frontier: frontier?.name || null,
    frontierConfigured: Boolean(frontier),
    frontierEnabled: config.get().brain.allowFrontier,
  }
}

module.exports = { think, completeAny, status, needsFrontier, recordTurn, distil, session, PERSONA }
