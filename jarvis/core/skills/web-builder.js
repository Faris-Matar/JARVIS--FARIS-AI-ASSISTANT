// Web builder skill — THE integration point between Jarvis and the (fully
// standalone) website builder. Jarvis can:
//   1. check Gmail for a new client form submission and brief Faris on it
//   2. discuss design direction with him
//   3. trigger the pipeline once he gives the go-ahead
//   4. report job status (see business skill for the live read)
//
// The dependency flows ONE way: this skill shells out to the builder's CLI.
// The builder never knows Jarvis exists.
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const gmail = require('./gmail')
const { builderJobs } = require('./business')

module.exports = {
  name: 'web-builder',
  description: 'Briefs you on client form submissions and runs the website builder pipeline',
  triggers: [/\b(website builder|build (?:their|the|a) website|client form|new client submission|start the pipeline|approve direction)\b/i],

  async execute(input, ctx) {
    const builderDir = path.resolve(__dirname, '..', '..', ctx.config.paths.websiteBuilder)

    // "check if there's a new client form submission and brief me"
    if (/check|submission|form/i.test(input) && gmail.configured()) {
      const candidates = await gmail.fetchUnread(15, 'is:unread (subject:(website) OR subject:(form) OR subject:(preferences))')
      if (candidates.length === 0) {
        return { reply: 'No new client form submissions in the inbox, Faris.' }
      }
      const listing = candidates.map((m) => `From: ${m.from}\nSubject: ${m.subject}\n${m.snippet}`).join('\n---\n')
      const res = await ctx.brain.think(
        `These unread emails look like client website form submissions:\n${listing}\n\n` +
          `Brief Faris: who the client is, what they do, what they asked for, anything notable. ` +
          `Then suggest a client slug (kebab-case) and remind him the next step is ` +
          `"start the pipeline for <slug>" — after which he'll review 3 design directions.`,
        { system: ctx.memory.contextBlock() }
      )
      return { reply: res.text }
    }

    // "start the pipeline for acme-renovations"
    const start = input.match(/(?:start|run|kick off).*?(?:pipeline|builder).*?(?:for\s+)([a-z0-9-]+)/i)
    if (start) {
      const slug = start[1].toLowerCase()
      const clientDir = path.join(builderDir, 'intake', 'clients', slug)
      if (!fs.existsSync(clientDir)) {
        await cli(builderDir, ['new', slug])
        return {
          reply:
            `I've scaffolded the intake for **${slug}** at website-builder/intake/clients/${slug}/. ` +
            `Drop the client's form answers into form.md (I can draft it from their email if you ask), ` +
            `fill supplementary.md, then tell me to start the pipeline again.`,
        }
      }
      runDetached(builderDir, ['run', slug])
      return {
        reply:
          `Pipeline running for **${slug}**. It will produce the brand brief and three design directions, ` +
          `then stop for your call — I'll have them ready in output/${slug}/02-design-directions.md. ` +
          `When you've chosen, say "approve direction 2 for ${slug}" (notes welcome).`,
        spoken: `Pipeline is running for ${slug}. I'll bring you the design directions shortly.`,
      }
    }

    // "approve direction 2 for acme-renovations — notes: warmer palette"
    const approve = input.match(/approve direction\s*([123]).*?for\s+([a-z0-9-]+)(?:.*?notes?:\s*(.+))?$/i)
    if (approve) {
      const [, dir, slug, notes] = approve
      const args = ['run', slug, '--direction', dir]
      if (notes) args.push('--notes', notes)
      runDetached(builderDir, args)
      return {
        reply:
          `Direction ${dir} approved for **${slug}**${notes ? ` with your notes` : ''}. ` +
          `The pipeline is writing copy, generating the build, and running QC. ` +
          `I'll surface REVIEW.md in output/${slug}/ when it's done — check "business status" for progress.`,
        spoken: `Direction ${dir} locked in. Building now.`,
      }
    }

    // Fallback: status + guidance
    const jobs = builderJobs(ctx.config)
    const jobLines = jobs.length ? jobs.map((j) => `- ${j.client}: ${j.summary}`).join('\n') : 'No active jobs.'
    return {
      reply:
        `${jobLines}\n\nI can: check the inbox for new client form submissions, ` +
        `start the pipeline for a client slug, or approve a design direction. ` +
        `The builder also runs standalone: \`cd website-builder && node cli.js --help\`.`,
    }
  },
}

function cli(builderDir, args) {
  return new Promise((resolve, reject) => {
    const p = spawn('node', ['cli.js', ...args], { cwd: builderDir })
    let out = ''
    p.stdout.on('data', (d) => (out += d))
    p.stderr.on('data', (d) => (out += d))
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(out))))
  })
}

function runDetached(builderDir, args) {
  const logPath = path.join(builderDir, 'output', 'jarvis-run.log')
  fs.mkdirSync(path.dirname(logPath), { recursive: true })
  const log = fs.openSync(logPath, 'a')
  spawn('node', ['cli.js', ...args], { cwd: builderDir, detached: true, stdio: ['ignore', log, log] }).unref()
}
