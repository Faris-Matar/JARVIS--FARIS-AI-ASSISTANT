// Job hunt skill — structured application tracking (memory/applications.json),
// follow-up reminders, interview stage tracking, cover letters via the
// frontier model when available.
//
//   "applied to Monzo for the grad software role"      → tracked
//   "interview with Monzo on the 24th"                 → stage updated
//   "monzo rejected me" / "got the Monzo offer"        → closed out
//   "what's the state of my applications"              → status board
//   "draft a cover letter for <company> <role>"        → frontier drafting
module.exports = {
  name: 'jobhunt',
  description: 'Grad application tracking, follow-ups, interview stages, cover letters',
  triggers: [/\b(applications?|applied|grad (role|scheme|job)|interview|cover letter|follow[- ]?up|job hunt|offer|rejected)\b/i],

  async execute(input, ctx) {
    const apps = ctx.memory.applications

    // "applied to X (for the Y role)"
    const applied = input.match(/applied (?:to|at|for)\s+([A-Z][\w&. ]+?)(?:\s+for (?:the )?(.+?))?(?:\s+(?:today|yesterday))?\.?$/i)
    if (applied) {
      const company = applied[1].trim()
      const entry = {
        company,
        role: (applied[2] || 'grad role').trim(),
        status: 'applied',
        applied: today(),
        followUp: addDays(10),
        history: [`${today()} applied`],
      }
      apps.append(entry)
      ctx.memory.remember(`(jobhunt) applied: ${company} — ${entry.role}`)
      return {
        reply: `Tracked: ${company}, ${entry.role}. Applied ${entry.applied}. I'll surface a follow-up nudge from ${entry.followUp} if nothing moves.`,
        spoken: `Tracked. ${company}. Follow up in ten days if quiet.`,
        data: { applications: apps.read() },
      }
    }

    // "interview with X on <date>" / stage updates / outcomes
    const update = input.match(/\b(interview|assessment|offer|rejected|final round|phone screen)\b.*?\b(?:with|from|at)?\s*([A-Z][\w&. ]{2,})/i)
    if (update && !/cover letter/i.test(input)) {
      const [, event, companyRaw] = update
      const company = companyRaw.trim().replace(/\s+(on|at|next|this).*$/i, '')
      const all = apps.read()
      const app = all.find((a) => a.company.toLowerCase().includes(company.toLowerCase()))
      if (app) {
        const ev = event.toLowerCase()
        app.status = ev.includes('reject') ? 'closed: rejected' : ev.includes('offer') ? 'OFFER' : `interviewing: ${ev}`
        app.history.push(`${today()} ${input.trim().slice(0, 100)}`)
        app.followUp = ev.includes('reject') ? null : addDays(3)
        apps.write(all)
        ctx.memory.remember(`(jobhunt) ${company}: ${app.status}`)
        return {
          reply: `${company} updated: ${app.status}.` + (app.status === 'OFFER' ? ' Get in, Faris.' : ''),
          spoken: `${company} updated.`,
          data: { applications: all },
        }
      }
      // unknown company → track it fresh
      apps.append({ company, role: 'grad role', status: `interviewing: ${event.toLowerCase()}`, applied: today(), followUp: addDays(3), history: [`${today()} ${input.trim().slice(0, 100)}`] })
      return { reply: `${company} wasn't tracked. It is now, at stage "${event.toLowerCase()}".`, data: { applications: apps.read() } }
    }

    // cover letter drafting → frontier-grade writing
    if (/cover letter|draft.*application/i.test(input)) {
      const res = await ctx.brain.think(
        `${input}\n\nWrite the cover letter draft now. Rules: Faris's real background only, never invent ` +
          `experience. Structure: what the employer needs, proof he delivers it, why this company ` +
          `specifically. Sounds like a sharp human. Banned: "passionate", "fast-paced environment", ` +
          `"I am writing to apply". 250 words max.`,
        { forceFrontier: true, temperature: 0.7 }
      )
      return { reply: res.text, tier: res.tier }
    }

    // default: status board
    const all = apps.read()
    if (!all.length) {
      return { reply: 'No applications tracked yet. Tell me as you apply: "applied to Monzo for the grad software role" and I take it from there.' }
    }
    const due = all.filter((a) => a.followUp && a.followUp <= today() && !a.status.startsWith('closed'))
    const board = all
      .map((a) => `- **${a.company}** · ${a.role} · ${a.status} · applied ${a.applied}${a.followUp && !a.status.startsWith('closed') ? ` · follow up ${a.followUp}` : ''}`)
      .join('\n')
    return {
      reply:
        (due.length ? `**Follow-ups due now:** ${due.map((a) => a.company).join(', ')}\n\n` : '') +
        `${all.length} tracked:\n${board}`,
      spoken: due.length ? `${due.length} follow-up${due.length > 1 ? 's' : ''} due: ${due.map((a) => a.company).join(', ')}.` : `${all.length} applications tracked. Nothing due today.`,
      data: { applications: all, followUpsDue: due },
    }
  },
}

const today = () => new Date().toISOString().slice(0, 10)
const addDays = (n) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10)
