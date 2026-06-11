// Local Ollama provider — free, runs on Mac hardware. The default when no API
// keys are configured.
const HOST = () => process.env.OLLAMA_HOST || 'http://localhost:11434'

export const name = 'ollama'

export async function available() {
  try {
    const res = await fetch(`${HOST()}/api/tags`, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

export async function complete({ system, prompt, maxTokens = 8192, temperature = 0.7 }) {
  const res = await fetch(`${HOST()}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.WB_OLLAMA_MODEL || 'llama3.1',
      prompt,
      ...(system ? { system } : {}),
      stream: false,
      options: { temperature, num_predict: maxTokens },
    }),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()} — is Ollama running? (ollama serve)`)
  const data = await res.json()
  return data.response
}
