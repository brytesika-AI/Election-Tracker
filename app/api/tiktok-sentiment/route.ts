import { NextRequest, NextResponse } from 'next/server'

const CF_ACCOUNT_ID     = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN      = process.env.CLOUDFLARE_API_TOKEN
const CF_MODEL          = '@cf/meta/llama-3.1-8b-instruct'
const APIFY_TOKEN       = process.env.APIFY_API_TOKEN
const AIRTABLE_TOKEN    = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID  = 'appEG17iTbwEvLYWU'
const AIRTABLE_TABLE_ID = 'tblcwKbfCnT6Ig8oi'
const TIKTOK_ACTOR_ID   = 'GdWCkxBtKWOsKjdch' // clockworks~tiktok-scraper

// ── TikTok hashtags to monitor per candidate ──────────────────────────────────
const CANDIDATE_HASHTAGS = [
  { id: 'hh',     name: 'Hakainde Hichilema', hashtags: ['ZambiaElection2026', 'HakaindehichilemaHH', 'UPND2026', 'HHZambia'] },
  { id: 'pf_ndc', name: 'PF-NDC Alliance',    hashtags: ['BrianMundubile', 'PFNDC2026', 'Mundubile2026', 'ZambiaElection'] },
  { id: 'kalaba', name: 'Harry Kalaba',        hashtags: ['HarryKalaba', 'DPZambia', 'KalabaZambia'] },
  { id: 'membe',  name: "Fred M'membe",        hashtags: ['FredMmembe', 'SocialistPartyZambia', 'MmembeZambia', 'ZambiaYouthVote'] },
]

const ALL_HASHTAGS = ['ZambiaElection2026', 'Zambia2026', 'HakaindehichilemaHH', 'BrianMundubile', 'FredMmembe', 'HarryKalaba', 'ZambiaVotes', 'ZambiaYouth']

interface CacheEntry { texts: string[]; runId: string; scrapedAt: number; videoCount: number }
const tiktokCache: Record<string, CacheEntry> = {}
const CACHE_TTL_MS = 4 * 60 * 60 * 1000

async function loadFromAirtable(leaderId: string): Promise<CacheEntry | null> {
  if (!AIRTABLE_TOKEN) return null
  try {
    const filter = encodeURIComponent(`FIND("TT-${leaderId}", {Batch ID})`)
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
    return { texts, runId: String(r.fields['Batch ID'] ?? ''), scrapedAt: new Date(r.createdTime).getTime(), videoCount: texts.length }
  } catch { return null }
}

async function triggerTikTokScrape(): Promise<string | null> {
  if (!APIFY_TOKEN) return null
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${TIKTOK_ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hashtags: ALL_HASHTAGS,
          resultsPerPage: 30,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          proxyConfig: { useApifyProxy: true },
        }),
      }
    )
    if (!res.ok) return null
    const { data } = await res.json()
    return data?.id ?? null
  } catch { return null }
}

interface TikTokVideo { text?: string; desc?: string; hashtags?: string[]; diggCount?: number; commentCount?: number; shareCount?: number }

function extractVideoTexts(items: TikTokVideo[], candidateHashtags: string[]): string[] {
  const lower = candidateHashtags.map(h => h.toLowerCase())
  return items
    .filter(v => {
      const body = ((v.text ?? v.desc ?? '') + ' ' + (v.hashtags ?? []).join(' ')).toLowerCase()
      return lower.some(h => body.includes(h.toLowerCase()))
    })
    .map(v => {
      const text = v.text ?? v.desc ?? ''
      const tags = (v.hashtags ?? []).join(' ')
      const engagement = v.diggCount ? `[${v.diggCount} likes]` : ''
      return `${text} ${tags} ${engagement}`.trim().slice(0, 300)
    })
    .filter(t => t.length > 15)
}

async function analyzeWithAI(candidateName: string, texts: string[], platform: string) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || texts.length === 0) return null
  const sample = texts.slice(0, 25).join('\n- ')
  const prompt = `You are a Zambian political analyst specialising in youth social media sentiment. Analyze this ${platform} content about ${candidateName}.

IMPORTANT CONTEXT: TikTok audience is 18-35 year old Zambians. Youth unemployment is 34.1%. Key issues: electricity (load shedding), mealie meal prices, jobs, mining revenue.

Content:
- ${sample}

Act as both analyst AND devil's advocate: give the honest critique youth are making, then recommend the strongest strategic counter-move the candidate should make.

Respond with exactly this JSON (no markdown):
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": <0-100>,
  "summary": "<one sentence youth mood summary>",
  "topThemes": ["<theme1>", "<theme2>", "<theme3>", "<theme4>"],
  "youthGrievance": "<the core youth complaint in one sentence>",
  "devilsAdvocate": "<strongest youth criticism in one sentence>",
  "strategicCounter": "<what the candidate must do to win youth vote, one concrete action>"
}`

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Zambian youth political analyst. JSON only. No markdown. Devil\'s advocate + strategic counter required.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.3,
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
      youthGrievance: String(parsed.youthGrievance ?? ''),
      devilsAdvocate: String(parsed.devilsAdvocate ?? ''),
      strategicCounter: String(parsed.strategicCounter ?? ''),
    }
  } catch { return null }
}

// ── Curated TikTok samples (youth voice) ─────────────────────────────────────
const CURATED: Record<string, string[]> = {
  hh: [
    "Mr President when is electricity coming back? I can't run my small business #LoadShedding #HHZambia",
    "Free education was real! Got my university place. Thank you @HHichilema but now fix jobs #UPND2026",
    "Mealie meal is K400. How are young people supposed to eat? #ZambiaYouth #HakaindehichilemaHH",
    "Kwacha improved but cost of living still high. Youth unemployment still 34%. Need more action #HH",
    "UPND built real roads in my province. Infrastructure is visible. But electricity must be fixed #Zambia",
    "HH if you don't fix load shedding before August 2026 the youth are not voting for you #ZambiaVotes",
    "Young people want jobs not speeches. 34% unemployed. What is the plan Mr President? #ZambiaYouth",
    "The debt restructuring is good for Zambia long term but we suffer short term. Please listen to youth",
    "Mines are hiring again slowly. Kwacha stable. Give credit where it is due #UPND #Zambia2026",
    "HH promised to empower youth but we see nothing on the ground in Ndola. Very disappointed",
  ],
  pf_ndc: [
    "Mundubile in Lusaka youth rally — crowd was massive. Young Zambians want change #PFNDC #ZambiaYouth",
    "PF-NDC 20.3% and rising. Mundubile speaks for young Northern Province Zambians #Mundubile2026",
    "Makebi Zulu brings NDC youth energy + Mundubile brings North. This alliance is different #PFNDC",
    "Engineering background means Mundubile understands jobs and real development #BrianMundubile",
    "UPND failed youth employment. PF-NDC alliance promising real change on jobs #ZambiaElection2026",
    "Young people are not loyal anymore. We vote for results. PF-NDC showing results in polls #Zambia",
    "NDC manifesto has youth entrepreneurship fund. First party to take youth seriously #MakebiZulu",
    "Northern Province youth fully behind the alliance. Copperbelt moving too #PFNDC #Zambia2026",
    "Mundubile TikTok engagement growing week by week. He understands digital #BrianMundubile",
    "PF-NDC could force second round if youth turn out. That changes everything #ZambiaElection2026",
  ],
  kalaba: [
    "Harry Kalaba left PF because of corruption. That is the kind of leader we need #KalabaDP #Zambia",
    "DP has good policies but where is the TikTok presence? Youth need to see you #HarryKalaba",
    "Kalaba should join the PF-NDC alliance. His votes + their numbers = real threat to UPND",
    "Principled over powerful. Kalaba chose integrity when it cost him. Respect that #DPZambia",
    "Young voters respect Kalaba but 3.8% is too small. Need to think coalition #Zambia2026",
    "Kalaba has no TikTok game. How does he expect to reach youth voters in 2026? #ZambiaYouth",
    "DP manifesto is best written but only policy nerds know it. Need content creators #KalabaDP",
    "We would vote Kalaba if he had a bigger platform. He's the most honest politician #Zambia",
  ],
  membe: [
    "Fred M'membe explaining how mining companies take 80% profits out of Zambia 🔥 #MmembeZambia",
    "M'membe TikTok is fire. He explains the IMF deal and what it really means for Zambians #SP2026",
    "Socialist Party for young Zambians who are tired of UPND and PF stealing our future #Mmembe",
    "M'membe is the only one talking about wealth redistribution. Youth unemployed at 34% #ZambiaYouth",
    "FredMmembe explains mining royalties better than any economics professor. Watch his content",
    "SP growing fast on TikTok. M'membe content goes viral every week #FredMmembe #Zambia2026",
    "Socialist policies worry investors but M'membe raises real questions about who benefits #Zambia",
    "The Post shutdown was political. Press freedom died under UPND just like it did under PF #Mmembe",
    "M'membe 2026 — young Zambians who feel left behind by capitalism are listening #SP #ZambiaYouth",
    "Best political content on Zambian TikTok is from Fred M'membe team. Consistently fire 🔥",
  ],
}

const DEMO_ANALYSIS: Record<string, { sentiment: 'positive' | 'negative' | 'neutral'; score: number; summary: string; topThemes: string[]; youthGrievance: string; devilsAdvocate: string; strategicCounter: string }> = {
  hh:     { sentiment: 'neutral',  score: 50, summary: "Youth split: grateful for free education but furious over load shedding and mealie meal prices — UPND youth vote is genuinely at risk", topThemes: ['Load shedding', 'Youth unemployment', 'Free education', 'Cost of living'], youthGrievance: "34% youth unemployment and K400 mealie meal make young Zambians feel UPND change never reached them", devilsAdvocate: "Young people see kwacha stability and debt restructuring as elite-level fixes while they can't afford food or electricity — macro wins mean nothing at street level", strategicCounter: "Launch a visible 90-day youth jobs sprint: 10,000 government internships announced on TikTok with HH doing live Q&A with young Zambians in each province" },
  pf_ndc: { sentiment: 'positive', score: 68, summary: "TikTok youth energised by PF-NDC Alliance momentum — Makebi Zulu NDC youth appeal fusing with Mundubile Northern base in fastest-growing digital bloc", topThemes: ['Alliance momentum', 'Youth jobs manifesto', 'Northern mobilisation', 'Digital growth'], youthGrievance: "Youth under PF-NDC see both UPND and PF as failed parties — alliance only works if it represents something genuinely new for young people", devilsAdvocate: "PF governed Zambia for 10 years and youth unemployment was just as bad — Mundubile is asking youth to forget the PF record that hurt them", strategicCounter: "Release a costed 100-day youth jobs plan within 30 days, distinguishing it clearly from PF's past record to credibly own the youth change narrative" },
  kalaba: { sentiment: 'neutral',  score: 55, summary: "Respected by youth but seen as too small to win alone — TikTok calls grow louder for coalition or strategic withdrawal", topThemes: ['Integrity brand', 'Coalition pressure', 'Digital absence', 'Kingmaker potential'], youthGrievance: "Youth admire Kalaba's principles but feel a vote for DP at 3.8% is wasted when the stakes are this high in 2026", devilsAdvocate: "DP has no TikTok presence, no youth creator network, no viral content — Kalaba is invisible to the 18-35 voter who lives on social media", strategicCounter: "Partner with 10 Zambian TikTok political creators immediately and announce Kalaba's coalition position before July 2026 to stay politically relevant" },
  membe:  { sentiment: 'positive', score: 62, summary: "M'membe owns youth TikTok in Zambia — mining inequality narrative viral among 18-35s, SP fastest growing party on social media despite socialist label", topThemes: ['Mining inequality', 'TikTok virality', 'Youth anger', 'Anti-establishment'], youthGrievance: "Young Zambians with 34% unemployment and zero mining royalty benefit feel capitalism has failed them — M'membe's analysis resonates deeply", devilsAdvocate: "SP at 4.1% can never win — M'membe is building a media brand not a government, and his socialist label will permanently cap his vote ceiling below 10%", strategicCounter: "Reframe SP messaging from 'socialist party' to 'Zambian resources for Zambians' — drop the ideological label to break through to moderate youth who agree with the economic analysis but fear the brand" },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const forceRefresh = searchParams.get('refresh') === '1'

  const needsScrape = forceRefresh || CANDIDATE_HASHTAGS.some(c => {
    const cached = tiktokCache[c.id]
    return !cached || (Date.now() - cached.scrapedAt) > CACHE_TTL_MS
  })

  if (APIFY_TOKEN && needsScrape) {
    triggerTikTokScrape().catch(() => {})
  }

  const results = await Promise.all(
    CANDIDATE_HASHTAGS.map(async (candidate) => {
      let cached = tiktokCache[candidate.id]
      const isFresh = cached && (Date.now() - cached.scrapedAt) < CACHE_TTL_MS

      if (!isFresh && AIRTABLE_TOKEN) {
        const at = await loadFromAirtable(candidate.id)
        if (at && (Date.now() - at.scrapedAt) < CACHE_TTL_MS) {
          tiktokCache[candidate.id] = at
          cached = at
        }
      }

      const validCached = tiktokCache[candidate.id]
      let texts = validCached?.texts ?? []
      let dataSource = validCached ? 'apify-cached' : 'curated'

      if (texts.length === 0) {
        texts = CURATED[candidate.id] ?? []
        dataSource = 'curated'
      }

      const isLive = dataSource !== 'curated'
      const aiResult = await analyzeWithAI(candidate.name, texts, 'TikTok')
      const analysis = aiResult ?? DEMO_ANALYSIS[candidate.id]

      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        platform: 'TikTok',
        sampleCount: texts.length,
        videoCount: validCached?.videoCount ?? 0,
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
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { candidateId, texts, runId, videoCount } = body as { candidateId: string; texts: string[]; runId: string; videoCount: number }
  if (!candidateId || !Array.isArray(texts)) return NextResponse.json({ error: 'candidateId and texts required' }, { status: 400 })
  tiktokCache[candidateId] = { texts, runId: runId ?? 'manual', scrapedAt: Date.now(), videoCount: videoCount ?? texts.length }
  return NextResponse.json({ ok: true, cached: candidateId, count: texts.length })
}
