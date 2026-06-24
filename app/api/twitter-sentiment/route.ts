import { NextRequest, NextResponse } from 'next/server'

const CF_ACCOUNT_ID     = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN      = process.env.CLOUDFLARE_API_TOKEN
const CF_MODEL          = '@cf/meta/llama-3.1-8b-instruct'
const APIFY_TOKEN       = process.env.APIFY_API_TOKEN
const AIRTABLE_TOKEN    = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID  = 'appEG17iTbwEvLYWU'
const AIRTABLE_TABLE_ID = 'tblcwKbfCnT6Ig8oi'
const TWITTER_ACTOR_ID  = 'u6ppkMWAx2E2MpEuF' // quacker~twitter-scraper

// ── Search queries per candidate ─────────────────────────────────────────────
const CANDIDATE_QUERIES = [
  { id: 'hh',     name: 'Hakainde Hichilema', queries: ['HakaindehichilemaHH', 'HH Zambia president 2026', 'UPND Zambia election'] },
  { id: 'pf_ndc', name: 'Brian Mundubile + Makebi Zulu', queries: ['BrianMundubile Zambia', 'Makebi Zulu Mundubile', 'Tonse Alliance 2026', 'Mundubile president'] },
  { id: 'kalaba', name: 'Harry Kalaba',        queries: ['HarryKalaba Zambia', 'Citizens First Zambia 2026', 'CF Orange Alliance'] },
  { id: 'membe',  name: "Fred M'membe",        queries: ['FredMmembe Socialist', 'Socialist Party Zambia 2026', "M'membe Zambia"] },
]

// ── In-memory + Airtable cache (same pattern as facebook-sentiment) ───────────
interface CacheEntry { texts: string[]; runId: string; scrapedAt: number; tweetCount: number }
const twitterCache: Record<string, CacheEntry> = {}
const CACHE_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours (Twitter moves faster)

async function loadFromAirtable(leaderId: string): Promise<CacheEntry | null> {
  if (!AIRTABLE_TOKEN) return null
  try {
    const filter = encodeURIComponent(`FIND("TW-${leaderId}", {Batch ID})`)
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
    return { texts, runId: String(r.fields['Batch ID'] ?? ''), scrapedAt: new Date(r.createdTime).getTime(), tweetCount: texts.length }
  } catch { return null }
}

async function triggerTwitterScrape(): Promise<string | null> {
  if (!APIFY_TOKEN) return null
  try {
    const searchTerms = CANDIDATE_QUERIES.flatMap(c => c.queries)
    const res = await fetch(
      `https://api.apify.com/v2/acts/${TWITTER_ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerms,
          maxItems: 100,
          addUserInfo: false,
          proxyConfig: { useApifyProxy: true },
        }),
      }
    )
    if (!res.ok) return null
    const { data } = await res.json()
    return data?.id ?? null
  } catch { return null }
}

interface Tweet { full_text?: string; text?: string; lang?: string }

function extractTweetTexts(items: Tweet[], candidateQueries: string[]): string[] {
  const lower = candidateQueries.map(q => q.toLowerCase())
  return items
    .filter(t => {
      const body = (t.full_text ?? t.text ?? '').toLowerCase()
      return lower.some(q => body.includes(q.split(' ')[0].toLowerCase()))
    })
    .map(t => (t.full_text ?? t.text ?? '').slice(0, 280))
    .filter(t => t.length > 15)
}

async function pollTwitterRun(runId: string): Promise<Tweet[]> {
  if (!APIFY_TOKEN) return []
  const deadline = Date.now() + 55000
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 4000))
    try {
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`)
      const { data } = await statusRes.json()
      if (data?.status === 'SUCCEEDED') {
        const itemsRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&limit=200`)
        return await itemsRes.json()
      }
      if (data?.status === 'FAILED' || data?.status === 'ABORTED' || data?.status === 'TIMED-OUT') return []
    } catch {
      return []
    }
  }
  return []
}

async function analyzeWithAI(candidateName: string, texts: string[], platform: string) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || texts.length === 0) return null
  const sample = texts.slice(0, 25).join('\n- ')
  const prompt = `You are a Zambian political sentiment analyst specialising in social media. Analyze this ${platform} content about ${candidateName} and respond in JSON only.

Content:
- ${sample}

Also act as devil's advocate: identify the strongest criticism of ${candidateName} found in the content, then suggest a strategic counter-response.

Respond with exactly one valid JSON object only:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": <0-100 where 100 is fully positive>,
  "summary": "<one sentence public mood summary>",
  "topThemes": ["<theme1>", "<theme2>", "<theme3>", "<theme4>"],
  "devilsAdvocate": "<strongest criticism from content in one sentence>",
  "strategicCounter": "<recommended candidate response/action in one sentence>"
}`

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Zambian political analyst. Return exactly one valid JSON object. No markdown. Include devil\'s advocate and strategic counter.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 450,
          temperature: 0.25,
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
      devilsAdvocate: String(parsed.devilsAdvocate ?? ''),
      strategicCounter: String(parsed.strategicCounter ?? ''),
    }
  } catch { return null }
}

// ── Curated Twitter samples per candidate ─────────────────────────────────────
const CURATED: Record<string, string[]> = {
  hh: [
    "HH promised us change but electricity goes 18 hours a day. What happened? #Zambia2026",
    "Kwacha stabilising slowly, GDP projected at 4.2% — @HHichilema doing something right despite load shedding",
    "Free education policy is real. My sister started university this year. Thank you President #UPND",
    "Cost of living is destroying us Mr President. Mealie meal K400 per bag. Please act #ZambiaVotes",
    "Infrastructure in Southern Province is visible. Roads improved under HH. Delivery is real #UPND2026",
    "Load shedding is the number one issue. HH must fix Zesco before August 2026 or lose #ZambiaElection",
    "Anti-corruption drive must go harder. Too many PF thieves still walking free #HHichilema",
    "Debt restructuring deal is done. IMF back. Zambia credible again internationally. @HHichilema",
    "Youth unemployment remains high. UPND promised jobs. Where are they? #ZambiaYouth #Zambia2026",
    "President HH at SADC summit. Zambia respected on the international stage again #UPND",
    "Mealie meal prices are making people angry. UPND losing Copperbelt if they don't act fast",
    "The infrastructure numbers don't lie. 3000km roads built. Schools, clinics. #UPND delivering",
  ],
  pf_ndc: [
    "Mundubile and the Tonse lane are rising. This is the real opposition Zambia needed #Mundubile2026",
    "@BrianMundubile in Kasama yesterday. Thousands came out. Northern Province is ready #Tonse",
    "Mundubile + Makebi Zulu coalition is smart politics. Youth + Northern base = formidable #Zambia2026",
    "The Mundubile-Makebi opposition lane is gaining momentum. If this holds to August it's second round territory",
    "Why is UPND harassing PF members? Political persecution is real. #Zambia2026 #Mundubile",
    "NDC manifesto on agriculture is excellent. Farmers will benefit from this alliance #MakebiZulu",
    "Engineer Mundubile built roads in Mporokoso. We know his delivery record #Tonse #Zambia",
    "UPND has failed on electricity and mealie meal. Time for opposition change in 2026 #ZambiaVotes",
    "If the opposition alliance holds together they could force a second round. Historic #Zambia2026",
    "Copperbelt youth moving to the opposition lane fast. UPND must take this seriously #CopperbeltVotes",
    "Mundubile speaks our language. He is from us. Northern Province is ready #NorthernProvince",
    "NDC + PF = real alternative. Young people have a choice now. #MakebiZulu #BrianMundubile",
  ],
  kalaba: [
    "Harry Kalaba left PF over corruption when it was costly to do so. That is real integrity #CitizensFirst",
    "@HarryKalaba polling at 3.8%. Squeezed by Mundubile in Luapula. Coalition talks inevitable",
    "Kalaba should be finance minister in a coalition. His economic record is excellent #DP2026",
    "Citizens First has policy ideas but needs more media presence #HarryKalaba",
    "Principled politicians are rare in Zambia. Kalaba is one of very few we trust #KalabaZambia",
    "Kalaba plus Mundubile in coalition would be serious in Northern and Luapula provinces",
    "Harry Kalaba can play kingmaker role in 2026 if he aligns right. His 3.8% matters strategically",
    "We in Luapula want Kalaba as VP in a coalition. His ethics are needed at the top #Zambia2026",
    "Citizens First policies on anti-corruption and agriculture are well-thought-out. Needs funding to scale",
    "Kalaba refuses to compromise principles for power. Zambia needs more leaders like this",
  ],
  membe: [
    "M'membe explaining mining royalties on TikTok — most watched political video this week #Zambia",
    "Fred M'membe is the only leader actually talking about wealth inequality in Zambia #SP2026",
    "Socialist Party growing fast on social media. Young Zambians are listening #Mmembe2026",
    "The IMF deal HH signed will force privatisation of state assets. @FredMmembe is right #Zambia",
    "M'membe TikTok content is fire. He explains complex economics clearly for youth #ZambiaYouth",
    "Socialist policy will scare investors. Zambia needs FDI not nationalisation #SP #Mmembe",
    "Fred M'membe sacrificed his media empire for Zambian politics. That takes courage and conviction",
    "SP at 4.1% and rising. Urban youth in Lusaka and Copperbelt are moving to M'membe #Zambia2026",
    "M'membe on The Post shutdown — UPND destroyed press freedom just like PF did before them",
    "Youth unemployment 34%. M'membe speaks for young Zambians who UPND and PF have failed",
    "SP digital team is the best in Zambia. M'membe understands TikTok, Twitter, youth media",
    "Fred M'membe is polarising but he forces important conversations about Zambia's economic model",
  ],
}

const DEMO_ANALYSIS: Record<string, ReturnType<typeof analyzeWithAI> extends Promise<infer T> ? NonNullable<T> : never> = {
  hh:     { sentiment: 'neutral', score: 54, summary: "Twitter split: infrastructure and kwacha gains praised, but load shedding and mealie meal cost generate intense backlash — HH must act before August", topThemes: ['Load shedding', 'Cost of living', 'Free education', 'Infrastructure'], devilsAdvocate: "High youth joblessness and food prices mean ordinary Zambians feel worse off despite macro gains — UPND risks losing urban youth vote", strategicCounter: "Launch visible province-by-province mealie meal relief campaign with real-time ZNBC/TikTok coverage to counter cost-of-living narrative" },
  pf_ndc: { sentiment: 'positive', score: 66, summary: "Twitter energised around the Mundubile-Makebi lane — Northern base mobilising fast, Copperbelt youth joining, second-round scenario trending", topThemes: ['Alliance surge', 'Northern mobilisation', 'Youth coalition', 'Second round'], devilsAdvocate: "Alliance cohesion is fragile — party vehicle, PF factions and ticket details could blunt the momentum", strategicCounter: "Lock in a clear candidate/running-mate announcement, alliance manifesto and joint rally schedule before nominations to demonstrate unity" },
  kalaba: { sentiment: 'positive', score: 60, summary: "Respected as principled but Twitter sees Citizens First squeezed between UPND and larger opposition structures — coalition or kingmaker role dominates discourse", topThemes: ['Integrity brand', 'Coalition pressure', 'Kingmaker role', 'Luapula base'], devilsAdvocate: "A low model estimate makes Kalaba look like a wasted vote in a two-horse race — users increasingly ask him to ally or sharpen the CF Orange lane", strategicCounter: "Announce a concrete CF Orange Alliance policy position to convert the integrity brand into electoral leverage" },
  membe:  { sentiment: 'neutral',  score: 47, summary: "M'membe owns the youth narrative on Twitter — mining and inequality resonate, but socialist label polarises business community and older voters", topThemes: ['Mining royalties', 'Youth mobilisation', 'Press freedom', 'Inequality debate'], devilsAdvocate: "SP/People's Pact can peel UPND urban youth votes but still needs a path beyond protest support", strategicCounter: "Reframe SP as 'Zambian resources for Zambians' to attract voters who agree with the economics but fear ideological labels" },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const forceRefresh = searchParams.get('refresh') === '1'

  const needsScrape = forceRefresh || CANDIDATE_QUERIES.some(c => {
    const cached = twitterCache[c.id]
    return !cached || (Date.now() - cached.scrapedAt) > CACHE_TTL_MS
  })

  let apifyRunId: string | null = null
  if (APIFY_TOKEN && needsScrape) {
    apifyRunId = await triggerTwitterScrape()
    if (forceRefresh && apifyRunId) {
      const items = await pollTwitterRun(apifyRunId)
      if (items.length > 0) {
        CANDIDATE_QUERIES.forEach(candidate => {
          const texts = extractTweetTexts(items, candidate.queries)
          if (texts.length > 0) {
            twitterCache[candidate.id] = {
              texts,
              runId: apifyRunId!,
              scrapedAt: Date.now(),
              tweetCount: texts.length,
            }
          }
        })
      }
    }
  }

  const results = await Promise.all(
    CANDIDATE_QUERIES.map(async (candidate) => {
      let cached = twitterCache[candidate.id]
      const isFresh = cached && (Date.now() - cached.scrapedAt) < CACHE_TTL_MS

      if (!isFresh && AIRTABLE_TOKEN) {
        const at = await loadFromAirtable(candidate.id)
        if (at && (Date.now() - at.scrapedAt) < CACHE_TTL_MS) {
          twitterCache[candidate.id] = at
          cached = at
        }
      }

      const validCached = twitterCache[candidate.id]
      let texts = validCached?.texts ?? []
      let dataSource = validCached ? 'apify-cached' : 'curated'

      if (texts.length === 0) {
        texts = CURATED[candidate.id] ?? []
        dataSource = 'curated'
      }

      const isLive = dataSource !== 'curated'
      const aiResult = await analyzeWithAI(candidate.name, texts, 'Twitter/X')
      const analysis = aiResult ?? DEMO_ANALYSIS[candidate.id]

      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        platform: 'Twitter/X',
        sampleCount: texts.length,
        tweetCount: validCached?.tweetCount ?? 0,
        liveData: isLive,
        dataSource,
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
  })
}

// POST: receive Apify results from webhook
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { candidateId, texts, runId, tweetCount } = body as { candidateId: string; texts: string[]; runId: string; tweetCount: number }
  if (!candidateId || !Array.isArray(texts)) return NextResponse.json({ error: 'candidateId and texts required' }, { status: 400 })
  twitterCache[candidateId] = { texts, runId: runId ?? 'manual', scrapedAt: Date.now(), tweetCount: tweetCount ?? texts.length }
  return NextResponse.json({ ok: true, cached: candidateId, count: texts.length })
}
