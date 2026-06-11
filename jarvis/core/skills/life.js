// Life skill — gym logging, diet tracking, schedule, family reminders.
// "log chest session today" stores a structured entry; questions get
// memory-aware answers with trends and gentle accountability.
module.exports = {
  name: 'life',
  description: 'Gym and diet logging, schedule, family reminders, personal management',
  triggers: [
    /\b(gym|workout|trained|training|session|diet|ate|meal|calories|protein|weighed?|schedule|remind me|reminder|family)\b/i,
    /\blog (chest|back|legs?|arms?|shoulders?|push|pull|cardio|run)\b/i,
  ],

  async execute(input, ctx) {
    // "log chest session today" / "trained back and biceps" → structured log
    const gymLog = input.match(/\b(?:log|trained|did)\s+(?:a\s+)?(chest|back|legs?|arms?|shoulders?|push|pull|upper|lower|full body|cardio|run)[\w\s]*?(session|day|workout)?\b/i)
    if (gymLog && !input.trim().endsWith('?')) {
      ctx.memory.remember(`(life/gym) ${gymLog[1].toLowerCase()} session — "${input.trim()}"`)
      const recent = gymCount(ctx, 7)
      return {
        reply: `Logged: ${gymLog[1].toLowerCase()} session. That's ${recent} in the last 7 days.`,
        spoken: `Logged. ${gymLog[1]} session. ${recent} this week.`,
      }
    }

    // diet statements → log
    if (/\b(ate|meal|calories|protein|weighed?)\b/i.test(input) && !input.trim().endsWith('?')) {
      ctx.memory.remember(`(life/diet) ${input.trim()}`)
      return { reply: 'Logged to the diet record.', spoken: 'Logged.' }
    }

    // "remind me to call mum on sunday" → task + memory
    const remind = input.match(/remind me( to)? (.+)/i)
    if (remind) {
      ctx.memory.addTask(remind[2].trim())
      return {
        reply: `On the board: "${remind[2].trim()}". It shows on the dashboard until done.`,
        spoken: `Reminder set.`,
      }
    }

    // questions → memory-aware coaching answer
    const res = await ctx.brain.think(input, {
      system:
        `Life-assistant mode. Faris's gym sessions are logged as "(life/gym)" entries and diet as ` +
        `"(life/diet)" in the recent memory log you have. Answer with the log in mind: real counts, ` +
        `streaks, honest accountability without nagging. Family reminders are never trivial.`,
    })
    return { reply: res.text }
  },
}

function gymCount(ctx, days) {
  const cutoff = Date.now() - days * 86400_000
  return ctx.memory
    .recentLog(400)
    .filter((l) => l.includes('(life/gym)'))
    .filter((l) => {
      const m = l.match(/\[(\d{4}-\d{2}-\d{2})/)
      return m && new Date(m[1]).getTime() >= cutoff
    }).length
}
