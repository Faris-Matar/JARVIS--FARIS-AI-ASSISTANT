// The intelligence layer. Local-first by design:
//   - Ollama (Llama 3.1 / Mistral) handles casual conversation, summaries,
//     daily updates, tracking — free forever on Mac hardware.
//   - Claude API / GPT-4 is called ONLY when genuinely needed (heavy creative
//     work, complex reasoning, the website builder pipeline), and only if
//     allowFrontier is true in config. Faris controls when credits are spent.
const config = require('../config')
const ollama = require('./providers/ollama')
const claude = require('./providers/claude')
const openai = require('./providers/openai')

function frontierProvider() {
  const pref = config.get().brain.frontierProvider
  if (pref === 'claude') return claude
  if (pref === 'openai') return openai
  // auto: prefer whichever key is configured
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

// Main entry: think(prompt, { system, forceLocal, forceFrontier, maxTokens })
async function think(prompt, opts = {}) {
  const cfg = config.get().brain
  const wantFrontier = cfg.allowFrontier && needsFrontier(prompt, opts)
  const frontier = wantFrontier ? frontierProvider() : null

  if (frontier) {
    try {
      const text = await frontier.complete({ prompt, ...opts })
      return { text, provider: frontier.name, tier: 'frontier' }
    } catch (err) {
      // Frontier failure falls back to local — Jarvis never goes silent.
      console.error(`[brain] ${frontier.name} failed (${err.message}); falling back to local`)
    }
  }

  const text = await ollama.complete({ prompt, ...opts })
  return { text, provider: 'ollama', tier: 'local' }
}

async function status() {
  return {
    local: (await ollama.available()) ? `ollama (${process.env.JARVIS_LOCAL_MODEL || 'llama3.1'})` : 'offline — run: ollama serve',
    frontier: frontierProvider()?.name || 'not configured (local-only mode)',
    frontierEnabled: config.get().brain.allowFrontier,
  }
}

module.exports = { think, status, needsFrontier }
