// Business skill — InteliSite status, active client pipeline, website-builder
// job status, tracked metrics. Job status is read live from the
// website-builder's output directory; the rest lives in memory/projects.md.
const fs = require('node:fs')
const path = require('node:path')

module.exports = {
  name: 'business',
  description: 'InteliSite status, client pipeline, website builder jobs, metrics',
  triggers: [/\b(business|intelisite|client pipeline|pipeline status|jobs? status|metrics)\b/i],

  async execute(input, ctx) {
    const jobs = builderJobs(ctx.config)
    const jobLines = jobs.length
      ? jobs.map((j) => `- ${j.client}: ${j.summary}`).join('\n')
      : '- no active website builder jobs'

    const res = await ctx.brain.think(
      `Faris asked: "${input}".\n\nLive website-builder jobs:\n${jobLines}\n\n` +
        `Combine with what you know about InteliSite and his current projects (memory below) ` +
        `into a short business status update. Lead with anything that needs his decision.`,
      { system: ctx.memory.contextBlock() }
    )
    return { reply: res.text, data: { jobs } }
  },

  builderJobs,
}

function builderJobs(config) {
  const outDir = path.resolve(__dirname, '..', '..', config.paths.websiteBuilder, 'output')
  if (!fs.existsSync(outDir)) return []
  const jobs = []
  for (const client of fs.readdirSync(outDir)) {
    const jobFile = path.join(outDir, client, 'job.json')
    if (!fs.existsSync(jobFile)) continue
    const state = JSON.parse(fs.readFileSync(jobFile, 'utf8'))
    const last = Math.max(0, ...(state.completed || []))
    const summary =
      last >= 7
        ? 'complete — awaiting your review'
        : state.direction
          ? `building (stage ${last} done, direction ${state.direction} approved)`
          : last >= 3
            ? 'WAITING ON YOU — design direction needed'
            : `in progress (stage ${last} done)`
    jobs.push({ client, stage: last, summary })
  }
  return jobs
}
