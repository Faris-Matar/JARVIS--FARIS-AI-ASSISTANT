// Job hunt — tracks grad role applications, follow-ups, prep, cover letters.
// Application state lives in memory/projects.md + the memory log.
module.exports = {
  name: 'jobhunt',
  description: 'Grad application tracking, follow-ups, interview prep, cover letters',
  triggers: [/\b(applications?|applied|grad role|interview|cover letter|follow[- ]?up|job hunt)\b/i],

  async execute(input, ctx) {
    if (/\bapplied\b/i.test(input) && !input.trim().endsWith('?')) {
      ctx.memory.remember(`(jobhunt) ${input}`)
    }

    const wantsCoverLetter = /cover letter|draft.*application/i.test(input)
    const res = await ctx.brain.think(input, {
      system:
        `You are JARVIS in job-hunt mode. You track Faris's grad role applications from his ` +
        `memory (below): statuses, follow-ups due, interview prep. For cover letters: his ` +
        `real background only — never invent experience; pain-point-led structure (what the ` +
        `employer needs → proof he delivers it), sounds like a sharp human, no clichés ` +
        `("passionate", "fast-paced environment"). For prep: concrete, role-specific.\n\n` +
        ctx.memory.contextBlock(),
      // Cover letters are high-stakes writing — use frontier when available.
      forceFrontier: wantsCoverLetter,
    })
    return { reply: res.text, tier: res.tier }
  },
}
