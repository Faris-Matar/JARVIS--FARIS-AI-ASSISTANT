// Model-agnostic provider layer. The pipeline works with whichever is
// available: Claude API, OpenAI, or local Ollama. No hard dependency on one.
//
// Selection order:
//   1. WB_PROVIDER env var or --provider flag (explicit override)
//   2. ANTHROPIC_API_KEY set → claude
//   3. OPENAI_API_KEY set → openai
//   4. Ollama reachable → ollama
import * as claude from './claude.js'
import * as openai from './openai.js'
import * as ollama from './ollama.js'

const PROVIDERS = { claude, openai, ollama }

export async function getProvider(override) {
  const forced = override || process.env.WB_PROVIDER
  if (forced) {
    const p = PROVIDERS[forced]
    if (!p) throw new Error(`Unknown provider "${forced}". Use: claude | openai | ollama`)
    return p
  }
  if (claude.available()) return claude
  if (openai.available()) return openai
  if (await ollama.available()) return ollama
  throw new Error(
    'No LLM provider available. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env, ' +
      'or start Ollama locally (ollama serve && ollama pull llama3.1).'
  )
}
