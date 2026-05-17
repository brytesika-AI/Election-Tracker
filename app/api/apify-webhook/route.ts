import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = 'appEG17iTbwEvLYWU'
const TABLE_ID         = 'tblcwKbfCnT6Ig8oi'

// Known actor IDs
const ACTOR_PLATFORM: Record<string, string> = {
  'KoJrdxJCTtpon81KY': 'facebook',   // apify~facebook-posts-scraper
  'u6ppkMWAx2E2MpEuF': 'twitter',    // quacker~twitter-scraper
  'GdWCkxBtKWOsKjdch': 'tiktok',     // clockworks~tiktok-scraper
}

interface ApifyWebhookBody {
  eventType: string
  resource: { id: string; actId: string; status: string; defaultDatasetId: string; finishedAt: string }
}

// ── Map content to candidate IDs ─────────────────────────────────────────────
const CANDIDATE_KEYWORDS: Record<string, string[]> = {
  hh:     ['hakainde', 'hichilema', 'upnd', 'hhichilema', 'hh zambia'],
  pf_ndc: ['mundubile', 'makebi', 'pf-ndc', 'pfndc', 'pf ndc', 'alliance'],
  kalaba: ['kalaba', 'democratic party', 'dp zambia'],
  membe:  ["m'membe", 'mmembe', 'socialist party', 'fred membe'],
}

function detectCandidate(text: string): string {
  const lower = text.toLowerCase()
  for (const [id, keywords] of Object.entries(CANDIDATE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return id
  }
  return 'unknown'
}

// ── Extract text from items depending on platform ────────────────────────────
interface RawItem { text?: string; full_text?: string; caption?: string; desc?: string; comments?: { text?: string }[]; hashtags?: string[] }

function extractTexts(items: RawItem[], platform: string): string[] {
  const texts: string[] = []
  for (const item of items) {
    const body = item.text ?? item.full_text ?? item.caption ?? item.desc ?? ''
    if (body.length > 15) texts.push(body.slice(0, 300))
    if (platform === 'facebook') {
      for (const c of item.comments ?? []) {
        if (c.text && c.text.length > 10) texts.push(c.text.slice(0, 200))
      }
    }
    if (platform === 'tiktok' && item.hashtags?.length) {
      texts[texts.length - 1] = (texts[texts.length - 1] ?? '') + ' ' + item.hashtags.join(' ')
    }
  }
  return texts.filter(Boolean)
}

// ── Store to Airtable ─────────────────────────────────────────────────────────
async function storeToAirtable(byCandidate: Record<string, string[]>, runId: string, platform: string) {
  if (!AIRTABLE_TOKEN) return
  const prefix = platform === 'facebook' ? 'APIFY' : platform === 'twitter' ? 'TW' : 'TT'

  for (const [candidateId, texts] of Object.entries(byCandidate)) {
    if (candidateId === 'unknown' || texts.length === 0) continue
    const record = {
      fields: {
        'Headline': `${platform.toUpperCase()} scrape · ${candidateId} · ${new Date().toISOString().slice(0, 10)}`,
        'Source': `${platform} Live · Apify run ${runId}`,
        'Sentiment Class': 'neutral',
        'Compound Score': 0,
        'Display Score': 50,
        'Batch ID': `${prefix}-${candidateId}-${runId}`,
        'Notes': texts.slice(0, 8).join(' | ').slice(0, 500),
      }
    }
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_ID}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [record] }),
    }).catch(() => {})
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ApifyWebhookBody = await req.json()

    if (body.eventType !== 'ACTOR.RUN.SUCCEEDED') {
      return NextResponse.json({ ok: true, skipped: 'non-success event' })
    }

    const { defaultDatasetId } = body.resource
    const runId = body.resource.id
    const actId = body.resource.actId
    const platform = ACTOR_PLATFORM[actId] ?? 'unknown'

    // Fetch dataset items
    const datasetRes = await fetch(
      `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?limit=200&token=${process.env.APIFY_API_TOKEN}`
    )
    if (!datasetRes.ok) return NextResponse.json({ ok: false, error: 'dataset fetch failed' }, { status: 500 })

    const items: RawItem[] = await datasetRes.json()
    const allTexts = extractTexts(items, platform)

    // Group by candidate
    const byCandidate: Record<string, string[]> = {}
    for (const text of allTexts) {
      const cid = detectCandidate(text)
      if (!byCandidate[cid]) byCandidate[cid] = []
      byCandidate[cid].push(text)
    }

    // Store to Airtable
    await storeToAirtable(byCandidate, runId, platform)

    return NextResponse.json({
      ok: true,
      platform,
      runId,
      itemsProcessed: items.length,
      textsExtracted: allTexts.length,
      candidatesDetected: Object.keys(byCandidate).filter(k => k !== 'unknown'),
      storedAt: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Apify webhook receiver — Facebook · Twitter/X · TikTok',
    actors: ACTOR_PLATFORM,
    url: 'https://zambia-election-app.vercel.app/api/apify-webhook',
    events: ['ACTOR.RUN.SUCCEEDED'],
  })
}
