ts// app/lib/forecast.ts
// Monte Carlo runoff-probability engine for the Zambia 2026 presidential race.
// Pure functions, no dependencies. The output is a MODEL SIMULATION over assumed
// inputs and uncertainty — it is NOT a forecast of the actual election result.

export interface ForecastLevers {
  upnd: number
  bmmz: number
  kalaba: number
  membe: number
  kateka: number
  undecided: number
  turnout: number
  undecidedToUpnd: number
  kalabaTransferToUpnd: number
  membeTransferToUpnd: number
  katekaTransferToUpnd: number
  economicDrag: number
  uncertainty: number
}

export interface ForecastResult {
  adjustedUpnd: number
  adjustedBmmz: number
  firstRoundWinPct: number
  runoffPct: number
  firstRoundTrailPct: number
  ci80: [number, number]
  ci95: [number, number]
  runoffUpnd: number
  runoffBmmz: number
  runoffWinProbUpnd: number
  iterations: number
}

const THRESHOLD = 50

function gaussian(mean: number, sd: number): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return mean + z * sd
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = clamp(Math.floor((p / 100) * (sorted.length - 1)), 0, sorted.length - 1)
  return sorted[idx]
}

export function runForecast(l: ForecastLevers, iterations = 6000): ForecastResult {
  const undToUpnd = l.undecided * (l.undecidedToUpnd / 100)
  const undToOthers = l.undecided - undToUpnd
  const oppPool = (l.bmmz + l.kalaba + l.membe + l.kateka) || 1
  const bmmzShareOfOpp = l.bmmz / oppPool

  const turnoutEffect = (l.turnout - 62) * 0.12

  const upndMean = clamp(l.upnd + undToUpnd + turnoutEffect - l.economicDrag)
  const bmmzMean = clamp(l.bmmz + undToOthers * bmmzShareOfOpp + l.economicDrag * 0.7)

  let firstRoundWins = 0
  let runoffs = 0
  let trails = 0
  const samples: number[] = new Array(iterations)
  for (let i = 0; i < iterations; i++) {
    const draw = clamp(gaussian(upndMean, l.uncertainty))
    samples[i] = draw
    if (draw >= THRESHOLD) {
      firstRoundWins++
    } else {
      runoffs++
      if (draw < bmmzMean) trails++
    }
  }
  samples.sort((a, b) => a - b)

  const runoffUpndRaw =
    l.upnd + turnoutEffect - l.economicDrag +
    l.kalaba * (l.kalabaTransferToUpnd / 100) +
    l.membe * (l.membeTransferToUpnd / 100) +
    l.kateka * (l.katekaTransferToUpnd / 100) +
    l.undecided * (l.undecidedToUpnd / 100)
  const runoffBmmzRaw =
    l.bmmz + l.economicDrag * 0.7 +
    l.kalaba * (1 - l.kalabaTransferToUpnd / 100) +
    l.membe * (1 - l.membeTransferToUpnd / 100) +
    l.kateka * (1 - l.katekaTransferToUpnd / 100) +
    l.undecided * (1 - l.undecidedToUpnd / 100)
  const runoffTotal = (runoffUpndRaw + runoffBmmzRaw) || 1
  const runoffUpnd = (runoffUpndRaw / runoffTotal) * 100
  const runoffBmmz = (runoffBmmzRaw / runoffTotal) * 100

  let runoffUpndWins = 0
  for (let i = 0; i < iterations; i++) {
    if (gaussian(runoffUpnd, l.uncertainty) >= THRESHOLD) runoffUpndWins++
  }

  return {
    adjustedUpnd: round1(upndMean),
    adjustedBmmz: round1(bmmzMean),
    firstRoundWinPct: round1((firstRoundWins / iterations) * 100),
    runoffPct: round1((runoffs / iterations) * 100),
    firstRoundTrailPct: round1((trails / iterations) * 100),
    ci80: [round1(percentile(samples, 10)), round1(percentile(samples, 90))],
    ci95: [round1(percentile(samples, 2.5)), round1(percentile(samples, 97.5))],
    runoffUpnd: round1(runoffUpnd),
    runoffBmmz: round1(runoffBmmz),
    runoffWinProbUpnd: round1((runoffUpndWins / iterations) * 100),
    iterations,
  }
}

export const DEFAULT_LEVERS: ForecastLevers = {
  upnd: 47.2,
  bmmz: 20.3,
  kalaba: 3.8,
  membe: 4.1,
  kateka: 1.6,
  undecided: 6.0,
  turnout: 62,
  undecidedToUpnd: 25,
  kalabaTransferToUpnd: 32,
  membeTransferToUpnd: 38,
  katekaTransferToUpnd: 60,
  economicDrag: 0,
  uncertainty: 3.0,
}

export interface ScenarioPreset {
  id: string
  name: string
  description: string
  levers: Partial<ForecastLevers>
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  { id: 'base', name: 'Base case', description: 'Current model assumptions, central turnout 62%.', levers: {} },
  { id: 'high_youth', name: 'High youth turnout', description: 'Youth mobilisation lifts turnout to 70% and breaks undecideds toward UPND.', levers: { turnout: 70, undecidedToUpnd: 50 } },
  { id: 'low_turnout', name: 'Low-turnout machine election', description: '2016-style 56% turnout favours opposition northern ground structures.', levers: { turnout: 56, undecidedToUpnd: 38, economicDrag: 5.5 } },
  { id: 'econ_pain', name: 'Economic pain', description: 'Mealie-meal, fuel and load-shedding anger deepen the drag on UPND.', levers: { economicDrag: 7.0, undecidedToUpnd: 36 } },
  { id: 'opp_consolidation', name: 'Opposition consolidation', description: 'BM/MZ + Kalaba + part of SP align; runoff transfers swing hard to the opposition.', levers: { kalabaTransferToUpnd: 18, membeTransferToUpnd: 25, economicDrag: 5.5, undecidedToUpnd: 38 } },
  { id: 'strong_incumbent', name: 'Strong incumbent mobilisation', description: 'Relief delivery + CDF visibility + copper recovery before 13 Aug.', levers: { economicDrag: -1.5, undecidedToUpnd: 52, turnout: 66 } },
]
