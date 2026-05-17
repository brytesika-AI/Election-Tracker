import { NextResponse } from 'next/server'
import { ELECTION_DATA } from '@/app/lib/data'

const AIRTABLE_BASE = 'appEG17iTbwEvLYWU'
const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN

async function fetchCandidates() {
  if (!AIRTABLE_TOKEN) return null
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/Candidates?maxRecords=10`,
    { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }, next: { revalidate: 300 } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.records?.map((r: { fields: Record<string, unknown> }) => ({
    name:           r.fields['Candidate'],
    party:          r.fields['Party'],
    poll:           r.fields['Poll Pct'],
    trend:          r.fields['Trend pts/mo'],
    sentimentScore: r.fields['Sentiment Score'],
    aiScore:        r.fields['AI Win Probability'],
    stronghold:     r.fields['Stronghold'],
    keyRisk:        r.fields['Key Risk'],
    status:         r.fields['Status'],
    lastUpdated:    r.fields['Last Updated'],
  })) ?? null
}

export async function GET() {
  const candidates = await fetchCandidates()
  return NextResponse.json({
    source: candidates ? 'airtable' : 'static',
    airtableBase: AIRTABLE_BASE,
    candidates: candidates ?? ELECTION_DATA.figures.map(f => ({
      name: f.name, party: f.party, poll: f.poll, trend: f.trend,
      sentimentScore: f.sentimentScore, aiScore: f.aiScore,
      stronghold: f.stronghold, lastUpdated: new Date().toISOString().slice(0, 10),
    })),
    nationalPoll: ELECTION_DATA.nationalPoll,
    fetchedAt: new Date().toISOString(),
  })
}

// Called by ai-judges to persist verdict to Airtable
export async function POST(req: Request) {
  if (!AIRTABLE_TOKEN) return NextResponse.json({ stored: false, reason: 'no token' })
  const body = await req.json().catch(() => ({}))
  const { judgeId, judgeName, verdict, confidence, summary, timestamp } = body

  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/AI%20Judge%20Verdicts`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [{ fields: {
          'Run ID':    `${judgeId}-${Date.now()}`,
          'Judge':     judgeName?.replace('Judge ', '') ?? judgeId,
          'Verdict':   verdict,
          'Confidence': confidence,
          'Summary':   summary,
          'Timestamp': timestamp ?? new Date().toISOString(),
        }}]
      })
    }
  )
  return NextResponse.json({ stored: res.ok })
}
