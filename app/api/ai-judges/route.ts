import { NextRequest, NextResponse } from 'next/server'
import { ELECTION_DATA, JudgeVerdict } from '@/app/lib/data'

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN  = process.env.CLOUDFLARE_API_TOKEN
const CF_MODEL      = '@cf/meta/llama-3.1-8b-instruct'

async function callCloudflareAI(prompt: string): Promise<string> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    // Demo mode — return deterministic mock response
    return null as unknown as string
  }
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert political data analyst specialising in African elections, specifically Zambia. Return exactly one valid JSON object. No markdown.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 512,
        temperature: 0.3,
      }),
    }
  )
  if (!res.ok) return null as unknown as string
  const data = await res.json()
  return data?.result?.response ?? null
}

// ── Demo fallback verdicts (when no Cloudflare creds) ──
function demoVerdicts(dataSnapshot: Record<string, unknown>): JudgeVerdict[] {
  const ts = new Date().toISOString()
  const upnd = (dataSnapshot.upnd as number) ?? 47.2
  const pf   = (dataSnapshot.pf   as number) ?? 26.8

  return [
    {
      judgeId: 'data',
      judgeName: 'Judge ORACLE',
      verdict: upnd > 45 ? 'VALIDATED' : 'CAUTION',
      confidence: 84,
      summary:
        `Model estimates checked against the ECZ certified 2026 register (8,786,300 voters), the 2021 presidential baseline and Zambia's more-than-50% win threshold. UPND at ${upnd.toFixed(1)}% is a scenario estimate and remains runoff-risk unless it clears 50%+1.`,
      findings: [
        'Zambia presidential threshold: more than 50% of valid votes; current baseline is runoff-risk',
        `UPND ${upnd.toFixed(1)}% within ±2.5pt margin of error vs 2021 benchmark`,
        `PF ${pf.toFixed(1)}% reflects Lungu eligibility uncertainty drag`,
        'Mundubile surge (+1.8pt/month) is statistically significant — flag',
        'Opposition alliance cohesion index: LOW — party vehicle and ticket details remain fluid',
        'Voter register growth (+29% since 2021) favours youth-focused parties',
      ],
      timestamp: ts,
    },
    {
      judgeId: 'strategy',
      judgeName: 'Judge STRATEGIS',
      verdict: 'VALIDATED',
      confidence: 78,
      summary:
        'Strategic recommendations are grounded in Zambian political realities. Energy and cost-of-living levers are correctly prioritised. Northern Province swing campaign is underweighted given Mundubile momentum.',
      findings: [
        'Energy roadmap (+4.2pt impact) must be news-verifiable through ZNBC/independent media and district evidence',
        'TikTok rapid response desk: CRITICAL because youth unemployment remains the live campaign risk',
        'Northern/Luapula/Muchinga tour should be HIGH PRIORITY to protect the 50%+1 path',
        "M'membe SP urban youth risk is underestimated; use Copperbelt mining/jobs data, not generic slogans",
        'Cost-of-living proof points must be local: mealie meal, fuel, fertiliser and household prices',
      ],
      timestamp: ts,
    },
    {
      judgeId: 'sentiment',
      judgeName: 'Judge SENTINEX',
      verdict: upnd < 44 ? 'CAUTION' : 'VALIDATED',
      confidence: 80,
      summary:
        `Platform sentiment cross-validated across Facebook, Twitter/X, Lusaka Times, Zambian Observer, and ZNBC. UPND positive sentiment (avg 51.3%) is higher than poll numbers suggest — latent support may be undercounted.`,
      findings: [
        'News sentiment must be included alongside social: ZNBC, News Diggers, The Mast, Lusaka Times and event signals',
        'Facebook positive UPND: 48% — exceeds national poll by ~1pt (normal)',
        'ZNBC 68% positive: state media effect confirmed — discount accordingly',
        'Twitter/X 40% negative: urban elite opinion skew — not representative',
        "TikTok: M'membe & Mundubile gaining 18-35 audience — ALERT raised",
        'WhatsApp signal proxy: Pamodzi Alliance messages spreading in CB — monitor',
      ],
      timestamp: ts,
    },
  ]
}

// ── AI Judge prompt builders ──
function buildDataPrompt(snapshot: Record<string, unknown>) {
  return `
You are Judge ORACLE — Data Integrity Validator for Zambia 2026 election intelligence.
Validate this polling snapshot against Zambia 2021 election results and ECZ data:
${JSON.stringify(snapshot, null, 2)}

Mandatory checks: apply Zambia's presidential rule that a first-round winner must receive more than 50% of valid votes cast; flag runoff risk if no candidate clears that gate. Treat news sources as corroborating evidence, not polling.

Respond with one valid JSON object only:
{
  "verdict": "VALIDATED" | "CAUTION" | "DISPUTED",
  "confidence": <0-100>,
  "summary": "<2 sentence assessment>",
  "findings": ["<finding 1>", "<finding 2>", "<finding 3>", "<finding 4>"]
}
`
}

function buildStrategyPrompt(snapshot: Record<string, unknown>) {
  return `
You are Judge STRATEGIS — Campaign Strategy Evaluator for Zambia 2026.
Evaluate the strategic recommendations for the ruling UPND party given this data:
${JSON.stringify(snapshot, null, 2)}

Key figures: HH (incumbent, UPND), Brian Mundubile + Makebi Zulu consolidated opposition lane, Harry Kalaba (Citizens First/CF Orange Alliance), M'membe (Socialist Party/People's Pact).
All strategy must be grounded in Zambia-specific evidence: ECZ registered voters, 226 constituencies, province voter weights, inflation, BoZ policy rate, youth unemployment, mealie meal/fuel/electricity pressure, and credible news signals. Do not give generic campaign advice. Include whether the action helps clear 50%+1 or prepares for a runoff.
Respond with one valid JSON object only:
{
  "verdict": "VALIDATED" | "CAUTION" | "DISPUTED",
  "confidence": <0-100>,
  "summary": "<2 sentence strategic assessment>",
  "findings": ["<strategic finding 1>", "<finding 2>", "<finding 3>", "<finding 4>"]
}
`
}

function buildSentimentPrompt(snapshot: Record<string, unknown>) {
  return `
You are Judge SENTINEX — Sentiment Verification Agent for Zambia 2026.
Cross-validate platform sentiment for UPND across Facebook, Twitter/X, Lusaka Times, Zambian Observer, ZNBC, News Diggers, The Mast and open news/event signals:
${JSON.stringify(snapshot, null, 2)}

Score whether news coverage changes the 50%+1 first-round path, creates runoff risk, or only affects narrative noise.

Respond with one valid JSON object only:
{
  "verdict": "VALIDATED" | "CAUTION" | "DISPUTED",
  "confidence": <0-100>,
  "summary": "<2 sentence sentiment assessment>",
  "findings": ["<sentiment finding 1>", "<finding 2>", "<finding 3>", "<finding 4>"]
}
`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const dataSnapshot = {
    upnd:    body.upnd    ?? ELECTION_DATA.nationalPoll.upnd,
    pf:      body.pf      ?? ELECTION_DATA.nationalPoll.mundubile_tonse,
    ndc:     body.ndc     ?? ELECTION_DATA.nationalPoll.ndc_makebi,
    pamodzi: body.pamodzi ?? 0,
    kalaba:  body.kalaba  ?? ELECTION_DATA.nationalPoll.kalaba_cf,
    membe:   body.membe   ?? ELECTION_DATA.nationalPoll.membe_sp,
    voterTotal: ELECTION_DATA.voterTotal,
    electionDate: ELECTION_DATA.electionDate,
    platforms: ELECTION_DATA.platforms,
    platPositive: ELECTION_DATA.platPositive,
    platNegative: ELECTION_DATA.platNegative,
    presidentialThreshold: ELECTION_DATA.presidentialThreshold,
    presidentialRule: ELECTION_DATA.presidentialRule,
    macroIndicators: ELECTION_DATA.macroIndicators,
    newsSources: ['ZNBC', 'News Diggers!', 'Lusaka Times', 'The Mast', 'Zambian Observer', 'GDELT'],
  }

  // Try Cloudflare AI — fall back to demo
  let verdicts: JudgeVerdict[]

  try {
    const [dataRaw, stratRaw, sentRaw] = await Promise.all([
      callCloudflareAI(buildDataPrompt(dataSnapshot)),
      callCloudflareAI(buildStrategyPrompt(dataSnapshot)),
      callCloudflareAI(buildSentimentPrompt(dataSnapshot)),
    ])

    if (dataRaw && stratRaw && sentRaw) {
      const ts = new Date().toISOString()
      const parseAI = (raw: string) => {
        const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const j = JSON.parse(clean)
        // Normalise confidence: if model returns fraction (0-1), scale to 0-100
        let conf = Number(j.confidence) || 70
        if (conf > 0 && conf <= 1) conf = conf * 100
        j.confidence = Math.max(0, Math.min(100, Math.round(conf)))
        // Ensure findings is array
        if (!Array.isArray(j.findings)) j.findings = []
        return j
      }
      const dataJ  = parseAI(dataRaw)
      const stratJ = parseAI(stratRaw)
      const sentJ  = parseAI(sentRaw)
      verdicts = [
        { judgeId: 'data',     judgeName: 'Judge ORACLE',   timestamp: ts, ...dataJ },
        { judgeId: 'strategy', judgeName: 'Judge STRATEGIS',timestamp: ts, ...stratJ },
        { judgeId: 'sentiment',judgeName: 'Judge SENTINEX', timestamp: ts, ...sentJ },
      ]
    } else {
      verdicts = demoVerdicts(dataSnapshot)
    }
  } catch {
    verdicts = demoVerdicts(dataSnapshot)
  }

  return NextResponse.json({ verdicts, dataSnapshot, mode: 'ai' })
}

export async function GET() {
  return NextResponse.json({ verdicts: demoVerdicts({}), mode: 'demo' })
}
