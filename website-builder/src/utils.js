import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function loadPrompt(name) {
  return fs.readFileSync(path.join(ROOT, 'prompts', name), 'utf8')
}

// Replace {{variable}} placeholders. Missing variables throw — a prompt run
// with a hole in it produces garbage silently, which is worse than failing.
export function fillTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Prompt variable {{${key}}} not supplied`)
    return vars[key]
  })
}

// Parse Stage 5/6 multi-file output:
//   === FILE: path ===\n...contents...\n=== END FILE ===
export function parseFileBlocks(text) {
  const files = []
  const re = /^=== FILE: (.+?) ===\n([\s\S]*?)\n=== END FILE ===/gm
  let m
  while ((m = re.exec(text))) {
    const rel = m[1].trim()
    if (rel.includes('..') || path.isAbsolute(rel)) {
      throw new Error(`Refusing unsafe file path in model output: ${rel}`)
    }
    files.push({ path: rel, contents: m[2] })
  }
  return files
}

export function writeFileBlocks(files, destDir) {
  for (const f of files) {
    const dest = path.join(destDir, f.path)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, f.contents)
  }
}

// Concatenate the reference library (truncated per-file) for {{reference_library}}.
export function gatherReferences(maxCharsPerFile = 6000) {
  const refDir = path.join(ROOT, 'references')
  const chunks = []
  for (const category of ['3d-components', 'scroll-animations', 'layout-patterns']) {
    const dir = path.join(refDir, category)
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, file)
      if (!fs.statSync(full).isFile()) continue
      const body = fs.readFileSync(full, 'utf8').slice(0, maxCharsPerFile)
      chunks.push(`--- reference: ${category}/${file} ---\n${body}`)
    }
  }
  return chunks.join('\n\n')
}

export function readIntake(clientDir) {
  const parts = []
  for (const f of ['form.md', 'supplementary.md']) {
    const p = path.join(clientDir, f)
    if (fs.existsSync(p)) parts.push(`--- ${f} ---\n${fs.readFileSync(p, 'utf8')}`)
  }
  if (parts.length === 0) {
    throw new Error(`No intake found in ${clientDir} — expected form.md and supplementary.md`)
  }
  const assetsDir = path.join(clientDir, 'assets')
  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir)
    if (assets.length) parts.push(`--- assets supplied (filenames) ---\n${assets.join('\n')}`)
  }
  return parts.join('\n\n')
}

export async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(question)
  rl.close()
  return answer.trim()
}

export function loadJobState(jobDir) {
  const p = path.join(jobDir, 'job.json')
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : { completed: [] }
}

export function saveJobState(jobDir, state) {
  fs.mkdirSync(jobDir, { recursive: true })
  fs.writeFileSync(path.join(jobDir, 'job.json'), JSON.stringify(state, null, 2))
}

// Load .env (no dependency on dotenv)
export function loadEnv() {
  const p = path.join(ROOT, '.env')
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && m[2] !== '' && !(m[1] in process.env)) process.env[m[1]] = m[2]
  }
}
