import { NextRequest, NextResponse } from 'next/server'

// ── VADER-Zambia NLP Engine ────────────────────────────────
// Port of Python VADER (Valence Aware Dictionary and sEntiment Reasoner)
// Enhanced with a Zambian political domain lexicon
// Reference: Hutto & Gilbert (2014) VADER: A Parsimonious Rule-Based Model
//
// compound score: -1.0 (strongly negative) to +1.0 (strongly positive)
// Threshold: >= 0.05 → positive | <= -0.05 → negative | else → neutral

const LEXICON: Record<string, number> = {
  // ── General positive ──
  stable: 1.8, stability: 2.0, dialogue: 1.5, development: 1.5,
  progress: 1.6, growth: 1.4, investment: 1.3, peace: 2.0, unity: 1.8,
  victory: 2.2, improved: 1.4, successful: 1.8, delivered: 1.5,
  thriving: 2.0, good: 1.0, great: 1.8, excellent: 2.0, hope: 1.5,
  strong: 1.2, confident: 1.4, recovery: 1.6, boost: 1.4,
  eases: 0.8, confirms: 0.5, registered: 0.3, allocated: 0.4,
  launched: 0.6, approved: 0.8, secured: 1.0, expanded: 0.8,

  // ── General negative ──
  protest: -1.5, unrest: -2.0, clash: -2.0, shortage: -2.0,
  inflation: -1.0, unemployment: -1.5, crisis: -2.2, failed: -1.8,
  corruption: -2.5, fraud: -2.8, violence: -2.5, collapse: -2.8,
  poverty: -1.8, suffering: -2.0, concern: -0.8, worry: -0.9,
  fear: -1.5, threat: -1.5, delays: -1.0, controversy: -1.5,
  accused: -1.5, rejected: -1.2, strike: -1.3, shutdown: -1.5,
  devastate: -2.2, threatens: -1.6, alarming: -2.0, deteriorating: -1.8,
  declining: -1.2, condemned: -1.8, arrested: -1.0, detained: -1.2,

  // ── Zambia political domain lexicon ──
  loadshedding: -1.8, 'load-shedding': -1.8, blackout: -1.5,
  zesco: -0.5, mealie: -0.6, kwacha: 0.2,
  ecz: 0.2, zambia: 0.1, election: 0.1, constitutional: 0.3,
  hh: 0.2, upnd: 0.2, mundubile: 0.0, pf: 0.0, ndc: 0.0,
  mines: 0.2, copper: 0.2, cdf: 0.8, fertiliser: 0.3,
  restructuring: 1.0, // Zambia debt restructuring = positive outcome
  imf: 0.1, infrastructure: 0.8, road: 0.6, clinic: 0.7, school: 0.8,
  rally: 0.4, coalition: 0.2, surge: 0.4, momentum: 0.6,
  rigging: -2.5, intimidation: -2.0, harassment: -2.0, persecution: -1.8,
  tribalism: -2.0, division: -1.5, deadlock: -1.5,
}

// VADER normalization constant (alpha=15 produces correct range)
const ALPHA = 15
// All-caps intensity amplifier
const C_INCR = 0.733
// Negation dampener
const NEG_SCALAR = -0.74
const NEGATION_WORDS = new Set(['not', 'no', 'never', 'none', 'without', 'despite', "don't", "doesn't", "won't", "can't", "cannot"])

function computeCompound(text: string): number {
  const tokens = text.split(/\s+/)
  let sum = 0
  let matchCount = 0

  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i]
    const word = raw.toLowerCase().replace(/[^a-z'-]/g, '')
    const isAllCaps = raw.length > 2 && raw === raw.toUpperCase() && /[A-Z]/.test(raw)

    if (!(word in LEXICON)) continue

    let score = LEXICON[word]

    // All-caps intensity boost
    if (isAllCaps) score += score > 0 ? C_INCR : -C_INCR

    // Check 3-token window for negation
    const prevTokens = tokens.slice(Math.max(0, i - 3), i).map(t => t.toLowerCase())
    if (prevTokens.some(t => NEGATION_WORDS.has(t))) {
      score *= NEG_SCALAR
    }

    sum += score
    matchCount++
  }

  if (matchCount === 0) return 0

  // VADER compound normalization: sum / sqrt(sum^2 + alpha)
  const compound = sum / Math.sqrt(sum * sum + ALPHA)
  return Math.round(Math.max(-1, Math.min(1, compound)) * 1000) / 1000
}

function classify(compound: number): 'positive' | 'negative' | 'neutral' {
  if (compound >= 0.05) return 'positive'
  if (compound <= -0.05) return 'negative'
  return 'neutral'
}

// Convert compound (-1 to +1) to 0–100 display scale
function displayScore(compound: number): number {
  return Math.round((compound + 1) * 50)
}

type HeadlineInput = {
  headline: string
  source: string
  url?: string
  timestamp?: string
}

function processHeadlines(items: HeadlineInput[]) {
  return items.map(item => {
    const compound = computeCompound(item.headline)
    return {
      headline: item.headline,
      source: item.source,
      url: item.url ?? '',
      timestamp: item.timestamp ?? new Date().toISOString(),
      sentiment_score: compound,
      sentiment_class: classify(compound),
      score_display: displayScore(compound),
    }
  })
}

function summarise(results: ReturnType<typeof processHeadlines>) {
  const avg = results.length > 0
    ? results.reduce((s, r) => s + r.sentiment_score, 0) / results.length
    : 0
  return {
    total: results.length,
    positive: results.filter(r => r.sentiment_class === 'positive').length,
    negative: results.filter(r => r.sentiment_class === 'negative').length,
    neutral: results.filter(r => r.sentiment_class === 'neutral').length,
    avgCompound: Math.round(avg * 1000) / 1000,
    avgDisplayScore: displayScore(avg),
    overallSentiment: classify(avg),
  }
}

// ── Demo headlines (Zambia political discourse sample) ──────
const DEMO_HEADLINES: HeadlineInput[] = [
  { headline: 'ECZ confirms stable voter registration turnout nationwide', source: 'News Diggers' },
  { headline: 'Opposition parties raise CONCERN over internet access during election campaigns', source: 'News Diggers' },
  { headline: 'Bank of Zambia holds policy rate as inflation eases slightly', source: 'Financial Insight ZM' },
  { headline: 'Load shedding CRISIS continues to devastate Lusaka businesses', source: 'Lusaka Times' },
  { headline: 'HH delivers free education programme reaching 2 million children', source: 'ZNBC' },
  { headline: 'Mundubile surge in Northern Province raises concern for UPND strategists', source: 'Zambian Observer' },
  { headline: 'PF-NDC Alliance gains momentum with combined 20% national poll support', source: 'Lusaka Times' },
  { headline: 'Mealie meal shortage hits rural communities ahead of 2026 election', source: 'The Mast' },
  { headline: 'Kwacha shows stability against major currencies in May 2026', source: 'Times of Zambia' },
  { headline: 'Youth unemployment CRISIS threatens UPND vote in Copperbelt Province', source: 'Zambian Observer' },
  { headline: 'Infrastructure development progress celebrated as roads delivered in Southern Province', source: 'ZANIS' },
  { headline: 'iVerify Zambia flags disinformation surge on WhatsApp groups targeting ECZ', source: 'iVerify Zambia' },
]

export async function GET() {
  const results = processHeadlines(DEMO_HEADLINES)
  return NextResponse.json({
    results,
    summary: summarise(results),
    engine: 'VADER-Zambia NLP v1.0',
    lexiconSize: Object.keys(LEXICON).length,
    mode: 'demo',
    processedAt: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const headlines: HeadlineInput[] = Array.isArray(body.headlines) && body.headlines.length > 0
    ? body.headlines
    : DEMO_HEADLINES
  const results = processHeadlines(headlines)
  return NextResponse.json({
    results,
    summary: summarise(results),
    engine: 'VADER-Zambia NLP v1.0',
    lexiconSize: Object.keys(LEXICON).length,
    mode: 'live',
    processedAt: new Date().toISOString(),
  })
}
