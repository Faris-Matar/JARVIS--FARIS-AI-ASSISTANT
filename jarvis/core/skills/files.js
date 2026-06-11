// Files skill — full file system operations: create, read, move, organise,
// open projects, run scripts.
//
// ARCHITECTURE NOTE (browser vs Mac):
// The skill executes inside the core server (Node), which always has fs
// access to the machine it runs on. In the browser phase that's the dev
// machine. On the Mac inside Electron the same server runs locally with
// full access to ~/. Nothing here changes for the Mac transition; the
// `open` and `run` verbs simply start working because the platform is
// darwin. Safety model: explicit paths execute, destructive verbs
// (delete) are intentionally absent, fuzzy requests return a plan first.
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')

const expand = (p) => path.resolve(p.replace(/^~/, process.env.HOME || ''))

module.exports = {
  name: 'files',
  description: 'File system: list, read, create, move, organise, open projects, run scripts',
  triggers: [
    /\b(list|read|show|create|move|rename|open|organise|organize|run)\b.*\b(file|folder|directory|project|script|desktop|downloads|documents)\b/i,
    /\b(list|read|show me|cat|open)\b.*(~?\/[\w./-]+)/i,
  ],

  async execute(input, ctx) {
    try {
      // list <dir>
      let m = input.match(/list (?:files in |what'?s in )?["']?(~?\/[\w ./-]+|~)["']?/i)
      if (m) {
        const dir = expand(m[1])
        const entries = fs.readdirSync(dir, { withFileTypes: true })
          .filter((e) => !e.name.startsWith('.'))
          .map((e) => `${e.isDirectory() ? '▸' : '·'} ${e.name}`)
        return { reply: `**${dir}** (${entries.length} items)\n${entries.slice(0, 60).join('\n')}` }
      }

      // read <file>
      m = input.match(/(?:read|show me|cat) ["']?(~?\/[\w ./-]+\.\w+)["']?/i)
      if (m) {
        const p = expand(m[1])
        const stat = fs.statSync(p)
        if (stat.size > 300_000) return { reply: `${p} is ${(stat.size / 1024).toFixed(0)}KB. Too big to dump; ask me about a specific part.` }
        return { reply: `**${p}**\n\`\`\`\n${fs.readFileSync(p, 'utf8').slice(0, 6000)}\n\`\`\`` }
      }

      // create folder <path>
      m = input.match(/create (?:a )?(?:new )?folder (?:at |called |in )?["']?(~?\/[\w ./-]+)["']?/i)
      if (m) {
        fs.mkdirSync(expand(m[1]), { recursive: true })
        return { reply: `Created ${expand(m[1])}.`, spoken: 'Folder created.' }
      }

      // write/create file with content is deliberately plan-first (see below)

      // move <src> to <dest>
      m = input.match(/move ["']?(~?\/[\w ./-]+)["']? to ["']?(~?\/[\w ./-]+)["']?/i)
      if (m) {
        const [src, dest] = [expand(m[1]), expand(m[2])]
        const target = fs.existsSync(dest) && fs.statSync(dest).isDirectory() ? path.join(dest, path.basename(src)) : dest
        fs.renameSync(src, target)
        ctx.memory.remember(`(files) moved ${src} → ${target}`)
        return { reply: `Moved ${src} → ${target}.`, spoken: 'Moved.' }
      }

      // open <path> — macOS only; on other platforms reports readiness
      m = input.match(/open (?:project |file )?["']?(~?\/[\w ./-]+)["']?/i)
      if (m) {
        const p = expand(m[1])
        if (process.platform === 'darwin') {
          spawn('open', [p], { detached: true }).unref()
          return { reply: `Opening ${p}.`, spoken: 'Opening it now.' }
        }
        return { reply: `"open" maps to the macOS open command. It activates automatically on the Mac; path verified: ${fs.existsSync(p) ? 'exists' : 'NOT FOUND'} (${p}).` }
      }

      // run <script>
      m = input.match(/run ["']?(~?\/[\w ./-]+\.(?:sh|js|py))["']?/i)
      if (m) {
        const p = expand(m[1])
        const runner = p.endsWith('.js') ? 'node' : p.endsWith('.py') ? 'python3' : 'bash'
        return new Promise((resolve) => {
          const proc = spawn(runner, [p], { timeout: 30_000 })
          let out = ''
          proc.stdout.on('data', (d) => (out += d))
          proc.stderr.on('data', (d) => (out += d))
          proc.on('close', (code) =>
            resolve({ reply: `Ran ${p} (exit ${code}):\n\`\`\`\n${out.slice(0, 3000) || '(no output)'}\n\`\`\`` })
          )
        })
      }
    } catch (err) {
      return { reply: `File operation failed: ${err.message}` }
    }

    // Fuzzy request → plan first, never blind execution.
    const res = await ctx.brain.think(
      `Faris asked: "${input}". Propose the exact file operations as a short numbered plan with concrete ` +
        `paths. Do not claim you've done them. End by asking him to confirm or give exact paths.`,
      { temperature: 0.3 }
    )
    return { reply: res.text }
  },
}
