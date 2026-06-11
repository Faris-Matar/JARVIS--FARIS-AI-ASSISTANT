// Business skill — InteliSite at a glance: live website-builder pipeline
// state (read straight from job.json files), decisions waiting on Faris,
// and a revenue ledger he feeds by telling Jarvis numbers.
const fs = require('node:fs')
const path = require('node:path')

module.exports = {
  name: 'business',
  description: 'InteliSite status, client pipeline, builder jobs, revenue tracking',
  triggers: [
    /\b(business|intelisite|client pipeline|pipeline status|jobs? status|metrics|revenue|how('s| is) the (business|pipeline))\b/i,
    /\blog revenue\b/i,
  ],

  async execute(input, ctx) {
    // "log revenue 1500 deposit from acme"
    const rev = input.match(/log revenue\s+£?(\d[\d,]*(?:\.\d+)?)\s*(.*)/i)
    if (rev) {
      const amount = Number(rev[1].replace(/,/g, ''))
      const label = rev[2].trim() || 'unlabelled'
      ctx.memory.ledger.append({ date: new Date().toISOString().slice(0, 10), amount, label })
      ctx.memory.remember(`(business) revenue logged: £${amount} ${label}`)
      const total = ledgerTotal(ctx)
      return {
        reply: `Logged. £${amount.toLocaleString()} for "${label}". Running total: £${total.toLocaleString()}.`,
        spoken: `Logged. ${amount} pounds. Total ${total}.`,
        data: { business: snapshot(ctx) },
      }
    }

    const snap = snapshot(ctx)
    const jobLines = snap.jobs.length
      ? snap.jobs.map((j) => `- ${j.client}: ${j.statusLabel}`).join('\n')
      : '- pipeline empty'

    const res = await ctx.brain.think(
      `Faris asked: "${input}".\n\nLive InteliSite state:\n` +
        `Builder jobs:\n${jobLines}\n` +
        `Decisions waiting on Faris: ${snap.awaitingFaris}\n` +
        `Revenue logged: £${snap.revenue.total.toLocaleString()} across ${snap.revenue.entries.length} entries\n\n` +
        `Give him the business status. Lead with anything that needs his decision. ` +
        `Current priority per memory: launch cold outreach, land first clients. Short.`,
      { temperature: 0.4 }
    )

    const reply = res.tier === 'offline' ? mechanicalStatus(snap) : res.text
    return {
      reply,
      spoken: snap.awaitingFaris
        ? `${snap.awaitingFaris} ${snap.awaitingFaris === 1 ? 'build needs' : 'builds need'} your design call.`
        : 'Pipeline is steady. Nothing waiting on you.',
      data: { business: snap },
    }
  },

  snapshot,
  builderJobs,
}

function snapshot(ctx) {
  const jobs = builderJobs(ctx.config)
  const entries = ctx.memory.ledger.read()
  return {
    jobs,
    activeJobs: jobs.filter((j) => !j.complete).length,
    awaitingFaris: jobs.filter((j) => j.waitingOnFaris).length,
    revenue: { total: entries.reduce((s, e) => s + (e.amount || 0), 0), entries },
    summary: jobs.length
      ? jobs.map((j) => `${j.client}: ${j.statusLabel}`).join('\n')
      : 'No active builds. Outreach phase: land the first client.',
  }
}

function mechanicalStatus(snap) {
  return [
    snap.awaitingFaris
      ? `${snap.awaitingFaris} build${snap.awaitingFaris > 1 ? 's' : ''} waiting on your design direction call. That's first.`
      : null,
    snap.jobs.length ? `Pipeline:\n${snap.summary}` : 'Pipeline empty. Current priority is cold outreach and the first client.',
    snap.revenue.entries.length
      ? `Revenue logged: £${snap.revenue.total.toLocaleString()} (${snap.revenue.entries.length} entries).`
      : `No revenue logged yet. Tell me "log revenue <amount> <label>" when money lands.`,
  ].filter(Boolean).join('\n\n')
}

function ledgerTotal(ctx) {
  return ctx.memory.ledger.read().reduce((s, e) => s + (e.amount || 0), 0)
}

function builderJobs(config) {
  const builderRoot = path.resolve(__dirname, '..', '..', config.paths.websiteBuilder)
  const outDir = path.join(builderRoot, 'output')
  if (!fs.existsSync(outDir)) return []
  const jobs = []
  for (const client of fs.readdirSync(outDir)) {
    const jobDir = path.join(outDir, client)
    const jobFile = path.join(jobDir, 'job.json')
    if (!fs.existsSync(jobFile)) continue
    let state
    try { state = JSON.parse(fs.readFileSync(jobFile, 'utf8')) } catch { continue }
    const last = Math.max(0, ...(state.completed || []))
    const waitingOnFaris = last >= 3 && !state.direction
    const complete = last >= 7
    jobs.push({
      client,
      stage: last,
      direction: state.direction || null,
      waitingOnFaris,
      complete,
      statusLabel: complete
        ? 'complete · awaiting your review'
        : waitingOnFaris
          ? 'needs your design call'
          : state.direction
            ? `building · stage ${last} done · direction ${state.direction}`
            : `in progress · stage ${last} done`,
      artifacts: fs.readdirSync(jobDir).filter((f) => f.endsWith('.md')),
    })
  }
  return jobs.sort((a, b) => Number(b.waitingOnFaris) - Number(a.waitingOnFaris))
}
