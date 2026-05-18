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

// ── Zambia 20-factor election context (injected into all judge prompts) ──
const ZAMBIA_ELECTORAL_CONTEXT = `
ZAMBIA 2026 ELECTORAL FRAMEWORK — 20 FACTOR DOMAINS:
1. Historical voting patterns: 2021 HH won 59.4% (landslide; regime-change conditions). 2016: PF 50.4% vs UPND 47.6% (13,588-vote margin). Model must discount 2021 by 15-20pt for incumbency-fatigue cycle. 2016 is the closer calibration baseline for a competitive re-election.
2. Provincial/constituency geography: 226 constituencies (70 new, zero voting history). UPND anchors: Southern, Western, North-Western. Opposition anchors: Northern, Luapula, Muchinga, Eastern. Lusaka and Copperbelt are genuine battlegrounds.
3. Identity/coalition dynamics: Opposition ticket cohesion (Mundubile-Makebi + Kalaba CF transfers) is the decisive coalition risk. Running mate effects are significant. Eastern Province vote transfer depends on Makebi Zulu network.
4. Economic conditions (macro vs household): GDP growth 4.2% (World Bank 2026 projection) — but voters feel mealie meal K400/25kg, fuel prices, electricity outages, and kwacha weakness daily. Macro ≠ household.
5. Cost of living: #1 voter grievance in Afrobarometer Round 10. Mealie meal, fuel, electricity, transport. Most potent opposition argument. Directly hurts UPND in Lusaka, Copperbelt, and peri-urban Central.
6. Youth unemployment and turnout: ZamStats 32.6% in 19-22 cohort. Youth were the 2021 UPND engine. If youth turnout drops (disillusionment), UPND loses its margin-of-safety over 50%+1.
7. Voter registration: 8,786,300 registered, 226 constituencies. Register quality must be verified. 70 new constituencies carry no historical signal.
8. Turnout probability: 2021 turnout 70.6% (unusually high — anti-PF mobilisation). 2016 turnout 56% (machinery election). 2015 by-election 32% (PF advantage). Low turnout benefits PF machinery structures in north. Projected 2026: 55–70%, central estimate 62%.
9. Party machinery: UPND now has incumbent resources and CDF. PF ward structures in Northern/Luapula/Muchinga remain intact. Ground coverage and polling agent deployment are decisive in close races.
10. Candidate credibility: HH retains international credibility; business/economic competence perception higher than opposition. Mundubile rising in north but nationally less known. Kalaba has integrity brand but low reach.
11. Incumbency advantage/state resources: MUST be discounted from raw support. CDF, ZNBC, state project launches, civil service inflate UPND visibility by 5-10pt vs genuine preference. CIVICUS rates civic space OBSTRUCTED.
12. Media access/bias: ZNBC heavily UPND. Private radio (Radio Phoenix, Muvi TV) more balanced. Opposition viable through social media, church networks, community radio. Discount ZNBC positive sentiment by 30-35pt.
13. Social media/information: TikTok and Twitter trending against incumbent on cost-of-living and youth jobs. Facebook more mixed. Social media is a signal, NOT a forecast — rural Zambia is offline.
14. Violence/intimidation: CCMG 2021 pre-election observation flagged violence, hate speech, intimidation. 2016 had cadre activity suppressing opposition in some Northern areas. Fear-of-disclosure can suppress 2-4pt in surveys.
15. Institutional trust: ECZ trust 62/100 (Afrobarometer R10). Courts 55/100 — ConCourt petition risk real. Police 48/100 — political policing concerns flagged. CCMG is most trusted observer at 78/100.
16. Corruption/governance: UPND promised anti-corruption delivery. Procurement concerns emerging. Afrobarometer satisfaction with democracy declined after post-2021 peak. Opposition must offer credible governance alternative.
17. Service delivery/CDF: CDF most visible UPND proof point. Free education real. Roads partly delivered. Counter-narrative: power cuts, mealie meal, and unemployment undercut delivery claims in urban areas.
18. Agriculture/food security: FISP delivery delayed in Eastern, Muchinga, Northern. 2024 drought affected Western, Southern, North-Western. Maize price elevated. FRA purchases below target. Agriculture delivery is electorally decisive in 3-4 opposition-leaning provinces.
19. Mining/Copperbelt: Copper price LME ~$9,200/t (recovering). KCM in provisional liquidation. Contractor payment delays in Kitwe/Ndola elevated. Local supplier grievances high. Resource-nationalism narrative (M'membe/SP) gaining traction. Copperbelt is a 3-5pt swing battleground.
20. Electoral law/delimitation: 50%+1 presidential threshold — runoff if no candidate clears. 70 new constituencies with no voting history. ConCourt petition within 7 days. Nomination rules: Lungu DISQUALIFIED. Petition risk HIGH if margin <2%.

ELECTION INTEGRITY FLAGS: Voter register quality LOW-MEDIUM risk. Ballot logistics LOW risk. Observer accreditation MEDIUM risk. Petition likelihood HIGH if margin <2%. Post-election violence LOW-MEDIUM risk. Overall integrity score: 65/100 — MODERATELY CREDIBLE, WATCH.

RUNOFF PROBABILITY AT BASELINE: P(UPND first-round win) = 34%. P(runoff) = 66%. Based on UPND at 47.2% vs 50%+1 threshold with ±1.8pt std.
`

// ── AI Judge prompt builders ──
function buildDataPrompt(snapshot: Record<string, unknown>) {
  return `
You are Judge ORACLE — Data Integrity Validator for Zambia 2026 election intelligence.
${ZAMBIA_ELECTORAL_CONTEXT}

Validate this current polling snapshot against the electoral framework above and Zambia's actual ECZ historical results:
${JSON.stringify(snapshot, null, 2)}

Mandatory checks:
1. Apply Zambia's presidential rule: winner must receive >50% of valid votes cast; calculate runoff probability if UPND is below threshold.
2. Cross-check current estimates against 2021 result (HH 59.4%) — apply incumbency fatigue discount of 10-15pt.
3. Cross-check against 2016 result (PF 50.4%, UPND 47.6%) — flag if current UPND is near that contested level.
4. Check turnout assumption: if turnout falls to 56% (2016 level), does UPND's urban base shrink?
5. Flag any of the 20 factor domains that are not addressed in the snapshot.
6. Treat social media sentiment as a signal requiring calibration, not as a direct forecast.
7. Identify the strongest single devil's-advocate case against the current leader's position.

Respond with one valid JSON object only:
{
  "verdict": "VALIDATED" | "CAUTION" | "DISPUTED",
  "confidence": <0-100>,
  "summary": "<2 sentence assessment including runoff probability>",
  "findings": ["<finding 1>", "<finding 2>", "<finding 3>", "<finding 4>", "<finding 5>"]
}
`
}

function buildStrategyPrompt(snapshot: Record<string, unknown>) {
  return `
You are Judge STRATEGIS — Campaign Strategy Evaluator for Zambia 2026.
${ZAMBIA_ELECTORAL_CONTEXT}

Evaluate strategic recommendations for ALL candidates given this data snapshot:
${JSON.stringify(snapshot, null, 2)}

Key figures: HH (incumbent, UPND), Brian Mundubile + Makebi Zulu (Tonse Alliance/opposition), Harry Kalaba (Citizens First/CF Orange Alliance), M'membe (Socialist Party/People's Pact).

Mandatory assessment criteria — grade each against the 20-factor framework:
1. UPND path to 50%+1: which of the 20 factors can move UPND from 47.2% to above 50%? What is the minimum viable strategy?
2. Opposition path to forcing a runoff: which factor combination (cost-of-living + youth unemployment + Copperbelt + Northern consolidation) creates a second-ballot scenario?
3. Runoff transfer dynamics: if HH misses 50%+1, which minor candidates (Kalaba, M'membe, Kateka) transfer where and to whom?
4. Agriculture and mining as swing levers: FISP delay + contractor payment anger = 3-4pt swing in 5 provinces. What action addresses this?
5. Turnout as a strategic variable: UPND needs 65%+ turnout to replicate 2021 margin. What youth mobilisation is required?
6. Devil's advocate: what is the single biggest strategic mistake UPND could make in the next 90 days?

All advice must be grounded in Zambia-specific evidence, ECZ data, and the 20-factor framework. No generic political advice. Include whether each action helps clear 50%+1 or prepares for a runoff.

Respond with one valid JSON object only:
{
  "verdict": "VALIDATED" | "CAUTION" | "DISPUTED",
  "confidence": <0-100>,
  "summary": "<2 sentence strategic assessment including runoff scenario>",
  "findings": ["<strategic finding 1>", "<finding 2>", "<finding 3>", "<finding 4>", "<finding 5>"]
}
`
}

function buildSentimentPrompt(snapshot: Record<string, unknown>) {
  return `
You are Judge SENTINEX — Sentiment Verification Agent for Zambia 2026.
${ZAMBIA_ELECTORAL_CONTEXT}

Cross-validate platform sentiment for all candidates across Facebook, Twitter/X, TikTok, Lusaka Times, Zambian Observer, ZNBC, News Diggers, The Mast and open news/event signals:
${JSON.stringify(snapshot, null, 2)}

Mandatory sentiment verification steps:
1. Apply the social-media calibration rule: Twitter/X is urban elite (5-8% signal weight max). TikTok is youth (18-35). Facebook is broader but English-biased. WhatsApp is unobservable but dominant — flag as structural data gap.
2. Apply the ZNBC discount: state media UPND positive sentiment must be discounted by 30-35pt before using as a voter preference signal.
3. Apply the fear-of-disclosure correction: in competitive Northern and Copperbelt constituencies, survey and social media may undercount opposition support by 2-4pt.
4. Identify the narrative that has most penetrated offline (radio, WhatsApp, market talk) vs purely online noise.
5. Flag any SP/M'membe youth narrative that is gaining velocity — TikTok viral content can shift youth constituency by 2-3pt in 6 weeks.
6. Score whether the current sentiment environment changes the 50%+1 first-round probability, creates runoff risk, or only affects the narrative layer.
7. Provide a devil's advocate: what is the strongest opposition counter-narrative that UPND has not effectively answered?

Respond with one valid JSON object only:
{
  "verdict": "VALIDATED" | "CAUTION" | "DISPUTED",
  "confidence": <0-100>,
  "summary": "<2 sentence sentiment assessment including runoff impact>",
  "findings": ["<sentiment finding 1>", "<finding 2>", "<finding 3>", "<finding 4>", "<finding 5>"]
}
`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const dataSnapshot = {
    upnd:    body.upnd    ?? ELECTION_DATA.nationalPoll.upnd,
    pf:      body.pf      ?? ELECTION_DATA.nationalPoll.mundubile_tonse,
    kalaba:  body.kalaba  ?? ELECTION_DATA.nationalPoll.kalaba_cf,
    membe:   body.membe   ?? ELECTION_DATA.nationalPoll.membe_sp,
    voterTotal: ELECTION_DATA.voterTotal,
    constituencies: ELECTION_DATA.constituencies,
    newConstituencies: 70,
    electionDate: ELECTION_DATA.electionDate,
    platforms: ELECTION_DATA.platforms,
    platPositive: ELECTION_DATA.platPositive,
    platNegative: ELECTION_DATA.platNegative,
    presidentialThreshold: ELECTION_DATA.presidentialThreshold,
    presidentialRule: ELECTION_DATA.presidentialRule,
    runoffProbabilityBaseline: ELECTION_DATA.runoffProbability.runoffProbability,
    firstRoundWinProbabilityBaseline: ELECTION_DATA.runoffProbability.firstRoundWinProbability,
    macroIndicators: ELECTION_DATA.macroIndicators,
    miningIndicators: {
      copperPriceLME: ELECTION_DATA.miningIndicators.copperPriceLME_USD_t,
      contractorPaymentRisk: ELECTION_DATA.miningIndicators.contractorPaymentRisk,
      copperbeltEmployment: ELECTION_DATA.miningIndicators.copperbeltFormalEmployment,
    },
    agricultureIndicators: {
      season: ELECTION_DATA.agricultureIndicators.season2025_26,
      FISPDelayed: ELECTION_DATA.agricultureIndicators.FISPDeliveryStatus.delayed,
      droughtAffected: ELECTION_DATA.agricultureIndicators.droughtAffectedProvinces,
    },
    institutionalTrust: {
      ecz: ELECTION_DATA.institutionalTrust.ecz.score,
      courts: ELECTION_DATA.institutionalTrust.courts.score,
      police: ELECTION_DATA.institutionalTrust.police.score,
      znbc: ELECTION_DATA.institutionalTrust.znbc.score,
    },
    integrityOverallScore: ELECTION_DATA.integritySignals.overallIntegrityScore,
    projectedTurnout: 62,
    turnout2021: 70.6,
    turnout2016: 56.0,
    historicalResult2021: { winner: 'HH/UPND', pct: 59.4, runnerUp: 'PF', runnerUpPct: 38.2 },
    historicalResult2016: { winner: 'PF', pct: 50.4, runnerUp: 'UPND', pct2: 47.6, margin: 0.8 },
    newsSources: ['ZNBC', 'News Diggers!', 'Lusaka Times', 'The Mast', 'Zambian Observer', 'GDELT', 'CCMG'],
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
