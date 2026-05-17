// Zambia Election Intelligence Data 2026
// SentimentCommand Platform — HH vs Mundubile, Kalaba, M'membe
// Sources: Facebook, Twitter/X, Lusaka Times, Zambian Observer, ZNBC

export const ELECTION_DATA = {
  electionDate: '2026-08-13',
  voterTotal: 8700000,
  constituencies: 156,
  aiConfidence: 84,

  // ── Macroeconomic Context (ZamStats / Bank of Zambia) ──
  macroIndicators: {
    inflation: 6.8,           // ZamStats CPI May 2026 (%)
    bozPolicyRate: 13.25,     // Bank of Zambia Monetary Policy Rate (%)
    kwachaUSD: 26.8,          // Kwacha per USD (approx)
    gdpGrowth: 4.2,           // World Bank projected GDP growth 2026 (%)
    unemploymentYouth: 34.1,  // Youth unemployment % (ILO / ZamStats)
    mealMealPriceK: 400,      // Approx price 25kg bag in Kwacha
  },

  // ── Key Political Figures (HH + 4 opposition) ──
  figures: [
    {
      id: 'hh',
      name: 'Hakainde Hichilema',
      shortName: 'HH',
      photo: '/candidates/hh.jpg',
      role: 'President of Zambia · UPND · INCUMBENT',
      party: 'UPND',
      age: 62,
      poll: 47.2,
      trend: +0.4,
      color: '#FF6B00',
      stronghold: 'Southern, Western, N/Western',
      weakness: 'Cost of living, load shedding, rural north',
      aiScore: 72,
      biography: 'Businessman-turned-president. Won 2021 with 57.9% — 7th attempt. Known universally as "HH". Background in ranching & accountancy. First UPND president, Tonga/Southern base.',
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
      name: 'PF-NDC Alliance',
      shortName: 'PF·NDC',
      photo: '/candidates/mundubile.jpg',
      role: 'Mundubile (PF) + Makebi Zulu (NDC) · Formal Opposition Alliance',
      party: 'PF-NDC',
      age: 49,
      poll: 20.3,
      trend: +2.3,
      color: '#CC0000',
      stronghold: 'Northern, Luapula, Muchinga, Copperbelt Urban',
      weakness: 'Alliance cohesion risk, limited southern presence, Lusaka name recognition gap',
      aiScore: 42,
      biography: 'Formal coalition: PF under Mundubile (14.2%, +1.8/mo) and NDC under Makebi Zulu (6.1%, +0.5/mo) joined forces to present a unified opposition front. Combined 20.3% is the single biggest opposition bloc. Rising at +2.3pts/month — the fastest-growing bloc in the 2026 race.',
      socialHandle: '@BrianMundubile · @MakebiZulu',
      sentimentScore: 62,
      facebookPage: 'BrianMundubile',
      narrative: 'The PF-NDC Alliance is the most significant structural development in the 2026 race. Combined polling of 20.3% with a +2.3pt/month trajectory makes this the only bloc with a realistic path to forcing a second round. PF\'s Northern base merges with NDC\'s Copperbelt urban youth — a dangerous flank for UPND if the coalition holds.',
      quotedPosts: [
        { src: 'Facebook · PF-NDC Alliance', text: 'PF and NDC together — this is the alliance Zambia has been waiting for! Mundubile for President, Makebi brings the youth. 2026 is ours! 🔴💙' },
        { src: 'Facebook · Luapula Province Group', text: 'Brian Mundubile visited Samfya last week. The reception was overwhelming. People are tired and ready for change. Even former UPND supporters are switching.' },
        { src: 'Twitter/X · ZambiaElection2026', text: 'PF-NDC Alliance now at 20.3% combined and rising +2.3pts/month. If this holds to August 2026 they could force a second round. HH must take this seriously. #Zambia2026' },
        { src: 'Facebook · Ndola Youth Forum', text: 'NDC + PF together is a game changer. Makebi brings Copperbelt youth, Mundubile brings Northern votes. UPND is in trouble if the alliance holds together.' },
      ],
    },
    {
      id: 'kalaba',
      name: 'Harry Kalaba',
      shortName: 'HK',
      photo: '/candidates/kalaba.jpg',
      role: 'DP Leader · Former Foreign Affairs Minister',
      party: 'DP',
      age: 51,
      poll: 3.8,
      trend: -0.2,
      color: '#27AE60',
      stronghold: 'Luapula, Eastern Province (pockets)',
      weakness: 'Funding, low 2026 media profile, squeezed by Mundubile in north',
      aiScore: 18,
      biography: 'Former PF cabinet minister. Founded Democratic Party in 2018. Known for principled resignation over corruption. Ran 2021 with 0.74%. Key watch: coalition or spoiler role in 2026.',
      socialHandle: '@HarryKalaba',
      sentimentScore: 55,
      facebookPage: 'HarryKalaba',
      narrative: 'Kalaba is respected as principled but squeezed in his northern base by the Mundubile surge. His value in 2026 may be as a coalition partner or kingmaker rather than direct contender. Watch for formal alliance announcement.',
      quotedPosts: [
        { src: 'Facebook · Harry Kalaba Official', text: 'I left PF because I refused to be part of corruption. I will not go back to any party that puts personal gain over Zambia. DP stands for integrity. 🇿🇲' },
        { src: 'Facebook · Luapula Political Talk', text: 'Kalaba is a good man but too small to win. He should join with Mundubile. Together they can beat UPND in 2026. Alone, votes go to waste.' },
        { src: 'Twitter/X · ZambiaAnalysis', text: 'Harry Kalaba polling at 3.8%. Down 0.2pts this month. The Mundubile surge is cannibalising DP support in Luapula. Coalition talks likely by Q1 2026.' },
        { src: 'WhatsApp · Eastern Province Group', text: 'We want Kalaba to be vice president in a coalition. He has the ethics that Zambia needs. Smart, honest, experienced.' },
      ],
    },
    {
      id: 'membe',
      name: "Fred M'membe",
      shortName: 'FM',
      photo: '/candidates/membe.jpg',
      role: 'SP Leader · Former Post Newspaper Editor',
      party: 'SP',
      age: 63,
      poll: 4.1,
      trend: +0.3,
      color: '#E74C3C',
      stronghold: 'Urban intellectuals, Copperbelt, TikTok youth',
      weakness: 'Socialist brand polarises, limited grassroots outside Lusaka & CB',
      aiScore: 20,
      biography: "Founded Socialist Party after The Post was shut down. Former journalist and media proprietor. Left-leaning anti-Western populist. Growing TikTok following among 18-35 urban youth. Key 2026 risk: urban youth defection from UPND.",
      socialHandle: '@FredMmembe',
      sentimentScore: 48,
      facebookPage: 'SocialistPartyZambia',
      narrative: "M'membe is winning the narrative war among young urban Zambians on TikTok and Twitter/X. His socialist messaging resonates with youth unemployment. Not a direct election threat but could peel 4-6% UPND urban youth vote — critical in Lusaka and Copperbelt.",
      quotedPosts: [
        { src: 'TikTok · @fredmmembe_sp', text: 'The IMF deal HH signed will force privatisation of our remaining state assets. Zambians wake up! These are your resources being sold.' },
        { src: 'Facebook · Socialist Party Zambia', text: 'Fred M\'membe is the only one speaking truth to power. UPND and PF are two sides of the same coin. SP is the real alternative for Zambia\'s future.' },
        { src: 'Twitter/X · Zambia Youth Politics', text: "M'membe's analysis of the mining royalty sellout is 🔥. He knows the numbers. These are our minerals. Why are Chinese companies taking 80% profit? #ZambiaFirst" },
        { src: 'Facebook · Copperbelt Debate', text: 'Socialist Party makes nice speeches but socialism has never worked in Africa. Look at Zimbabwe. Zambia needs investment not nationalisation.' },
      ],
    },
  ],

  // ── National Polling ──
  nationalPoll: {
    upnd: 47.2,
    pf_ndc_alliance: 20.3,
    kalaba_dp: 3.8,
    membe_sp: 4.1,
    others_undecided: 24.6,
    // kept for API compatibility
    pf_mundubile: 14.2,
    ndc_makebi: 6.1,
  },

  // ── 20-Month Timeline (18 historical + 2 projected) ──
  months: [
    "Jan'25","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec'25",
    "Jan'26","Feb","Mar","Apr","May","Jun'26",
    "Jul'26▸","Aug'26▸"
  ],
  // Historical (18 months) + 2 projected months (marked with ▸ in months array)
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
    { name: 'Lusaka',     voters: 1453000, upnd: 44, pf: 36, lean: 'CONTESTED' },
    { name: 'Copperbelt', voters: 1326000, upnd: 38, pf: 46, lean: 'PF' },
    { name: 'Eastern',    voters:  842000, upnd: 58, pf: 24, lean: 'UPND' },
    { name: 'Southern',   voters:  801000, upnd: 76, pf: 12, lean: 'UPND' },
    { name: 'Central',    voters:  588000, upnd: 52, pf: 30, lean: 'UPND' },
    { name: 'Northern',   voters:  553000, upnd: 28, pf: 52, lean: 'PF' },
    { name: 'N/Western',  voters:  461000, upnd: 72, pf: 18, lean: 'UPND' },
    { name: 'Western',    voters:  438000, upnd: 68, pf: 18, lean: 'UPND' },
    { name: 'Luapula',    voters:  415000, upnd: 25, pf: 54, lean: 'PF' },
    { name: 'Muchinga',   voters:  380000, upnd: 30, pf: 50, lean: 'PF' },
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
      threat: 'Kalaba DP / Coalition Risk',
      color: '#27AE60',
      pollImpact: '+1.2%',
      priority: 'MEDIUM',
      actions: [
        'Monitor Kalaba–Mundubile coalition signals via SentimentCommand AI',
        'Engage DP sympathisers in Eastern & Luapula with local projects',
        'Back-channel dialogue option: offer Kalaba dignified role post-election',
        'Ensure Kalaba northern base is cannibalised by Mundubile, not consolidated',
      ],
    },
  ],

  // ── Intelligence Sources (for attribution) ──
  intelligenceSources: [
    { id: 'afrobarometer', name: 'Afrobarometer Round 10 (INESOR/UNZA)', type: 'polling', note: 'UNZA-led Zambia module — trust in institutions, free & fair election expectations, economic sentiment' },
    { id: 'zern', name: 'ZERN Round 1 Survey', type: 'polling', note: 'Zambia Election Research Network — service delivery, institutional trust, voting intentions ahead of Aug 2026' },
    { id: 'idcppa', name: 'IDCPPA Zambia Briefing (Mar 2026)', type: 'polling', note: 'Institute for Democracy, Citizenship & Public Policy in Africa — economic sentiment and election confidence by party affiliation' },
    { id: 'zeps', name: 'Zambia Election Panel Survey (ZEPS)', type: 'polling', note: 'Panel study tracking how campaigns shape voter sentiment over time — pre/during/post election waves' },
    { id: 'ecz', name: 'ECZ Voter Register 2026', type: 'official', note: '156 constituencies · 8,700,000 registered voters (confirmed)' },
    { id: 'zamstats', name: 'ZamStats CPI Report', type: 'economic', note: 'Inflation at 6.8% as of May 2026' },
    { id: 'boz', name: 'Bank of Zambia', type: 'economic', note: 'Policy rate 13.25% · Monetary policy update' },
    { id: 'iverify', name: 'iVerify Zambia', type: 'integrity', note: 'Mis/disinformation verification · UN supported' },
    { id: 'ooni', name: 'OONI Zambia', type: 'integrity', note: 'Open Observatory Network Interference — internet measurement' },
    { id: 'civicus', name: 'CIVICUS Monitor', type: 'integrity', note: 'Civic space rating: OBSTRUCTED' },
    { id: 'google_trends', name: 'Google Trends Zambia', type: 'social', note: 'Search interest: HH, Mundubile, election' },
    { id: 'datareportal', name: 'DataReportal Zambia 2026', type: 'social', note: 'Internet users 5.2M · Facebook 2.4M · TikTok growing' },
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
