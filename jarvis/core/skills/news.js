// News & intelligence — world news, AI industry, tech. Curated to what Faris
// cares about (memory-aware), delivered as a briefing, not a dump.
// Sources are free RSS feeds; the local model does the curation.
const FEEDS = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
]

module.exports = {
  name: 'news',
  description: 'World, AI and tech news as a curated briefing',
  triggers: [/\b(news|briefing|headlines|what'?s happening|ai industry)\b/i],

  async execute(input, ctx) {
    const headlines = []
    for (const feed of FEEDS) {
      try {
        const xml = await (await fetch(feed.url, { signal: AbortSignal.timeout(8000) })).text()
        for (const item of titles(xml).slice(0, 8)) headlines.push(`[${feed.name}] ${item}`)
      } catch {
        headlines.push(`[${feed.name}] (feed unreachable)`)
      }
    }

    const res = await ctx.brain.think(
      `Today's raw headlines:\n${headlines.join('\n')}\n\nFaris asked: "${input}". ` +
        `Curate a tight briefing for him: 1) anything genuinely important in the world, ` +
        `2) AI industry moves that matter, 3) tech worth knowing. Use what you know about ` +
        `his interests to filter hard — a briefing, not a dump. Skip celebrity/sports filler.`,
      { system: ctx.memory.contextBlock() }
    )
    return { reply: res.text, spoken: firstSentences(res.text, 2) }
  },
}

function titles(xml) {
  return [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)]
    .map((m) => m[1].trim())
    .filter((t) => t && !/rss|feed/i.test(t))
    .slice(1) // first <title> is the channel name
}

function firstSentences(text, n) {
  return text.split(/(?<=[.!?])\s+/).slice(0, n).join(' ')
}
