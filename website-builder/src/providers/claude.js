// Claude API provider — uses native fetch, no SDK dependency.
const API_URL = 'https://api.anthropic.com/v1/messages'

export const name = 'claude'

export function available() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export async function complete({ system, prompt, maxTokens = 8192, temperature = 0.7 }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.WB_CLAUDE_MODEL || 'claude-fable-5',
      max_tokens: maxTokens,
      temperature,
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.content.map((b) => b.text ?? '').join('')
}
