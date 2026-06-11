#!/usr/bin/env node
// Website Builder Machine — standalone CLI. No Jarvis required.
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, loadEnv, loadJobState } from './src/utils.js'
import { runPipeline } from './src/pipeline.js'

loadEnv()

const HELP = `
Website Builder Machine — client intake → deployable site

Usage:
  node cli.js new <client-slug>                       Scaffold a new client intake
  node cli.js run <client-slug> [options]             Run the pipeline (resumes where it left off)
  node cli.js status <client-slug>                    Show job progress
  node cli.js redo <client-slug> <stage>              Clear a stage (and later ones) to re-run it

Options for run:
  --direction <1|2|3>    Approve a design direction (required to pass the Stage 3 gate non-interactively)
  --notes "<text>"       Creative notes carried into copy and build
  --provider <name>      Force claude | openai | ollama (default: auto-detect)
  --force                Re-run stages even if marked complete

The pipeline ALWAYS stops after Stage 3 until a direction is approved.
`

const [, , cmd, slug, ...rest] = process.argv

function flag(name) {
  const i = rest.indexOf(`--${name}`)
  if (i === -1) return undefined
  return rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true
}

try {
  switch (cmd) {
    case 'new': {
      requireSlug()
      const dir = path.join(ROOT, 'intake', 'clients', slug)
      if (fs.existsSync(dir)) throw new Error(`${dir} already exists`)
      fs.mkdirSync(path.join(dir, 'assets'), { recursive: true })
      fs.copyFileSync(path.join(ROOT, 'intake', 'client-form-template.md'), path.join(dir, 'form.md'))
      fs.copyFileSync(path.join(ROOT, 'intake', 'supplementary-template.md'), path.join(dir, 'supplementary.md'))
      console.log(`Created ${dir}`)
      console.log('Fill in form.md and supplementary.md, drop brand files in assets/, then:')
      console.log(`  node cli.js run ${slug}`)
      break
    }

    case 'run': {
      requireSlug()
      const result = await runPipeline(slug, {
        direction: flag('direction'),
        notes: typeof flag('notes') === 'string' ? flag('notes') : '',
        provider: typeof flag('provider') === 'string' ? flag('provider') : undefined,
        force: Boolean(flag('force')),
      })
      if (result.done) console.log(`\nDone. Review at: ${result.jobDir}/REVIEW.md`)
      break
    }

    case 'status': {
      requireSlug()
      const state = loadJobState(path.join(ROOT, 'output', slug))
      const stages = ['', '', 'Brand brief', 'Design directions', 'Copywriting', 'Code generation', 'Quality control', 'Output']
      for (let s = 2; s <= 7; s++) {
        const mark = state.completed?.includes(s) ? '✔' : ' '
        console.log(` [${mark}] Stage ${s} — ${stages[s]}`)
      }
      console.log(state.direction ? ` Direction approved: ${state.direction}` : ' Awaiting direction approval (Stage 3 gate)')
      break
    }

    case 'redo': {
      requireSlug()
      const stage = Number(rest[0])
      if (!(stage >= 2 && stage <= 7)) throw new Error('redo needs a stage number 2–7')
      const jobDir = path.join(ROOT, 'output', slug)
      const state = loadJobState(jobDir)
      state.completed = (state.completed || []).filter((s) => s < stage)
      if (stage <= 3) { delete state.direction; delete state.directionNotes }
      fs.writeFileSync(path.join(jobDir, 'job.json'), JSON.stringify(state, null, 2))
      console.log(`Stages ${stage}–7 cleared. Run: node cli.js run ${slug}`)
      break
    }

    default:
      console.log(HELP)
  }
} catch (err) {
  console.error(`\nError: ${err.message}`)
  process.exit(1)
}

function requireSlug() {
  if (!slug) {
    console.log(HELP)
    process.exit(1)
  }
}
