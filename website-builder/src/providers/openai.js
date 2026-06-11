// OpenAI provider — uses native fetch, no SDK dependency.
const API_URL = 'https://api.openai.com/v1/chat/completions'

export const name = 'openai'

export function available() {
  return Boolean(process.env.OPENAI_API_KEY)
}

export async function complete({ system, prompt, maxTokens = 8192, temperature = 0.7 }) {
  const messages = []
  if (system) messages.push({ role: 'system', content: system })
  messages.push({ role: 'user', content: prompt })

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.WB_OPENAI_MODEL || 'gpt-4o',
      max_tokens: maxTokens,
      temperature,
      messages,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content
}
