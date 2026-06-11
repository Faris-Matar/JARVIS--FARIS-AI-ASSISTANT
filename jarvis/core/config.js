const fs = require('node:fs')
const path = require('node:path')

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'jarvis.config.json')
let cached = null

function get() {
  if (!cached) cached = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  return cached
}

function reload() {
  cached = null
  return get()
}

module.exports = { get, reload, CONFIG_PATH }
