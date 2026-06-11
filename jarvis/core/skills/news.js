// News & intelligence skill — world news, AI industry, tech. Real free
// feeds, curated to Faris's interests (memory-aware), delivered as a
// structured briefing: headline + one-line summary, never a dump.
//
// Works fully without any model (structured headline briefing); a model
// adds the curation layer and the Jarvis assessment on top.
const FEEDS = [
  { source: 'BBC World', category: 'world', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { source: 'Reuters via BBC Business', category: 'world', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { source: 'TechCrunch AI', category: 'ai', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { source: 'Ars Technica AI', category: 'ai', url: 'https://arstechnica.com/ai/feed/' },
  { source: 'Hacker News', category: 'tech', url: 'https://hnrss.org/frontpage' },
  { source: 'The Verge', category: 'tech', url: 'https://www.theverge.com/rss/index.xml' },
]

let cache = { at: 0, briefing: null }
const CACHE_MS = 15 * 60_000

module.exports = {
  name: 'news',
  description: 'World, AI and tech intelligence as a curated structured briefing',
  triggers: [/\b(news|briefing|headlines|what'?s happening|ai industry|intel(ligence)? report)\b/i],

  async execute(input, ctx) {
    const briefing = await getBriefing(ctx)
    if (briefing.error) return { reply: briefing.error }

    const top = briefing.items.slice(0, 10)
    const reply = [
      briefing.curatorNote || null,
      ...['world', 'ai', 'tech'].map((cat) => {
        const items = top.filter((i) => i.category === cat)
        if (!items.length) return null
        return `**${{ world: 'World', ai: 'AI Industry', tech: 'Tech' }[cat]}**\n` +
          items.map((i) => `- ${i.headline}${i.summary ? ` · ${i.summary}` : ''} (${i.source})`).join('\n')
      }),
    ].filter(Boolean).join('\n\n')

    return {
      reply,
      spoken: briefing.curatorNote || `Briefing ready. ${top.length} items worth your time.`,
      data: { news: briefing },
    }
  },

  getBriefing,
}

async function getBriefing(ctx, force = false) {
  if (!force && cache.briefing && Date.now() - cache.at < CACHE_MS) return cache.briefing

  const raw = []
  await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          signal: AbortSignal.timeout(9000),
          headers: { 'user-agent': 'Jarvis/1.0 (personal assistant)' },
        })
        const xml = await res.text()
        for (const item of parseFeed(xml).slice(0, 7)) {
          raw.push({ ...item, source: feed.source, category: feed.category })
        }
      } catch { /* one dead feed never kills the briefing */ }
    })
  )

  if (raw.length === 0) return { error: 'All news feeds unreachable. Check the network.', items: [] }

  // Curate: model if available, mechanical selection otherwise.
  let items = mechanicalCurate(raw)
  let curatorNote = null

  const res = await ctx.brain.completeAny({
    system: ctx.brain.PERSONA + '\n' + ctx.memory.contextBlock().slice(0, 3000),
    prompt:
      `Here are raw headlines (id | category | source | title):\n` +
      raw.map((r, i) => `${i} | ${r.category} | ${r.source} | ${r.title}`).join('\n') +
      `\n\nCurate for Faris (filter hard against his interests: AI industry moves, tech that matters, ` +
      `genuinely important world events, UK business climate; skip celebrity, sport, US politics filler). ` +
      `Return JSON only:\n` +
      `{"picks":[{"id":0,"summary":"one tight line on why it matters"}],"note":"2-3 sentence assessment of the day"}` +
      `\nPick 9 to 12 ids across categories.`,
    maxTokens: 700,
    temperature: 0.4,
    preferLocal: true,
  })

  if (res) {
    try {
      const parsed = JSON.parse(res.text.match(/\{[\s\S]*\}/)[0])
      const picked = parsed.picks
        .map((p) => raw[p.id] && { ...raw[p.id], summary: p.summary })
        .filter(Boolean)
      if (picked.length >= 5) {
        items = picked
        curatorNote = parsed.note
      }
    } catch { /* model returned junk JSON: keep mechanical curation */ }
  }

  const briefing = {
    generatedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    curatorNote,
    items: items.map((i) => ({
      headline: i.title,
      summary: i.summary || null,
      category: i.category,
      source: i.source,
      link: i.link,
    })),
  }
  cache = { at: Date.now(), briefing }
  return briefing
}

// No model: balanced selection across categories, newest first.
function mechanicalCurate(raw) {
  const byCat = { world: [], ai: [], tech: [] }
  for (const r of raw) byCat[r.category]?.push(r)
  const out = []
  for (let i = 0; i < 4; i++) {
    for (const cat of ['ai', 'tech', 'world']) {
      if (byCat[cat][i]) out.push(byCat[cat][i])
    }
  }
  return out.slice(0, 12)
}

// Tolerant RSS/Atom title+link extraction, no XML dependency.
function parseFeed(xml) {
  const items = []
  const chunks = xml.split(/<(?:item|entry)[\s>]/).slice(1)
  for (const chunk of chunks) {
    const title = pick(chunk, 'title')
    if (!title) continue
    let link = pick(chunk, 'link')
    if (!link) {
      const href = chunk.match(/<link[^>]*href="([^"]+)"/)
      link = href ? href[1] : null
    }
    items.push({ title: decodeEntities(title), link })
  }
  return items
}

function pick(chunk, tag) {
  const m = chunk.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))
  return m ? m[1].trim() : null
}

const decodeEntities = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'")
