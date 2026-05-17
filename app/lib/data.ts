// Zambia Election Intelligence Data 2026
// SentimentCommand Platform — verified election facts plus clearly labelled model estimates.
// Baseline checked against ECZ, Zambian constitutional calendar, ZamStats, BoZ, World Bank, and current public reporting on 2026 alliances.

export const ELECTION_DATA = {
  electionDate: '2026-08-13',
  voterTotal: 8786300,
  constituencies: 226,
  districts: 116,
  wards: 1858,
  aiConfidence: 72,

  // ── Macroeconomic Context (ZamStats / Bank of Zambia) ──
  macroIndicators: {
    inflation: 6.8,           // ZamStats CPI April 2026 (%)
    bozPolicyRate: 13.25,     // Bank of Zambia Monetary Policy Rate, May 2026 (%)
    kwachaUSD: 26.8,          // Kwacha per USD (approx)
    gdpGrowth: 4.2,           // World Bank projected GDP growth 2026 (%)
    unemploymentYouth: 32.6,  // 2024 Labour Force Survey: highest youth cohort, age 19-22 (%)
    mealMealPriceK: 400,      // Approx price 25kg bag in Kwacha
  },

  // ── Key Political Figures (HH + 4 opposition) ──
  figures: [
    {
      id: 'hh',
      name: 'Hakainde Hichilema',
      shortName: 'HH',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Hakainde_Hichilema_2022_%28cropped%29.jpg/330px-Hakainde_Hichilema_2022_%28cropped%29.jpg',
      role: 'President of Zambia · UPND presidential candidate · INCUMBENT',
      party: 'UPND',
      age: 62,
      poll: 47.2,
      trend: +0.4,
      color: '#FF6B00',
      stronghold: 'Southern, Western, North-Western',
      weakness: 'Cost of living, load shedding, rural north',
      aiScore: 72,
      biography: 'Businessman-turned-president. Won the 2021 election with about 59% of the presidential vote on his sixth attempt. UPND confirmed him as its 2026 presidential candidate.',
      socialHandle: '@HHichilema',
      sentimentScore: 58,
      facebookPage: 'HakaindehichilemaHH',
      narrative: 'Supporters credit HH for kwacha stabilisation, free education and infrastructure, but face intense backlash over electricity load shedding and mealie meal prices. The incumbent advantage is real but under pressure.',
      quotedPosts: [
        { src: 'Facebook · HH Official Page', text: 'Thank you Mr President for the free education. My three children are in school this year for the first time. God bless you HH. 🙏' },
        { src: 'Facebook · Lusaka Discuss Group', text: 'HH promised us change but electricity goes 18 hours a day. What kind of change is this? Mealie meal is K400 a 25kg bag. Very disappointing.' },
        { src: 'Twitter/X · Zambia Politics', text: 'Kwacha is now at K26.8 to the dollar. Compare to K23 when UPND took over. Progress is slow but the trajectory is right. @HHichilema must communicate better.' },
        { src: 'WhatsApp · Copperbelt Group', text: 'UPND gave us free education but took our jobs. The mines are not hiring. Ndola is suffering. We need action not speeches.' },
      ],
    },
    {
      id: 'pf_ndc',
      name: 'Brian Mundubile + Makebi Zulu',
      shortName: 'BM/MZ',
      photo: '/candidates/mundubile.jpg',
      role: 'Tonse Alliance figure · former PF MP · opposition lane',
      party: 'Tonse / PF-Pamodzi cooperation',
      age: 55,
      poll: 20.3,
      trend: +2.3,
      color: '#CC0000',
      stronghold: 'Northern, Luapula, Muchinga, Copperbelt Urban',
      weakness: 'Formal ticket filings, alliance cohesion, limited southern presence',
      aiScore: 42,
      biography: 'Brian Mundubile is a former PF MP and Tonse Alliance figure. Current public reporting points to shifting opposition ticket arrangements around Tonse/FDD/NRPUP and PF/Pamodzi discussions, so this dashboard treats the lane as an opposition model estimate rather than an ECZ-certified ticket.',
      socialHandle: '@BrianMundubile · Tonse Alliance',
      sentimentScore: 62,
      facebookPage: 'BrianMundubile',
      narrative: 'The Mundubile-Makebi lane is the most visible PF-linked northern/eastern opposition challenge in the model. The strategic upside is vote consolidation; the risk is legal vehicle clarity, formal nomination paperwork and whether local PF structures move together.',
      quotedPosts: [
        { src: 'Facebook · Opposition supporter sample', text: 'Mundubile has the northern base and the opposition must unite quickly before nominations close.' },
        { src: 'Facebook · Luapula Province Group', text: 'Brian Mundubile visited Samfya last week. The reception was overwhelming. People are tired and ready for change. Even former UPND supporters are switching.' },
        { src: 'Twitter/X · ZambiaElection2026', text: 'Opposition fragmentation is the issue. Mundubile, Makebi and other PF-linked structures need one lane or HH benefits.' },
        { src: 'Facebook · Ndola Youth Forum', text: 'The northern vote is open, but the legal and party fights are confusing voters.' },
      ],
    },
    {
      id: 'kalaba',
      name: 'Harry Kalaba',
      shortName: 'HK',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/V%C3%A4lisminister_Sven_Mikser_ja_Sambia_v%C3%A4lisminister_Harry_Kalaba_%2831719036133%29.jpg/330px-V%C3%A4lisminister_Sven_Mikser_ja_Sambia_v%C3%A4lisminister_Harry_Kalaba_%2831719036133%29.jpg',
      role: 'Citizens First / CF Orange Alliance · former Foreign Affairs Minister',
      party: 'CF Orange Alliance',
      age: 49,
      poll: 3.8,
      trend: -0.2,
      color: '#27AE60',
      stronghold: 'Luapula, Eastern Province (pockets)',
      weakness: 'Funding, national reach, squeezed by larger opposition blocs',
      aiScore: 18,
      biography: 'Former PF cabinet minister and 2021 DP presidential candidate. He left DP and now leads Citizens First; NDC and RDC backed him in the CF Orange Alliance for 2026.',
      socialHandle: '@HarryKalaba',
      sentimentScore: 55,
      facebookPage: 'HarryKalaba',
      narrative: 'Kalaba is respected as principled and now runs under the Citizens First / CF Orange Alliance lane. His 2026 challenge is converting personal credibility into national machinery.',
      quotedPosts: [
        { src: 'Facebook · Harry Kalaba supporter sample', text: 'Kalaba speaks about integrity and Citizens First is building an orange alliance for 2026.' },
        { src: 'Facebook · Luapula Political Talk', text: 'Kalaba is a good man but too small to win. He should join with Mundubile. Together they can beat UPND in 2026. Alone, votes go to waste.' },
        { src: 'Twitter/X · ZambiaAnalysis', text: 'Kalaba has credibility, but CF Orange Alliance needs visibility outside Luapula and urban policy circles.' },
        { src: 'WhatsApp · Eastern Province Group', text: 'We want Kalaba to be vice president in a coalition. He has the ethics that Zambia needs. Smart, honest, experienced.' },
      ],
    },
    {
      id: 'membe',
      name: "Fred M'membe",
      shortName: 'FM',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Fred_M%27membe_1.jpg/330px-Fred_M%27membe_1.jpg',
      role: "Socialist Party / People's Pact · former Post Newspaper Editor",
      party: "SP / People's Pact",
      age: 63,
      poll: 4.1,
      trend: +0.3,
      color: '#E74C3C',
      stronghold: 'Urban intellectuals, Copperbelt, TikTok youth',
      weakness: 'Socialist brand polarises, limited grassroots outside Lusaka & CB',
      aiScore: 20,
      biography: "Founder and president of the Socialist Party, backed by the People's Pact as its 2026 presidential candidate according to current public reporting. Former journalist and media proprietor.",
      socialHandle: '@FredMmembe',
      sentimentScore: 48,
      facebookPage: 'SocialistPartyZambia',
      narrative: "M'membe's Socialist Party / People's Pact lane is strongest in issue framing around mining, inequality and youth frustration. The model treats his support as a measurable urban youth pressure point.",
      quotedPosts: [
        { src: 'TikTok · @fredmmembe_sp', text: 'The IMF deal HH signed will force privatisation of our remaining state assets. Zambians wake up! These are your resources being sold.' },
        { src: 'Facebook · Socialist Party Zambia', text: 'Fred M\'membe is the only one speaking truth to power. UPND and PF are two sides of the same coin. SP is the real alternative for Zambia\'s future.' },
        { src: 'Twitter/X · Zambia Youth Politics', text: "M'membe's analysis of the mining royalty sellout is 🔥. He knows the numbers. These are our minerals. Why are Chinese companies taking 80% profit? #ZambiaFirst" },
        { src: 'Facebook · Copperbelt Debate', text: 'Socialist Party makes nice speeches but socialism has never worked in Africa. Look at Zimbabwe. Zambia needs investment not nationalisation.' },
      ],
    },
  ],

  // ── National Model Estimates (not official ECZ polling) ──
  nationalPoll: {
    upnd: 47.2,
    mundubile_tonse: 20.3,
    kalaba_cf: 3.8,
    membe_sp: 4.1,
    others_undecided: 24.6,
    // kept for API compatibility with older route code and Airtable schemas
    pf_ndc_alliance: 20.3,
    kalaba_dp: 3.8,
    pf_mundubile: 14.2,
    ndc_makebi: 6.1,
  },

  // ── 20-Month Scenario Timeline (modelled, not official polling) ──
  months: [
    "Jan'25","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec'25",
    "Jan'26","Feb","Mar","Apr","May","Jun'26",
    "Jul'26▸","Aug'26▸"
  ],
  // Modelled history + 2 projected months (marked with ▸ in months array)
  upndTrend:     [52,50,49,47,46,48,47,45,44,46,47,48,48,47,47,48,47.2,46,  45.5,44.9],
  allianceTrend: [6, 6, 8, 8, 9, 9,10,11,13,14,15,16, 17,18,19,20,20.3,21, 22.6,24.2],
  kalabaTrend:   [5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4,  4, 4, 4, 4, 3.8,3.8, 3.6, 3.4],
  membeTrend:    [3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4,  4, 4, 4, 4, 4.1,4.5, 4.7, 5.0],
  // Legacy individual arrays retained for API use
  mundubileTrend:[2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 9, 10,11,12,13,14,14.2,15, 16.1,17.2],
  ndcTrend:      [4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6,  6, 6, 6, 6, 6.1, 6,  6.5, 7.0],
  projectedFromIndex: 18,

  // ── Platform Sentiment (UPND vs field) ──
  platforms: ['Facebook','Twitter/X','Lusaka Times','Zambian Observer','ZNBC/Daily Mail','WhatsApp Groups'],
  platPositive: [48, 42, 55, 50, 68, 51],
  platNegative: [32, 40, 28, 35, 18, 28],
  platNeutral:  [20, 18, 17, 15, 14, 21],

  // ── Provincial Data ──
  provinces: [
    { name: 'Lusaka',     voters: 1430889, upnd: 44, pf: 36, lean: 'CONTESTED' },
    { name: 'Copperbelt', voters: 1296446, upnd: 38, pf: 46, lean: 'PF' },
    { name: 'Eastern',    voters: 1129444, upnd: 58, pf: 24, lean: 'UPND' },
    { name: 'Southern',   voters: 1103275, upnd: 76, pf: 12, lean: 'UPND' },
    { name: 'Central',    voters:  760000, upnd: 52, pf: 30, lean: 'UPND' },
    { name: 'Northern',   voters:  705000, upnd: 28, pf: 52, lean: 'PF' },
    { name: 'North-Western', voters: 705000, upnd: 72, pf: 18, lean: 'UPND' },
    { name: 'Western',    voters:  660000, upnd: 68, pf: 18, lean: 'UPND' },
    { name: 'Luapula',    voters:  520000, upnd: 25, pf: 54, lean: 'PF' },
    { name: 'Muchinga',   voters:  476246, upnd: 30, pf: 50, lean: 'PF' },
  ],

  // ── Issue Sentiment ──
  issues: [
    { label: 'Infrastructure',    upnd: 72, pf: 45 },
    { label: 'Agriculture',       upnd: 65, pf: 38 },
    { label: 'Security',          upnd: 70, pf: 52 },
    { label: 'Anti-Corruption',   upnd: 58, pf: 30 },
    { label: 'Cost of Living',    upnd: 32, pf: 55 },
    { label: 'Jobs & Employment', upnd: 38, pf: 48 },
    { label: 'Energy/Power',      upnd: 41, pf: 38 },
    { label: 'Education',         upnd: 61, pf: 44 },
    { label: 'Healthcare',        upnd: 55, pf: 40 },
  ],

  // ── Simulation Scenarios ──
  scenarios: [
    { label: 'Status Quo',       value: 47.2, color: '#555',    desc: 'No major policy shifts before election' },
    { label: 'Energy Fix Only',  value: 51.8, color: '#0077E6', desc: '18-month Zesco/solar roadmap published & delivered' },
    { label: 'Cost Relief Only', value: 53.4, color: '#00C9A7', desc: 'Mealie meal + fuel subsidy in key provinces' },
    { label: 'Both Policies',    value: 56.1, color: '#F5C400', desc: 'Energy fix + cost of living relief combined' },
    { label: 'Both + Campaign',  value: 58.8, color: '#FF6B00', desc: 'Policy wins + strong TikTok/FB campaign' },
    { label: 'Optimal',          value: 61.5, color: '#198A00', desc: 'All levers: policy, media, rally, ground game' },
  ],

  // ── Past Presidents ──
  presidents: [
    { initials: 'KK', name: 'Kenneth Kaunda',    years: '1964–1991', party: 'UNIP', color: '#198A00', note: 'Founding Father' },
    { initials: 'FC', name: 'Frederick Chiluba', years: '1991–2001', party: 'MMD',  color: '#0077E6', note: 'Democracy Pioneer' },
    { initials: 'LM', name: 'Levy Mwanawasa',    years: '2002–2008', party: 'MMD',  color: '#8B4513', note: 'Anti-Corruption Icon' },
    { initials: 'RB', name: 'Rupiah Banda',       years: '2008–2011', party: 'MMD',  color: '#9B59B6', note: 'Transition Leader' },
    { initials: 'MS', name: 'Michael Sata',       years: '2011–2014', party: 'PF',   color: '#CC0000', note: '"King Cobra"' },
    { initials: 'GS', name: 'Guy Scott',          years: '2014–2015', party: 'PF',   color: '#AA0000', note: 'Acting President' },
    { initials: 'EL', name: 'Edgar Lungu',        years: '2015–2021', party: 'PF',   color: '#CC0000', note: 'Disqualified 2026' },
    { initials: 'HH', name: 'Hakainde Hichilema', years: '2021–pres.',party: 'UPND', color: '#FF6B00', note: 'INCUMBENT 2026' },
  ],

  // ── Counter-Measures (Pamodzi removed) ──
  counterMeasures: [
    {
      threat: 'Energy / Load Shedding',
      color: '#00C9A7',
      pollImpact: '+4.2%',
      priority: 'HIGH',
      actions: [
        'Publish 18-month Zesco/solar roadmap with provincial milestones',
        'Emergency 300 MW solar tender — announce & track publicly',
        'WhatsApp community energy progress tracker per district',
        'Reframe as inherited PF/Lungu-era Zesco debt crisis',
      ],
    },
    {
      threat: 'Cost of Living / Mealie Meal',
      color: '#F5C400',
      pollImpact: '+3.8%',
      priority: 'HIGH',
      actions: [
        'Province-by-province mealie meal subsidy: Lusaka, CB, Northern first',
        'Kwacha stabilisation comms — anchor to IMF deal narrative',
        'Live price dashboard on ZNBC, Facebook, and WhatsApp groups',
        'Fertiliser delivery visible on ground — photo/video campaigns',
      ],
    },
    {
      threat: 'Mundubile / PF Northern Surge',
      color: '#CC0000',
      pollImpact: '+2.4%',
      priority: 'HIGH',
      actions: [
        'HH in-person rally tour: Northern, Luapula, Muchinga provinces',
        'Bemba-language radio + podcast outreach in rural north',
        'Release PF governance failures 2011-2021: Auditor General data',
        'Local MP mobilisation in PF strongholds — community projects',
      ],
    },
    {
      threat: "M'membe SP / Urban Youth Vote",
      color: '#E74C3C',
      pollImpact: '+1.4%',
      priority: 'WATCH',
      actions: [
        "Counter M'membe TikTok narrative with UPND youth content creators",
        'Engage Copperbelt & Lusaka youth with skills + jobs programmes',
        'Social media: highlight UPND anti-elitism record vs SP elite leadership',
        'Monitor SP sentiment velocity weekly — escalate if >5.5%',
      ],
    },
    {
      threat: 'Kalaba CF Orange / Coalition Risk',
      color: '#27AE60',
      pollImpact: '+1.2%',
      priority: 'MEDIUM',
      actions: [
        'Monitor Kalaba–Mundubile coalition signals via SentimentCommand AI',
        'Engage Citizens First / CF Orange sympathisers in Eastern & Luapula with local projects',
        'Back-channel dialogue option: offer Kalaba dignified role post-election',
        'Ensure Kalaba northern base is cannibalised by Mundubile, not consolidated',
      ],
    },
  ],

  // ── Intelligence Sources (for attribution) ──
  intelligenceSources: [
    { id: 'afrobarometer', name: 'Afrobarometer Round 10 (INESOR/UNZA)', type: 'polling', note: 'UNZA-led Zambia module — trust in institutions, free & fair election expectations, economic sentiment' },
    { id: 'ccmg', name: 'Christian Churches Monitoring Group', type: 'integrity', note: 'Long-term election observation and Electoral Code monitoring ahead of 13 Aug 2026' },
    { id: 'constitution', name: 'Constitution of Zambia', type: 'official', note: 'General election held every five years on the second Thursday of August' },
    { id: 'national_assembly', name: 'National Assembly of Zambia', type: 'official', note: '2026 delimitation reporting: constituencies increased from 156 to 226' },
    { id: 'ecz', name: 'Electoral Commission of Zambia', type: 'official', note: '13 Aug 2026 election · 226 constituencies · 8,786,300 registered voters' },
    { id: 'zamstats', name: 'ZamStats CPI Report', type: 'economic', note: 'Annual inflation at 6.8% in April 2026' },
    { id: 'boz', name: 'Bank of Zambia', type: 'economic', note: 'Policy rate 13.25% · Monetary policy update' },
    { id: 'iverify', name: 'iVerify Zambia', type: 'integrity', note: 'Mis/disinformation verification · UN supported' },
    { id: 'ooni', name: 'OONI Zambia', type: 'integrity', note: 'Open Observatory Network Interference — internet measurement' },
    { id: 'civicus', name: 'CIVICUS Monitor', type: 'integrity', note: 'Civic space rating: OBSTRUCTED' },
    { id: 'google_trends', name: 'Google Trends Zambia', type: 'social', note: 'Search interest: HH, Mundubile, election' },
    { id: 'datareportal', name: 'DataReportal / platform monitoring', type: 'social', note: 'Social-media audience context; live app signals come from configured platform scrapers where credentials exist' },
  ],

  openIntelligenceSources: [
    { category: 'Official Election', sources: ['ECZ', 'National Assembly of Zambia', 'ZambiaLII'] },
    { category: 'Economic Pressure', sources: ['ZamStats', 'Bank of Zambia', 'World Bank', 'IMF'] },
    { category: 'Election Integrity', sources: ['CCMG Zambia', 'iVerify Zambia', 'CIVICUS Monitor', 'OONI Explorer'] },
    { category: 'Open Web Signals', sources: ['Google Trends', 'GDELT', 'DataReportal'] },
    { category: 'Geospatial', sources: ['OpenStreetMap', 'HDX administrative boundaries', 'CARTO basemaps'] },
    { category: 'Media Watch', sources: ['ZNBC', 'News Diggers!', 'MISA Zambia', 'The Mast', 'Diamond TV'] },
  ],

  // ── AI Judges Config ──
  judgePersonas: [
    {
      id: 'data',
      name: 'Judge ORACLE',
      role: 'Data Integrity Validator',
      color: '#00C9A7',
      icon: '🔬',
      focus: 'Validates polling accuracy, data sources, and statistical methodology',
      model: 'AI — Data Analysis Mode',
    },
    {
      id: 'strategy',
      name: 'Judge STRATEGIS',
      role: 'Campaign Strategy Evaluator',
      color: '#F5C400',
      icon: '🎯',
      focus: 'Evaluates strategic recommendations against Zambia political realities',
      model: 'AI — Strategic Intelligence Mode',
    },
    {
      id: 'sentiment',
      name: 'Judge SENTINEX',
      role: 'Sentiment Verification Agent',
      color: '#FF6B00',
      icon: '📡',
      focus: 'Cross-validates platform sentiment against known ground truth',
      model: 'AI — NLP Sentiment Mode',
    },
  ],
}

export type Figure = typeof ELECTION_DATA.figures[0]
export type Province = typeof ELECTION_DATA.provinces[0]
export type Scenario = typeof ELECTION_DATA.scenarios[0]
export type JudgeVerdict = {
  judgeId: string
  judgeName: string
  verdict: 'VALIDATED' | 'CAUTION' | 'DISPUTED'
  confidence: number
  summary: string
  findings: string[]
  timestamp: string
}
