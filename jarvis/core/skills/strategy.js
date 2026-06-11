// Strategy — thinking partner mode. Reasons through problems WITH Faris,
// gives genuine pushback, presents options, helps him decide. Not a yes-man.
module.exports = {
  name: 'strategy',
  description: 'Thinking partner: reasons with you, pushes back, helps you decide',
  triggers: [/\b(think (?:this )?through|thinking partner|should i|strategy|pros and cons|help me decide|pushback|sanity check)\b/i],

  async execute(input, ctx) {
    const res = await ctx.brain.think(input, {
      system:
        `You are JARVIS in thinking-partner mode. Faris wants a sparring partner, not ` +
        `agreement. Method: 1) restate his actual decision in one line, 2) steelman the ` +
        `option he seems to favour, 3) attack it honestly — the strongest case against, ` +
        `4) lay out 2–3 real options with the trade-off that matters for HIM (use his ` +
        `goals and context below), 5) give your recommendation and what evidence would ` +
        `change it. Push back where he's fooling himself; he's asked for that explicitly.\n\n` +
        ctx.memory.contextBlock(),
    })
    return { reply: res.text }
  },
}
