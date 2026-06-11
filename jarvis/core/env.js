// Minimal .env loader — no dotenv dependency.
const fs = require('node:fs')
const path = require('node:path')

function loadEnv() {
  const p = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && m[2] !== '' && !(m[1] in process.env)) process.env[m[1]] = m[2]
  }
}

module.exports = { loadEnv }
