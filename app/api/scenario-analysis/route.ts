import { NextRequest, NextResponse } from 'next/server'
import { ELECTION_DATA } from '@/app/lib/data'

// ── Multi-Agent Scenario Analysis API ──────────────────────────────────────
// Five specialised agents each analyse a different lens of the 2026 Zambia
// election. Agents share a common data snapshot and can be called individually
// or all-at-once.

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN  = process.env.CLOUDFLARE_API_TOKEN
const CF_MODEL      = '@cf/meta/llama-3.1-8b-instruct'

async function callAI(prompt: string): Promise<string | null> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) return null
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an expert Zambia political analyst. Return one valid JSON object. No markdown.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 800,
        temperature: 0.25,
      }),
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data?.result?.response ?? null
}

// ── Shared electoral snapshot ─────────────────────────────────────────────
function buildSnapshot(body: Record<string, unknown>) {
  const D = ELECTION_DATA
  return {
    electionDate: D.electionDate,
    voterTotal: D.voterTotal,
    constituencies: D.constituencies,
    presidentialThreshold: 50,
    presidentialRule: D.presidentialRule,

    // Post-nomination polls
    upnd:    body.upnd    ?? D.nationalPoll.upnd,
    bm_mz:   body.bm_mz  ?? D.nationalPoll.mundubile_tonse,
    kalaba:  body.kalaba  ?? D.nationalPoll.kalaba_cf,
    membe:   body.membe   ?? D.nationalPoll.membe_sp,
    kateka:  body.kateka  ?? D.nationalPoll.kateka_nhp,
    undecided: D.nationalPoll.others_undecided,

    // Economic
    inflation:      D.macroIndicators.inflation,
    bozRate:        D.macroIndicators.bozPolicyRate,
    kwachaUSD:      D.macroIndicators.kwachaUSD,
    gdpGrowth:      D.macroIndicators.gdpGrowth,
    youthUnemploy:  D.macroIndicators.unemploymentYouth,
    mealMealKwacha: D.macroIndicators.mealMealPriceK,

    // Provinces (summary)
    provinces: D.provinces.map(p => ({
      name: p.name, upnd: p.upnd, pf: p.pf,
      lean: p.lean, voters: p.voters, confidence: p.confidence,
    })),

    // Turnout history
    turnout2021: 70.6,
    turnout2016: 56.0,
    projectedTurnout: 62,

    // Historical
    result2021: { hh: 59.4, pf: 38.2 },
    result2016: { pf: 50.4, upnd: 47.6 },

    // Integrity
    integrityScore: ELECTION_DATA.integritySignals?.overallIntegrityScore ?? 65,
    eczTrust: ELECTION_DATA.institutionalTrust?.ecz?.score ?? 62,

    // Scenario context
    phase: 'POST-NOMINATION — confirmed field, campaign phase active',
    daysToElection: Math.round((new Date('2026-08-13').getTime() - Date.now()) / 86400000),
  }
}

// ── Agent 1: ORACLE — Probabilistic Forecaster ───────────────────────────
function oraclePrompt(s: ReturnType<typeof buildSnapshot>) {
  return `
You are ORACLE — Probabilistic Forecaster. Zambia 2026 election. Today is post-nomination.
Data: ${JSON.stringify(s)}

Run Monte Carlo logic:
1. P(UPND first-round win) = P(UPND > 50%). Baseline: UPND=${s.upnd}%, threshold=50%, assume ±2pt std.
2. P(Runoff) = P(UPND ≤ 50%). In runoff, model BM/MZ consolidation + Kalaba/M'membe transfers.
3. P(UPND loses first round badly) = P(UPND < 44%).
4. Key swing variables: turnout (low=55% vs high=70%), undecided split (60/40 vs 40/60 UPND), Kalaba CF transfer (70% opp vs 30% UPND).
5. Give separate probability columns for: LOW turnout scenario, BASE scenario, HIGH turnout scenario.
6. Identify the single province whose result swings first-round vs runoff outcome.

Return JSON: {
  "verdict": "FIRST_ROUND_RISK"|"RUNOFF_LIKELY"|"LOSS_RISK",
  "firstRoundWinPct": <number 0-100>,
  "runoffPct": <number 0-100>,
  "lossPct": <number 0-100>,
  "lowTurnoutFirstRound": <number>,
  "baseTurnoutFirstRound": <number>,
  "highTurnoutFirstRound": <number>,
  "pivotProvince": "<string>",
  "pivotReason": "<string>",
  "runoffTransferSummary": "<string>",
  "keyInsight": "<1 sentence>",
  "recommendations": ["<rec1>","<rec2>","<rec3>"]
}`
}

// ── Agent 2: STRATEGIS — Campaign Strategist ─────────────────────────────
function strategisPrompt(s: ReturnType<typeof buildSnapshot>) {
  return `
You are STRATEGIS — Campaign Strategy Advisor. Zambia 2026. Field confirmed post-nomination.
Data: ${JSON.stringify(s)}

Provide province-by-province targeting strategy for UPND to clear 50%+1:
1. Tier provinces: DEFEND (anchors), CONTEST (battlegrounds), CONCEDE (opposition locks).
2. For each battleground: recommend the #1 tactical action to move 2-3pt.
3. Calculate minimum voter targets for first-round win: if UPND at ${s.upnd}%, needs (50%-${s.upnd}%) * ${s.voterTotal} more net votes.
4. Priority messaging: which issue is most movable in each tier?
5. Ground game: where must UPND deploy polling agents to prevent result manipulation?
6. Time allocation: with ${s.daysToElection} days to election, allocate campaign time as % per province tier.

Return JSON: {
  "verdict": "ON_TRACK"|"NEEDS_WORK"|"CRITICAL",
  "netVotesNeeded": <number>,
  "defenseProvinces": ["<p1>","<p2>"],
  "contestProvinces": ["<p1>","<p2>"],
  "concedeProvinces": ["<p1>","<p2>"],
  "topThreeActions": ["<action1>","<action2>","<action3>"],
  "timeAllocation": {"defend": <pct>, "contest": <pct>, "concede": <pct>},
  "pivotMessage": "<the single message that moves battleground voters>",
  "biggestRisk": "<1 sentence>",
  "keyInsight": "<1 sentence>"
}`
}

// ── Agent 3: SENTINEX — Risk & Integrity Monitor ─────────────────────────
function sentinexPrompt(s: ReturnType<typeof buildSnapshot>) {
  return `
You are SENTINEX — Electoral Risk & Integrity Monitor. Zambia 2026.
Data: ${JSON.stringify(s)}

Assess 6 risk categories:
1. Vote-count manipulation risk (polling agent coverage, result transmission, parallel vote tabulation)
2. Voter suppression risk (party cadres, intimidation, transport denial in opposition areas)
3. Disinformation risk (fake result announcements, WhatsApp rumors, social media manipulation)
4. Legal/petition risk (margin below 2% triggers ConCourt petition — 7 day window)
5. Violence risk (post-election protest, cadre activity)
6. Institutional bias risk (ZNBC, state resources, ECZ impartiality)

Assign each category: LOW / MEDIUM / HIGH risk + specific mitigation.

Return JSON: {
  "overallRisk": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
  "overallScore": <0-100>,
  "risks": [
    {"category":"Vote Manipulation","level":"LOW"|"MEDIUM"|"HIGH","detail":"<string>","mitigation":"<string>"},
    {"category":"Voter Suppression","level":"...","detail":"...","mitigation":"..."},
    {"category":"Disinformation","level":"...","detail":"...","mitigation":"..."},
    {"category":"Legal/Petition","level":"...","detail":"...","mitigation":"..."},
    {"category":"Post-Election Violence","level":"...","detail":"...","mitigation":"..."},
    {"category":"Institutional Bias","level":"...","detail":"...","mitigation":"..."}
  ],
  "alertProvince": "<most at-risk province>",
  "keyInsight": "<1 sentence>",
  "watchList": ["<item1>","<item2>","<item3>"]
}`
}

// ── Agent 4: ECONOMIST — Economic Vote Impact Analyst ────────────────────
function economistPrompt(s: ReturnType<typeof buildSnapshot>) {
  return `
You are ECONOMIST — Economic Conditions Vote Impact Analyst. Zambia 2026.
Data: ${JSON.stringify(s)}

Model how each economic indicator shifts voting probability:
1. Inflation ${s.inflation}%: impact on UPND vote share province by province.
2. Mealie meal K${s.mealMealKwacha}/25kg: % of households above affordability threshold; electoral anger index.
3. Kwacha at K${s.kwachaUSD}/USD: import cost pass-through to food/fuel; urban voter impact.
4. Youth unemployment ${s.youthUnemploy}%: probability of youth voter turnout drop; UPND risk.
5. GDP growth ${s.gdpGrowth}%: does macro growth penetrate to household level? Model gap.
6. Load shedding (not in direct data — estimate from context): SME survival pressure in Lusaka/Copperbelt.
7. Copper price recovery: does it create jobs fast enough to move Copperbelt by election day?

Provide vote-impact estimates in percentage points per indicator.

Return JSON: {
  "overallEconomicPressure": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
  "netEconomicDrag": <number pts drag on UPND>,
  "indicators": [
    {"name":"Inflation","value":"${s.inflation}%","voteImpact":<pts>,"affectedProvinces":["<p1>"],"direction":"DRAG"|"BOOST"},
    {"name":"Mealie Meal","value":"K${s.mealMealKwacha}","voteImpact":<pts>,"affectedProvinces":["<p1>"],"direction":"DRAG"|"BOOST"},
    {"name":"Kwacha","value":"K${s.kwachaUSD}","voteImpact":<pts>,"affectedProvinces":["<p1>"],"direction":"DRAG"|"BOOST"},
    {"name":"Youth Unemployment","value":"${s.youthUnemploy}%","voteImpact":<pts>,"affectedProvinces":["<p1>"],"direction":"DRAG"|"BOOST"},
    {"name":"Load Shedding","value":"est. 8-14hrs","voteImpact":<pts>,"affectedProvinces":["<p1>"],"direction":"DRAG"|"BOOST"},
    {"name":"Copper Price","value":"$9,200/t","voteImpact":<pts>,"affectedProvinces":["<p1>"],"direction":"DRAG"|"BOOST"}
  ],
  "adjustedUPND": <upnd pct after economic drag>,
  "keyInsight": "<1 sentence>",
  "relief": "<the single fastest economic relief action and its vote impact>"
}`
}

// ── Agent 5: COALITION — Alliance Dynamics Analyst ───────────────────────
function coalitionPrompt(s: ReturnType<typeof buildSnapshot>) {
  return `
You are COALITION — Alliance & Vote Transfer Analyst. Zambia 2026. Post-nomination.
Data: ${JSON.stringify(s)}

Model vote transfer and coalition mathematics:
1. Runoff scenario: UPND ${s.upnd}% vs BM/MZ ${s.bm_mz}%. Who wins the runoff and by how much?
2. Kalaba CF (${s.kalaba}%): in runoff, what % transfers to BM/MZ vs UPND? Which provinces?
3. M'membe SP (${s.membe}%): urban youth — runoff transfer split?
4. Kateka NHP (${s.kateka}%): governance reform voters — transfer direction?
5. Undecided ${s.undecided}%: in first round, what's the expected split?
6. Northern/Luapula/Muchinga consolidation: what % of ward-level PF structures activate for BM/MZ? What does this do to BM/MZ share in these provinces?
7. Makebi Zulu running-mate effect: % vote transfer from Eastern PF/Makebi networks?

Return JSON: {
  "firstRoundCall": "UPND_WIN"|"RUNOFF"|"CLOSE_RACE",
  "runoffWinner": "UPND"|"BM_MZ"|"TOO_CLOSE",
  "runoffUPND": <pct>,
  "runoffBMMZ": <pct>,
  "kalabaTransfer": {"toUPND":<pct>,"toBMMZ":<pct>},
  "membeTransfer": {"toUPND":<pct>,"toBMMZ":<pct>},
  "undecidedSplit": {"toUPND":<pct>,"toBMMZ":<pct>,"abstain":<pct>},
  "northernConsolidation": "<estimate of PF structure activation %>",
  "makebiBonusEastern": "<vote bonus estimate>",
  "criticalAlliance": "<the single alliance move that changes the outcome>",
  "keyInsight": "<1 sentence>"
}`
}

// ── Demo responses when no Cloudflare creds ──────────────────────────────
function demoResponses(snap: ReturnType<typeof buildSnapshot>) {
  const upnd = snap.upnd as number
  const bm   = snap.bm_mz as number
  const ts   = new Date().toISOString()

  return {
    oracle: {
      verdict: 'RUNOFF_LIKELY',
      firstRoundWinPct: 34,
      runoffPct: 61,
      lossPct: 5,
      lowTurnoutFirstRound: 28,
      baseTurnoutFirstRound: 34,
      highTurnoutFirstRound: 44,
      pivotProvince: 'Copperbelt',
      pivotReason: 'Copperbelt swings the aggregate by ±3pt depending on mine-job sentiment and turnout',
      runoffTransferSummary: `In runoff: Kalaba 70% to BM/MZ, M'membe 55% to BM/MZ, Kateka 60% to UPND. Projected runoff: UPND 52.1% vs BM/MZ 47.9%.`,
      keyInsight: `At ${upnd.toFixed(1)}%, UPND needs 3.2pt more to clear the threshold — achievable but not guaranteed.`,
      recommendations: [
        'Deploy ground game in Lusaka/Copperbelt to convert undecideds in final 60 days',
        'Mealie meal relief announcement before July 2026 to shift 1-2pt in urban provinces',
        'Youth turnout drive targeting 18-30 cohort in Lusaka, Kabwe, Kitwe, Ndola',
      ],
      timestamp: ts,
    },
    strategis: {
      verdict: 'NEEDS_WORK',
      netVotesNeeded: Math.round((50.1 - upnd) / 100 * snap.voterTotal),
      defenseProvinces: ['Southern', 'Western', 'North-Western'],
      contestProvinces: ['Lusaka', 'Copperbelt', 'Central'],
      concedeProvinces: ['Northern', 'Luapula', 'Muchinga', 'Eastern'],
      topThreeActions: [
        'Mealie meal/fuel price relief visible in Lusaka markets before Aug 13',
        'Zesco load-shedding reduction schedule announced with measurable targets',
        'Northern Province tour by HH with constituency-level CDF delivery evidence',
      ],
      timeAllocation: { defend: 20, contest: 65, concede: 15 },
      pivotMessage: 'You built it — protect it. Free education, kwacha stability, roads. The alternative is untested.',
      biggestRisk: 'Urban cost-of-living anger in Lusaka/Copperbelt turning abstention into 3-4pt net UPND loss',
      keyInsight: `${Math.round((50.1 - upnd) / 100 * snap.voterTotal).toLocaleString()} net votes separate UPND from a first-round win.`,
      timestamp: ts,
    },
    sentinex: {
      overallRisk: 'MEDIUM',
      overallScore: 62,
      risks: [
        { category: 'Vote Manipulation', level: 'LOW', detail: 'ECZ e-results system reduces tabulation manipulation risk vs 2016', mitigation: 'Deploy polling agents in all 226 constituencies — Northern and Luapula are priority' },
        { category: 'Voter Suppression', level: 'MEDIUM', detail: 'Historical cadre intimidation in Northern/Luapula opposition strongholds and UPND areas', mitigation: 'CCMG and ZAFES observer saturation in flagged constituencies' },
        { category: 'Disinformation', level: 'HIGH', detail: 'WhatsApp fake result announcements in 2021 — repeat risk high; early vote-count narratives can trigger unrest', mitigation: 'Rapid-response desk live from ECZ Announcement Centre; pre-brief media on result timing' },
        { category: 'Legal/Petition', level: 'HIGH', detail: `Margin below 2% triggers ConCourt petition. UPND at ${upnd.toFixed(1)}% — any result under 50%+1 by <2pt is petition territory`, mitigation: 'Legal team on standby; documentation of anomalies province by province; parallel vote tabulation' },
        { category: 'Post-Election Violence', level: 'LOW', detail: 'Historical pattern: violence spikes within 72 hours of a disputed result', mitigation: 'Pre-deploy CCMG observers and civil society monitors in flashpoint areas' },
        { category: 'Institutional Bias', level: 'MEDIUM', detail: 'ZNBC access imbalance confirmed; state resources visible in campaign', mitigation: 'Media access complaints to ECZ; independent audit of airtime distribution' },
      ],
      alertProvince: 'Northern',
      keyInsight: 'Disinformation and legal/petition risk are the two most material threats given the current 47% baseline.',
      watchList: ['WhatsApp fake-result chains in Northern/Copperbelt', 'ECZ parallel tabulation transparency', 'Polling agent deployment completeness'],
      timestamp: ts,
    },
    economist: {
      overallEconomicPressure: 'HIGH',
      netEconomicDrag: -4.2,
      indicators: [
        { name: 'Inflation', value: `${snap.inflation}%`, voteImpact: -1.2, affectedProvinces: ['Lusaka', 'Copperbelt'], direction: 'DRAG' },
        { name: 'Mealie Meal', value: `K${snap.mealMealKwacha}`, voteImpact: -1.8, affectedProvinces: ['Lusaka', 'Copperbelt', 'Central'], direction: 'DRAG' },
        { name: 'Kwacha', value: `K${snap.kwachaUSD}/USD`, voteImpact: -0.6, affectedProvinces: ['Lusaka', 'Copperbelt'], direction: 'DRAG' },
        { name: 'Youth Unemployment', value: `${snap.youthUnemploy}%`, voteImpact: -1.4, affectedProvinces: ['Lusaka', 'Copperbelt', 'North-Western'], direction: 'DRAG' },
        { name: 'Load Shedding', value: 'est. 8–14hrs/day', voteImpact: -1.5, affectedProvinces: ['Lusaka', 'Copperbelt', 'Central'], direction: 'DRAG' },
        { name: 'Copper Price', value: '$9,200/t', voteImpact: +0.8, affectedProvinces: ['Copperbelt', 'North-Western'], direction: 'BOOST' },
        { name: 'Free Education', value: 'Universal', voteImpact: +1.5, affectedProvinces: ['Southern', 'Western', 'Eastern'], direction: 'BOOST' },
      ],
      adjustedUPND: upnd - 4.2 + 2.3,
      keyInsight: 'Net economic drag is approximately -4.2pt against UPND; free education and copper recovery partially offset this.',
      relief: 'Mealie meal subsidy or strategic grain release in Aug 2026 = estimated +1.8pt urban UPND recovery',
      timestamp: ts,
    },
    coalition: {
      firstRoundCall: upnd > 50 ? 'UPND_WIN' : 'RUNOFF',
      runoffWinner: 'UPND',
      runoffUPND: 52.4,
      runoffBMMZ: 47.6,
      kalabaTransfer: { toUPND: 32, toBMMZ: 68 },
      membeTransfer: { toUPND: 38, toBMMZ: 62 },
      undecidedSplit: { toUPND: 44, toBMMZ: 40, abstain: 16 },
      northernConsolidation: `Est. 72% of PF ward branch structures in Northern/Luapula/Muchinga activating for BM/MZ. This boosts BM/MZ by ~2.5pt in those provinces.`,
      makebiBonusEastern: `Makebi Zulu running-mate effect: est. +4–6pt for opposition in Eastern Province vs baseline. Model now gives BM/MZ 44% in Eastern.`,
      criticalAlliance: `If Kalaba formally endorses BM/MZ before Aug 13, Luapula CF pockets (est. 8,000 votes) shift decisively to opposition — moves Luapula from 49% to 52% for opposition.`,
      keyInsight: `Even with runoff, UPND holds an advantage as Kateka\'s governance voters (60%) split toward UPND in a second round.`,
      timestamp: ts,
    },
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const agent: string = body.agent ?? 'all'
    const snap = buildSnapshot(body)

    // Try AI, fall back to demo
    async function runAgent(agentId: string) {
      let prompt: string
      switch (agentId) {
        case 'oracle':    prompt = oraclePrompt(snap);    break
        case 'strategis': prompt = strategisPrompt(snap); break
        case 'sentinex':  prompt = sentinexPrompt(snap);  break
        case 'economist': prompt = economistPrompt(snap); break
        case 'coalition': prompt = coalitionPrompt(snap); break
        default: return null
      }
      const raw = await callAI(prompt)
      if (!raw) return null
      try {
        return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
      } catch { return null }
    }

    const demo = demoResponses(snap)

    if (agent === 'all') {
      const [oracle, strategis, sentinex, economist, coalition] = await Promise.all([
        runAgent('oracle'), runAgent('strategis'), runAgent('sentinex'),
        runAgent('economist'), runAgent('coalition'),
      ])
      return NextResponse.json({
        success: true,
        mode: oracle ? 'ai' : 'demo',
        timestamp: new Date().toISOString(),
        daysToElection: snap.daysToElection,
        snapshot: { upnd: snap.upnd, bm_mz: snap.bm_mz, kalaba: snap.kalaba, membe: snap.membe },
        oracle:    oracle    ?? demo.oracle,
        strategis: strategis ?? demo.strategis,
        sentinex:  sentinex  ?? demo.sentinex,
        economist: economist ?? demo.economist,
        coalition: coalition ?? demo.coalition,
      })
    }

    const result = await runAgent(agent) ?? demo[agent as keyof typeof demo]
    return NextResponse.json({
      success: true,
      agent,
      mode: (await callAI('{}')) ? 'ai' : 'demo',
      timestamp: new Date().toISOString(),
      result,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
