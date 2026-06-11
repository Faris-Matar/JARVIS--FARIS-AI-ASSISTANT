// Research — deep dives on any topic, structured useful output, not a wall
// of text.
module.exports = {
  name: 'research',
  description: 'Deep dives on any topic with structured output',
  triggers: [/\b(research|deep dive|investigate|compare .* (?:vs|versus)|look into)\b/i],

  async execute(input, ctx) {
    const res = await ctx.brain.think(input, {
      system:
        `You are JARVIS in research mode. Produce structured, decision-ready output: ` +
        `a 3-line executive summary first, then organised sections with the substance, ` +
        `then "what I'd do" with a recommendation. Flag uncertainty honestly — and flag ` +
        `anything that needs live web data you don't have, rather than guessing. ` +
        `Never a wall of text.\n\n` +
        ctx.memory.contextBlock(),
      // Deep dives are a legitimate frontier use when enabled.
      forceFrontier: /deep dive/i.test(input),
    })
    return { reply: res.text, tier: res.tier }
  },
}
