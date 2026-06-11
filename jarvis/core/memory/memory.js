// Persistent memory. Everything Jarvis knows about Faris lives in
// jarvis/memory/ as plain Markdown + JSON — committed to the repo, so a
// fresh clone on any machine restores it all. Nothing is lost on restart
// or machine change.
//
//   memory/profile.md          who Faris is (long-lived facts)
//   memory/preferences.md      how he works, decides, what he likes
//   memory/projects.md         current projects & goals
//   memory/tasks.md            live task list the dashboard shows
//   memory/ledger.json         revenue entries (business skill)
//   memory/applications.json   job applications (jobhunt skill)
//   memory/log/YYYY-MM.md      rolling log: learnings + notable interactions
const fs = require('node:fs')
const path = require('node:path')

const MEM_DIR = path.join(__dirname, '..', '..', 'memory')
const LOG_DIR = path.join(MEM_DIR, 'log')

const readIf = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '')
const monthFile = () => path.join(LOG_DIR, `${new Date().toISOString().slice(0, 7)}.md`)
const stamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

// ── Context block: what gets injected into every brain call ───────────
function contextBlock() {
  const core = ['profile.md', 'preferences.md', 'projects.md']
    .map((f) => readIf(path.join(MEM_DIR, f)))
    .filter(Boolean)
    .join('\n\n')
  const recent = readIf(monthFile()).split('\n').filter(Boolean).slice(-50).join('\n')
  return `${core}\n\n## Recent memory log\n${recent || '(empty)'}`.trim()
}

// ── Log writes ────────────────────────────────────────────────────────
function remember(note) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
  fs.appendFileSync(monthFile(), `- [${stamp()}] ${String(note).trim()}\n`)
  return { saved: true }
}

// Lightweight interaction trace; full distillation happens in the brain.
function logInteraction(input) {
  if (!input || input.length < 12) return
  fs.mkdirSync(LOG_DIR, { recursive: true })
  fs.appendFileSync(monthFile(), `- [${stamp()}] asked: "${input.slice(0, 140)}"\n`)
}

function recentLog(lines = 80) {
  return readIf(monthFile()).split('\n').filter(Boolean).slice(-lines)
}

// ── Tasks ─────────────────────────────────────────────────────────────
function currentTasks() {
  return readIf(path.join(MEM_DIR, 'tasks.md'))
    .split('\n')
    .filter((l) => l.trim().startsWith('- [ ]'))
    .map((l) => l.replace('- [ ]', '').trim())
}

function addTask(text) {
  fs.appendFileSync(path.join(MEM_DIR, 'tasks.md'), `- [ ] ${String(text).trim()}\n`)
  remember(`(task) added: ${text}`)
}

function completeTask(match) {
  const p = path.join(MEM_DIR, 'tasks.md')
  const lines = readIf(p).split('\n')
  const idx = lines.findIndex((l) => l.includes('- [ ]') && l.toLowerCase().includes(match.toLowerCase()))
  if (idx === -1) return false
  lines[idx] = lines[idx].replace('- [ ]', '- [x]')
  fs.writeFileSync(p, lines.join('\n'))
  return true
}

// ── Structured stores (JSON next to the markdown) ─────────────────────
function store(name) {
  const p = path.join(MEM_DIR, `${name}.json`)
  return {
    read() {
      try { return JSON.parse(readIf(p) || '[]') } catch { return [] }
    },
    write(data) {
      fs.writeFileSync(p, JSON.stringify(data, null, 2))
    },
    append(entry) {
      const data = this.read()
      data.push(entry)
      this.write(data)
      return entry
    },
  }
}

const ledger = store('ledger') // { date, amount, label }
const applications = store('applications') // { company, role, status, applied, followUp, notes, history[] }

// ── Files the memory screen browses ───────────────────────────────────
function snapshot() {
  return {
    profile: readIf(path.join(MEM_DIR, 'profile.md')),
    preferences: readIf(path.join(MEM_DIR, 'preferences.md')),
    projects: readIf(path.join(MEM_DIR, 'projects.md')),
    tasks: currentTasks(),
    log: recentLog(120),
  }
}

function stats() {
  const files = fs.existsSync(MEM_DIR)
    ? fs.readdirSync(MEM_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.json')).length
    : 0
  return { files, logEntries: recentLog(10000).length }
}

module.exports = {
  contextBlock, remember, logInteraction, recentLog,
  currentTasks, addTask, completeTask,
  ledger, applications,
  snapshot, stats, MEM_DIR,
}
