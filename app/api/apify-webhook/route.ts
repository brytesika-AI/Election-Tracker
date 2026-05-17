import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = 'appEG17iTbwEvLYWU'
const TABLE_ID         = 'tblcwKbfCnT6Ig8oi' // Media Sentiment NLP table

// Apify posts a webhook to this endpoint when a scrape run finishes.
// Configure in Apify: Actor run → Settings → Webhooks
// URL: https://zambia-election-app.vercel.app/api/apify-webhook
// Events: ACTOR.RUN.SUCCEEDED

interface ApifyWebhookBody {
  eventType: string
  createdAt: string
  eventData: {
    actorId: string
    actorRunId: string
  }
  resource: {
    id: string
    actId: string
    status: string
    defaultDatasetId: string
    finishedAt: string
  }
}

interface ApifyPostItem {
  pageName?: string
  pageUrl?: string
  text?: string
  postUrl?: string
  time?: string
  likes?: number
  comments?: number
  shares?: number
  leaderId?: string
}

// Map Facebook page handles to leader IDs
const PAGE_TO_LEADER: Record<string, string> = {
  'hakaindehichilemaHH': 'hh',
  'hakaindehichilema': 'hh',
  'brianmundubile': 'pf_ndc',
  'harrykalaba': 'kalaba',
  'socialistpartyzambia': 'membe',
}

function detectLeader(item: ApifyPostItem): string {
  const url = (item.pageUrl ?? '').toLowerCase()
  const name = (item.pageName ?? '').toLowerCase()
  for (const [handle, id] of Object.entries(PAGE_TO_LEADER)) {
    if (url.includes(handle) || name.includes(handle.replace(/hh$/i, ''))) return id
  }
  return 'unknown'
}

async function storeToAirtable(posts: ApifyPostItem[], runId: string) {
  if (!AIRTABLE_TOKEN || posts.length === 0) return

  // Group posts by leader
  const byLeader: Record<string, ApifyPostItem[]> = {}
  for (const post of posts) {
    const lid = post.leaderId ?? detectLeader(post)
    if (!byLeader[lid]) byLeader[lid] = []
    byLeader[lid].push(post)
  }

  // Store one summary record per leader
  for (const [leaderId, leaderPosts] of Object.entries(byLeader)) {
    if (leaderId === 'unknown') continue
    const texts = leaderPosts.map(p => p.text ?? '').filter(Boolean)
    const record = {
      fields: {
        'Headline': `Apify FB scrape · ${leaderId} · ${new Date().toISOString().slice(0, 10)}`,
        'Source': `Facebook Live · Apify run ${runId}`,
        'Sentiment Class': 'neutral', // will be updated by AI analysis
        'Compound Score': 0,
        'Display Score': 50,
        'Batch ID': `APIFY-${runId}`,
        'Notes': texts.slice(0, 5).join(' | ').slice(0, 500),
      }
    }

    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_ID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
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

    // Fetch dataset items from the completed run
    const datasetRes = await fetch(
      `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?limit=100&token=${process.env.APIFY_API_TOKEN}`
    )
    if (!datasetRes.ok) {
      return NextResponse.json({ ok: false, error: 'dataset fetch failed' }, { status: 500 })
    }

    const items: ApifyPostItem[] = await datasetRes.json()

    // Store to Airtable as cache
    await storeToAirtable(items, runId)

    return NextResponse.json({
      ok: true,
      runId,
      itemsProcessed: items.length,
      storedAt: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    endpoint: 'Apify webhook receiver',
    configure: 'Add this URL in Apify actor → Settings → Webhooks → Event: ACTOR.RUN.SUCCEEDED',
    url: 'https://zambia-election-app.vercel.app/api/apify-webhook',
  })
}
