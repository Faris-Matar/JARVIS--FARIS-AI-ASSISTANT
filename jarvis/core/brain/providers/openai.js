// OpenAI — alternative frontier tier.
const name = 'openai'

function available() {
  return Boolean(process.env.OPENAI_API_KEY)
}

async function complete({ prompt, system, maxTokens = 4096, temperature = 0.7 }) {
  const messages = []
  if (system) messages.push({ role: 'system', content: system })
  messages.push({ role: 'user', content: prompt })

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.JARVIS_OPENAI_MODEL || 'gpt-4o',
      max_tokens: maxTokens,
      temperature,
      messages,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`)
  return (await res.json()).choices[0].message.content
}

module.exports = { name, available, complete }
