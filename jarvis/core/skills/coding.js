// Coding assistant — receives a file path or pasted snippet, reasons
// through it, suggests fixes, explains concepts. Any language, any
// framework: grad role work, side AI projects, client builds. Heavy
// problems escalate to the frontier model (that's what it's for).
const fs = require('node:fs')
const path = require('node:path')

const HEAVY = /architect|design review|race condition|memory leak|deadlock|refactor (the|this) (whole|entire)|performance audit|security/i

module.exports = {
  name: 'coding',
  description: 'Debug, write and explain code across any stack, file-aware',
  triggers: [
    /\b(code|debug|error|exception|stack ?trace|function|refactor|typescript|javascript|python|react|css|api|regex|sql)\b/i,
    /```/,
  ],

  async execute(input, ctx) {
    // Inline file references: "look at ~/dev/app/src/index.js" pulls the file in.
    let fileContext = ''
    for (const m of input.matchAll(/(?:^|\s)(~?\/[\w./-]+\.\w{1,5})\b/g)) {
      const p = path.resolve(m[1].replace(/^~/, process.env.HOME || ''))
      try {
        if (fs.existsSync(p) && fs.statSync(p).size < 200_000) {
          fileContext += `\n\n--- ${p} ---\n${fs.readFileSync(p, 'utf8')}`
        }
      } catch { /* unreadable path in prose; ignore */ }
    }

    const res = await ctx.brain.think(`${input}${fileContext}`, {
      system:
        `Coding-assistant mode. Be precise and practical: diagnose before prescribing, show concrete ` +
        `code, explain the why in a line or two, not an essay. His stack preferences are in memory ` +
        `(React 18, Vite, Tailwind, GSAP, R3F, etc.) but follow whatever stack the question is in. ` +
        `If you need to see more code to be sure, say exactly what.`,
      forceFrontier: HEAVY.test(input),
      maxTokens: 2500,
      temperature: 0.4,
    })
    return { reply: res.text, tier: res.tier }
  },
}
