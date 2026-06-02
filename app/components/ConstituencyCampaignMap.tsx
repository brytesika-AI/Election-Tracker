'use client'

import { useState, useMemo } from 'react'

// ── Design tokens matching SentimentCommand Platform ──
const C = {
  bg:      '#060C14',
  card:    '#0E1724',
  card2:   '#121C2C',
  border:  '#1C2A3A',
  text:    '#E2E8F0',
  muted:   '#7A8FA6',
  gold:    '#F5C400',
  upnd:    '#FF6B00',
  pf:      '#CC0000',
  sp:      '#E74C3C',
  cf:      '#27AE60',
  zmp:     '#E67E22',
  teal:    '#00C9A7',
  ocean:   '#07111E',
  completed: '#198A00',
  progress:  '#F5C400',
  delayed:   '#CC0000',
}

interface ParliamentaryCandidate {
  name: string
  party: string
  color: string
  status: 'Leading' | 'Competitive' | 'Trailing'
  chatterScore: number // 0-100 public sentiment
  platformFocus: string
  latestUpdate: string
}

interface CdfProject {
  id: string
  name: string
  type: 'Healthcare' | 'Infrastructure' | 'Water Security' | 'Education'
  funding: string
  status: 'Completed' | 'In Progress' | 'Delayed'
  voterVisibility: 'High' | 'Medium' | 'Low'
  tacticalStrategy: string
  details: string
}

interface ConstituencyData {
  name: string
  province: string
  registeredVoters: number
  targetSwingWeight: 'Critical Swing' | 'Incumbent Stronghold' | 'Opposition Lock' | 'Lean Swing'
  incumbentParty: string
  x: number // Map layout coordinates
  y: number
  candidates: ParliamentaryCandidate[]
  projects: CdfProject[]
  generalNews: string
  campaignStrategyTask: string
}

const CONSTITUENCIES: ConstituencyData[] = [
  {
    name: 'Munali',
    province: 'Lusaka',
    registeredVoters: 154200,
    targetSwingWeight: 'Critical Swing',
    incumbentParty: 'UPND',
    x: 430,
    y: 380,
    candidates: [
      { name: 'Mike Mposha', party: 'UPND', color: C.upnd, status: 'Leading', chatterScore: 56, platformFocus: 'Facebook / Radio', latestUpdate: 'UPND home-to-home mobilizers deployed in Chelstone. Actively campaigning on CDF success.' },
      { name: 'Josephine Mphanza', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Competitive', chatterScore: 48, platformFocus: 'Community Rallies', latestUpdate: 'Targeting market women at Chelstone Market on mealie meal pricing.' },
      { name: 'Chanda Mwale', party: 'Socialist Party', color: C.sp, status: 'Trailing', chatterScore: 32, platformFocus: 'TikTok / Youth hubs', latestUpdate: 'Gaining momentum in Chainda youth groups with IMF-critique handbills.' }
    ],
    projects: [
      { id: 'proj-mun-1', name: 'Munali Clinic Maternity Wing Extension', type: 'Healthcare', funding: 'K4,200,000', status: 'Completed', voterVisibility: 'High', tacticalStrategy: 'Launch a heavy visual hyper-local campaign focusing on the free maternity services to offset generic cost-of-living anger in Chelstone.', details: 'Brand-new modern facility serving 25,000+ residents. 100% operational with free government staffing.' },
      { id: 'proj-mun-2', name: 'Chainda Secondary School Science Lab', type: 'Education', funding: 'K2,100,000', status: 'In Progress', voterVisibility: 'Medium', tacticalStrategy: 'Arrange a delegation of youth student creators to tour the lab structure to counter Socialist Party student narratives.', details: 'Structural work 80% complete. Supply contracts for gas taps and solar power backup are currently being verified.' }
    ],
    generalNews: 'Munali is highly reactive to cost-of-living news. CDF launches serve as the key counter-weights. Turnout is projected high.',
    campaignStrategyTask: 'Deploy student mobilizers to showcase completed Munali Clinic Maternity wing before August 2026 nomination rallies.'
  },
  {
    name: 'Kabwata',
    province: 'Lusaka',
    registeredVoters: 138500,
    targetSwingWeight: 'Critical Swing',
    incumbentParty: 'UPND',
    x: 450,
    y: 410,
    candidates: [
      { name: 'Andrew Tayengwa', party: 'UPND', color: C.upnd, status: 'Competitive', chatterScore: 51, platformFocus: 'Constituency Radio', latestUpdate: 'Tayengwa highlights 12 newly completed inner community roads in Libala.' },
      { name: 'Clement Tembo', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Competitive', chatterScore: 52, platformFocus: 'Market Scrapes / Facebook', latestUpdate: 'Tembo gains strong traction in Chilenje markets, focusing on Mealie Meal price pain.' },
      { name: 'Martha Mwansa', party: 'Socialist Party', color: C.sp, status: 'Trailing', chatterScore: 28, platformFocus: 'WhatsApp Broadcasts', latestUpdate: 'Focusing on university students in Libala corridor with scholarship reform talks.' }
    ],
    projects: [
      { id: 'proj-kab-1', name: 'Chilenje Market Tarred Roads & Drainage Network', type: 'Infrastructure', funding: 'K5,800,000', status: 'In Progress', voterVisibility: 'High', tacticalStrategy: 'Accelerate construction phase before August. Highlight flood mitigation works directly to market traders who suffered in the last wet season.', details: '8 of 12 roads tarred. Heavy civil engineering in progress on main outfall drain.' }
    ],
    generalNews: 'Tight battleground. PF-Pamodzi activists are targeting Chilenje and Kabwata markets heavily. Minor candidate splits could benefit UPND.',
    campaignStrategyTask: 'Establish mobile clinics on completed Libala inner roads to highlight CDF delivery to peri-urban swing voters.'
  },
  {
    name: 'Ndola Central',
    province: 'Copperbelt',
    registeredVoters: 142000,
    targetSwingWeight: 'Critical Swing',
    incumbentParty: 'UPND',
    x: 390,
    y: 220,
    candidates: [
      { name: 'Frank Tayali', party: 'UPND', color: C.upnd, status: 'Competitive', chatterScore: 54, platformFocus: 'Mining unions / Facebook', latestUpdate: 'Tayali pledges local contractor payments are sorted and KCM/Mopani mines are hiring.' },
      { name: 'Emmanuel Mulenga', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Competitive', chatterScore: 49, platformFocus: 'Church gatherings', latestUpdate: 'Mulenga highlights job losses in sub-contractors and business closures in industrial area.' }
    ],
    projects: [
      { id: 'proj-ndo-1', name: 'Ndola Main Market Solar Power Hub', type: 'Water Security', funding: 'K3,500,000', status: 'Completed', voterVisibility: 'High', tacticalStrategy: 'Brilliant energy relief proof. Deploy mini solar chargers to market stallholders. Directly combats load-shedding grievances.', details: '450kW micro-grid with batteries. Powers Ndola Main Market cold storage and lighting during outages.' }
    ],
    generalNews: 'Mining sub-contractor payments are the single most active discussion point. Load-shedding hits small shopkeepers.',
    campaignStrategyTask: 'Highlight Ndola Main Market Solar Hub on local Copperbelt Radio and WhatsApp networks to show actual energy relief.'
  },
  {
    name: 'Kitwe Central',
    province: 'Copperbelt',
    registeredVoters: 161000,
    targetSwingWeight: 'Lean Swing',
    incumbentParty: 'Tonse Alliance (PF)',
    x: 360,
    y: 240,
    candidates: [
      { name: "Kang'ombe Christopher", party: 'Tonse Alliance (PF)', color: C.pf, status: 'Leading', chatterScore: 62, platformFocus: 'Direct Community / Radio', latestUpdate: 'Christopher leads community sensitization drives, cementing solid local grassroots.' },
      { name: 'Leonard Phiri', party: 'UPND', color: C.upnd, status: 'Competitive', chatterScore: 44, platformFocus: 'CDF Launches', latestUpdate: 'Phiri tours completed education projects but faces strong anti-incumbency mine sentiment.' }
    ],
    projects: [
      { id: 'proj-kit-1', name: 'Nkana Youth Skills Development Centre', type: 'Education', funding: 'K2,900,000', status: 'Completed', voterVisibility: 'Medium', tacticalStrategy: 'Deploy mineral-processing and mining engineering scholarships directly to Nkana graduates. Shift debate from nostalgia to future jobs.', details: 'Fully rehabilitated block with new computer lab and welding workshops. 450 students enrolled.' }
    ],
    generalNews: 'Kitwe remains an opposition stronghold. Christopher Kang\'ombe has a very strong personal brand. Mine transition plans must be communicated.',
    campaignStrategyTask: 'Organize mine contractor townhall meetings in Kitwe to announce verified payment numbers and counter opposition mining attack.'
  },
  {
    name: 'Mansa Central',
    province: 'Luapula',
    registeredVoters: 122000,
    targetSwingWeight: 'Opposition Lock',
    incumbentParty: 'Tonse Alliance (PF)',
    x: 430,
    y: 150,
    candidates: [
      { name: 'Chabu Chilangwa', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Leading', chatterScore: 65, platformFocus: 'Traditional Networks', latestUpdate: 'Chilangwa leverages regional Bemba networks. Activates dormant PF branch cells.' },
      { name: 'Davies Mwila', party: 'CF Orange Alliance', color: C.cf, status: 'Trailing', chatterScore: 35, platformFocus: 'Luapula Radio', latestUpdate: 'Mwila draws moderate crowds but is squeezed by Chilangwa\'s strong machine.' },
      { name: 'Gertrude Bwalya', party: 'UPND', color: C.upnd, status: 'Trailing', chatterScore: 30, platformFocus: 'CDF Launches', latestUpdate: 'Bwalya faces severe fishing-ban and rural road grievances.' }
    ],
    projects: [
      { id: 'proj-man-1', name: 'Mansa General Hospital Maternity Block', type: 'Healthcare', funding: 'K6,200,000', status: 'Delayed', voterVisibility: 'High', tacticalStrategy: 'Delayed status is highly toxic. Immediate taskforce required to address contractor bottlenecks. Weaponized daily on Mansa radio.', details: 'Structure standing but abandoned at 60% complete due to funding bottleneck and supplier dispute.' }
    ],
    generalNews: 'Deep opposition territory. Fishing economy grievances around Mweru Wantipa bans are highly capitalized on by PF.',
    campaignStrategyTask: 'Fast-track Mansa Maternity Block funding. Announce date of completion to diffuse Chilangwa\'s key radio weapon.'
  },
  {
    name: 'Solwezi Central',
    province: 'North-Western',
    registeredVoters: 115000,
    targetSwingWeight: 'Incumbent Stronghold',
    incumbentParty: 'UPND',
    x: 260,
    y: 200,
    candidates: [
      { name: 'Stafford Mulusa', party: 'UPND', color: C.upnd, status: 'Leading', chatterScore: 68, platformFocus: 'Facebook / Direct Meetings', latestUpdate: 'Mulusa leverages Solwezi dual-carriageway road progress and mining supplier benefits.' },
      { name: 'Jackson Mwila', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Trailing', chatterScore: 24, platformFocus: 'Local Radios', latestUpdate: 'Mwila tries to tap into mining contractor payment grievances with limited success.' }
    ],
    projects: [
      { id: 'proj-sol-1', name: 'Solwezi-Kansanshi Dual Carriageway Rehabilitation', type: 'Infrastructure', funding: 'K12,500,000', status: 'Completed', voterVisibility: 'High', tacticalStrategy: 'Outstanding incumbent asset. Run drone videos on Facebook and local TV highlighting quick travel times. Combats general rural neglect charges.', details: '14km high-quality asphalt dual-carriageway finished with lighting, radically reducing mine transport bottlenecks.' }
    ],
    generalNews: 'Very safe UPND territory. High expectations on mining jobs and community royalties must be carefully managed.',
    campaignStrategyTask: 'Publish Solwezi Dual Carriageway drone clips on Facebook and distribute via local WhatsApp groups for max visibility.'
  },
  {
    name: 'Choma Central',
    province: 'Southern',
    registeredVoters: 129000,
    targetSwingWeight: 'Incumbent Stronghold',
    incumbentParty: 'UPND',
    x: 350,
    y: 460,
    candidates: [
      { name: 'Cornelius Mweetwa', party: 'UPND', color: C.upnd, status: 'Leading', chatterScore: 78, platformFocus: 'Southern Radio / Rallies', latestUpdate: 'Mweetwa dominates local political space, focusing on universal free education and CDF drought borehole success.' },
      { name: 'Gift Mudenda', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Trailing', chatterScore: 18, platformFocus: 'Community Meetings', latestUpdate: 'Mudenda struggles to find campaign ground. Struggles to set up active ward structures.' }
    ],
    projects: [
      { id: 'proj-cho-1', name: 'Choma Drought Solar-Borehole Network', type: 'Water Security', funding: 'K4,800,000', status: 'Completed', voterVisibility: 'High', tacticalStrategy: 'Mobilize agricultural clubs and women cooperatives around the 45 solar water points to offset national drought recovery panic.', details: '45 solar-powered deep boreholes built across rural wards, delivering clean irrigation water to 18,000 farmers during extreme dry season.' }
    ],
    generalNews: 'Absolute UPND anchor province. Regional loyalty combined with massive free education enrollment makes it impenetrable to opposition.',
    campaignStrategyTask: 'Coordinate local farmer clips showcasing Choma solar boreholes to broadcast on Southern radio and nationwide news.'
  }
]

export default function ConstituencyCampaignMap() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConstName, setSelectedConstName] = useState('Munali')
  const [mapZoom, setMapZoom] = useState<'national' | 'constituency'>('national')
  const [activeViewMode, setActiveViewMode] = useState<'projects' | 'candidates' | 'strategy'>('projects')
  const [strategyStatus, setStrategyStatus] = useState<Record<string, boolean>>({
    'Munali': false,
    'Kabwata': false,
    'Ndola Central': false,
    'Kitwe Central': false,
    'Mansa Central': false,
    'Solwezi Central': false,
    'Choma Central': false,
  })

  const filteredConstituencies = useMemo(() => {
    return CONSTITUENCIES.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.province.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const selectedConst = useMemo(() => {
    return CONSTITUENCIES.find(c => c.name === selectedConstName) ?? CONSTITUENCIES[0]
  }, [selectedConstName])

  const targetWeights = {
    'Critical Swing': { bg: `${C.gold}20`, border: C.gold, color: C.gold },
    'Lean Swing': { bg: `${C.zmp}20`, border: C.zmp, color: C.zmp },
    'Incumbent Stronghold': { bg: `${C.completed}20`, border: C.completed, color: C.completed },
    'Opposition Lock': { bg: `${C.delayed}20`, border: C.delayed, color: C.delayed },
  }

  function handleMapPointClick(cName: string) {
    setSelectedConstName(cName)
    setMapZoom('constituency')
  }

  function toggleTaskCompleted(cName: string) {
    setStrategyStatus(prev => ({ ...prev, [cName]: !prev[cName] }))
  }

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Google Maps Styled Header Banner */}
      <div style={{ background: '#080F1A', borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ color: C.gold, fontWeight: 800, fontSize: 13, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🗺️</span> CONSTITUENCY COMMAND & PROJECT MAP (SIMULATED GOOGLE MAPS)
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
            Zoom in to verify localized CDF-funded projects, candidate updates, and real-time campaign strategy.
          </div>
        </div>
        
        {/* Quick Map Controls */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            type="button" 
            onClick={() => setMapZoom('national')}
            style={{ background: mapZoom === 'national' ? C.gold : C.card, color: mapZoom === 'national' ? '#000' : C.muted, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            🔎 National View
          </button>
          <button 
            type="button" 
            onClick={() => setMapZoom('constituency')}
            style={{ background: mapZoom === 'constituency' ? C.gold : C.card, color: mapZoom === 'constituency' ? '#000' : C.muted, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            🔎 Zoom In
          </button>
        </div>
      </div>

      {/* Main Command Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 360px', minHeight: 650 }}>
        
        {/* Left Side: Search & Constituency List */}
        <div style={{ background: C.card, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 14, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search Constituency or Province..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px 10px 32px', color: C.text, fontSize: 12, outline: 'none' }}
              />
              <span style={{ position: 'absolute', left: 10, top: 12, fontSize: 12 }}>🔍</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 580 }}>
            {filteredConstituencies.map(c => {
              const selected = c.name === selectedConstName
              const weight = targetWeights[c.targetSwingWeight]
              const taskDone = strategyStatus[c.name]
              return (
                <div 
                  key={c.name}
                  onClick={() => { setSelectedConstName(c.name); setMapZoom('constituency') }}
                  style={{ padding: 14, borderBottom: `1px solid ${C.border}`, background: selected ? 'rgba(245,196,0,0.06)' : 'transparent', borderLeft: `4px solid ${selected ? C.gold : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <strong style={{ color: selected ? C.gold : C.text, fontSize: 13 }}>{c.name} Constituency</strong>
                      <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{c.province} Province · {c.registeredVoters.toLocaleString()} voters</div>
                    </div>
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: weight.bg, border: `1px solid ${weight.border}`, color: weight.color, fontWeight: 700 }}>
                      {c.targetSwingWeight}
                    </span>
                  </div>
                  
                  {/* Miniature Strategy Checklist Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: taskDone ? C.completed : C.delayed }} />
                    <span style={{ fontSize: 9.5, color: C.muted }}>
                      {taskDone ? '✅ Strategy Task Deployed' : '⚠️ Strategy Action Pending'}
                    </span>
                  </div>
                </div>
              )
            })}
            {filteredConstituencies.length === 0 && (
              <div style={{ color: C.muted, padding: 20, textAlign: 'center', fontSize: 11 }}>
                No constituencies found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Center: Simulated Google Maps Interactive Canvas */}
        <div style={{ background: C.ocean, position: 'relative', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
          
          {/* Zoom Overlay Indicators */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, background: 'rgba(6,12,20,0.85)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 10, pointerEvents: 'none' }}>
            <span style={{ color: C.muted }}>Google Maps Viewport:</span>{' '}
            <strong style={{ color: mapZoom === 'national' ? C.teal : C.gold }}>
              {mapZoom === 'national' ? 'NATIONAL HUB' : `${selectedConst.name.toUpperCase()} constituency`}
            </strong>
            <div style={{ color: C.muted, fontSize: 8.5, marginTop: 2 }}>
              {mapZoom === 'national' ? 'Tap markers to zoom in and examine local projects' : 'Constituency level active · click "National View" to reset'}
            </div>
          </div>

          {/* Interactive Map Visualisation */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Simulated Satellite/Terrain Vector Overlay */}
            <svg 
              viewBox="0 0 800 600" 
              style={{ 
                width: '100%', 
                height: '100%', 
                maxWidth: 820,
                maxHeight: 600,
                transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transform: mapZoom === 'national' 
                  ? 'scale(1) translate(0px, 0px)' 
                  : `scale(2.4) translate(${400 - selectedConst.x}px, ${300 - selectedConst.y}px)`
              }}
            >
              {/* Ocean Grid Background */}
              <defs>
                <radialGradient id="map-bg" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="#111B2C" />
                  <stop offset="100%" stopColor="#040810" />
                </radialGradient>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(28,42,58,0.15)" strokeWidth="0.8" />
                </pattern>
                <filter id="marker-glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <rect width="800" height="600" fill="url(#map-bg)" />
              <rect width="800" height="600" fill="url(#grid)" />

              {/* Map Outline of Zambia (Simplified Stylized Base Topology) */}
              <path 
                d="M180,240 L280,180 L360,120 L480,140 L530,220 L600,260 L680,220 L740,320 L710,420 L640,480 L520,530 L380,480 L320,440 L240,480 L180,420 L150,320 Z" 
                fill="#0A1220" 
                stroke="#1B2B44" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
              />
              
              {/* Province Borders (Rough stylized guides) */}
              <line x1="380" y1="240" x2="430" y2="150" stroke="rgba(28,42,58,0.3)" strokeDasharray="3 3" />
              <line x1="390" y1="220" x2="430" y2="380" stroke="rgba(28,42,58,0.3)" strokeDasharray="3 3" />
              <line x1="260" y1="200" x2="360" y2="240" stroke="rgba(28,42,58,0.3)" strokeDasharray="3 3" />
              <line x1="430" y1="380" x2="350" y2="460" stroke="rgba(28,42,58,0.3)" strokeDasharray="3 3" />

              {/* Map Terrain labels when zoomed out */}
              {mapZoom === 'national' && (
                <>
                  <text x="350" y="320" fill="rgba(122,143,166,0.3)" fontSize="18" fontWeight="800" letterSpacing="0.2em">ZAMBIA</text>
                  <text x="440" y="290" fill="rgba(122,143,166,0.2)" fontSize="10" fontWeight="700" letterSpacing="0.1em">KAFUE NATIONAL PARK</text>
                  <text x="260" y="350" fill="rgba(122,143,166,0.2)" fontSize="10" fontWeight="700" letterSpacing="0.1em">BAROTSE FLOODPLAINS</text>
                  <text x="560" y="380" fill="rgba(122,143,166,0.2)" fontSize="10" fontWeight="700" letterSpacing="0.1em">LOWER ZAMBEZI</text>
                </>
              )}

              {/* Zoomed-in Topology Details (Simulated streets / local rivers near selected constituency) */}
              {mapZoom === 'constituency' && (
                <g opacity="0.6">
                  {/* Rivers / Lakes */}
                  <path d={`M ${selectedConst.x - 200} ${selectedConst.y + 120} Q ${selectedConst.x - 40} ${selectedConst.y + 40} ${selectedConst.x + 200} ${selectedConst.y + 90}`} fill="none" stroke="#003E6B" strokeWidth="6" opacity="0.4" />
                  
                  {/* Roads / Highways */}
                  <line x1={selectedConst.x - 250} y1={selectedConst.y} x2={selectedConst.x + 250} y2={selectedConst.y} stroke="rgba(245,196,0,0.15)" strokeWidth="4" />
                  <line x1={selectedConst.x} y1={selectedConst.y - 200} x2={selectedConst.x} y2={selectedConst.y + 200} stroke="rgba(245,196,0,0.15)" strokeWidth="4" />
                  <line x1={selectedConst.x - 200} y1={selectedConst.y - 120} x2={selectedConst.x + 200} y2={selectedConst.y + 120} stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                  
                  {/* Local Settlement Area Circles */}
                  <circle cx={selectedConst.x - 60} cy={selectedConst.y - 50} r="25" fill="rgba(28,42,58,0.2)" stroke="rgba(28,42,58,0.4)" strokeWidth="1.2" />
                  <circle cx={selectedConst.x + 80} cy={selectedConst.y + 40} r="35" fill="rgba(28,42,58,0.2)" stroke="rgba(28,42,58,0.4)" strokeWidth="1.2" />
                  <text x={selectedConst.x - 60} y={selectedConst.y - 48} fill="rgba(122,143,166,0.5)" fontSize="6" fontWeight="700" textAnchor="middle">SOCIETY AREA</text>
                  <text x={selectedConst.x + 80} y={selectedConst.y + 42} fill="rgba(122,143,166,0.5)" fontSize="6" fontWeight="700" textAnchor="middle">TRADE WARD</text>
                </g>
              )}

              {/* Interactive Constituency Location Pins (Simulating Google Map Pins) */}
              {CONSTITUENCIES.map(c => {
                const selected = c.name === selectedConstName
                const isIncumbUPND = c.incumbentParty === 'UPND'
                const primaryColor = isIncumbUPND ? C.upnd : C.pf
                
                // Project markers on top
                return (
                  <g 
                    key={c.name}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleMapPointClick(c.name)}
                  >
                    {/* Ring Outer Highlight */}
                    <circle 
                      cx={c.x} 
                      cy={c.y} 
                      r={selected ? 22 : 12} 
                      fill="none" 
                      stroke={selected ? C.gold : primaryColor} 
                      strokeWidth={selected ? 2.5 : 1}
                      strokeOpacity={selected ? 1 : 0.4}
                      opacity={mapZoom === 'national' || selected ? 1 : 0.3}
                    />

                    {/* Glowing pulse ring if selected */}
                    {selected && (
                      <circle 
                        cx={c.x} 
                        cy={c.y} 
                        r="35" 
                        fill="none" 
                        stroke={C.gold} 
                        strokeWidth="1.5" 
                        opacity="0.5"
                        style={{ transformOrigin: `${c.x}px ${c.y}px`, animation: 'pulse 1.8s infinite' }}
                      />
                    )}

                    {/* Google Pin Shape */}
                    <path 
                      d={`M ${c.x} ${c.y} C ${c.x - 8} ${c.y - 12} ${c.x - 12} ${c.y - 20} ${c.x} ${c.y - 28} C ${c.x + 12} ${c.y - 20} ${c.x + 8} ${c.y - 12} ${c.x} ${c.y} Z`}
                      fill={selected ? C.gold : primaryColor}
                      filter="url(#marker-glow)"
                      opacity={mapZoom === 'national' || selected ? 1 : 0.25}
                    />

                    {/* Inner Pin Dot */}
                    <circle 
                      cx={c.x} 
                      cy={c.y - 20} 
                      r="4.5" 
                      fill="#FFFFFF" 
                      opacity={mapZoom === 'national' || selected ? 1 : 0.3}
                    />

                    {/* Label Overlay */}
                    <g opacity={mapZoom === 'national' || selected ? 1 : 0.15}>
                      {/* Label Background */}
                      <rect 
                        x={c.x - 38} 
                        y={c.y + 4} 
                        width="76" 
                        height="16" 
                        rx="8" 
                        fill="rgba(6,12,20,0.85)" 
                        stroke={selected ? C.gold : 'rgba(28,42,58,0.7)'}
                        strokeWidth={selected ? 1.2 : 0.8}
                      />
                      {/* Text */}
                      <text 
                        x={c.x} 
                        y={c.y + 15} 
                        textAnchor="middle" 
                        fill={selected ? C.gold : C.text} 
                        fontSize="7.5" 
                        fontWeight="800"
                        letterSpacing="0.04em"
                      >
                        {c.name.toUpperCase()}
                      </text>
                    </g>

                    {/* Zoomed-in Project markers inside this constituency */}
                    {selected && mapZoom === 'constituency' && c.projects.map((proj, idx) => {
                      const projOffset = idx === 0 ? -42 : 42
                      const projColor = proj.status === 'Completed' ? C.completed : proj.status === 'In Progress' ? C.progress : C.delayed
                      
                      return (
                        <g key={proj.id} style={{ cursor: 'pointer' }}>
                          {/* Dotted Line linking constituency pin to project node */}
                          <line 
                            x1={c.x} 
                            y1={c.y - 20} 
                            x2={c.x + projOffset} 
                            y2={c.y - 60} 
                            stroke={projColor} 
                            strokeWidth="1.2" 
                            strokeDasharray="2 2" 
                          />
                          
                          {/* Project Circle Marker */}
                          <circle 
                            cx={c.x + projOffset} 
                            cy={c.y - 60} 
                            r="11" 
                            fill={projColor} 
                            stroke="#FFFFFF" 
                            strokeWidth="1.5" 
                          />
                          
                          {/* Inner Icon Symbol */}
                          <text 
                            x={c.x + projOffset} 
                            y={c.y - 56} 
                            textAnchor="middle" 
                            fill="#FFFFFF" 
                            fontSize="10" 
                            fontWeight="800"
                          >
                            {proj.type === 'Healthcare' ? '🏥' : proj.type === 'Education' ? '🏫' : proj.type === 'Water Security' ? '💧' : '🚧'}
                          </text>

                          {/* Tiny Project Tag */}
                          <rect 
                            x={c.x + projOffset - 30} 
                            y={c.y - 82} 
                            width="60" 
                            height="14" 
                            rx="4" 
                            fill="rgba(6,12,20,0.9)" 
                            stroke={projColor}
                            strokeWidth="0.8"
                          />
                          <text 
                            x={c.x + projOffset} 
                            y={c.y - 72} 
                            textAnchor="middle" 
                            fill="#FFFFFF" 
                            fontSize="6" 
                            fontWeight="700"
                          >
                            {proj.funding}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Quick Info Bar Overlay */}
          <div style={{ background: '#080F1A', borderTop: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 14 }}>
              {[
                { label: 'Completed Project', color: C.completed },
                { label: 'In Progress', color: C.progress },
                { label: 'Delayed / Bottleneck', color: C.delayed },
              ].map(leg => (
                <span key={leg.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.text }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: leg.color }} />
                  {leg.label}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 9.5, color: C.muted, fontFamily: 'monospace' }}>
              Zambia 2026 Constituency Mapping · Delimitation Audit Layer 1
            </div>
          </div>
        </div>

        {/* Right Side: Zoom-In Intelligence Panel */}
        <div style={{ background: C.card, display: 'flex', flexDirection: 'column' }}>
          
          {/* Tabs for Selected Constituency Detail */}
          <div style={{ display: 'flex', background: C.card2, borderBottom: `1px solid ${C.border}` }}>
            {[
              { id: 'projects', label: '🏥 CDF Projects', desc: 'Real Local Delivery' },
              { id: 'candidates', label: '👤 Candidates', desc: 'News & Chatter' },
              { id: 'strategy', label: '🎯 Strategy', desc: 'Next Actions' },
            ].map(tab => {
              const active = tab.id === activeViewMode
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveViewMode(tab.id as 'projects' | 'candidates' | 'strategy')}
                  style={{ flex: 1, padding: '12px 8px', background: active ? 'transparent' : C.card2, border: 'none', borderBottom: `3px solid ${active ? C.gold : 'transparent'}`, color: active ? C.gold : C.muted, cursor: 'pointer', outline: 'none' }}
                >
                  <strong style={{ fontSize: 11, display: 'block' }}>{tab.label}</strong>
                  <span style={{ fontSize: 8.5, color: C.muted }}>{tab.desc}</span>
                </button>
              )
            })}
          </div>

          {/* Details Scroll Area */}
          <div style={{ flex: 1, padding: 18, overflowY: 'auto', maxHeight: 540, display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Header info */}
            <div>
              <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 900, color: C.gold, letterSpacing: 1 }}>SELECTED CONSTITUENCY</span>
              <h3 style={{ color: C.text, fontSize: 22, margin: '4px 0 2px', fontWeight: 900 }}>{selectedConst.name}</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: C.muted }}>Incumbent MP: </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: selectedConst.incumbentParty === 'UPND' ? C.upnd : C.pf }}>
                  {selectedConst.incumbentParty}
                </span>
                <span style={{ color: C.muted, fontSize: 10 }}>·</span>
                <span style={{ fontSize: 10, color: C.muted }}>Voters: {(selectedConst.registeredVoters / 1000).toFixed(0)}K</span>
              </div>
            </div>

            {/* TAB: CDF PROJECTS */}
            {activeViewMode === 'projects' && (
              <>
                <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: 0.5, marginBottom: -6 }}>LOCAL CDF IMPACT</div>
                {selectedConst.projects.map(proj => {
                  const projColor = proj.status === 'Completed' ? C.completed : proj.status === 'In Progress' ? C.progress : C.delayed
                  return (
                    <div key={proj.id} style={{ background: C.card2, border: `1.5px solid ${C.border}`, borderTop: `4px solid ${projColor}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: C.text }}>{proj.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, color: projColor, background: projColor + '16', border: `1px solid ${projColor}44`, borderRadius: 4, padding: '2px 6px' }}>
                          {proj.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: C.muted, marginBottom: 8 }}>
                        <span>Funding: <strong style={{ color: C.text }}>{proj.funding}</strong></span>
                        <span>Visibility: <strong style={{ color: C.gold }}>{proj.voterVisibility}</strong></span>
                      </div>
                      <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, margin: '0 0 10px' }}>{proj.details}</p>
                      
                      <div style={{ background: 'rgba(6,12,20,0.8)', border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 10, lineHeight: 1.55 }}>
                        <span style={{ color: C.gold, fontWeight: 700, fontSize: 8.5, letterSpacing: 0.5, display: 'block', marginBottom: 3 }}>TACTICAL CAMPAIGN STRATEGY</span>
                        💡 {proj.tacticalStrategy}
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* TAB: CANDIDATES & NEWS */}
            {activeViewMode === 'candidates' && (
              <>
                <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: 0.5, marginBottom: -6 }}>CONSTITUENCY BALLOT FIELD</div>
                {selectedConst.candidates.map(cand => {
                  const statusColor = cand.status === 'Leading' ? C.completed : cand.status === 'Competitive' ? C.gold : C.delayed
                  return (
                    <div key={cand.name} style={{ background: C.card2, border: `1.5px solid ${C.border}`, borderLeft: `3px solid ${cand.color}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                        <div>
                          <strong style={{ color: cand.color, fontSize: 12 }}>{cand.name}</strong>
                          <span style={{ fontSize: 9, color: C.muted, display: 'block', marginTop: 1 }}>{cand.party} Candidate</span>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 800, color: statusColor, background: statusColor + '16', border: `1px solid ${statusColor}44`, borderRadius: 4, padding: '2px 6px' }}>
                          {cand.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9.5, color: C.muted, marginBottom: 8 }}>
                        <span>Sentiment: <strong style={{ color: cand.color }}>{cand.chatterScore}%</strong></span>
                        <span>Focus: <strong>{cand.platformFocus}</strong></span>
                      </div>
                      <p style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.5, margin: 0 }}>{cand.latestUpdate}</p>
                    </div>
                  )
                })}

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 900, color: C.gold, letterSpacing: 0.5 }}>LOCAL CONSTITUENCY NEWS</span>
                  <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 6, padding: 10, marginTop: 6, fontSize: 10.5, color: C.text, lineHeight: 1.55 }}>
                    📰 {selectedConst.generalNews}
                  </div>
                </div>
              </>
            )}

            {/* TAB: STRATEGIC TASK LIST */}
            {activeViewMode === 'strategy' && (
              <>
                <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: 0.5, marginBottom: -6 }}>CAMPAIGN OPERATIONS ACTION CARD</div>
                
                <div style={{ background: C.card2, border: `1px solid ${C.gold}50`, borderRadius: 8, padding: 12 }}>
                  <span style={{ fontSize: 8.5, color: C.gold, fontFamily: 'monospace', fontWeight: 900, display: 'block', marginBottom: 4 }}>CAMPAIGN OBJECTIVE</span>
                  <p style={{ fontSize: 11, color: C.text, lineHeight: 1.6, margin: 0, fontWeight: 700 }}>
                    {selectedConst.campaignStrategyTask}
                  </p>
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 900, color: C.gold, letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Ground Deployment Checklist</span>
                  
                  <div 
                    onClick={() => toggleTaskCompleted(selectedConst.name)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'start', 
                      gap: 10, 
                      background: 'rgba(6,12,20,0.8)', 
                      border: `1.5px solid ${strategyStatus[selectedConst.name] ? C.completed : C.border}`, 
                      borderRadius: 8, 
                      padding: 12, 
                      cursor: 'pointer',
                      transition: 'border 0.2s'
                    }}
                  >
                    <div style={{ 
                      width: 18, 
                      height: 18, 
                      borderRadius: 4, 
                      border: `2px solid ${strategyStatus[selectedConst.name] ? C.completed : C.border}`, 
                      background: strategyStatus[selectedConst.name] ? C.completed : 'transparent',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 900,
                      fontSize: 11,
                      flexShrink: 0
                    }}>
                      {strategyStatus[selectedConst.name] ? '✓' : ''}
                    </div>
                    <div>
                      <strong style={{ fontSize: 11.5, color: strategyStatus[selectedConst.name] ? C.completed : C.text }}>
                        Action: {strategyStatus[selectedConst.name] ? 'Deployed to Ground Teams' : 'Approve Ground Deployment'}
                      </strong>
                      <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.5, margin: '4px 0 0' }}>
                        Click this box to verify that you have briefed the provincial campaign committee and approved deployment of this specific CDF project narrative to the local street organizers.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ background: `${C.gold}11`, border: `1px solid ${C.gold}33`, borderRadius: 8, padding: '10px 12px', fontSize: 10, lineHeight: 1.5, color: C.muted }}>
                  📍 <strong>Strategist Protip:</strong> Munali, Kabwata, and Ndola Central are the most critical swing zones. High-impact CDF project visualization is proven to sway undecided voters in peri-urban markets by up to +3.5 percentage points.
                </div>
              </>
            )}

          </div>

          {/* Bottom All Constituencies Link */}
          <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center' }}>
            <button 
              type="button" 
              onClick={() => setMapZoom('national')}
              style={{ background: 'transparent', color: C.gold, border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
            >
              ← Back to Zambia National command view
            </button>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
