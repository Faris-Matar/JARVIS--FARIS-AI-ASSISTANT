// Life assistant — gym tracking, diet, daily schedule, family reminders,
// anything personal. Tracking data persists in memory (memory/log + tasks).
module.exports = {
  name: 'life',
  description: 'Gym, diet, schedule, family reminders, personal management',
  triggers: [/\b(gym|workout|trained|diet|ate|meal|schedule|remind me|reminder|family)\b/i],

  async execute(input, ctx) {
    // Trackable statements get written to memory as well as answered.
    if (/\b(trained|workout|gym|ate|meal|weighed?)\b/i.test(input) && !input.trim().endsWith('?')) {
      ctx.memory.remember(`(life) ${input}`)
    }
    if (/remind me/i.test(input)) {
      ctx.memory.addTask(input.replace(/.*remind me( to)?/i, '').trim())
    }

    const res = await ctx.brain.think(input, {
      system:
        `You are JARVIS in life-assistant mode. You track Faris's gym sessions, diet, ` +
        `schedule and family reminders via his memory log (below). Answer with the log in ` +
        `mind — trends, streaks, gentle accountability. Reminders you were asked to set are ` +
        `now on his task list; confirm briefly.\n\n` +
        ctx.memory.contextBlock(),
    })
    return { reply: res.text }
  },
}
