// app/lib/historical.ts
// Real ECZ presidential results — PUBLIC RECORD, for calibration only.
// Sources: Electoral Commission of Zambia official results (elections.org.zm);
// EISA Journal of African Elections Vol.20 No.2 (2021); ECZ gazette figures.
// Percentages are share of valid votes cast. This is HISTORICAL FACT, not a forecast.

export interface HistoricalCandidate {
  name: string
  party: string
  pct: number
  votes?: number
}

export interface HistoricalResult {
  year: number
  date: string
  registeredVoters: number
  turnoutPct: number
  winnerParty: string
  decidedFirstRound: boolean
  marginPct: number
  candidates: HistoricalCandidate[]
  provinceWinnerParty?: Record<string, string>
  note: string
}

export const HISTORICAL_RESULTS: HistoricalResult[] = [
  {
    year: 2021,
    date: '2021-08-12',
    registeredVoters: 7023499,
    turnoutPct: 70.61,
    winnerParty: 'UPND',
    decidedFirstRound: true,
    marginPct: 20.69,
    candidates: [
      { name: 'Hakainde Hichilema', party: 'UPND', pct: 59.02, votes: 2852348 },
      { name: 'Edgar Lungu', party: 'PF', pct: 38.33, votes: 1870780 },
      { name: 'Others (14 candidates)', party: 'Various', pct: 2.65 },
    ],
    provinceWinnerParty: {
      Central: 'UPND', Copperbelt: 'UPND', Lusaka: 'UPND',
      'North-Western': 'UPND', Southern: 'UPND', Western: 'UPND',
      Eastern: 'PF', Luapula: 'PF', Muchinga: 'PF', Northern: 'PF',
    },
    note: 'Landslide / regime-change cycle: Lungu-fatigue + cost-of-living + record youth turnout. HH took the Lusaka and Copperbelt swing provinces. Discount 10-15pt for incumbency-fatigue before using as a 2026 baseline.',
  },
  {
    year: 2016,
    date: '2016-08-11',
    registeredVoters: 6698372,
    turnoutPct: 56.45,
    winnerParty: 'PF',
    decidedFirstRound: true,
    marginPct: 2.72,
    candidates: [
      { name: 'Edgar Lungu', party: 'PF', pct: 50.35 },
      { name: 'Hakainde Hichilema', party: 'UPND', pct: 47.63 },
      { name: 'Others', party: 'Various', pct: 2.02 },
    ],
    note: 'The closest modern contest — PF cleared 50%+1 by ~13,000 votes, narrowly avoiding a runoff. The most instructive calibration baseline for a competitive 2026 50%+1 race.',
  },
  {
    year: 2011,
    date: '2011-09-20',
    registeredVoters: 5167154,
    turnoutPct: 53.65,
    winnerParty: 'PF',
    decidedFirstRound: true,
    marginPct: 6.90,
    candidates: [
      { name: 'Michael Sata', party: 'PF', pct: 43.0, votes: 1150045 },
      { name: 'Rupiah Banda', party: 'MMD', pct: 36.1, votes: 961796 },
      { name: 'Hakainde Hichilema', party: 'UPND', pct: 18.3, votes: 489838 },
    ],
    note: 'Urban-populist PF breakthrough; incumbent MMD unseated under economic strain. Plurality system pre-2016 (no 50%+1 rule). Best analogue for an incumbent loss.',
  },
]

// 2026 official reference figures (ECZ).
export const REGISTER_2026 = 8786300
export const CONSTITUENCIES_2026 = 226
export const NEW_CONSTITUENCIES_2026 = 70
export const ELECTION_DATE_2026 = '2026-08-13'
export const PRESIDENTIAL_THRESHOLD = 50 // must exceed 50% of valid votes for a first-round win
