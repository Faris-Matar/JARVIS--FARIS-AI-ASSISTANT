// Coding assistant — debug, write, explain, work through problems across any
// language or framework: grad role work, side AI projects, anything.
// Can pull files into context via the files skill's helpers.
const fs = require('node:fs')
const path = require('node:path')

module.exports = {
  name: 'coding',
  description: 'Debugging, writing and explaining code across any stack',
  triggers: [/\b(code|debug|error|stack ?trace|function|refactor|explain this|typescript|python|react\b)\b/i],

  async execute(input, ctx) {
    // Inline file references: "look at /path/to/file.js" pulls the file in.
    let fileContext = ''
    for (const m of input.matchAll(/(?:^|\s)(~?\/[\w./-]+\.\w+)/g)) {
      const p = m[1].replace(/^~/, process.env.HOME)
      if (fs.existsSync(p) && fs.statSync(p).size < 200_000) {
        fileContext += `\n\n--- ${p} ---\n${fs.readFileSync(p, 'utf8')}`
      }
    }

    const res = await ctx.brain.think(`${input}${fileContext}`, {
      system:
        `You are JARVIS in coding-assistant mode for Faris. Be precise and practical: ` +
        `diagnose before prescribing, show concrete code, explain the why in one or two ` +
        `lines, not an essay. If the problem is genuinely complex, say what you'd need to see next.\n\n` +
        ctx.memory.contextBlock(),
      // Hard problems deserve the frontier tier when it's enabled.
      forceFrontier: /architect|design review|gnarly|complex|race condition/i.test(input),
    })
    return { reply: res.text, tier: res.tier }
  },
}
