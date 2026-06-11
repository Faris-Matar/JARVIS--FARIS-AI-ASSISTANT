// Files skill — full Mac file system operations: create, edit, move, run,
// organise. Direct commands are executed; anything fuzzier is planned with
// the brain first and echoed back before touching anything destructive.
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')

const expand = (p) => path.resolve(p.replace(/^~/, process.env.HOME))

module.exports = {
  name: 'files',
  description: 'File system: create, read, move, organise, open projects, run scripts',
  triggers: [/\b(file|folder|directory|move|rename|open project|list|organise|organize|create a)\b.*\b(file|folder|directory|desktop|downloads|documents|project)\b/i],

  async execute(input, ctx) {
    // list <dir>
    let m = input.match(/list (?:files in |what'?s in )?["']?(~?\/[\w ./-]+|~)["']?/i)
    if (m) {
      const dir = expand(m[1])
      const entries = fs.readdirSync(dir).filter((e) => !e.startsWith('.'))
      return { reply: `**${dir}** (${entries.length} items):\n` + entries.slice(0, 50).map((e) => `- ${e}`).join('\n') }
    }

    // create folder <path>
    m = input.match(/create (?:a )?(?:new )?folder (?:at |called )?["']?(~?\/[\w ./-]+)["']?/i)
    if (m) {
      fs.mkdirSync(expand(m[1]), { recursive: true })
      return { reply: `Created ${expand(m[1])}.` }
    }

    // move <src> to <dest>
    m = input.match(/move ["']?(~?\/[\w ./-]+)["']? to ["']?(~?\/[\w ./-]+)["']?/i)
    if (m) {
      const [src, dest] = [expand(m[1]), expand(m[2])]
      const target = fs.existsSync(dest) && fs.statSync(dest).isDirectory() ? path.join(dest, path.basename(src)) : dest
      fs.renameSync(src, target)
      return { reply: `Moved ${src} → ${target}.` }
    }

    // open project <path> (opens in default editor/Finder)
    m = input.match(/open (?:project )?["']?(~?\/[\w ./-]+)["']?/i)
    if (m && process.platform === 'darwin') {
      spawn('open', [expand(m[1])])
      return { reply: `Opening ${expand(m[1])}.` }
    }

    // read <file>
    m = input.match(/(?:read|show me|cat) ["']?(~?\/[\w ./-]+\.\w+)["']?/i)
    if (m) {
      const p = expand(m[1])
      const body = fs.readFileSync(p, 'utf8').slice(0, 4000)
      return { reply: `**${p}:**\n\`\`\`\n${body}\n\`\`\`` }
    }

    // Fuzzy request → plan with the brain, don't act blind.
    const res = await ctx.brain.think(
      `Faris asked: "${input}". Propose the exact file operations (as a short numbered plan ` +
        `with concrete paths) you would run. Do not pretend you've done them.`,
      { system: ctx.memory.contextBlock() }
    )
    return { reply: `${res.text}\n\nSay the word and I'll run it — or give me exact paths and I'll do it directly.` }
  },
}
