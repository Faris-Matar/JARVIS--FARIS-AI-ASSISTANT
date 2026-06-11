// The stage runner. Stages 2→7 with a hard human-approval gate after Stage 3:
// Faris picks the design direction; nothing proceeds without it.
import fs from 'node:fs'
import path from 'node:path'
import { getProvider } from './providers/index.js'
import {
  ROOT, loadPrompt, fillTemplate, parseFileBlocks, writeFileBlocks,
  gatherReferences, readIntake, ask, loadJobState, saveJobState,
} from './utils.js'

const SYSTEM = 'You are one stage of a production website pipeline. Follow your stage prompt exactly, including its Output Format. Output only the deliverable — no preamble, no commentary.'

const art = (jobDir, name) => path.join(jobDir, name)
const read = (p) => fs.readFileSync(p, 'utf8')
const write = (p, body) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, body) }

export async function runPipeline(clientSlug, opts = {}) {
  const clientDir = path.join(ROOT, 'intake', 'clients', clientSlug)
  const jobDir = path.join(ROOT, 'output', clientSlug)
  const provider = await getProvider(opts.provider)
  const state = loadJobState(jobDir)
  const log = (msg) => console.log(`[${clientSlug}] ${msg}`)

  log(`provider: ${provider.name}`)
  const intake = readIntake(clientDir)
  const done = (stage) => state.completed.includes(stage) && !opts.force

  // ── Stage 2: Brand Intelligence Brief ────────────────────────────────
  if (!done(2)) {
    log('Stage 2 — Brand Intelligence Brief…')
    const out = await provider.complete({
      system: SYSTEM,
      prompt: fillTemplate(loadPrompt('stage-2-brand-brief.md'), { intake_package: intake }),
      temperature: 0.5,
    })
    write(art(jobDir, '01-brand-brief.md'), out)
    state.completed.push(2)
    saveJobState(jobDir, state)
    log('  → 01-brand-brief.md')
  }
  const brief = read(art(jobDir, '01-brand-brief.md'))

  // ── Stage 3: Design Directions (then STOP for Faris) ─────────────────
  if (!done(3)) {
    log('Stage 3 — Design Directions…')
    const out = await provider.complete({
      system: SYSTEM,
      prompt: fillTemplate(loadPrompt('stage-3-design-directions.md'), {
        brand_brief: brief,
        intake_package: intake,
      }),
      temperature: 0.9,
    })
    write(art(jobDir, '02-design-directions.md'), out)
    state.completed.push(3)
    saveJobState(jobDir, state)
    log('  → 02-design-directions.md')
  }

  // ── Human gate: Faris chooses the direction ───────────────────────────
  if (!state.direction) {
    let choice = opts.direction
    let notes = opts.notes || ''
    if (!choice) {
      if (!process.stdin.isTTY) {
        log('Design directions ready: output/' + clientSlug + '/02-design-directions.md')
        log('Review them, then resume with: node cli.js run ' + clientSlug + ' --direction <1|2|3> [--notes "..."]')
        return { paused: 'awaiting-direction', jobDir }
      }
      console.log('\n──────────────────────────────────────────────')
      console.log(read(art(jobDir, '02-design-directions.md')))
      console.log('──────────────────────────────────────────────\n')
      choice = await ask('Faris — which direction? (1/2/3): ')
      notes = await ask('Any notes to carry into copy & build (enter for none): ')
    }
    if (!['1', '2', '3'].includes(String(choice))) throw new Error(`Direction must be 1, 2 or 3 (got "${choice}")`)
    state.direction = Number(choice)
    state.directionNotes = notes
    saveJobState(jobDir, state)
    log(`direction ${choice} approved${notes ? ' (with notes)' : ''}`)
  }

  const directionsDoc = read(art(jobDir, '02-design-directions.md'))
  const chosenDirection =
    extractDirection(directionsDoc, state.direction) +
    (state.directionNotes ? `\n\n## Notes from Faris (binding)\n${state.directionNotes}` : '')

  // ── Stage 4: Copywriting ──────────────────────────────────────────────
  if (!done(4)) {
    log('Stage 4 — Copywriting…')
    const out = await provider.complete({
      system: SYSTEM,
      prompt: fillTemplate(loadPrompt('stage-4-copywriting.md'), {
        brand_brief: brief,
        chosen_direction: chosenDirection,
      }),
      temperature: 0.8,
    })
    write(art(jobDir, '03-copy.md'), out)
    state.completed.push(4)
    saveJobState(jobDir, state)
    log('  → 03-copy.md')
  }
  const copy = read(art(jobDir, '03-copy.md'))

  // ── Stage 5: Code Generation ──────────────────────────────────────────
  const siteDir = path.join(jobDir, 'site')
  if (!done(5)) {
    log('Stage 5 — Code Generation… (this is the long one)')
    const out = await provider.complete({
      system: SYSTEM,
      prompt: fillTemplate(loadPrompt('stage-5-code-generation.md'), {
        brand_brief: brief,
        chosen_direction: chosenDirection,
        copy,
        reference_library: gatherReferences(),
      }),
      maxTokens: 16384,
      temperature: 0.6,
    })
    write(art(jobDir, 'raw-stage-5-output.txt'), out)
    const files = parseFileBlocks(out)
    if (files.length === 0) throw new Error('Stage 5 produced no parseable === FILE === blocks — see raw-stage-5-output.txt')
    writeFileBlocks(files, siteDir)
    state.completed.push(5)
    saveJobState(jobDir, state)
    log(`  → site/ (${files.length} files)`)
  }

  // ── Stage 6: Quality Control ──────────────────────────────────────────
  if (!done(6)) {
    log('Stage 6 — Quality Control…')
    const out = await provider.complete({
      system: SYSTEM,
      prompt: fillTemplate(loadPrompt('stage-6-quality-control.md'), {
        brand_brief: brief,
        chosen_direction: chosenDirection,
        copy,
        site_files: dumpSite(siteDir),
      }),
      maxTokens: 16384,
      temperature: 0.3,
    })
    write(art(jobDir, '04-qc-report.md'), out)
    const fixes = parseFileBlocks(out)
    if (fixes.length) {
      writeFileBlocks(fixes, siteDir)
      log(`  → applied ${fixes.length} QC fixes`)
    }
    state.completed.push(6)
    saveJobState(jobDir, state)
    log('  → 04-qc-report.md')
  }

  // ── Stage 7: Output assembly ──────────────────────────────────────────
  if (!done(7)) {
    log('Stage 7 — Output…')
    const qc = read(art(jobDir, '04-qc-report.md'))
    const verdict = (qc.match(/Verdict:\s*(.+)/) || [])[1]?.trim() || 'see QC report'
    write(art(jobDir, 'REVIEW.md'), reviewDoc(clientSlug, state, verdict))
    state.completed.push(7)
    saveJobState(jobDir, state)
    log('  → REVIEW.md — ready for your high-level review')
  }

  return { done: true, jobDir }
}

// Pull one "## Direction N: …" block out of the Stage 3 document.
function extractDirection(doc, n) {
  const re = new RegExp(`## Direction ${n}[\\s\\S]*?(?=\\n## Direction |\\n## How to Choose|$)`)
  const m = doc.match(re)
  if (!m) throw new Error(`Could not find "## Direction ${n}" in 02-design-directions.md`)
  return m[0].trim()
}

function dumpSite(siteDir) {
  const out = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') walk(full)
      } else {
        out.push(`=== FILE: ${path.relative(siteDir, full)} ===\n${fs.readFileSync(full, 'utf8')}\n=== END FILE ===`)
      }
    }
  }
  walk(siteDir)
  return out.join('\n\n')
}

function reviewDoc(clientSlug, state, verdict) {
  return `# Review — ${clientSlug}

QC verdict: **${verdict}**

The detail work is done. This is your high-level pass:

- [ ] Read \`04-qc-report.md\` — anything under "Outstanding for Faris"?
- [ ] \`cd site && npm install && npm run dev\` — feel the scroll story
- [ ] Does it match Direction ${state.direction}${state.directionNotes ? ' and your notes' : ''}?
- [ ] Spot-check copy against \`01-brand-brief.md\` proof inventory
- [ ] Resolve any [NEEDS-CLIENT-CONFIRMATION] flags with the client

Ship: push \`site/\` to its own repo and deploy (Vercel/Netlify — see site/README.md).
`
}
