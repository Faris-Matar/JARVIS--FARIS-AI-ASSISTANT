// Web builder skill — THE integration point between Jarvis and the (fully
// standalone) website builder. The flow Faris asked for:
//
//   "check my inbox for a client form submission"
//      → Gmail search with form-specific filters
//      → extract the structured client data from the form email
//      → present it as a proper intake brief for review
//   "create the intake for <slug>"        → writes intake files from the form
//   "start the pipeline for <slug>"       → fires node cli.js run <slug>
//   "approve direction 2 for <slug> ..."  → resumes past the human gate
//
// Dependency flows ONE way: this skill shells out to the builder's CLI.
// The builder never knows Jarvis exists.
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const gmail = require('./gmail')
const { builderJobs } = require('./business')

// The last form Jarvis extracted, held so "create the intake" can use it.
let lastExtraction = null

module.exports = {
  name: 'web-builder',
  description: 'Finds client form submissions, briefs you, runs and monitors the website builder pipeline',
  triggers: [
    /\b(website builder|build (?:their|the|a) website|client form|form submission|new client|start the pipeline|approve direction|create the intake)\b/i,
  ],

  async execute(input, ctx) {
    const builderDir = path.resolve(__dirname, '..', '..', ctx.config.paths.websiteBuilder)

    // 1 ── scan inbox for form submissions and brief Faris
    if (/check|scan|look|find|any (new )?(client|form)/i.test(input) && /inbox|gmail|email|form|submission|client/i.test(input)) {
      return scanForForms(ctx)
    }

    // 2 ── brief on a specific submission
    const briefReq = input.match(/brief me on the client form submission from (.+)/i)
    if (briefReq) return briefOnForm(briefReq[1], ctx)

    // 3 ── create the intake from the last extraction
    const createReq = input.match(/create the intake(?: for ([a-z0-9-]+))?/i)
    if (createReq) return createIntake(createReq[1], builderDir, ctx)

    // 4 ── start the pipeline
    const start = input.match(/(?:start|run|kick off|fire).*?(?:pipeline|builder|build).*?for\s+([a-z0-9-]+)/i)
    if (start) return startPipeline(start[1].toLowerCase(), builderDir)

    // 5 ── approve a direction past the human gate
    const approve = input.match(/approve direction\s*([123])(?:.*?for\s+([a-z0-9-]+))?(?:.*?notes?:?\s*(.+))?$/i)
    if (approve) return approveDirection(approve, builderDir, ctx)

    // fallback: status + what I can do
    const jobs = builderJobs(ctx.config)
    const lines = jobs.length ? jobs.map((j) => `- ${j.client}: ${j.statusLabel}`).join('\n') : 'No active jobs.'
    return {
      reply:
        `${lines}\n\nSay the word:\n` +
        `- "check my inbox for a client form submission"\n` +
        `- "start the pipeline for <client-slug>"\n` +
        `- "approve direction 2 for <client-slug>, notes: warmer palette"\n` +
        `It also runs standalone: cd website-builder && node cli.js --help`,
      data: { builderJobs: jobs },
    }
  },
}

/* ── 1. Inbox scan ─────────────────────────────────────────────────── */

async function scanForForms(ctx) {
  if (!gmail.configured()) {
    return {
      reply:
        'I can run that scan the moment Gmail is connected. Authorise it on the INBOX screen, then ask me again and I\'ll pull any form submissions, extract the client data, and brief you.',
    }
  }
  const candidates = await gmail.searchMessages(
    'newer_than:14d (subject:(website) OR subject:(form) OR subject:(enquiry) OR subject:(submission) OR "new submission")',
    12
  )
  if (candidates.length === 0) {
    return { reply: 'No client form submissions in the last fortnight. Inbox is quiet on that front.', spoken: 'No new client forms, Faris.' }
  }
  // Brief on the most recent automatically.
  return briefOnForm(candidates[0].from, ctx, candidates[0])
}

/* ── 2. Extract + intake brief ─────────────────────────────────────── */

async function briefOnForm(fromDesc, ctx, knownMsg) {
  const msg =
    knownMsg ||
    (await gmail.searchMessages('newer_than:30d', 20)).find((m) =>
      `${m.from} ${m.subject}`.toLowerCase().includes(fromDesc.toLowerCase().slice(0, 24))
    )
  if (!msg) return { reply: `Couldn't find a submission matching "${fromDesc}".` }

  const body = await gmail.fetchMessageBody(msg.id)
  const extracted = await extractFormData(body, msg, ctx)
  lastExtraction = { msg, body, extracted }

  const slug = extracted.suggestedSlug
  return {
    reply:
      `**Client form submission**\n` +
      `From: ${msg.from} (${msg.date})\n\n` +
      formatBrief(extracted) +
      `\n\nNext step when you're happy: "create the intake for ${slug}", then "start the pipeline for ${slug}". ` +
      `You'll get three design directions to choose from before anything gets built.`,
    spoken: `New client form from ${extracted.businessName || 'a prospect'}. Brief is on screen.`,
    data: { formExtraction: extracted },
  }
}

async function extractFormData(body, msg, ctx) {
  const res = await ctx.brain.completeAny({
    prompt:
      `This email is a website client form submission. Extract the structured data as JSON only:\n` +
      `{"businessName":"","contactName":"","email":"","sector":"","services":"","idealCustomer":"",` +
      `"customerPains":"","dreamOutcome":"","primaryAction":"","stylePreferences":"","deadline":"","raw_notes":""}\n` +
      `Use empty strings for anything absent. No commentary.\n\nEMAIL:\n${body.slice(0, 5000)}`,
    maxTokens: 600,
    temperature: 0.2,
    preferLocal: true,
  })

  let data = {}
  if (res) {
    try { data = JSON.parse(res.text.match(/\{[\s\S]*\}/)[0]) } catch { /* fall through to regex */ }
  }
  if (!data.businessName) {
    // Mechanical fallback: label/value pairs common to form notification emails.
    const grab = (re) => (body.match(re) || [])[1]?.trim() || ''
    data = {
      businessName: grab(/(?:business|company)(?: name)?\s*[:\-]\s*(.+)/i),
      contactName: grab(/(?:name|contact)\s*[:\-]\s*(.+)/i),
      email: grab(/[\w.+-]+@[\w-]+\.[\w.]+/) ? (body.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] : '',
      sector: grab(/(?:sector|industry|trade)\s*[:\-]\s*(.+)/i),
      services: grab(/(?:services?|offer)\s*[:\-]\s*(.+)/i),
      idealCustomer: grab(/(?:ideal customer|target)\s*[:\-]\s*(.+)/i),
      customerPains: grab(/(?:struggle|pain|problem)s?\s*[:\-]\s*(.+)/i),
      dreamOutcome: grab(/(?:after|outcome|dream)\s*[:\-]\s*(.+)/i),
      primaryAction: grab(/(?:one thing|action|goal)\s*[:\-]\s*(.+)/i),
      stylePreferences: grab(/(?:style|design|look)\s*[:\-]\s*(.+)/i),
      deadline: grab(/(?:deadline|launch)\s*[:\-]\s*(.+)/i),
      raw_notes: '',
      _mechanical: true,
    }
  }
  data.suggestedSlug = slugify(data.businessName || msg.subject || 'new-client')
  data._sourceSubject = msg.subject
  data._sourceFrom = msg.from
  return data
}

function formatBrief(d) {
  const row = (label, v) => (v ? `- **${label}:** ${v}` : null)
  return [
    row('Business', d.businessName),
    row('Contact', `${d.contactName || '?'} · ${d.email || 'no email found'}`),
    row('Sector', d.sector),
    row('Services', d.services),
    row('Ideal customer', d.idealCustomer),
    row('Their customers struggle with', d.customerPains),
    row('Dream outcome', d.dreamOutcome),
    row('Primary site action', d.primaryAction),
    row('Style preferences', d.stylePreferences),
    row('Deadline', d.deadline),
    d._mechanical ? '- *(extracted mechanically, no model online; double-check the fields)*' : null,
  ].filter(Boolean).join('\n')
}

/* ── 3. Write the intake package ───────────────────────────────────── */

function createIntake(slugArg, builderDir, ctx) {
  if (!lastExtraction) {
    return { reply: 'No form in hand. Run "check my inbox for a client form submission" first, then ask again.' }
  }
  const { msg, body, extracted } = lastExtraction
  const slug = slugArg || extracted.suggestedSlug
  const dir = path.join(builderDir, 'intake', 'clients', slug)
  if (fs.existsSync(dir)) return { reply: `Intake for ${slug} already exists at website-builder/intake/clients/${slug}/.` }

  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'form.md'),
    `# Client Form — ${extracted.businessName || slug}\n\n` +
      `> Auto-extracted by Jarvis from "${msg.subject}" (${msg.from}, ${msg.date}). Verify before running the pipeline.\n\n` +
      formatBrief(extracted).replace(/\*\*/g, '**') +
      `\n\n## Full submission text\n\n${body.slice(0, 8000)}\n`
  )
  const supTemplate = path.join(builderDir, 'intake', 'supplementary-template.md')
  fs.copyFileSync(supTemplate, path.join(dir, 'supplementary.md'))
  ctx.memory.remember(`(business) intake created for ${slug} from ${extracted._sourceFrom}`)

  return {
    reply:
      `Intake created at website-builder/intake/clients/${slug}/.\n` +
      `- form.md is filled from the submission\n` +
      `- supplementary.md needs your part: old site URL, competitors, brand assets, verified facts\n\n` +
      `When that's done: "start the pipeline for ${slug}".`,
    spoken: `Intake ready for ${slug}. Fill in your supplementary notes and we can build.`,
  }
}

/* ── 4 & 5. Pipeline control ───────────────────────────────────────── */

function startPipeline(slug, builderDir) {
  const clientDir = path.join(builderDir, 'intake', 'clients', slug)
  if (!fs.existsSync(clientDir)) {
    return {
      reply: `No intake exists for "${slug}" yet. Either "create the intake for ${slug}" from a form I've extracted, or scaffold it manually: cd website-builder && node cli.js new ${slug}.`,
    }
  }
  runDetached(builderDir, ['run', slug])
  return {
    reply:
      `Pipeline running for **${slug}**. It will produce the brand brief and three design directions, then stop for your call. ` +
      `Watch it on the BUILDER screen; I'll flag it the moment it needs you.`,
    spoken: `Pipeline is away for ${slug}. I'll bring you the design directions shortly.`,
  }
}

function approveDirection(match, builderDir, ctx) {
  const [, dir, slugMaybe, notes] = match
  let slug = slugMaybe?.toLowerCase()
  if (!slug) {
    const waiting = builderJobs(ctx.config).filter((j) => j.waitingOnFaris)
    if (waiting.length === 1) slug = waiting[0].client
    else return { reply: waiting.length ? `Which client? ${waiting.map((j) => j.client).join(', ')} are all waiting.` : 'No build is waiting on a direction call.' }
  }
  const args = ['run', slug, '--direction', dir]
  if (notes) args.push('--notes', notes.trim())
  runDetached(builderDir, args)
  ctx.memory.remember(`(business) approved design direction ${dir} for ${slug}${notes ? ` with notes: ${notes.trim()}` : ''}`)
  return {
    reply:
      `Direction ${dir} locked in for **${slug}**${notes ? ' with your notes' : ''}. ` +
      `Copy, build and QC are running. REVIEW.md lands in output/${slug}/ when it's done.`,
    spoken: `Direction ${dir} locked in. Building now.`,
  }
}

function runDetached(builderDir, args) {
  const logPath = path.join(builderDir, 'output', 'jarvis-run.log')
  fs.mkdirSync(path.dirname(logPath), { recursive: true })
  const log = fs.openSync(logPath, 'a')
  spawn('node', ['cli.js', ...args], { cwd: builderDir, detached: true, stdio: ['ignore', log, log] }).unref()
}

function slugify(s) {
  return s.toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'new-client'
}
