// Skill registry + dispatcher.
// Every skill exports: { name, description, triggers: [RegExp], execute(input, ctx) }
// ctx = { brain, memory, config }
//
// Anything that doesn't match a skill falls through to open conversation with
// the brain — Jarvis figures it out. The scope is everything Faris could need.
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

const SKILLS = [gmail, news, business, webBuilder, coding, life, jobhunt, research, files, strategy]

const PERSONA = `You are JARVIS, Faris's personal AI assistant — calm, sharp,
loyal, lightly witty in the spirit of the original. You know Faris well; his
profile, preferences, projects and recent context follow. Speak naturally and
concisely. Be genuinely useful, never sycophantic. Push back when he's wrong.
Address him as Faris.`

function detect(input) {
  return SKILLS.find((s) => s.triggers.some((t) => t.test(input))) || null
}

async function handle(input, ctx) {
  // Explicit memory write: "remember that I ..."
  const rem = input.match(/^(?:jarvis,?\s*)?remember(?:\s+that)?\s+(.+)/i)
  if (rem) {
    ctx.memory.remember(rem[1])
    return { reply: `Noted. I'll remember that.`, skill: 'memory' }
  }

  const skill = detect(input)
  if (skill) {
    const result = await skill.execute(input, ctx)
    return { skill: skill.name, ...result }
  }

  // Open conversation — local model with full memory context.
  const res = await ctx.brain.think(input, {
    system: `${PERSONA}\n\n# What you know about Faris\n${ctx.memory.contextBlock()}`,
  })
  return { reply: res.text, skill: 'conversation', tier: res.tier }
}

async function run(name, input, ctx) {
  const skill = SKILLS.find((s) => s.name === name)
  if (!skill) throw new Error(`No skill named "${name}"`)
  return skill.execute(input, ctx)
}

function list() {
  return SKILLS.map(({ name, description }) => ({ name, description }))
}

module.exports = { handle, run, list, detect, PERSONA }
