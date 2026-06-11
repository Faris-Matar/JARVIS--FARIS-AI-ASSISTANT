// Persistent memory. Everything Jarvis knows about Faris lives in
// jarvis/memory/ as plain Markdown — committed to the repo, so cloning the
// repo on a new Mac brings Jarvis's knowledge with it. Nothing is lost on
// restart or machine change.
//
//   memory/profile.md      who Faris is (long-lived facts)
//   memory/preferences.md  how he works, decides, what he likes
//   memory/projects.md     current projects & goals (updated as they move)
//   memory/tasks.md        live task list the dashboard shows
//   memory/log/YYYY-MM.md  rolling log of learnings + notable interactions
const fs = require('node:fs')
const path = require('node:path')

const MEM_DIR = path.join(__dirname, '..', '..', 'memory')
const LOG_DIR = path.join(MEM_DIR, 'log')

const readIf = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '')
const monthFile = () => path.join(LOG_DIR, `${new Date().toISOString().slice(0, 7)}.md`)

// The context block injected into every brain call: core files + recent log.
function contextBlock() {
  const core = ['profile.md', 'preferences.md', 'projects.md']
    .map((f) => readIf(path.join(MEM_DIR, f)))
    .filter(Boolean)
    .join('\n\n')
  const recent = readIf(monthFile()).split('\n').slice(-60).join('\n')
  return `${core}\n\n## Recent memory log\n${recent}`.trim()
}

// Explicit learning: "Jarvis, remember that …" or a skill noticing something.
function remember(note) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
  fs.appendFileSync(monthFile(), `- [${stamp}] ${note.trim()}\n`)
  return { saved: true }
}

// Lightweight interaction trace — keeps the log useful without storing
// every word of every chat.
function logInteraction(input, reply) {
  if (input.length < 12) return
  fs.mkdirSync(LOG_DIR, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const line = `- [${stamp}] asked: "${input.slice(0, 140)}"\n`
  fs.appendFileSync(monthFile(), line)
}

function currentTasks() {
  const raw = readIf(path.join(MEM_DIR, 'tasks.md'))
  return raw
    .split('\n')
    .filter((l) => l.trim().startsWith('- [ ]'))
    .map((l) => l.replace('- [ ]', '').trim())
}

function addTask(text) {
  fs.appendFileSync(path.join(MEM_DIR, 'tasks.md'), `- [ ] ${text.trim()}\n`)
}

module.exports = { contextBlock, remember, logInteraction, currentTasks, addTask, MEM_DIR }
