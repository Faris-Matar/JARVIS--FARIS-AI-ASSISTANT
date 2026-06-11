// Skill registry + intent router.
// Every skill exports: { name, description, triggers: [RegExp], execute(input, ctx) }
// ctx = { brain, memory, config }
//
// Routing is multi-skill: "what did I miss in my inbox and is there anything
// from a new client" matches gmail AND web-builder, both run, the answers
// merge into one reply. Anything matching nothing falls through to open
// conversation with full memory context. The scope is everything.
const brain = require('../brain/router')
const memory = require('../memory/memory')
const config = require('../config')

const gmail = require('./gmail')
const news = require('./news')
const business = require('./business')
const coding = require('./coding')
const webBuilder = require('./web-builder')
const life = require('./life')
const jobhunt = require('./jobhunt')
const research = require('./research')
const files = require('./files')
const strategy = require('./strategy')

const SKILLS = [webBuilder, gmail, news, business, jobhunt, life, research, files, coding, strategy]

function detectAll(input) {
  return SKILLS.filter((s) => s.triggers.some((t) => t.test(input)))
}

async function handle(input, opts = {}) {
  const ctx = { brain, memory, config: config.get() }
  brain.recordTurn('user', input)

  let result
  // Explicit memory write beats everything: "remember that I ..."
  const rem = input.match(/^(?:jarvis,?\s*)?remember(?:\s+that)?\s+(.+)/i)
  if (rem) {
    memory.remember(rem[1])
    result = { reply: 'Noted. It\'s in the archive.', skills: ['memory'] }
  } else {
    const matched = detectAll(input).slice(0, 3)
    if (matched.length === 0) {
      const res = await brain.think(input)
      result = { reply: res.text, skills: ['conversation'], tier: res.tier }
    } else if (matched.length === 1) {
      const out = await matched[0].execute(input, ctx)
      result = { skills: [matched[0].name], ...out }
    } else {
      // Run matched skills in parallel, merge into one briefing.
      const outs = await Promise.all(
        matched.map((s) =>
          s.execute(input, ctx).catch((err) => ({ reply: `(${s.name}: ${err.message})` }))
        )
      )
      result = {
        reply: outs
          .map((o, i) => `**${labelFor(matched[i].name)}**\n${o.reply}`)
          .join('\n\n'),
        spoken: outs.find((o) => o.spoken)?.spoken,
        skills: matched.map((s) => s.name),
        tier: outs.some((o) => o.tier === 'frontier') ? 'frontier' : outs[0]?.tier,
        data: Object.assign({}, ...outs.map((o) => o.data || {})),
      }
    }
  }

  brain.recordTurn('jarvis', result.reply)
  memory.logInteraction(input)
  brain.distil() // fire and forget — best-effort fact extraction
  return result
}

function labelFor(name) {
  return {
    gmail: 'Inbox',
    news: 'Intelligence',
    business: 'Business',
    'web-builder': 'Website Builder',
    coding: 'Code',
    life: 'Life',
    jobhunt: 'Job Hunt',
    research: 'Research',
    files: 'Files',
    strategy: 'Strategy',
  }[name] || name
}

async function run(name, input) {
  const skill = SKILLS.find((s) => s.name === name)
  if (!skill) throw new Error(`No skill named "${name}"`)
  const ctx = { brain, memory, config: config.get() }
  return skill.execute(input, ctx)
}

function list() {
  return SKILLS.map(({ name, description }) => ({ name, description }))
}

module.exports = { handle, run, list, detectAll }
