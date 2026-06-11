// Local model via Ollama — Jarvis's default brain. Free forever.
const HOST = () => process.env.OLLAMA_HOST || 'http://localhost:11434'

const name = 'ollama'

async function available() {
  try {
    const res = await fetch(`${HOST()}/api/tags`, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

async function complete({ prompt, system, maxTokens = 2048, temperature = 0.7 }) {
  const res = await fetch(`${HOST()}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.JARVIS_LOCAL_MODEL || 'llama3.1',
      prompt,
      ...(system ? { system } : {}),
      stream: false,
      options: { temperature, num_predict: maxTokens },
    }),
  })
  if (!res.ok) {
    throw new Error(`Ollama ${res.status} — is it running? Start with: ollama serve`)
  }
  return (await res.json()).response
}

module.exports = { name, available, complete }
