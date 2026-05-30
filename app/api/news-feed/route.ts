import { NextResponse } from 'next/server'

// ── Live Zambian News Feed Aggregator ──────────────────────────────
// Pulls REAL articles from public Zambian news RSS feeds (no API key
// required). Each feed is fetched in parallel with a hard timeout; any
// feed that fails (block, timeout, downtime) is skipped gracefully and
// reported in `sources` so the dashboard can show what's live.
//
// Headlines are scored with a compact Zambia-aware political sentiment
// lexicon (same approach as /api/nlp-sentiment), so the news panel
// doubles as a real-data sentiment signal.

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Feed = { name: string; url: string; slug: string }

// Confirmed-working, key-free feeds (probed: HTTP 200 + valid RSS items).
const FEEDS: Feed[] = [
  { name: 'Lusaka Times',          url: 'https://www.lusakatimes.com/feed/',          slug: 'lusakatimes' },
  { name: 'News Diggers',          url: 'https://diggers.news/feed/',                 slug: 'diggers' },
  { name: 'Mwebantu',              url: 'https://www.mwebantu.com/feed/',             slug: 'mwebantu' },
  { name: 'Zambian Eye',           url: 'https://zambianeye.com/feed/',               slug: 'zambianeye' },
  { name: 'Kalemba',               url: 'https://kalemba.news/feed/',                 slug: 'kalemba' },
  { name: 'Makanday',              url: 'https://makanday.org/feed/',                 slug: 'makanday' },
  { name: 'Zambian Business Times', url: 'https://www.zambianbusinesstimes.com/feed/', slug: 'zbt' },
  { name: 'Times of Zambia',       url: 'https://www.times.co.zm/feed/',              slug: 'timesofzambia' },
  // Probed but excluded (empty/blocked/down at build time, kept for transparency):
  // Zambia Watchdog (RSS returns 0 items), Zambian Observer (unreachable),
  // ZNBC + Daily Mail (DNS/cert errors from serverless).
]

// ── Compact Zambia political sentiment lexicon ──────────────────────
const LEX: Record<string, number> = {
  stable: 1.8, stability: 2, dialogue: 1.5, development: 1.5, progress: 1.6,
  growth: 1.4, investment: 1.3, peace: 2, unity: 1.8, victory: 2.2,
  improved: 1.4, successful: 1.8, delivered: 1.5, thriving: 2, hope: 1.5,
  recovery: 1.6, boost: 1.4, secured: 1, approved: 0.8, launched: 0.6,
  restructuring: 1, cdf: 0.8, infrastructure: 0.8, clinic: 0.7, school: 0.8,
  road: 0.6, momentum: 0.6, surge: 0.4, rally: 0.4, win: 1.2, wins: 1.2,
  protest: -1.5, unrest: -2, clash: -2, shortage: -2, inflation: -1,
  unemployment: -1.5, crisis: -2.2, failed: -1.8, corruption: -2.5,
  fraud: -2.8, violence: -2.5, collapse: -2.8, poverty: -1.8, fear: -1.5,
  threat: -1.5, threatens: -1.6, delays: -1, controversy: -1.5, accused: -1.5,
  rejected: -1.2, strike: -1.3, arrested: -1, detained: -1.2, condemned: -1.8,
  loadshedding: -1.8, 'load-shedding': -1.8, blackout: -1.5, rigging: -2.5,
  intimidation: -2, harassment: -2, alarming: -2, deteriorating: -1.8,
  declining: -1.2, mealie: -0.4, dies: -2, killed: -2.4, dead: -2,
}
const NEGATIONS = new Set(['not', 'no', 'never', 'without', 'cannot', "n't", 'neither', 'nor'])
const ALPHA = 15

function compound(text: string): number {
  const tokens = text.toLowerCase().replace(/[^a-z0-9'\- ]/g, ' ').split(/\s+/).filter(Boolean)
  let sum = 0, hits = 0
  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i]
    if (!(w in LEX)) continue
    let s = LEX[w]
    const prev = tokens.slice(Math.max(0, i - 3), i)
    if (prev.some(t => NEGATIONS.has(t))) s *= -0.74
    sum += s; hits++
  }
  if (!hits) return 0
  const c = sum / Math.sqrt(sum * sum + ALPHA)
  return Math.round(Math.max(-1, Math.min(1, c)) * 1000) / 1000
}
function classify(c: number) { return c >= 0.05 ? 'positive' : c <= -0.05 ? 'negative' : 'neutral' }

// Election-relevance tagging (keeps everything, flags on-topic items).
const TOPIC = /\b(electi|ecz|vote|voter|poll|campaign|upnd|pf|hh|hichilema|mundubile|kalaba|membe|lungu|tayali|constituen|ballot|runoff|2026|presiden|parliament|delimitat|patriotic front|socialist party|opposition|ruling party|candidate)\b/i

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&#8217;|&#x2019;/gi, '’').replace(/&#8216;|&#x2018;/gi, '‘')
    .replace(/&#8220;|&#x201c;/gi, '“').replace(/&#8221;|&#x201d;/gi, '”')
    .replace(/&#8211;|&#x2013;/gi, '–').replace(/&#8230;|&#x2026;/gi, '…')
    .replace(/&nbsp;/gi, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ').trim()
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? m[1] : null
}

type Article = {
  title: string; link: string; source: string; sourceSlug: string
  publishedAt: string; snippet: string
  sentiment: number; sentimentClass: string; scoreDisplay: number
  electionRelevant: boolean
}

function parseFeed(xml: string, feed: Feed, limit: number): Article[] {
  const out: Article[] = []
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || []
  for (const block of items.slice(0, limit)) {
    const title = decode(tag(block, 'title') || '')
    if (!title) continue
    let link = decode(tag(block, 'link') || '')
    if (!link) { const a = block.match(/<link[^>]*href="([^"]+)"/i); if (a) link = a[1] }
    const pub = tag(block, 'pubDate') || tag(block, 'dc:date') || tag(block, 'published') || ''
    const desc = decode(tag(block, 'description') || tag(block, 'content:encoded') || '').slice(0, 240)
    const c = compound(title + ' ' + desc)
    let iso = new Date().toISOString()
    if (pub) { const d = new Date(decode(pub)); if (!isNaN(d.getTime())) iso = d.toISOString() }
    out.push({
      title, link, source: feed.name, sourceSlug: feed.slug, publishedAt: iso,
      snippet: desc, sentiment: c, sentimentClass: classify(c),
      scoreDisplay: Math.round((c + 1) * 50), electionRelevant: TOPIC.test(title + ' ' + desc),
    })
  }
  return out
}

async function fetchFeed(feed: Feed, perFeed: number) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 9000)
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal, cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZambiaElectionIntel/1.0; +https://zambia-election-app.vercel.app)', 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
    })
    if (!res.ok) return { feed, status: `http_${res.status}`, articles: [] as Article[] }
    const xml = await res.text()
    const articles = parseFeed(xml, feed, perFeed)
    return { feed, status: articles.length ? 'ok' : 'empty', articles }
  } catch (e) {
    return { feed, status: e instanceof Error && e.name === 'AbortError' ? 'timeout' : 'error', articles: [] as Article[] }
  } finally { clearTimeout(t) }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const perFeed = Math.min(Math.max(parseInt(searchParams.get('perFeed') || '8', 10) || 8, 1), 15)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '40', 10) || 40, 1), 120)
  const onlyElection = searchParams.get('election') === '1'

  const settled = await Promise.allSettled(FEEDS.map(f => fetchFeed(f, perFeed)))
  const results = settled.map((s, i) =>
    s.status === 'fulfilled' ? s.value : { feed: FEEDS[i], status: 'error', articles: [] as Article[] })

  let articles = results.flatMap(r => r.articles)
  if (onlyElection) articles = articles.filter(a => a.electionRelevant)
  articles.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
  articles = articles.slice(0, limit)

  const live = articles.length
  const avg = live ? Math.round((articles.reduce((s, a) => s + a.sentiment, 0) / live) * 1000) / 1000 : 0
  const sources = results.map(r => ({ name: r.feed.name, slug: r.feed.slug, status: r.status, count: r.articles.length }))

  return NextResponse.json({
    articles,
    summary: {
      total: live,
      electionRelevant: articles.filter(a => a.electionRelevant).length,
      positive: articles.filter(a => a.sentimentClass === 'positive').length,
      negative: articles.filter(a => a.sentimentClass === 'negative').length,
      neutral: articles.filter(a => a.sentimentClass === 'neutral').length,
      avgCompound: avg,
      avgDisplayScore: Math.round((avg + 1) * 50),
      overallSentiment: classify(avg),
    },
    sources,
    liveData: live > 0,
    dataSource: live > 0 ? 'live-rss' : 'unavailable',
    feedsLive: sources.filter(s => s.status === 'ok').length,
    feedsTotal: FEEDS.length,
    engine: 'Zambia News Aggregator v1.0 (key-free RSS)',
    fetchedAt: new Date().toISOString(),
  })
}
