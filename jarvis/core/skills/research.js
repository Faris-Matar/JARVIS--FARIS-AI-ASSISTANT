// Research skill — structured deep dives. Frontier model when available
// (this is exactly the work API credits exist for), local otherwise, honest
// hand-off when neither is reachable.
module.exports = {
  name: 'research',
  description: 'Deep dives on any topic, structured decision-ready output',
  triggers: [/\b(research|deep dive|investigate|compare .* (?:vs|versus)|look into|break down)\b/i],

  async execute(input, ctx) {
    const res = await ctx.brain.think(
      `${input}\n\nProduce the deep dive now using this exact structure:\n` +
        `# <Title>\n` +
        `**Executive summary** (3 lines max)\n` +
        `## The landscape (what's true, organised in 2-4 subsections)\n` +
        `## What matters for Faris (apply his context: InteliSite, UK luxury home improvement clients, his stack, his goals)\n` +
        `## Key takeaways (5 bullets max)\n` +
        `## Recommendation (one position, what evidence would change it)\n` +
        `## Sources & confidence (name what this is based on; flag anything that needs live web data you don't have rather than guessing)`,
      { forceFrontier: true, maxTokens: 3000, temperature: 0.5 }
    )

    if (res.tier === 'offline') {
      return {
        reply:
          `Deep dives need an intelligence engine and none is reachable. With one I'd produce: executive summary, ` +
          `landscape, what it means for you, takeaways, recommendation, sources with confidence levels. ` +
          `Add ANTHROPIC_API_KEY to jarvis/.env (this is genuinely frontier-grade work) or start Ollama for a lighter version.`,
      }
    }
    return {
      reply: res.text,
      spoken: 'Deep dive ready on screen. Executive summary first.',
      tier: res.tier,
    }
  },
}
