// Claude API — frontier tier, called only when genuinely needed.
const name = 'claude'

function available() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

async function complete({ prompt, system, maxTokens = 4096, temperature = 0.7 }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.JARVIS_CLAUDE_MODEL || 'claude-fable-5',
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

module.exports = { name, available, complete }
