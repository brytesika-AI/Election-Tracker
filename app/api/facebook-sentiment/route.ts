import { NextRequest, NextResponse } from 'next/server'

// ── Credentials ─────────────────────────────────────────────────────────────
const CF_ACCOUNT_ID  = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN   = process.env.CLOUDFLARE_API_TOKEN
const CF_MODEL       = '@cf/meta/llama-3.1-8b-instruct'

// MCP / Scraping layer (priority order):
// 1. Apify MCP — apify/facebook-pages-scraper actor (no FB login needed)
// 2. Bright Data MCP — web unlocker for social pages
// 3. Facebook Graph API — official but requires token + permissions
// 4. Curated samples — always available fallback
const APIFY_TOKEN    = process.env.APIFY_API_TOKEN          // apify.com → Settings → API tokens
const BRIGHTDATA_TOKEN = process.env.BRIGHTDATA_API_TOKEN   // brightdata.com → API credentials
const FB_TOKEN       = process.env.FACEBOOK_ACCESS_TOKEN    // fb app token fallback
const FB_BASE        = 'https://graph.facebook.com/v19.0'

const LEADER_PAGES = [
  { id: 'hh',     name: 'Hakainde Hichilema', fbPage: 'HakaindehichilemaHH',  fbUrl: 'https://www.facebook.com/HakaindehichilemaHH' },
  { id: 'pf_ndc', name: 'PF-NDC Alliance',    fbPage: 'BrianMundubile',        fbUrl: 'https://www.facebook.com/BrianMundubile' },
  { id: 'kalaba', name: 'Harry Kalaba',        fbPage: 'HarryKalaba',           fbUrl: 'https://www.facebook.com/HarryKalaba' },
  { id: 'membe',  name: "Fred M'membe",        fbPage: 'SocialistPartyZambia',  fbUrl: 'https://www.facebook.com/SocialistPartyZambia' },
]

// ── MCP Layer 1: Apify facebook-pages-scraper ───────────────────────────────
// Actor: apify/facebook-pages-scraper
// Docs: https://apify.com/apify/facebook-pages-scraper
// Cost: ~0.25 CU per run (free tier: 5 USD/month)

interface ApifyPost {
  text?: string
  topLevelUrl?: string
  timestamp?: string
  comments?: { text: string }[]
}

async function scrapeWithApify(pageUrl: string, postLimit = 10): Promise<string[]> {
  if (!APIFY_TOKEN) return []

  try {
    // Start actor run
    const runRes = await fetch(
      'https://api.apify.com/v2/acts/apify~facebook-pages-scraper/runs?token=' + APIFY_TOKEN,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: pageUrl }],
          maxPosts: postLimit,
          maxPostComments: 15,
          maxReviews: 0,
          scrapePagesWithLogin: false,
          proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
        }),
      }
    )
    if (!runRes.ok) return []
    const { data: run } = await runRes.json()
    const runId = run?.id
    if (!runId) return []

    // Poll until finished (max 60s)
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 5000))
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
      )
      const { data: status } = await statusRes.json()
      if (status?.status === 'SUCCEEDED') break
      if (status?.status === 'FAILED' || status?.status === 'ABORTED') return []
    }

    // Fetch results from dataset
    const datasetRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&limit=50`
    )
    if (!datasetRes.ok) return []
    const items: ApifyPost[] = await datasetRes.json()

    const texts: string[] = []
    for (const item of items) {
      if (item.text && item.text.length > 20) texts.push(item.text.slice(0, 300))
      for (const c of item.comments ?? []) {
        if (c.text && c.text.length > 10) texts.push(c.text.slice(0, 200))
      }
    }
    return texts
  } catch {
    return []
  }
}

// ── MCP Layer 2: Bright Data web unlocker ───────────────────────────────────
// Bright Data scrapes JS-rendered pages with residential proxies
// Docs: https://brightdata.com/products/web-scraper-api

async function scrapeWithBrightData(pageUrl: string): Promise<string[]> {
  if (!BRIGHTDATA_TOKEN) return []

  try {
    const res = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${BRIGHTDATA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zone: 'mcp_unlocker',
        url: pageUrl,
        format: 'raw',
        render_js: true,
      }),
    })
    if (!res.ok) return []
    const html = await res.text()
    // Extract visible text from FB page HTML — strip tags, get content blocks
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
    // Split into sentences and filter meaningful ones
    const sentences = clean.split(/[.!?]\s+/).filter(s => s.length > 30 && s.length < 400)
    return sentences.slice(0, 30)
  } catch {
    return []
  }
}

// ── Layer 3: Facebook Graph API fallback ────────────────────────────────────

interface FbPost { id: string; message?: string; comments?: { data: { message: string }[] } }

async function scrapeWithFbApi(pageId: string): Promise<string[]> {
  if (!FB_TOKEN) return []
  try {
    const url = `${FB_BASE}/${pageId}/posts?fields=message,comments.limit(8){message}&limit=12&access_token=${FB_TOKEN}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (data.error) return []
    const posts: FbPost[] = data.data ?? []
    const texts: string[] = []
    for (const p of posts) {
      if (p.message) texts.push(p.message.slice(0, 280))
      for (const c of p.comments?.data ?? []) {
        if (c.message) texts.push(c.message.slice(0, 200))
      }
    }
    return texts
  } catch {
    return []
  }
}

// ── Cloudflare AI sentiment analysis ────────────────────────────────────────

async function analyzeWithAI(leaderName: string, texts: string[], dataSource: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  summary: string
  topThemes: string[]
}> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || texts.length === 0) {
    return getDemoAnalysis(leaderName)
  }

  const sample = texts.slice(0, 20).join('\n- ')
  const prompt = `You are a Zambian political sentiment analyst. Analyze this ${dataSource} content about ${leaderName} from public Facebook and respond in JSON only.

Content:
- ${sample}

Respond with exactly this JSON (no markdown):
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": <0-100 where 100 is fully positive>,
  "summary": "<one sentence summary of public mood>",
  "topThemes": ["<theme1>", "<theme2>", "<theme3>", "<theme4>"]
}`

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a political sentiment analyst for Zambia. Respond in JSON only. No markdown.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 350,
          temperature: 0.2,
        }),
      }
    )
    if (!res.ok) return getDemoAnalysis(leaderName)
    const data = await res.json()
    const raw: string = data?.result?.response ?? ''
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)
    const sentimentRaw = (parsed.sentiment ?? '').toLowerCase()
    const sentiment: 'positive' | 'negative' | 'neutral' =
      sentimentRaw.includes('pos') ? 'positive' :
      sentimentRaw.includes('neg') ? 'negative' : 'neutral'
    return {
      sentiment,
      score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
      summary: parsed.summary ?? '',
      topThemes: Array.isArray(parsed.topThemes) ? parsed.topThemes.slice(0, 4) : [],
    }
  } catch {
    return getDemoAnalysis(leaderName)
  }
}

// ── Curated fallback samples ─────────────────────────────────────────────────

const CURATED_SAMPLES: Record<string, string[]> = {
  hh: [
    "Electricity prices are too high Mr President, we voted for change not suffering",
    "HH has done well to stabilize the kwacha, import prices are coming down slowly",
    "Cost of living is killing us, mealie meal is K400 a 25kg bag, what happened to your promises?",
    "The infrastructure is improving in Southern Province, roads are better now",
    "Load shedding must end, businesses are closing in Lusaka, please act fast",
    "Thank you for the CDF empowerment funds, our community has benefited",
    "Dollar rate has improved since UPND took over, economy is recovering",
    "We need hospitals and drugs, Levy Mwanawasa Memorial Hospital is not enough",
    "Our president is working hard, the opposition just wants to destabilise",
    "Too many foreigners getting contracts, what about Zambian companies?",
    "UPND delivered free education, my children are in school now, thank you",
    "The anti-corruption drive must continue, many thieves still walking free",
    "Fertiliser subsidy is not reaching farmers in Northern Province, please investigate",
    "Great speech at SADC summit, Zambia is respected again internationally",
    "Mining royalties should benefit local communities, we see nothing here in Copperbelt",
    "HH please fix load shedding before 2026, that is the number one issue",
    "Infrastructure progress is real but cost of living makes it hard to feel it",
    "Thank you Mr President for the debt restructuring deal, future looks brighter",
    "UPND must address mealie meal prices or lose Northern and Copperbelt",
    "HH is the right person for Zambia but he needs to listen to ordinary people more",
  ],
  pf_ndc: [
    "PF and NDC together — this is the alliance Zambia has been waiting for! 2026 is ours!",
    "Mundubile for president 2026, PF must come back and save Zambia",
    "Brian is the only one speaking for poor Zambians in rural areas",
    "We support you Mundubile, Northern Province will vote massively for the alliance",
    "Why is the government harassing PF members? This is political persecution",
    "UPND has failed, time for change in 2026, PF-NDC has our vote",
    "Engineer Mundubile understands development, he built roads in Mporokoso",
    "Northern and Luapula provinces are solidly behind PF still",
    "The PF-NDC alliance is recovering after difficult times, we are united now",
    "2026 is our year, Zambians are tired of UPND failures on economy",
    "Makebi Zulu brings the youth vote, Mundubile brings Northern base — this combination is powerful",
    "NDC joining PF is good, now we have a real alternative that can win",
    "Young people need change, NDC and PF together give us that option in 2026",
    "PF built good infrastructure when in power, UPND is destroying that legacy",
    "The PF-NDC combined polling of 20% is a real threat to UPND now, watch this space",
    "Mundubile speaks our language, he is from us, Northern Province is ready",
    "NDC manifesto on agriculture is good, farmers will benefit from this alliance",
    "We need Lungu to campaign for Mundubile even though he cannot stand himself",
    "PF-NDC is the real change option, not SP or DP who have no ground presence",
    "If the alliance holds to August 2026 they could force a second round, historic",
  ],
  kalaba: [
    "Kalaba is honest and principled, Zambia needs leaders like him",
    "Harry Kalaba left PF because of corruption, that takes real courage, respect",
    "DP is too small to win alone but Kalaba would make an excellent cabinet minister",
    "Kalaba please form coalition with PF-NDC to beat UPND, your votes matter",
    "Principled politicians are very rare in Zambia, Kalaba is one of the few",
    "We in Luapula support Kalaba even though he left PF, he is still our son",
    "DP policies are good but need more funding and visibility to reach rural areas",
    "Kalaba should be finance minister in a coalition government with his background",
    "Please do not give up Harry, Zambia needs your voice in the political arena",
    "Kalaba plus Mundubile coalition would be very strong in Northern and Luapula",
    "I respect Kalaba because he speaks truth even when it is unpopular to do so",
    "DP manifesto is well-written but who knows about it outside Lusaka? More outreach needed",
    "Harry Kalaba represents integrity that Zambia desperately needs right now",
    "Kalaba 2026 — small party but big ideas, hope he gets more attention",
    "Coalition talks with PF-NDC make strategic sense, Kalaba should consider seriously",
  ],
  membe: [
    "Fred M'membe speaks truth about capitalism destroying Zambia's resources",
    "Socialist Party is the future for Africa, look at what progressive governments achieve",
    "M'membe newspaper was shut down because he spoke truth to power, political persecution",
    "SP ideology does not suit Zambia, we are not Cuba and investors will flee",
    "Fred is articulate and intelligent but socialist economic policies will scare investors away",
    "The Post newspaper was a great paper, UPND destroyed press freedom when they shut it",
    "M'membe understands media and communication better than all other candidates",
    "Youth on TikTok love Fred M'membe content, he explains things clearly and goes viral",
    "Socialist policies to nationalise mines will drive away the investment Zambia needs",
    "Fred M'membe is a patriot who sacrificed his business empire for Zambia's future",
    "SP growing fast on social media, young people are listening to M'membe now",
    "M'membe on TikTok explaining mining royalties is the most watched political content in Zambia",
    "I don't agree with socialism but M'membe raises real issues about inequality and poverty",
    "Fred's analysis of the IMF deal is accurate, Zambia gave away too much sovereignty",
    "M'membe 2026 — urban youth are moving to SP, UPND must take this threat seriously",
    "He may not win but M'membe will force important conversations about Zambia's economic model",
    "The socialist label puts off business community but his analysis of mining sector is correct",
    "SP digital team is the best in Zambia, M'membe understands the youth media landscape",
    "M'membe speaks for the poor even if his solutions are debatable",
    "Fred M'membe is the most intellectually serious candidate in this election",
  ],
}

function getDemoAnalysis(leaderId: string) {
  const demos: Record<string, { sentiment: 'positive' | 'negative' | 'neutral'; score: number; summary: string; topThemes: string[] }> = {
    hh:     { sentiment: 'positive', score: 58, summary: "Supporters credit HH's economic stabilisation and free education, but intense backlash over load shedding and mealie meal prices", topThemes: ['Cost of living', 'Load shedding', 'Free education', 'Kwacha stability'] },
    pf_ndc: { sentiment: 'positive', score: 64, summary: 'PF-NDC Alliance energising northern rural base and Copperbelt youth simultaneously — fastest-growing bloc at +2.3pts/month', topThemes: ['Alliance unity', 'Northern vote', 'Youth coalition', '2026 comeback'] },
    kalaba: { sentiment: 'positive', score: 61, summary: 'Widely respected as principled but DP seen as too small to win alone — coalition calls are the dominant theme', topThemes: ['Principled leadership', 'Coalition pressure', 'Anti-corruption', 'Luapula base'] },
    membe:  { sentiment: 'neutral',  score: 49, summary: "Polarised: intellectuals and TikTok youth rally to M'membe's analysis but business community fears socialist economic policy", topThemes: ['Mining royalties', 'TikTok youth', 'Press freedom', 'Socialism debate'] },
  }
  return demos[leaderId] ?? { sentiment: 'neutral' as const, score: 50, summary: 'Analysis unavailable', topThemes: [] }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const leaderId = searchParams.get('leader')
  const targetLeaders = leaderId ? LEADER_PAGES.filter(l => l.id === leaderId) : LEADER_PAGES

  const results = await Promise.all(
    targetLeaders.map(async (leader) => {
      let texts: string[] = []
      let dataSource = 'curated'
      let mcpLayer = 'none'

      // ── Priority 1: Apify MCP ──
      if (APIFY_TOKEN) {
        texts = await scrapeWithApify(leader.fbUrl)
        if (texts.length > 0) { dataSource = 'apify-mcp'; mcpLayer = 'apify' }
      }

      // ── Priority 2: Bright Data MCP ──
      if (texts.length === 0 && BRIGHTDATA_TOKEN) {
        texts = await scrapeWithBrightData(leader.fbUrl)
        if (texts.length > 0) { dataSource = 'brightdata-mcp'; mcpLayer = 'brightdata' }
      }

      // ── Priority 3: Facebook Graph API ──
      if (texts.length === 0 && FB_TOKEN) {
        texts = await scrapeWithFbApi(leader.fbPage)
        if (texts.length > 0) { dataSource = 'facebook-api'; mcpLayer = 'fb-api' }
      }

      // ── Priority 4: Curated fallback ──
      if (texts.length === 0) {
        texts = CURATED_SAMPLES[leader.id] ?? []
        dataSource = 'curated'
      }

      const isLive = dataSource !== 'curated'
      const analysis = await analyzeWithAI(leader.name, texts, dataSource)

      return {
        leaderId: leader.id,
        leaderName: leader.name,
        fbPage: leader.fbPage,
        sampleCount: texts.length,
        postsCount: isLive ? Math.ceil(texts.length / 3) : 0,
        commentsCount: isLive ? texts.length : 0,
        liveData: isLive,
        dataSource,
        mcpLayer,
        analysis,
        mode: CF_ACCOUNT_ID ? 'ai' : 'demo',
        timestamp: new Date().toISOString(),
      }
    })
  )

  return NextResponse.json({
    results,
    fetchedAt: new Date().toISOString(),
    mcpEnabled: { apify: !!APIFY_TOKEN, brightdata: !!BRIGHTDATA_TOKEN, fbApi: !!FB_TOKEN },
    aiEnabled: !!CF_ACCOUNT_ID,
  })
}
