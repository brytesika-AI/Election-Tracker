// Zambia Election Intelligence Data 2026
// SentimentCommand Platform — verified election facts plus clearly labelled model estimates.
// LIVE UPDATE: 29 May 2026 — post ECZ-nomination closure (22 May 2026), 14 candidates confirmed.
// Sources: ECZ (elections.org.zm), ZamStats, News Diggers, Lusaka Times, Zambian Observer,
//          Afrobarometer R10, ZERN Survey (UCT/CSSR), Bank of Zambia, World Bank.

export const ELECTION_DATA = {
  electionDate: '2026-08-13',
  voterTotal: 8786300,       // ECZ certified register — official
  constituencies: 226,       // ECZ — 70 new constituencies (no voting history)
  districts: 116,
  wards: 1858,
  aiConfidence: 82,          // Post-nomination + live polling data integrated
  presidentialThreshold: 50,
  presidentialRule: 'President-elect must receive more than 50% of valid votes cast; otherwise a second-round/runoff risk is triggered.',
  nominationsClosedDate: '2026-05-22',  // ECZ confirmation — 14 candidates on ballot
  totalCandidates: 14,        // ECZ certified (22 May 2026)

  // ── Macroeconomic Context — LIVE VERIFIED (ZamStats / Bank of Zambia May 2026) ──
  macroIndicators: {
    inflation: 6.6,           // ZamStats CPI May 2026 — LIVE (down from 6.8% April; lowest since Feb 2018). Source: News Diggers 29 May 2026
    bozPolicyRate: 13.25,     // Bank of Zambia Monetary Policy Rate, May 2026 (%)
    kwachaUSD: 19.87,         // Kwacha per USD — LIVE. Kwacha rallied ~10% since Dec 2025; briefly Bloomberg's top performer. Source: Zambian Observer
    gdpGrowth: 4.2,           // World Bank projected GDP growth 2026 (%)
    unemploymentYouth: 32.6,  // 2024 Labour Force Survey: youth cohort 19-22 (%)
    mealMealPriceK: 289,      // 25kg bag national average May 2026 — LIVE. Down from K296 (Apr) and K344 (May 2025). Source: News Diggers
    copperPriceLME_USD_t: 13090, // LME copper spot May 2026 — LIVE. Source: Zambian Observer / Bloomberg
    foodInflation: 7.3,       // ZamStats food-specific CPI May 2026
  },

  // ── Key Political Figures (HH + 4 opposition) ──
  nationalVoterPressures: [
    { issue: 'Cost of living', countrySignal: 'Afrobarometer Round 10 placed rising cost of living as the top problem Zambians want government to address.', modelEffect: 'Hurts the incumbent most in Lusaka, Copperbelt and peri-urban Central where food, rent and transport costs are felt daily.' },
    { issue: 'Water, drought and food security', countrySignal: 'Drought, water supply, farming and food shortage are national voter concerns, especially after the 2024 drought cycle.', modelEffect: 'Moves rural and farming provinces by delivery evidence: inputs, FRA/maize flow, irrigation, water points and drought recovery.' },
    { issue: 'Electricity and load shedding', countrySignal: 'Power reliability remains a national economic and household pressure point.', modelEffect: 'Sharpest in urban commerce, mining towns, SMEs and households that experience lost income from outages.' },
    { issue: 'Jobs and youth economy', countrySignal: 'Youth voters prioritise the economy, employment, health, infrastructure and water supply.', modelEffect: 'Creates volatility in Lusaka, Copperbelt, North-Western mining districts and urban youth corridors.' },
    { issue: 'Roads, CDF and free education', countrySignal: 'Infrastructure, schools and local development are visible government proof points.', modelEffect: 'Supports UPND where delivery is locally visible, but loses power where voters feel prices and power cuts overwhelm those gains.' },
    { issue: 'Opposition ticket consolidation', countrySignal: 'The 2026 opposition lane depends on whether PF-linked, Tonse, Pamodzi and regional actors coordinate cleanly.', modelEffect: 'Most important in Northern, Luapula, Muchinga, Eastern and Copperbelt where vote transfer is plausible but not automatic.' },
  ],

  figures: [
    {
      id: 'hh',
      name: 'Hakainde Hichilema',
      shortName: 'HH',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Hakainde_Hichilema_2022_%28cropped%29.jpg/330px-Hakainde_Hichilema_2022_%28cropped%29.jpg',
      role: 'President of Zambia · UPND presidential candidate · INCUMBENT · Running mate: VP Mutale Nalumango (retained)',
      party: 'UPND',
      age: 62,
      poll: 55.0,  // LIVE: UNZA demographer poll 60%; digital polls avg 51-60%; Facebook poll 55% (67,600 participants). Conservative mid-point used.
      trend: +1.2, // Post-nomination trend positive — kwacha rally, inflation falling, mealie meal prices down
      color: '#FF6B00',
      stronghold: 'Southern, Western, North-Western',
      weakness: 'Cost of living, load shedding, rural north',
      aiScore: 72,
      biography: 'Businessman-turned-president. Won the 2021 election with 59.4% on his sixth attempt. ECZ-nominated 22 May 2026 at Mulungushi International Conference Centre; running mate VP Mutale Nalumango retained. Afrobarometer R10 (Jul 2024): 57.3% approval. Oct 2025 poll: 75% approval rating. Multiple independent polls place him at 55–60% ahead of the Aug 13 ballot.',
      socialHandle: '@HHichilema',
      sentimentScore: 58,
      facebookPage: 'HakaindehichilemaHH',
      narrative: 'LIVE (29 May 2026): HH is the clear front-runner at 55%+ in verified polling. Kwacha rallied ~10% since Dec 2025 (briefly Bloomberg\'s top-performing currency). Inflation fell to 6.6% (May) — lowest since Feb 2018. Mealie meal prices down to K289/25kg (from K344 a year ago). Main risks: load shedding still material; Bishops Council warned UPND against political violence; Mazabuka nomination-day violence incident. UPND swept multiple seats unopposed, drawing opposition criticism.',
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
      role: 'ECZ-nominated presidential candidate · NRPUP · Tonse-Pamodzi Alliance · Running mate: Makebi Zulu',
      party: 'NRPUP (Tonse-Pamodzi Alliance)',  // LIVE: Tonse + PF/Pamodzi merged. Mundubile on NRPUP ticket after FDD fallout.
      age: 55,
      poll: 22.1,
      trend: +3.1,
      color: '#CC0000',
      stronghold: 'Northern, Luapula, Muchinga, Copperbelt Urban',
      weakness: 'Alliance cohesion across all structures, limited southern presence, HH incumbency advantage',
      aiScore: 45,
      biography: 'Former PF MP, ECZ-nominated 22 May 2026 under NRPUP (Tonse-Pamodzi Alliance). The Tonse Alliance formed Nov 2024 with Edgar Lungu as initial presidential pick; after Lungu\'s death (5 June 2025) Mundubile was endorsed at a January 2026 convention. A "dramatic fallout" with FDD moved him to NRPUP. Tonse and PF/Pamodzi formally merged ahead of the ballot. Alliance has fielded candidates in 220 constituencies. Alliance cohesion remains fragile — Zambian Observer warns of potential structure collapse.',
      socialHandle: '@BrianMundubile · Tonse Alliance',
      sentimentScore: 65,
      facebookPage: 'BrianMundubile',
      narrative: 'Post-nomination: Mundubile-Makebi is now the confirmed opposition lane. The field is set. The model upgrades their share as ticket clarity reduces split-vote leakage. The 50%+1 calculation now turns entirely on voter turnout, rally penetration and whether Northern/Luapula/Muchinga structures deliver as expected.',
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
      poll: 2.0,   // 2021 actual: 0.34%. Model uplift for 2026 People's Pact coalition; pending court challenge may further suppress
      trend: -0.3,
      color: '#E74C3C',
      stronghold: 'Urban intellectuals, Copperbelt, TikTok youth',
      weakness: 'Socialist brand polarises, limited grassroots outside Lusaka & CB',
      aiScore: 20,
      biography: "ECZ-nominated 21 May 2026 under the People's Pact. Running mate: Dolika Banda (one of 3 female running mates on the ballot). NOTE: A civil society consortium has petitioned Lusaka High Court to disqualify M'membe and Dolika Banda, alleging Banda lacks a Grade 12 certificate and unverified foreign qualifications. Case pending as of 29 May 2026. Historical context: 2021 vote share was just 0.34%.",
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
    {
      id: 'kateka',
      name: 'Chishala Kateka',
      shortName: 'CK',
      photo: '/candidates/kateka.jpg',
      role: 'New Heritage Party leader · WOZA-aligned opposition figure',
      party: 'New Heritage Party / WOZA',
      age: 69,
      poll: 1.5,
      trend: +0.1,
      color: '#8E44AD',
      stronghold: 'Governance reform voters, Lusaka professionals, civic-rights issue voters',
      weakness: 'Low national machinery, limited rural reach, squeezed by larger opposition lanes',
      aiScore: 12,
      biography: 'Economist, chartered accountant and New Heritage Party leader. Public reporting shows NHP participating in the WOZA alliance space ahead of 2026, so the dashboard treats her as a next-tier candidate/issue-lane rather than a frontrunner.',
      socialHandle: '@NewHeritageParty',
      sentimentScore: 44,
      facebookPage: 'NewHeritagePartyZambia',
      narrative: 'Kateka gives the field a governance-and-reform signal. The model does not show a direct winning route today, but her voters matter in a tight first round because small reform blocs can influence runoff transfer assumptions.',
      quotedPosts: [
        { src: 'Lusaka civil-society sample', text: 'Kateka keeps raising governance and ECZ independence questions. Small party, but important voice.' },
        { src: 'Urban professional sample', text: 'NHP is unlikely to win but the governance message is strong. Zambia needs institutions that are trusted.' },
        { src: 'Youth reform sample', text: 'We need more women and technocrats in the race, not only the same big-party names.' },
      ],
    },
    {
      id: 'kbf',
      name: 'Kelvin Fube Bwalya',
      shortName: 'KBF',
      photo: '/candidates/kbf.jpg',
      role: 'ECZ-nominated presidential candidate · Zambia Must Prosper · Running mate: Milner Katolo',
      party: 'Zambia Must Prosper (ZMP)',
      age: 47,
      poll: 2.0,
      trend: +0.2,
      color: '#E67E22',
      stronghold: 'Urban youth, Copperbelt, online media',
      weakness: 'Limited rural machinery, squeezed by Mundubile in northern vote',
      aiScore: 14,
      biography: 'ECZ-nominated 22 May 2026 under Zambia Must Prosper. Popular online figure with significant social media following. One of the more visible challengers to emerge from the digital political space. Not projected to win but carries urban youth protest vote.',
      socialHandle: '@KBF',
      sentimentScore: 52,
      facebookPage: 'KelvinFubeBwalya',
      narrative: 'KBF represents the urban youth digital-native vote. His social media presence outpaces his polling numbers. Watch for TikTok momentum — if SP\'s court challenge removes M\'membe, some SP voters may drift to KBF.',
      quotedPosts: [
        { src: 'Facebook · Lusaka Youth Group', text: 'KBF is the only one speaking our language. Young, online, understands Zambia\'s real problems. Give him a chance!' },
        { src: 'Twitter/X · Urban Zambia', text: 'KBF has a better digital strategy than most candidates. If this were a TikTok election he would win. But it\'s not.' },
        { src: 'WhatsApp · Copperbelt Youth', text: 'Kelvin Bwalya gets the youth frustration. Whether he can convert it to votes at rural polling stations is the big question.' },
      ],
    },
  ],

  // ── National Model Estimates (not official ECZ polling) ──
  // ── LIVE National Model — May 2026 (post ECZ nomination closure 22 May) ──
  // PRIMARY SOURCES: UNZA demographer poll (HH 60%, opp 35%), Zambian Post Facebook poll 67,600 participants (HH 55%),
  // Afrobarometer R10 approval 57.3% (Jul 2024), ZERN Round 1 survey (UCT/CSSR).
  // Model uses conservative mid-point of verified polling range.
  nationalPoll: {
    upnd: 55.0,            // HH — multiple verified polls: 51–60%, conservative mid-point 55%
    mundubile_tonse: 22.0, // BM/MZ — Facebook poll 35% combined opp; model allocates ~22% to Mundubile lane
    kalaba_cf: 3.5,        // HK — no poll data shows top-3 position; low single digits
    membe_sp: 2.0,         // FM — 2021 actual 0.34%; model 2026 uplift capped; pending court challenge
    kateka_nhp: 1.3,       // CK — unchanged; governance niche
    kbf_zmp: 2.0,          // KBF (Kelvin Fube Bwalya) — Zambia Must Prosper; credible challenger with media presence
    others_undecided: 14.2, // Residual — narrowed with confirmed field
    // Legacy fields retained for backward compat — DO NOT use for primary analysis
    pf_ndc_alliance: 22.0,
    kalaba_dp: 3.5,
    pf_mundubile: 15.5,
    ndc_makebi: 6.5,
  },

  // ── 20-Month Scenario Timeline (modelled, not official polling) ──
  // Index 17 = May'26 NOMINATION MONTH (field confirmed by ECZ). Indices 18-19 are projected.
  months: [
    "Jan'25","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec'25",
    "Jan'26","Feb","Mar","Apr","May'26★","Jun'26",
    "Jul'26▸","Aug'26▸"
  ],
  // ★ = post-nomination live read (verified polling). ▸ = model projection.
  // LIVE VERIFIED: May'26★ HH=55% per UNZA demographer + Facebook poll avg.
  upndTrend:     [52,51,50,49,48,49,48,47,46,47,48,49,51,52,53,54,55.0,54.5, 54.0,53.5],
  allianceTrend: [6, 6, 8, 8, 9, 9,10,11,13,14,15,16, 17,18,19,20,22.0,22.5, 23.0,23.8],
  kalabaTrend:   [5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4,  4, 4, 4, 4, 3.5, 3.4,  3.3, 3.1],
  membeTrend:    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,  2, 2, 2, 2, 2.0, 1.9,  1.8, 1.7],
  // Legacy individual arrays retained for API use
  mundubileTrend:[2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 9, 10,11,12,13,14,14.2,15.6, 16.8,18.1],
  ndcTrend:      [4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6,  6, 6, 6, 6, 6.1, 6.5,  6.7, 6.9],
  projectedFromIndex: 18,

  // ── Platform Sentiment (UPND vs field) ──
  platforms: ['Facebook','Twitter/X','Lusaka Times','Zambian Observer','ZNBC/Daily Mail','WhatsApp Groups'],
  platPositive: [48, 42, 55, 50, 68, 51],
  platNegative: [32, 40, 28, 35, 18, 28],
  platNeutral:  [20, 18, 17, 15, 14, 21],

  // ── Provincial Data ──
  provinces: [
    { name: 'Lusaka', voters: 1430889, upnd: 50, pf: 35, lean: 'UPND', classification: 'Urban toss-up, HH edge', baseline2021: 'ECZ 2021: HH led Lusaka, but urban anti-incumbent pressure is high.', nationalIssueEffect: 'National cost-of-living, electricity and youth-employment anger is strongest here because voters experience prices, rent, transport and power cuts daily.', issueDrivers: ['compound mealie-meal prices', 'load shedding for SMEs', 'youth jobs and hustling economy', 'market and bus-station prices', 'visible CDF/free education proof'], rationale: 'Lusaka keeps a narrow HH edge because 2021 support, free education and CDF visibility still matter, but the model sharply discounts UPND for electricity, food prices, rent, transport and youth job frustration.', confidence: 'medium' },
    { name: 'Copperbelt', voters: 1296446, upnd: 46, pf: 39, lean: 'CONTESTED', classification: 'Mining belt toss-up, opposition edge', baseline2021: 'ECZ 2021: HH led Copperbelt, so a clean opposition anchor is not justified.', nationalIssueEffect: 'National job and power concerns become mining-town questions: who is creating mine jobs, paying suppliers and keeping small businesses powered.', issueDrivers: ['mine contractor payments', 'local supplier economy', 'load shedding in Kitwe/Ndola SMEs', 'casual labour and mine jobs', 'Black Mountain and youth opportunity narratives'], rationale: 'Copperbelt is moved from opposition anchor to battleground. The opposition gets a small edge from mining-community job pressure and urban cost anger, while HH retains a credible route through CDF, mine investment messaging and student/youth programmes.', confidence: 'medium' },
    { name: 'Eastern', voters: 1129444, upnd: 35, pf: 44, lean: 'PF', classification: 'Opposition leaning', baseline2021: 'ECZ 2021: Lungu/PF led Eastern, so an HH province lead was unsupported.', nationalIssueEffect: 'National farming, food-price and opposition-consolidation pressures convert into fertiliser, maize-market and Eastern ticket-transfer questions.', issueDrivers: ['PF legacy vote', 'Makebi transfer effect', 'Kalaba and CF pockets', 'fertiliser access', 'maize price and FRA timing'], rationale: 'Eastern is opposition-leaning because the 2021 baseline favoured PF and the 2026 lane has Makebi/Eastern transfer potential. HH can still compete through agriculture delivery, CDF and incumbency, but not as the current leader.', confidence: 'high' },
    { name: 'Southern', voters: 1103275, upnd: 80, pf: 10, lean: 'UPND', classification: 'UPND anchor', baseline2021: 'ECZ 2021: HH won Southern overwhelmingly.', nationalIssueEffect: 'National drought, water and food-security concerns matter here, but they sit on top of HH regional loyalty and a very strong 2021 baseline.', issueDrivers: ['cattle disease and dipping services', 'drought recovery', 'water points and irrigation', 'feeder roads', 'agriculture input delivery'], rationale: 'Southern remains the strongest HH anchor. The model trims the 2021 landslide for drought, water and cost-of-living fatigue, but there is no evidence strong enough to remove UPND leadership.', confidence: 'high' },
    { name: 'Central', voters: 760000, upnd: 55, pf: 30, lean: 'UPND', classification: 'UPND leaning, mixed belt', baseline2021: 'ECZ 2021: HH led Central overall, with constituency-level PF pockets.', nationalIssueEffect: 'National farming, road and cost pressures are mixed here because Central combines rural producers, civil servants and peri-urban households.', issueDrivers: ['FISP/farming inputs', 'feeder roads and market access', 'Kabwe/Kapiri cost pressure', 'civil service household costs', 'PF pockets in mixed constituencies'], rationale: 'Central stays UPND-leaning but not a safe landslide. Farming inputs, roads and service delivery help HH, while PF-linked pockets and cost pressure keep the opposition competitive.', confidence: 'medium' },
    { name: 'Northern', voters: 705000, upnd: 32, pf: 48, lean: 'PF', classification: 'Opposition anchor', baseline2021: 'ECZ 2021: Lungu/PF led Northern.', nationalIssueEffect: 'National opposition-consolidation and cost pressures are amplified by Bemba-belt political identity and Mundubile visibility.', issueDrivers: ['Mundubile home-region effect', 'PF ward structures', 'fish and cassava economy', 'rural road delivery', 'Bemba radio narrative share'], rationale: 'Northern remains an opposition anchor because the PF baseline, Mundubile visibility and regional political machinery outweigh HH incumbency gains. UPND can reduce the gap through delivery proof, but not lead today.', confidence: 'high' },
    { name: 'North-Western', voters: 705000, upnd: 72, pf: 17, lean: 'UPND', classification: 'UPND anchor with mining scrutiny', baseline2021: 'ECZ 2021: HH won North-Western by a very large margin.', nationalIssueEffect: 'National jobs and infrastructure concerns become new-copperbelt questions about whether mining growth benefits local workers and suppliers.', issueDrivers: ['Solwezi/Kalumbila mine jobs', 'local supplier contracts', 'royalty/development expectations', 'roads to mining communities', 'environmental governance'], rationale: 'North-Western remains a strong HH province. Mining benefit expectations and environmental/local supplier concerns reduce the margin from 2021 levels but do not create an opposition lead.', confidence: 'high' },
    { name: 'Western', voters: 660000, upnd: 69, pf: 17, lean: 'UPND', classification: 'UPND anchor', baseline2021: 'ECZ 2021: HH won Western heavily.', nationalIssueEffect: 'National water, roads and decentralisation concerns become Barotse-development and flood-management questions.', issueDrivers: ['flood plain access', 'Barotse development expectations', 'Mongu-Limulunga service delivery', 'rice/cattle/agriculture', 'decentralisation credibility'], rationale: 'Western remains UPND-led. The model discounts for development impatience and service delivery expectations, but the 2021 baseline still gives HH a strong anchor.', confidence: 'high' },
    {
      name: 'Luapula', voters: 520000, upnd: 29, pf: 51, lean: 'PF',
      classification: 'Deep opposition anchor · post-nomination hardened',
      baseline2021: 'ECZ 2021: Lungu/PF led Luapula with the largest provincial margin. HH was weakest here of any province.',
      nationalIssueEffect: 'Post-nomination field clarity strengthens PF/Tonse structures. Luapula voters respond to opposition consolidation as a signal of seriousness, not merely identity. Kalaba\'s CF Orange Alliance drew moderate voters who may now re-evaluate with the confirmed ticket.',
      issueDrivers: [
        'Harry Kalaba home-base influence (Mwense/Kawambwa pockets)',
        'PF/Tonse ward and branch activation post-nomination',
        'Fishing economy: Mweru Wantipa, Bangweulu, Johnston Falls livelihoods',
        'Lake Mweru fishing ban grievances vs UPND enforcement stance',
        'Cassava and maize prices (rural food inflation)',
        'Rural road access: Great North Road feeders to Nchelenge, Mansa',
        'Mansa Hospital and rural clinic resourcing',
        'Youth unemployment: no major mine employment base',
        'Chiefdom-level loyalty networks (Chief Nkuba, Chief Mulundu areas)',
        'PF traditional stronghold legacy since Sata era',
        'Makebi Zulu running-mate signal for eastern Luapula corridors',
        'UPND CDF delivery visibility: where roads and boreholes are seen, HH edge softens opposition margin'
      ],
      rationale: 'Post-nomination: Luapula is now the strongest opposition anchor in the model. The Mundubile-Makebi ticket confirmation activates dormant PF branch networks. Kalaba\'s CF pockets in Mwense and Kawambwa are the only material UPND pickup route. The fishing economy, rural road grievances and absence of mine employment make it structurally the hardest province for HH. The model upgrades PF from 49% to 51% as ticket clarity removes the uncertainty discount. UPND\'s only path to reducing the gap is visible CDF and clinic delivery in Mansa, Nchelenge and Samfya.',
      keyDistricts: [
        { district: 'Mansa', leanSignal: 'PF anchor, Mundubile rally reception strong' },
        { district: 'Nchelenge', leanSignal: 'Fishing economy grievance, PF stronghold' },
        { district: 'Kawambwa', leanSignal: 'Kalaba home area, CF pockets possible' },
        { district: 'Samfya', leanSignal: 'Bangweulu fishing base, PF lean' },
        { district: 'Mwense', leanSignal: 'Kalaba influence, mixed CF/PF' },
        { district: 'Chembe', leanSignal: 'Deep rural, PF ward structures intact' },
      ],
      confidence: 'high'
    },
    { name: 'Muchinga', voters: 476246, upnd: 31, pf: 49, lean: 'PF', classification: 'Opposition leaning · post-nomination upgrade', baseline2021: 'ECZ 2021: Lungu/PF led Muchinga strongly.', nationalIssueEffect: 'National agriculture, food-price and opposition-ticket pressures show up through rural delivery and northern/eastern bloc voting behaviour.', issueDrivers: ['PF/Tonse ward structures now activated', 'Nakonde trade corridor', 'chiefdom networks', 'rural agriculture inputs', 'feeder roads and food prices'], rationale: 'Post-nomination: Muchinga opposition share nudges up as the confirmed Mundubile-Makebi ticket activates PF ward structures. Ticket uncertainty is resolved; execution risk now drives the residual gap.', confidence: 'high' },
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
    { label: 'Live Baseline',    value: 55.0, color: '#555',    desc: 'LIVE: verified post-nomination polling average (UNZA 60%, Facebook 55%, Afrobarometer 57.3% approval). HH is above 50%+1 threshold at current read.' },
    { label: 'CB/Lusaka Swing',  value: 57.2, color: '#0077E6', desc: 'If Copperbelt and Lusaka battleground break 55/45 for UPND — e.g. electricity supply improvement and cost-of-living relief narrative lands.' },
    { label: 'Turnout Drop',     value: 52.1, color: '#F5C400', desc: 'Low-turnout scenario (55%): urban youth abstention reduces UPND margin; still above 50%+1 but narrows.' },
    { label: 'Full Consolidation',value: 49.8, color: '#CC0000', desc: 'Adverse: full BM/MZ structural consolidation (Northern/Luapula/Muchinga/Eastern unite); brings UPND below threshold, forcing runoff.' },
    { label: 'Both + Campaign',  value: 59.1, color: '#FF6B00', desc: 'Delivery proof (power, mealie meal) + active TikTok/FB/radio mobilisation drive. Strong first-round comfort zone.' },
    { label: 'Optimal',          value: 62.0, color: '#198A00', desc: 'All levers: macro delivery, cost relief visible, youth turnout 70%+, effective ground game. 2021-style margin.' },
  ],

  // ── Past Presidents ──
  presidents: [
    { initials: 'KK', name: 'Kenneth Kaunda',    years: '1964–1991', party: 'UNIP', color: '#198A00', note: 'Founding Father' },
    { initials: 'FC', name: 'Frederick Chiluba', years: '1991–2001', party: 'MMD',  color: '#0077E6', note: 'Democracy Pioneer' },
    { initials: 'LM', name: 'Levy Mwanawasa',    years: '2002–2008', party: 'MMD',  color: '#8B4513', note: 'Anti-Corruption Icon' },
    { initials: 'RB', name: 'Rupiah Banda',       years: '2008–2011', party: 'MMD',  color: '#9B59B6', note: 'Transition Leader' },
    { initials: 'MS', name: 'Michael Sata',       years: '2011–2014', party: 'PF',   color: '#CC0000', note: '"King Cobra"' },
    { initials: 'GS', name: 'Guy Scott',          years: '2014–2015', party: 'PF',   color: '#AA0000', note: 'Acting President' },
    { initials: 'EL', name: 'Edgar Lungu',        years: '2015–2021', party: 'PF',   color: '#CC0000', note: 'Died 5 June 2025' },
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
        'Publish 18-month Zesco/solar roadmap with provincial milestones and weekly news-verifiable delivery updates',
        'Emergency solar/IPP procurement tracker: show MW added, district served and outage-hours reduced',
        'Target Lusaka/Copperbelt SMEs first because urban anger can block a 50%+1 first-round path',
        'Pair inherited-debt narrative with visible repairs, mini-grids and tariff facts',
      ],
    },
    {
      threat: 'Cost of Living / Mealie Meal',
      color: '#F5C400',
      pollImpact: '+3.8%',
      priority: 'HIGH',
      actions: [
        'Province-by-province mealie meal relief: Lusaka, Copperbelt and Northern first, with shop-price evidence',
        'Tie kwacha and inflation messages to household price proof; macro claims alone do not close the 50%+1 gap',
        'Live price dashboard on ZNBC, News Diggers placements, Facebook and WhatsApp groups',
        'Fertiliser and FRA delivery proof: publish district receipts, farmer clips and radio call-in checks',
      ],
    },
    {
      threat: 'Mundubile / PF Northern Surge',
      color: '#CC0000',
      pollImpact: '+2.4%',
      priority: 'HIGH',
      actions: [
        'HH in-person rally tour: Northern, Luapula and Muchinga, where modelled UPND share is 25-30%',
        'Bemba-language radio + podcast outreach in rural north, then track call-in sentiment weekly',
        'Release PF governance record with Auditor General and debt facts, not generic attack lines',
        'Local MP mobilisation in PF strongholds tied to clinics, CDF, roads and agriculture delivery evidence',
      ],
    },
    {
      threat: "M'membe SP / Urban Youth Vote",
      color: '#E74C3C',
      pollImpact: '+1.4%',
      priority: 'WATCH',
      actions: [
        "Counter M'membe mining inequality narrative with specific Copperbelt royalty, contractor-payment and jobs data",
        'Engage Copperbelt & Lusaka youth with measurable skills/jobs programmes; youth unemployment is the live risk',
        'Use creator Q&A with ministers, not slogans, to answer mining, jobs and cost-of-living questions',
        'Monitor SP sentiment velocity weekly; escalate if SP crosses 5.5% or pulls UPND urban youth share',
      ],
    },
    {
      threat: 'Kalaba CF Orange / Coalition Risk',
      color: '#27AE60',
      pollImpact: '+1.2%',
      priority: 'MEDIUM',
      actions: [
        'Monitor Kalaba-Mundubile coalition signals via news, radio and SentimentCommand AI',
        'Engage CF Orange sympathisers in Eastern and Luapula with local delivery proof, not national talking points',
        'Model Kalaba as first-round spoiler and runoff-transfer actor; his 3-4% matters under 50%+1',
        'Avoid consolidating the whole opposition lane; track whether Kalaba voters transfer to Mundubile-Makebi',
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
    { id: 'gdelt', name: 'GDELT Global Knowledge Graph', type: 'news', note: 'Open news/event monitoring for campaign narratives, issue spikes and misinformation signals' },
    { id: 'newsdiggers', name: 'News Diggers!', type: 'news', note: 'Independent reporting used as a news signal, not as certified polling' },
    { id: 'znbc', name: 'ZNBC', type: 'news', note: 'Public broadcaster signal; discount for state-media bias when modelling sentiment' },
  ],

  openIntelligenceSources: [
    { category: 'Official Election', sources: ['ECZ', 'National Assembly of Zambia', 'ZambiaLII'] },
    { category: 'Economic Pressure', sources: ['ZamStats', 'Bank of Zambia', 'World Bank', 'IMF'] },
    { category: 'Election Integrity', sources: ['CCMG Zambia', 'iVerify Zambia', 'CIVICUS Monitor', 'OONI Explorer'] },
    { category: 'News & Open Web Signals', sources: ['News Diggers!', 'ZNBC', 'Lusaka Times', 'The Mast', 'GDELT', 'Google Trends', 'DataReportal'] },
    { category: 'Geospatial', sources: ['OpenStreetMap', 'HDX administrative boundaries', 'CARTO basemaps'] },
    { category: 'Media Watch', sources: ['ZNBC', 'News Diggers!', 'MISA Zambia', 'The Mast', 'Diamond TV'] },
  ],

  candidateStrategyPackets: [
    {
      schemaVersion: 'candidate-strategy.v1',
      candidateId: 'hh',
      analysis: {
        currentCall: 'Lead, not outright win',
        baselineShare: 47.2,
        thresholdGap: 2.8,
        mainPath: 'Convert undecided voters in Lusaka, Copperbelt and Northern while holding Southern, Western and North-Western anchors.',
        keyRisks: ['Load shedding blame', 'mealie meal and fuel prices', 'Copperbelt jobs', 'urban youth turnout']
      },
      scenarios: [
        { name: 'First-round recovery', probability: 'medium', projectedShare: 51.8, trigger: 'Visible electricity and food-price relief plus youth turnout recovery.' },
        { name: 'Rerun exposure', probability: 'high at baseline', projectedShare: 47.2, trigger: 'Undecided voters split against the incumbent and opposition ticket consolidates.' },
        { name: 'Strong mandate', probability: 'low-medium', projectedShare: 56.1, trigger: 'Economic confidence improves and opposition remains fragmented outside PF-linked provinces.' }
      ],
      strategy: [
        'Publish province-level delivery proof on power, maize, health workers and CDF execution.',
        'Use Copperbelt job, supplier-payment and mining-community numbers rather than generic national promises.',
        'Target undecided urban voters with short evidence-led radio, Facebook, WhatsApp and TikTok explainers.',
        'Prepare runoff transfer outreach to smaller candidates before first-round bargaining hardens.'
      ],
      validation: {
        status: 'validated',
        checks: ['baselineShare is numeric', '50%+1 threshold modelled', 'Zambia issue drivers included', 'projection caveat retained']
      }
    },
    {
      schemaVersion: 'candidate-strategy.v1',
      candidateId: 'pf_ndc',
      analysis: {
        currentCall: 'Main opposition ticket lane',
        baselineShare: 20.3,
        thresholdGap: 29.7,
        mainPath: 'Treat Brian Mundubile and Makebi Zulu as a combined ticket lane that can consolidate Northern, Luapula, Muchinga, Eastern and parts of Copperbelt.',
        keyRisks: ['Final ECZ ticket filing uncertainty', 'PF legacy drag', 'alliance discipline', 'weak Southern and Western conversion']
      },
      scenarios: [
        { name: 'Consolidated surge', probability: 'medium', projectedShare: 24.2, trigger: 'Tonse/PF-aligned structures campaign as one machine and Eastern transfer improves.' },
        { name: 'Fragmented opposition', probability: 'medium', projectedShare: 18.0, trigger: 'Multiple opposition personalities split anti-incumbent votes.' },
        { name: 'Rerun challenger', probability: 'conditional', projectedShare: 30.0, trigger: 'HH stays below 50%+1 and smaller opposition voters transfer tactically.' }
      ],
      strategy: [
        'Lock the public ticket narrative early: candidate, running mate, province role and field command.',
        'Prioritize Bemba/Nyanja radio, market visits and church/community networks with a disciplined cost-of-living message.',
        'Offer a costed Copperbelt jobs and mining supplier plan that can be compared against UPND delivery claims.',
        'Build a runoff-transfer map by province before election day, especially Kalaba, Socialist Party and undecided issue voters.'
      ],
      validation: {
        status: 'caution',
        checks: ['baselineShare is numeric', 'ticket treated as combined lane', 'ECZ filing caveat included', '50%+1 threshold modelled']
      }
    },
    {
      schemaVersion: 'candidate-strategy.v1',
      candidateId: 'kalaba',
      analysis: {
        currentCall: 'Spoiler and coalition-transfer actor',
        baselineShare: 3.8,
        thresholdGap: 46.2,
        mainPath: 'Win enough Northern/Luapula and anti-corruption voters to become strategically valuable in a rerun.',
        keyRisks: ['Low national structure', 'squeeze by Mundubile-Makebi lane', 'limited media oxygen']
      },
      scenarios: [
        { name: 'Transfer kingmaker', probability: 'medium', projectedShare: 5.2, trigger: 'Anti-corruption and regional credibility hold while major parties stay below 50%+1.' },
        { name: 'Squeezed vote', probability: 'medium-high', projectedShare: 2.4, trigger: 'Opposition voters consolidate behind the main ticket late.' },
        { name: 'Regional breakout', probability: 'low', projectedShare: 7.0, trigger: 'Luapula/Northern field network outperforms national visibility.' }
      ],
      strategy: [
        'Focus on clean-government credibility and local delivery failures, not broad presidential messaging.',
        'Defend a clear transfer-negotiation position for any rerun.',
        'Use constituency-level field captains in Luapula and Northern where small vote gains matter most.'
      ],
      validation: {
        status: 'validated',
        checks: ['baselineShare is numeric', 'rerun transfer role explicit', 'province-specific strategy included']
      }
    },
    {
      schemaVersion: 'candidate-strategy.v1',
      candidateId: 'membe',
      analysis: {
        currentCall: 'Youth, mining-inequality and protest lane',
        baselineShare: 4.1,
        thresholdGap: 45.9,
        mainPath: 'Grow protest support among youth, labour, mining-community and ideological voters without losing credibility to tactical-vote pressure.',
        keyRisks: ['Anti-incumbent tactical squeeze', 'elite distrust', 'urban turnout volatility']
      },
      scenarios: [
        { name: 'Protest vote expands', probability: 'medium', projectedShare: 6.4, trigger: 'Load shedding, inequality and mining grievances dominate final campaign conversation.' },
        { name: 'Tactical squeeze', probability: 'medium', projectedShare: 2.8, trigger: 'Voters move to the strongest anti-HH challenger to force a rerun.' },
        { name: 'Runoff broker', probability: 'conditional', projectedShare: 5.5, trigger: 'First round misses 50%+1 and ideological voters become transferable.' }
      ],
      strategy: [
        'Convert anger into a visible province-by-province worker, youth and mining-community platform.',
        'Explain what Socialist Party voters should demand in a rerun before other campaigns define it.',
        'Use issue receipts and local testimonies rather than abstract ideology.'
      ],
      validation: {
        status: 'validated',
        checks: ['baselineShare is numeric', 'sentiment drivers included', '50%+1 rerun effect included']
      }
    },
    {
      schemaVersion: 'candidate-strategy.v1',
      candidateId: 'kateka',
      analysis: {
        currentCall: 'Governance reform signal',
        baselineShare: 1.5,
        thresholdGap: 48.5,
        mainPath: 'Use integrity, women leadership and governance reform to attract undecided civic-minded voters and shape post-first-round negotiation.',
        keyRisks: ['Low awareness', 'limited provincial machinery', 'vote squeezed by larger anti-incumbent choices']
      },
      scenarios: [
        { name: 'Civic reform lift', probability: 'low-medium', projectedShare: 2.6, trigger: 'Debate visibility and integrity messaging cut through among undecided voters.' },
        { name: 'Visibility ceiling', probability: 'high', projectedShare: 1.2, trigger: 'Media attention remains concentrated on HH and the Mundubile-Makebi lane.' },
        { name: 'Runoff values bloc', probability: 'conditional', projectedShare: 2.0, trigger: 'Her supporters become a small but explainable reform-transfer bloc.' }
      ],
      strategy: [
        'Own the governance, anti-corruption and women-leadership lane with measurable reform pledges.',
        'Target high-information undecided voters in Lusaka, Copperbelt and university communities.',
        'Publish a transparent rerun negotiation test so supporters know what any endorsement would require.'
      ],
      validation: {
        status: 'validated',
        checks: ['baselineShare is numeric', 'undecided conversion path included', 'strategy tied to Zambian voter segments']
      }
    }
  ],

  // ── Historical Election Results (ECZ Official / AU/SADC observer records) ──
  historicalElections: [
    {
      year: 1991, type: 'GENERAL',
      winner: 'Frederick Chiluba', winnerParty: 'MMD', winnerPct: 75.8,
      runnerUp: 'Kenneth Kaunda', runnerUpParty: 'UNIP', runnerUpPct: 24.2,
      turnout: 47.0, registeredVoters: 3073502,
      context: 'End of one-party UNIP era. Economic collapse + political liberalisation pressure produced MMD landslide. First peaceful alternation of power.',
      keyDrivers: ['Economic crisis under UNIP', 'One-party state fatigue', 'International pressure for multiparty democracy', 'Chiluba labour/union credibility'],
      modelLesson: 'Structural regime-change elections behave differently to competitive re-elections. Economic collapse + system change = landslide. Do not use as baseline for 2026.',
    },
    {
      year: 2001, type: 'GENERAL',
      winner: 'Levy Mwanawasa', winnerParty: 'MMD', winnerPct: 28.7,
      runnerUp: 'Anderson Mazoka', runnerUpParty: 'UPND', runnerUpPct: 26.7,
      turnout: 68.0, registeredVoters: 4226716,
      context: 'Highly fragmented 11-candidate race. Mwanawasa won narrowly amid fraud allegations. Mazoka petition dismissed by Supreme Court.',
      keyDrivers: ['MMD incumbency + split opposition', 'UPND first major national showing (Tonga/Southern base)', 'UNIP collapse to third', 'Fragmentation of anti-MMD vote'],
      modelLesson: 'Fragmented multi-candidate races suppress winning margins. Opposition fragmentation is historically the ruling party\'s best friend.',
    },
    {
      year: 2006, type: 'GENERAL',
      winner: 'Levy Mwanawasa', winnerParty: 'MMD', winnerPct: 43.1,
      runnerUp: 'Michael Sata', runnerUpParty: 'PF', runnerUpPct: 29.4,
      turnout: 70.0, registeredVoters: 4648257,
      thirdPlace: { name: 'Hakainde Hichilema', party: 'UPND', pct: 25.3 },
      context: 'PF urban-populist rise visible for first time. Mwanawasa retained on anti-corruption credibility. Hichilema at 25.3% confirmed UPND as third national force.',
      keyDrivers: ['Mwanawasa anti-corruption "Cabbage" credibility', 'Sata Copperbelt/urban worker base emerging', 'UPND not yet a national coalition builder', 'MMD incumbency + macro economy improving'],
      modelLesson: 'Anti-corruption credibility is a powerful incumbent retention asset. Urban worker mobilisation (PF) was visible 5 years before the breakthrough.',
    },
    {
      year: 2008, type: 'BY-ELECTION', note: 'Presidential by-election after Mwanawasa death',
      winner: 'Rupiah Banda', winnerParty: 'MMD', winnerPct: 40.6,
      runnerUp: 'Michael Sata', runnerUpParty: 'PF', runnerUpPct: 38.6,
      turnout: 45.0, registeredVoters: 5058397,
      context: 'Extremely close by-election. MMD barely retained. PF almost broke through 5 years early. Low by-election turnout limited PF urban surge.',
      keyDrivers: ['By-election fatigue = low turnout', 'PF urban surge nearly decisive', 'MMD incumbency + sympathy vote', 'UPND Hichilema 19.7% — kingmaker in next round'],
      modelLesson: 'By-elections systematically favour incumbents due to turnout suppression. Low turnout ≠ low enthusiasm — it means mobilisation gap.',
    },
    {
      year: 2011, type: 'GENERAL',
      winner: 'Michael Sata', winnerParty: 'PF', winnerPct: 43.3,
      runnerUp: 'Rupiah Banda', runnerUpParty: 'MMD', runnerUpPct: 36.2,
      turnout: 53.0, registeredVoters: 5166088,
      thirdPlace: { name: 'Hakainde Hichilema', party: 'UPND', pct: 18.5 },
      context: 'PF breakthrough on urban worker, youth, and resource-nationalism platform. "More money in your pocket" messaging broke MMD 20-year hold. First MMD→PF alternation.',
      keyDrivers: ['Urban youth and Copperbelt worker anger', 'MMD incumbency fatigue after 20 years', 'Sata "King Cobra" charisma and Northern/Copperbelt base', 'Resource nationalism: Chinese mine owners, jobs, wages', 'MMD split weakened incumbency machinery'],
      modelLesson: 'Economic populism in mining + urban corridor can defeat an incumbent in Lusaka/Copperbelt even without rural base. PF mobilised the informal sector.',
    },
    {
      year: 2015, type: 'BY-ELECTION', note: 'Presidential by-election after Sata death',
      winner: 'Edgar Lungu', winnerParty: 'PF', winnerPct: 48.3,
      runnerUp: 'Hakainde Hichilema', runnerUpParty: 'UPND', runnerUpPct: 46.7,
      turnout: 32.0, registeredVoters: 5581367,
      context: '13,000-vote margin. Closest Zambian election on record. Low turnout favoured PF ward machinery. UPND petition dismissed.',
      keyDrivers: ['PF incumbency machinery + sympathy vote', 'UPND first credible national challenge', 'Low turnout suppressed UPND urban youth base', 'Lungu not well known — tactical PF vote held'],
      modelLesson: 'In a 50%+1 system, a 32% turnout by-election can decide the presidency. Ground machinery matters more when enthusiasm is low.',
    },
    {
      year: 2016, type: 'GENERAL',
      winner: 'Edgar Lungu', winnerParty: 'PF', winnerPct: 50.4,
      runnerUp: 'Hakainde Hichilema', runnerUpParty: 'UPND', runnerUpPct: 47.6,
      turnout: 56.0, registeredVoters: 6698372,
      context: 'PF barely cleared 50%+1 by 13,588 votes. Security apparatus + intimidation + state media used aggressively. HH arrested 2017. UPND petition dismissed.',
      keyDrivers: ['Incumbency advantage: state media, resources, PF cadres', 'Violence and intimidation suppressed UPND in some Northern areas', 'UPND failed to convert Southern anchor into national majority', 'Fear-of-disclosure effect in competitive constituencies'],
      modelLesson: 'The 2016 result is the best calibration reference for a contested 2026 race. Every percentage-point of undecided and opposition-fragmentation voter matters. Fear of disclosure suppresses opposition polls.',
    },
    {
      year: 2021, type: 'GENERAL',
      winner: 'Hakainde Hichilema', winnerParty: 'UPND', winnerPct: 59.4,
      runnerUp: 'Edgar Lungu', runnerUpParty: 'PF', runnerUpPct: 38.2,
      turnout: 70.6, registeredVoters: 6956453,
      context: 'High-turnout UPND landslide driven by PF fatigue, economic crisis, COVID, debt distress, load shedding, and exceptional first-time youth voter mobilisation. Lungu conceded.',
      keyDrivers: ['Youth turnout surge (first-time voter mobilisation)', 'Economic pain: debt, inflation, food prices, load shedding', 'PF governance fatigue + cadre impunity', 'HH 6th attempt credibility + broad coalition', 'UPND finally broke into Copperbelt and Lusaka'],
      modelLesson: '2021 was a structural correction election, not a normal competitive cycle. Using 2021 margins as a 2026 baseline requires a 10-20pt incumbency-fatigue discount applied to UPND.',
    },
  ],

  // ── Turnout History ──
  turnoutHistory: [
    { year: 1991, turnout: 47.0, type: 'GENERAL', note: 'First competitive election; UNIP supporters some boycott' },
    { year: 2001, turnout: 68.0, type: 'GENERAL', note: 'High for fragmented race' },
    { year: 2006, turnout: 70.0, type: 'GENERAL', note: 'Competitive three-way; high engagement' },
    { year: 2008, turnout: 45.0, type: 'BY-ELECTION', note: 'By-election fatigue' },
    { year: 2011, turnout: 53.0, type: 'GENERAL', note: 'Moderate; PF urban surge' },
    { year: 2015, turnout: 32.0, type: 'BY-ELECTION', note: 'Very low; machinery election' },
    { year: 2016, turnout: 56.0, type: 'GENERAL', note: 'Competitive; fear/intimidation suppressed some areas' },
    { year: 2021, turnout: 70.6, type: 'GENERAL', note: 'Highest since 2006; youth surge; anti-PF mobilisation' },
    { year: 2026, turnout: null, projectedTurnout: 62, turnoutRange: [55, 70], type: 'GENERAL',
      note: 'Projected. High end requires youth enthusiasm matching 2021. Low end reflects disillusionment + normal incumbency election pattern.' },
  ],

  // ── 20 Electoral Factor Domains ──
  electionFactors: [
    { id: 'historical_patterns', label: 'Historical Voting Patterns', domain: 'A', weight: 8,
      upndAdvantage: 62, oppositionAdvantage: 52, trend: 'NARROWING',
      upndNote: 'UPND 2021 59.4% baseline, but model discounts 15–20pt for incumbency fatigue cycle.',
      oppositionNote: 'PF northern base intact; 2016 precedent (50.4% PF) shows the race can tighten.',
      riskFlag: false, riskLevel: 'MEDIUM' },
    { id: 'provincial_geography', label: 'Provincial & Constituency Geography', domain: 'C', weight: 9,
      upndAdvantage: 58, oppositionAdvantage: 60, trend: 'CONTESTED',
      upndNote: 'UPND anchors Southern, Western, North-Western; Lusaka narrow edge.',
      oppositionNote: 'Northern, Luapula, Muchinga, Eastern opposition anchors; Copperbelt battleground.',
      riskFlag: true, riskLevel: 'HIGH' },
    { id: 'identity_coalition', label: 'Identity / Language / Coalition Building', domain: 'G', weight: 7,
      upndAdvantage: 52, oppositionAdvantage: 55, trend: 'RISK',
      upndNote: 'UPND now a broad national coalition, not just Southern base. Running mate selection critical.',
      oppositionNote: 'Mundubile-Makebi coalition risks fragmentation. Kalaba CF transfers matter. Eastern/Northern consolidation is key.',
      riskFlag: true, riskLevel: 'HIGH' },
    { id: 'economic_conditions', label: 'Economic Conditions (Macro vs Household)', domain: 'E', weight: 10,
      upndAdvantage: 48, oppositionAdvantage: 62, trend: 'HURTS UPND',
      upndNote: 'GDP 4.2% growth, IMF deal, debt restructuring — macro story is real. But voters feel prices, not GDP.',
      oppositionNote: 'Opposition correctly frames: GDP grows while mealie meal, fuel, electricity pain hits households.',
      riskFlag: true, riskLevel: 'CRITICAL' },
    { id: 'cost_of_living', label: 'Cost of Living & Household Stress', domain: 'E', weight: 10,
      upndAdvantage: 32, oppositionAdvantage: 70, trend: 'CRITICAL RISK',
      upndNote: 'Mealie meal K400/25kg, kwacha weak, electricity disrupts income. This is the #1 voter grievance.',
      oppositionNote: 'Single most powerful opposition argument. Mealie meal/fuel/electricity proof points hit daily.',
      riskFlag: true, riskLevel: 'CRITICAL' },
    { id: 'youth_unemployment', label: 'Youth Unemployment & Youth Turnout', domain: 'D', weight: 9,
      upndAdvantage: 44, oppositionAdvantage: 58, trend: 'RISK',
      upndNote: 'UPND relied on youth turnout in 2021. ZamStats 32.6% unemployment in 19-22 cohort. Are they still mobilised?',
      oppositionNote: 'SP/M\'membe and TikTok opposition growing fastest with 18-35 demographic. Youth anger = electoral risk.',
      riskFlag: true, riskLevel: 'HIGH' },
    { id: 'voter_registration', label: 'Voter Registration & Register Quality', domain: 'D', weight: 7,
      upndAdvantage: 55, oppositionAdvantage: 50, trend: 'NEUTRAL',
      upndNote: '8,786,300 registered; youth registration drive somewhat benefits UPND if enthusiasm holds.',
      oppositionNote: 'Opposition needs to verify ward-level register for anomalies and ensure polling agent coverage.',
      riskFlag: false, riskLevel: 'MEDIUM' },
    { id: 'turnout_model', label: 'Turnout Probability', domain: 'D', weight: 9,
      upndAdvantage: 52, oppositionAdvantage: 60, trend: 'WATCH',
      upndNote: 'High turnout (2021: 70.6%) favoured UPND. If turnout drops to 55–60%, incumbency machinery advantage shrinks UPND margin.',
      oppositionNote: 'Low turnout (2015/2016 pattern) historically favours party-machinery election — PF structure in north is still operational.',
      riskFlag: true, riskLevel: 'HIGH' },
    { id: 'party_machinery', label: 'Party Machinery & Ground Mobilisation', domain: 'G', weight: 8,
      upndAdvantage: 58, oppositionAdvantage: 62, trend: 'CONTESTED',
      upndNote: 'UPND now has incumbent resources, CDF, civil service. But opposition PF ward structures in north intact.',
      oppositionNote: 'PF/NDC ward structures + Bemba-belt radio networks stronger than UPND in 5 provinces.',
      riskFlag: false, riskLevel: 'MEDIUM' },
    { id: 'candidate_credibility', label: 'Candidate Credibility & Leadership Contrast', domain: 'G', weight: 8,
      upndAdvantage: 60, oppositionAdvantage: 50, trend: 'UPND EDGE',
      upndNote: 'HH retains credibility on international platform, debt deal, and business competence. Running mate choice will be watched.',
      oppositionNote: 'Mundubile credibility growing in north; less known nationally. Kalaba strong on integrity brand.',
      riskFlag: false, riskLevel: 'MEDIUM' },
    { id: 'incumbency_advantage', label: 'Incumbency Advantage / State Resources', domain: 'F', weight: 7,
      upndAdvantage: 70, oppositionAdvantage: 30, trend: 'UPND ADVANTAGE — MUST DISCOUNT',
      upndNote: 'CDF, state media, project launches, civil service access. Incumbency visibility inflates raw support numbers.',
      oppositionNote: 'Opposition observers must document state resource misuse. CCMG observation critical here.',
      riskFlag: true, riskLevel: 'HIGH' },
    { id: 'media_access', label: 'Media Access & State Media Bias', domain: 'H', weight: 6,
      upndAdvantage: 65, oppositionAdvantage: 42, trend: 'UPND ADVANTAGE',
      upndNote: 'ZNBC coverage heavily skewed UPND. Private radio (Radio Phoenix, Muvi) more balanced. Online shifting opposition.',
      oppositionNote: 'Opposition viable through private radio, church networks, WhatsApp, and social media amplification.',
      riskFlag: true, riskLevel: 'HIGH' },
    { id: 'social_media_info', label: 'Social Media & Information Flows', domain: 'H', weight: 6,
      upndAdvantage: 50, oppositionAdvantage: 58, trend: 'MIXED — ONLINE ≠ VOTES',
      upndNote: 'HH social media reach large but incumbency backlash louder on cost-of-living threads.',
      oppositionNote: 'SP/M\'membe and Mundubile gaining online traction. Social sentiment ≠ rural vote share.',
      riskFlag: false, riskLevel: 'MEDIUM' },
    { id: 'violence_intimidation', label: 'Violence, Cadres, Intimidation & Security', domain: 'H', weight: 8,
      upndAdvantage: 45, oppositionAdvantage: 50, trend: 'MONITOR — BOTH SIDES',
      upndNote: 'CIVICUS rates Zambia civic space OBSTRUCTED. History of cadre activity. Must monitor ECZ report cards.',
      oppositionNote: 'Historical intimidation suppressed opposition in 2016. CCMG must deploy to all contested constituencies.',
      riskFlag: true, riskLevel: 'HIGH' },
    { id: 'institutional_trust', label: 'Institutional Trust: ECZ, Courts, Police', domain: 'F', weight: 8,
      upndAdvantage: 58, oppositionAdvantage: 52, trend: 'WATCH',
      upndNote: 'ECZ credibility moderate. UPND benefited from credible ECZ in 2021. Petition risk real if result is close.',
      oppositionNote: 'ConCourt petition within 7 days of declaration is available. Dispute risk higher in tight race.',
      riskFlag: true, riskLevel: 'HIGH' },
    { id: 'corruption_governance', label: 'Corruption & Governance Perception', domain: 'F', weight: 8,
      upndAdvantage: 55, oppositionAdvantage: 48, trend: 'WATCH',
      upndNote: 'UPND promised anti-corruption. Procurement concerns emerging. Afrobarometer democratic satisfaction declined post-2021 peak.',
      oppositionNote: 'Opposition must offer credible governance alternative, not just attack. PF record is a liability for Mundubile.',
      riskFlag: false, riskLevel: 'MEDIUM' },
    { id: 'service_delivery', label: 'Local Service Delivery & CDF/Projects', domain: 'I', weight: 7,
      upndAdvantage: 64, oppositionAdvantage: 38, trend: 'UPND ADVANTAGE',
      upndNote: 'CDF most visible delivery proof. Free education real. Roads visible. Counter: power cuts, mealie meal undercut delivery narrative.',
      oppositionNote: 'Where CDF has not reached, or where delivery quality is poor, opposition gains credibility.',
      riskFlag: false, riskLevel: 'LOW' },
    { id: 'agriculture_food', label: 'Agriculture, Food Security, Rainfall, Drought', domain: 'O', weight: 8,
      upndAdvantage: 48, oppositionAdvantage: 55, trend: 'RISK IN NORTH/EAST',
      upndNote: 'FISP delivery delays in Northern/Eastern critical. Southern drought-recovery must show in harvest numbers.',
      oppositionNote: '2024 drought + delayed inputs = farmer grievance in 5 provinces. Agriculture is a mobilisation lever.',
      riskFlag: true, riskLevel: 'HIGH' },
    { id: 'mining_copperbelt', label: 'Mining, Copperbelt Labour Politics, Copper Prices', domain: 'P', weight: 7,
      upndAdvantage: 45, oppositionAdvantage: 62, trend: 'RISK',
      upndNote: 'Copper prices recovering (LME ~$9,200/t). But contractor payment cycle, local supplier contracts, and KCM/Mopani status drive Copperbelt mood.',
      oppositionNote: 'Copperbelt is historically volatile. Mining job anger + SP resource-nationalism narrative = real electoral pressure.',
      riskFlag: true, riskLevel: 'HIGH' },
    { id: 'electoral_law', label: 'Electoral Law, Delimitation, Nominations, Petitions', domain: 'B', weight: 7,
      upndAdvantage: 55, oppositionAdvantage: 48, trend: 'WATCH',
      upndNote: '226 constituencies (70 new — zero voting history). Nomination deadlines critical. ConCourt dispute path exists.',
      oppositionNote: 'New constituencies may advantage or disadvantage any party depending on boundary design — verify each.',
      riskFlag: true, riskLevel: 'HIGH' },
  ],

  // ── National Poll with Uncertainty Bands ──
  nationalPollUncertainty: {
    upnd:   { point: 47.2, low: 43.8, high: 50.6, confidence: 68 },
    pf_ndc: { point: 20.3, low: 17.5, high: 23.1, confidence: 62 },
    kalaba: { point: 3.8,  low: 2.4,  high: 5.4,  confidence: 55 },
    membe:  { point: 4.1,  low: 2.8,  high: 6.0,  confidence: 55 },
    kateka: { point: 1.5,  low: 0.8,  high: 2.5,  confidence: 50 },
    others: { point: 23.1, low: 19.0, high: 27.5, confidence: 45 },
    methodologyNote: 'Uncertainty bands derived from 2016–2021 Zambia survey-to-result error range (±3.4pt avg), opposition fragmentation variance, and turnout model uncertainty. Not a certified poll. Fear-of-disclosure effect may suppress UPND or opposition numbers by 2–4pt in contested areas.',
    lastUpdated: '2026-05-18',
  },

  // ── Runoff Probability Engine ──
  runoffProbability: {
    firstRoundWinProbability: 34,
    runoffProbability: 66,
    methodology: 'Monte Carlo simulation (10,000 runs) over national vote share distribution. UPND mean 47.2%, std 1.8pt. Threshold 50.0%+1 of valid votes. P(UPND ≥ 50.01%) = 34%.',
    scenarioMatrix: [
      { scenario: 'Status quo (baseline)',             upndShare: 47.2, firstRoundWin: 34, note: 'Below threshold; runoff risk dominant' },
      { scenario: 'Energy + cost relief delivered',    upndShare: 53.4, firstRoundWin: 78, note: 'Clears threshold with credible delivery proof' },
      { scenario: 'Opposition ticket consolidation',   upndShare: 42.0, firstRoundWin: 8,  note: 'Mundubile + Kalaba + M\'membe vote pools transfer' },
      { scenario: 'High-turnout youth (2021 repeat)',  upndShare: 51.8, firstRoundWin: 62, note: 'Youth mobilisation matching 2021 pattern' },
      { scenario: 'Low-turnout incumbency drag',       upndShare: 45.0, firstRoundWin: 18, note: '2016-style turnout 56%; enthusiasm gap hurts UPND' },
      { scenario: 'Economic pain escalation',          upndShare: 43.5, firstRoundWin: 12, note: 'Mealie meal + load shedding dominate to polling day' },
    ],
    lastUpdated: '2026-05-18',
    disclaimer: 'Probability estimate, not prediction. Requires actual ECZ historical result calibration to reach full reliability.',
  },

  // ── Institutional Trust ──
  institutionalTrust: {
    ecz:         { score: 62, trend: 'STABLE',   label: 'ECZ',            source: 'Afrobarometer R10 (INESOR/UNZA)', note: 'ECZ perceived as technically competent. Trust higher than 2016. Independence concerns from opposition still flagged.' },
    courts:      { score: 55, trend: 'DECLINING', label: 'Constitutional Court', source: 'Afrobarometer R10',         note: 'ConCourt petition track record mixed. 7-day petition window is operative. Dispute risk elevated in close race.' },
    police:      { score: 48, trend: 'LOW',       label: 'Zambia Police',  source: 'CIVICUS Monitor / CCMG',          note: 'Political policing concerns from opposition. Civic space rated OBSTRUCTED. Monitoring critical.' },
    znbc:        { score: 35, trend: 'BIASED',    label: 'ZNBC/State Media', source: 'MISA Zambia',                   note: 'State broadcaster heavily favours UPND coverage. Discount ZNBC positive sentiment by 30–35pt. Private radio more balanced.' },
    parliament:  { score: 52, trend: 'NEUTRAL',   label: 'National Assembly', source: 'Afrobarometer R10',            note: 'Parliament perceived as relatively functional. Delimitation and electoral reform debates active.' },
    ccmg:        { score: 78, trend: 'HIGH',      label: 'CCMG Zambia',    source: 'CCMG self-assessment',            note: 'Most trusted domestic election observer. Deployed in 2021. Accreditation status for 2026 to be monitored.' },
    anticorruption: { score: 50, trend: 'WATCH',  label: 'ACC / DEC',      source: 'Transparency International',      note: 'Anti-corruption agencies active but perceived as selectively prosecuting PF targets. UPND credibility depends on even-handed enforcement.' },
  },

  // ── Mining Indicators ──
  miningIndicators: {
    copperPriceLME_USD_t: 9200,
    copperPriceTrend: 'RECOVERING',
    kcmStatus: 'PROVISIONAL LIQUIDATION — contested; investor negotiations ongoing',
    mopaniStatus: 'OPERATING under IFISA management',
    copperbeltFormalEmployment: 85000,
    contractorPaymentRisk: 'HIGH',
    localSupplierGrievances: 'ELEVATED in Kitwe, Ndola, Chingola',
    newMiningProjects: [
      'Sentinel Mine expansion (North-Western Province) — capacity growing',
      'Mingomba Copper (North-Western) — development stage',
      'Kabompo Gorge hydro + Kalumbila power — infrastructure for mining corridor',
    ],
    resourceNationalismRisk: 'MEDIUM-HIGH — SP/M\'membe narrative gaining traction; royalty and profit-sharing debate active',
    modelEffect: 'Copper price recovery helps UPND macro story but does not reach households directly. Contractor payment delays and mine job shortages are the Copperbelt swing variable, not the copper price.',
    votingEffect: 'Copperbelt is a true battleground. Mining community anger (contractor payments, local suppliers, youth employment) can swing 3–5pt in urban Copperbelt constituencies.',
  },

  // ── Agriculture Indicators ──
  agricultureIndicators: {
    season2025_26: 'PARTIAL RECOVERY from 2024 drought',
    rainfallStatus: 'BELOW NORMAL: Western, Southern, North-Western. NORMAL: Northern, Eastern, Central, Luapula.',
    maizePriceZMW_50kg: 3200,
    maizePriceTrend: 'ELEVATED — above 2021 prices in most regions',
    FISPDeliveryStatus: {
      onTime:   ['Southern', 'Central'],
      delayed:  ['Eastern', 'Muchinga', 'Northern'],
      patchy:   ['Western', 'North-Western', 'Luapula'],
    },
    FRAMaizePurchases: 'BELOW TARGET — farmer frustration with low volumes and delayed payment in Eastern/Muchinga',
    droughtAffectedProvinces: ['Western', 'Southern', 'North-Western'],
    livestockRisk: 'ELEVATED in Southern (cattle disease + water stress)',
    modelEffect: 'FISP delivery failures in Northern/Eastern/Muchinga are a direct electoral risk for UPND in 3 opposition-leaning provinces. Drought-recovery in Southern Province holds HH base but is at risk if support is not visible.',
    votingEffect: 'Agriculture delivery is most electorally decisive in Northern, Eastern, Muchinga — all currently opposition-leaning. Any improvement in FISP/FRA delivery can narrow opposition margins in these provinces.',
  },

  // ── Election Integrity Signals ──
  integritySignals: {
    voterRegisterAnomalies: { risk: 'LOW-MEDIUM', source: 'ECZ', note: '8,786,300 registered. Registration growth rate normal. No major anomaly reported yet. Verification window still open.' },
    ballotLogistics: { risk: 'LOW', source: 'ECZ', note: 'ECZ procurement processes active. Previous elections delivered ballots on time. Monitor USAID/EU support for printing and logistics.' },
    pollingStationReadiness: { risk: 'MEDIUM', source: 'ECZ/CCMG', note: '226 constituencies include 70 new. Some new constituencies may have access or infrastructure challenges. Monitor rural access roads.' },
    observerAccreditation: { risk: 'MEDIUM', source: 'CCMG/AU/SADC', note: 'CCMG deploying. AU and SADC observer missions to be confirmed. EU accreditation status watch. Adequate coverage needed in new constituencies.' },
    parallelVoteTabulation: { risk: 'MEDIUM', source: 'CCMG', note: 'PVT requires polling agent coverage at all 11,000+ polling stations. Historically incomplete in remote districts.' },
    resultTransmission: { risk: 'LOW-MEDIUM', source: 'ECZ', note: 'ECZ electronic result transmission system active since 2021. Connectivity gaps in remote constituencies remain.' },
    petitionLikelihood: { risk: 'HIGH if margin <2%', source: 'ConCourt', note: 'If UPND wins by less than 2 percentage points, petition is highly probable. 7-day window. 2015 and 2016 precedents show petitions are survivable for ruling parties but destabilising.' },
    postElectionViolence: { risk: 'LOW-MEDIUM', source: 'ACLED/CIVICUS', note: 'Zambia has historically managed post-election transitions peacefully. Risk rises if result is disputed or if cadre activity escalates before polling day.' },
    overallIntegrityScore: 65,
    overallIntegrityRating: 'MODERATELY CREDIBLE — WATCH',
  },

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
