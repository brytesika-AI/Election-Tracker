import { NextRequest, NextResponse } from 'next/server'

// ── Credentials ─────────────────────────────────────────────────────────────
const CF_ACCOUNT_ID     = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN      = process.env.CLOUDFLARE_API_TOKEN
const CF_MODEL          = '@cf/meta/llama-3.1-8b-instruct'
const APIFY_TOKEN       = process.env.APIFY_API_TOKEN
const AIRTABLE_TOKEN    = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID  = 'appEG17iTbwEvLYWU'
const AIRTABLE_TABLE_ID = 'tblcwKbfCnT6Ig8oi' // Media Sentiment NLP table

// ── Candidate Facebook pages ─────────────────────────────────────────────────
const LEADER_PAGES = [
  { id: 'hh',     name: 'Hakainde Hichilema', fbPage: 'HakaindehichilemaHH',  fbUrl: 'https://www.facebook.com/HakaindehichilemaHH' },
  { id: 'pf_ndc', name: 'Brian Mundubile + Makebi Zulu', fbPage: 'BrianMundubile', fbUrl: 'https://www.facebook.com/BrianMundubile' },
  { id: 'kalaba', name: 'Harry Kalaba',        fbPage: 'HarryKalaba',           fbUrl: 'https://www.facebook.com/HarryKalaba' },
  { id: 'membe',  name: "Fred M'membe",        fbPage: 'SocialistPartyZambia',  fbUrl: 'https://www.facebook.com/SocialistPartyZambia' },
]

// ── In-memory cache (hot path — survives within same Vercel instance) ─────────
// Airtable is the persistent cache across cold starts (written by apify-webhook)
interface CacheEntry {
  texts: string[]
  runId: string
  scrapedAt: number
  postCount: number
}
const apifyCache: Record<string, CacheEntry> = {}
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

// ── Read Airtable for persisted Apify results (cold start recovery) ───────────
async function loadFromAirtable(leaderId: string): Promise<CacheEntry | null> {
  if (!AIRTABLE_TOKEN) return null
  try {
    const filter = encodeURIComponent(`FIND("${leaderId}", {Batch ID})`)
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=${filter}&sort[0][field]=Created&sort[0][direction]=desc&maxRecords=1`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    )
    if (!res.ok) return null
    const { records } = await res.json() as { records: Array<{ fields: Record<string, unknown>; createdTime: string }> }
    if (!records?.length) return null
    const r = records[0]
    const notes = String(r.fields['Notes'] ?? '')
    const texts = notes ? notes.split(' | ').filter(Boolean) : []
    return {
      texts,
      runId: String(r.fields['Batch ID'] ?? '').replace('APIFY-', ''),
      scrapedAt: new Date(r.createdTime).getTime(),
      postCount: texts.length,
    }
  } catch {
    return null
  }
}

// ── Trigger Apify scrape (async — does NOT block response) ───────────────────
// Uses facebook-posts-scraper actor for post text + comments
async function triggerApifyScrape(pages: typeof LEADER_PAGES): Promise<string | null> {
  if (!APIFY_TOKEN) return null
  try {
    const startUrls = pages.map(p => ({ url: p.fbUrl }))
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~facebook-posts-scraper/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls,
          maxPosts: 10,
          maxPostsPerPage: 10,
          commentsMode: 'RANKED_THREADED',
          maxComments: 20,
          maxReactions: 0,
          loginCookies: [],
          proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
        }),
      }
    )
    if (!res.ok) return null
    const { data } = await res.json()
    return data?.id ?? null
  } catch {
    return null
  }
}

// ── Poll a specific Apify run and load results into cache ─────────────────────
// Called when user explicitly requests a refresh (up to 55s wait)
async function pollApifyRun(runId: string): Promise<string[]> {
  if (!APIFY_TOKEN) return []
  const deadline = Date.now() + 55000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 4000))
    try {
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
      )
      const { data } = await statusRes.json()
      if (data?.status === 'SUCCEEDED') {
        const itemsRes = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&limit=100`
        )
        const items = await itemsRes.json()
        return extractTexts(items)
      }
      if (data?.status === 'FAILED' || data?.status === 'ABORTED') return []
    } catch {
      return []
    }
  }
  return [] // timed out
}

interface ApifyPost {
  text?: string; caption?: string; comments?: { text?: string }[]
  url?: string; time?: string; likes?: number
}

function extractTexts(items: ApifyPost[]): string[] {
  const texts: string[] = []
  for (const item of items) {
    const body = item.text ?? item.caption ?? ''
    if (body.length > 20) texts.push(body.slice(0, 300))
    for (const c of item.comments ?? []) {
      if (c.text && c.text.length > 10) texts.push(c.text.slice(0, 200))
    }
  }
  return texts.filter(Boolean)
}

// ── Cloudflare AI analysis ────────────────────────────────────────────────────
async function analyzeWithAI(leaderName: string, texts: string[], source: string) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || texts.length === 0) return null

  const sample = texts.slice(0, 20).join('\n- ')
  const prompt = `You are a Zambian political sentiment analyst. Analyze this ${source} content about ${leaderName} from public Facebook and respond in JSON only.

Content:
- ${sample}

Respond with exactly one valid JSON object only:
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
            { role: 'system', content: 'Political sentiment analyst for Zambia. Return exactly one valid JSON object. No markdown.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 350,
          temperature: 0.2,
        }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const raw: string = data?.result?.response ?? ''
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)
    const sentRaw = (parsed.sentiment ?? '').toLowerCase()
    return {
      sentiment: (sentRaw.includes('pos') ? 'positive' : sentRaw.includes('neg') ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
      score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
      summary: String(parsed.summary ?? ''),
      topThemes: Array.isArray(parsed.topThemes) ? parsed.topThemes.slice(0, 4) as string[] : [],
    }
  } catch {
    return null
  }
}

// ── Curated fallback samples ──────────────────────────────────────────────────
const CURATED: Record<string, string[]> = {
  hh: [
    "Electricity prices are too high Mr President, we voted for change not suffering",
    "HH has done well to stabilize the kwacha, import prices are coming down slowly",
    "Cost of living is killing us, mealie meal is K400 a 25kg bag, what happened to promises?",
    "The infrastructure is improving in Southern Province, roads are better now",
    "Load shedding must end, businesses are closing in Lusaka, please act fast",
    "Thank you for the CDF empowerment funds, our community has benefited greatly",
    "Dollar rate has improved since UPND took over, economy is slowly recovering",
    "UPND delivered free education, my children are in school now, thank you Mr President",
    "The anti-corruption drive must continue, many thieves still walking free",
    "Fertiliser subsidy is not reaching farmers in Northern Province please investigate",
    "Great speech at SADC summit, Zambia is respected again internationally",
    "Mining royalties should benefit local communities, we see nothing here in Copperbelt",
    "HH please fix load shedding before 2026, that is the number one issue on ground",
    "Infrastructure progress is real but cost of living makes it hard to feel",
    "Thank you Mr President for the debt restructuring deal, future looks brighter",
    "UPND must address mealie meal prices or lose Northern and Copperbelt in 2026",
    "HH is the right person for Zambia but he needs to listen to ordinary people",
    "Too many foreigners getting contracts, what about Zambian companies?",
    "Our president is working hard, the opposition just wants to destabilise Zambia",
    "We need hospitals and drugs, Levy Mwanawasa Memorial Hospital is not enough",
  ],
  pf_ndc: [
    "Mundubile and the Tonse lane must unite the opposition quickly. 2026 is close!",
    "Mundubile for president 2026, PF must come back and save Zambia from UPND failure",
    "Brian is the only one speaking for poor Zambians in rural areas honestly",
    "We support you Mundubile, Northern Province will vote massively for the alliance",
    "Why is the government harassing PF members? This is political persecution plain and simple",
    "UPND has failed, time for change in 2026, the opposition lane has our vote in Northern Province",
    "Engineer Mundubile understands development, he built roads in Mporokoso when in govt",
    "Northern and Luapula provinces are solidly behind the Mundubile-Makebi lane in 2026",
    "The opposition alliance is recovering after difficult times, but it needs unity and clarity",
    "2026 is our year, Zambians are tired of UPND failures on economy and electricity",
    "Makebi Zulu brings the youth vote, Mundubile brings Northern base — powerful combination",
    "NDC joining PF is great, now we have a real credible alternative that can win",
    "Young people need real change, NDC and PF together give us that option in August",
    "PF built good infrastructure when in power, UPND is destroying that legacy",
    "Mundubile-Makebi model support around 20% is a real threat to UPND now, watch this space",
    "Mundubile speaks our language, he is from us, Northern Province is solidly ready",
    "NDC manifesto on agriculture is excellent, farmers will benefit from this alliance",
    "We need Lungu to campaign for Mundubile even though he cannot stand himself in 2026",
    "Mundubile-Makebi is the real change option if it can organise nationally",
    "If the alliance holds to August 2026 they could force a second round — historic",
  ],
  kalaba: [
    "Kalaba is honest and principled, Zambia needs leaders like him urgently",
    "Harry Kalaba left PF because of corruption, that takes real courage and conviction",
    "Citizens First is too small to win alone but Kalaba would make an excellent cabinet minister",
    "Kalaba please make CF Orange Alliance visible; your votes matter strategically",
    "Principled politicians are very rare in Zambia, Kalaba is one of the precious few",
    "We in Luapula support Kalaba even though he left PF, he is still our son",
    "Citizens First policies are good but need more funding and visibility to reach rural communities",
    "Kalaba should be finance minister in a coalition government given his economic background",
    "Please do not give up Harry, Zambia needs your voice in the political arena",
    "Kalaba plus Mundubile coalition would be formidable in Northern and Luapula provinces",
    "I respect Kalaba because he speaks truth even when it is very unpopular to do so",
    "Citizens First manifesto is well-written but who knows about it outside Lusaka? Need more outreach",
    "Harry Kalaba represents the integrity that Zambia desperately needs right now in politics",
    "Kalaba 2026 — small party but big principles, hope he gets much more media attention",
    "Coalition talks make strategic sense, Kalaba should seriously consider where CF Orange fits",
    "Kalaba left PF on principle over corruption, that decision was the right one for Zambia",
    "Citizens First has the right policies but not enough resources to compete with UPND and larger opposition blocs",
    "Harry Kalaba is one of the few politicians in Zambia with real moral credibility",
    "We want Kalaba to be vice president in a coalition, his integrity is needed at top",
    "Kalaba can play kingmaker role in 2026 if he aligns with the right coalition partners",
  ],
  membe: [
    "Fred M'membe speaks truth about capitalism destroying Zambia's mineral wealth",
    "Socialist Party is the future for Africa, look at what progressive governments achieve",
    "M'membe newspaper was shut down because he spoke truth to power, political persecution",
    "SP ideology does not suit Zambia, we are not Cuba and investors will definitely flee",
    "Fred is articulate and intelligent but socialist economic policies will scare investors",
    "The Post newspaper was great, UPND destroyed press freedom in Zambia when they shut it",
    "M'membe understands media and communication better than all other candidates in 2026",
    "Youth on TikTok love Fred M'membe content, he explains mining clearly and goes viral",
    "Socialist policies to nationalise mines will drive away the investment Zambia needs",
    "Fred M'membe is a patriot who sacrificed his business empire for Zambia's future",
    "SP growing fast on social media, young people are seriously listening to M'membe now",
    "M'membe on TikTok explaining mining royalties is most watched political content in Zambia",
    "I don't agree with socialism but M'membe raises real issues about inequality and poverty",
    "Fred's analysis of the IMF deal is accurate, Zambia gave away too much sovereignty",
    "M'membe 2026 — urban youth are moving to SP fast, UPND must take this seriously",
    "He may not win but M'membe forces important conversations about Zambia's economic model",
    "Socialist label puts off business community but his analysis of mining sector is correct",
    "SP digital team is the best in Zambia, M'membe understands youth media landscape",
    "M'membe speaks for the poor even if his solutions remain very debatable to many",
    "Fred M'membe is the most intellectually serious candidate in this entire 2026 election",
  ],
}

const DEMO_ANALYSIS: Record<string, { sentiment: 'positive' | 'negative' | 'neutral'; score: number; summary: string; topThemes: string[] }> = {
  hh:     { sentiment: 'positive', score: 58, summary: "Supporters credit HH's economic stabilisation and free education, but backlash over load shedding and mealie meal prices is intense", topThemes: ['Cost of living', 'Load shedding', 'Free education', 'Kwacha stability'] },
  pf_ndc: { sentiment: 'positive', score: 64, summary: 'Mundubile-Makebi lane energising northern rural base and Copperbelt youth, but ticket and alliance clarity remain the main risk', topThemes: ['Alliance unity', 'Northern vote', 'Youth coalition', '2026 comeback'] },
  kalaba: { sentiment: 'positive', score: 61, summary: 'Widely respected as principled but Citizens First/CF Orange is seen as too small to win alone — coalition calls dominate the conversation', topThemes: ['Principled leadership', 'Coalition pressure', 'Anti-corruption', 'Luapula base'] },
  membe:  { sentiment: 'neutral',  score: 49, summary: "Polarised: intellectuals and TikTok youth rally to M'membe's mining analysis, business community fears socialist policy", topThemes: ['Mining royalties', 'TikTok youth', 'Press freedom', 'Socialism debate'] },
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const leaderId = searchParams.get('leader')
  const forceRefresh = searchParams.get('refresh') === '1'
  const targetLeaders = leaderId ? LEADER_PAGES.filter(l => l.id === leaderId) : LEADER_PAGES

  // Trigger async Apify scrape if cache is stale or refresh requested
  const needsScrape = forceRefresh || targetLeaders.some(l => {
    const cached = apifyCache[l.id]
    return !cached || (Date.now() - cached.scrapedAt) > CACHE_TTL_MS
  })

  let apifyRunId: string | null = null
  if (APIFY_TOKEN && needsScrape) {
    // Fire async — do not await (non-blocking)
    apifyRunId = await triggerApifyScrape(targetLeaders)
    if (forceRefresh && apifyRunId) {
      const texts = await pollApifyRun(apifyRunId)
      if (texts.length > 0) {
        targetLeaders.forEach(leader => {
          apifyCache[leader.id] = {
            texts,
            runId: apifyRunId!,
            scrapedAt: Date.now(),
            postCount: texts.length,
          }
        })
      }
    }
  }

  const results = await Promise.all(
    targetLeaders.map(async (leader) => {
      // 1. Check hot in-memory cache
      let cached = apifyCache[leader.id]
      const isFresh = cached && (Date.now() - cached.scrapedAt) < CACHE_TTL_MS

      // 2. On cold start (no in-memory data), recover from Airtable
      if (!isFresh && AIRTABLE_TOKEN) {
        const airtableEntry = await loadFromAirtable(leader.id)
        if (airtableEntry && (Date.now() - airtableEntry.scrapedAt) < CACHE_TTL_MS) {
          apifyCache[leader.id] = airtableEntry // repopulate in-memory
          cached = airtableEntry
        }
      }

      const validCached = apifyCache[leader.id]
      const cacheAge = validCached ? Math.round((Date.now() - validCached.scrapedAt) / 60000) : null

      let texts = validCached?.texts ?? []
      let dataSource = validCached ? 'apify-cached' : 'curated'
      let mcpLayer = validCached ? 'apify' : 'none'

      // 3. Always fall back to curated if no live data
      if (texts.length === 0) {
        texts = CURATED[leader.id] ?? []
        dataSource = 'curated'
        mcpLayer = 'none'
      }

      const isLive = dataSource !== 'curated'
      const aiResult = await analyzeWithAI(leader.name, texts, dataSource)
      const analysis = aiResult ?? DEMO_ANALYSIS[leader.id] ?? { sentiment: 'neutral' as const, score: 50, summary: 'Analysis unavailable', topThemes: [] }

      return {
        leaderId: leader.id,
        leaderName: leader.name,
        fbPage: leader.fbPage,
        sampleCount: texts.length,
        postsCount: validCached?.postCount ?? 0,
        commentsCount: isLive ? texts.length : 0,
        liveData: isLive,
        dataSource,
        mcpLayer,
        cacheAgeMinutes: cacheAge,
        analysis,
        mode: CF_ACCOUNT_ID ? 'ai' : 'demo',
        timestamp: new Date().toISOString(),
      }
    })
  )

  return NextResponse.json({
    results,
    fetchedAt: new Date().toISOString(),
    apifyEnabled: !!APIFY_TOKEN,
    aiEnabled: !!CF_ACCOUNT_ID,
    scrapeTriggered: needsScrape && !!APIFY_TOKEN,
    apifyRunId,
    webhookUrl: 'https://zambia-election-app.vercel.app/api/apify-webhook',
  })
}

// ── POST: receive Apify results (called by webhook or manually) ───────────────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { leaderId, texts, runId, postCount } = body as {
    leaderId: string; texts: string[]; runId: string; postCount: number
  }

  if (!leaderId || !Array.isArray(texts)) {
    return NextResponse.json({ error: 'leaderId and texts required' }, { status: 400 })
  }

  apifyCache[leaderId] = {
    texts,
    runId: runId ?? 'manual',
    scrapedAt: Date.now(),
    postCount: postCount ?? texts.length,
  }

  return NextResponse.json({ ok: true, cached: leaderId, count: texts.length })
}
