'use client'

import { useState, useMemo, useEffect, useRef } from 'react'

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

// ── Custom Dark Theme Map Styling for CNN-Style Visuals ──
const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#0e1724" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0e1724" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#7a8fa6" }] },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#1c2a3a" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#7a8fa6" }]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [{ "color": "#0b1220" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#121c2c" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#00c9a7" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#1c2a3a" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{ "color": "#1c2a3a" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#2a3d54" }]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{ "color": "#121c2c" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#07111e" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#7a8fa6" }]
  }
]

interface ParliamentaryCandidate {
  name: string
  party: string
  color: string
  status: 'Leading' | 'Competitive' | 'Trailing'
  chatterScore: number
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
  lat: number
  lng: number
}

interface ConstituencyData {
  name: string
  province: string
  registeredVoters: number
  targetSwingWeight: 'Critical Swing' | 'Incumbent Stronghold' | 'Opposition Lock' | 'Lean Swing'
  incumbentParty: string
  lat: number
  lng: number
  candidates: ParliamentaryCandidate[]
  projects: CdfProject[]
  generalNews: string
  campaignStrategyTask: string
}

// ── Zambia's Strategic Election Hotspots with real-world lat/lng ──
const CONSTITUENCIES: ConstituencyData[] = [
  {
    name: 'Munali',
    province: 'Lusaka',
    registeredVoters: 154200,
    targetSwingWeight: 'Critical Swing',
    incumbentParty: 'UPND',
    lat: -15.3888,
    lng: 28.3551,
    candidates: [
      { name: 'Mike Mposha', party: 'UPND', color: C.upnd, status: 'Leading', chatterScore: 56, platformFocus: 'Facebook / Radio', latestUpdate: 'UPND home-to-home mobilizers deployed in Chelstone. Actively campaigning on CDF success.' },
      { name: 'Josephine Mphanza', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Competitive', chatterScore: 48, platformFocus: 'Community Rallies', latestUpdate: 'Targeting market women at Chelstone Market on mealie meal pricing.' },
      { name: 'Chanda Mwale', party: 'Socialist Party', color: C.sp, status: 'Trailing', chatterScore: 32, platformFocus: 'TikTok / Youth hubs', latestUpdate: 'Gaining momentum in Chainda youth groups with IMF-critique handbills.' }
    ],
    projects: [
      { id: 'proj-mun-1', name: 'Munali Clinic Maternity Wing', type: 'Healthcare', funding: 'K4,200,000', status: 'Completed', voterVisibility: 'High', tacticalStrategy: 'Launch a heavy visual hyper-local campaign focusing on the free maternity services to offset generic cost-of-living anger in Chelstone.', details: 'Brand-new modern facility serving 25,000+ residents. 100% operational with free government staffing.', lat: -15.3872, lng: 28.3561 },
      { id: 'proj-mun-2', name: 'Chainda Secondary School Science Lab', type: 'Education', funding: 'K2,100,000', status: 'In Progress', voterVisibility: 'Medium', tacticalStrategy: 'Arrange a delegation of youth student creators to tour the lab structure to counter Socialist Party student narratives.', details: 'Structural work 80% complete. Supply contracts for gas taps and solar power backup are currently being verified.', lat: -15.4055, lng: 28.3912 }
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
    lat: -15.4419,
    lng: 28.3182,
    candidates: [
      { name: 'Andrew Tayengwa', party: 'UPND', color: C.upnd, status: 'Competitive', chatterScore: 51, platformFocus: 'Constituency Radio', latestUpdate: 'Tayengwa highlights 12 newly completed inner community roads in Libala.' },
      { name: 'Clement Tembo', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Competitive', chatterScore: 52, platformFocus: 'Market Scrapes / Facebook', latestUpdate: 'Tembo gains strong traction in Chilenje markets, focusing on Mealie Meal price pain.' },
      { name: 'Martha Mwansa', party: 'Socialist Party', color: C.sp, status: 'Trailing', chatterScore: 28, platformFocus: 'WhatsApp Broadcasts', latestUpdate: 'Focusing on university students in Libala corridor with scholarship reform talks.' }
    ],
    projects: [
      { id: 'proj-kab-1', name: 'Chilenje Market Tarred Roads & Drainage Network', type: 'Infrastructure', funding: 'K5,800,000', status: 'In Progress', voterVisibility: 'High', tacticalStrategy: 'Accelerate construction phase before August. Highlight flood mitigation works directly to market traders who suffered in the last wet season.', details: '8 of 12 roads tarred. Heavy civil engineering in progress on main outfall drain.', lat: -15.4491, lng: 28.3242 }
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
    lat: -12.9692,
    lng: 28.6433,
    candidates: [
      { name: 'Frank Tayali', party: 'UPND', color: C.upnd, status: 'Competitive', chatterScore: 54, platformFocus: 'Mining unions / Facebook', latestUpdate: 'Tayali pledges local contractor payments are sorted and KCM/Mopani mines are hiring.' },
      { name: 'Emmanuel Mulenga', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Competitive', chatterScore: 49, platformFocus: 'Church gatherings', latestUpdate: 'Mulenga highlights job losses in sub-contractors and business closures in industrial area.' }
    ],
    projects: [
      { id: 'proj-ndo-1', name: 'Ndola Main Market Solar Power Hub', type: 'Water Security', funding: 'K3,500,000', status: 'Completed', voterVisibility: 'High', tacticalStrategy: 'Brilliant energy relief proof. Deploy mini solar chargers to market stallholders. Directly combats load-shedding grievances.', details: '450kW micro-grid with batteries. Powers Ndola Main Market cold storage and lighting during outages.', lat: -12.9620, lng: 28.6360 }
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
    lat: -12.8025,
    lng: 28.2128,
    candidates: [
      { name: "Kang'ombe Christopher", party: 'Tonse Alliance (PF)', color: C.pf, status: 'Leading', chatterScore: 62, platformFocus: 'Direct Community / Radio', latestUpdate: 'Christopher leads community sensitization drives, cementing solid local grassroots.' },
      { name: 'Leonard Phiri', party: 'UPND', color: C.upnd, status: 'Competitive', chatterScore: 44, platformFocus: 'CDF Launches', latestUpdate: 'Phiri tours completed education projects but faces strong anti-incumbency mine sentiment.' }
    ],
    projects: [
      { id: 'proj-kit-1', name: 'Nkana Youth Skills Development Centre', type: 'Education', funding: 'K2,900,000', status: 'Completed', voterVisibility: 'Medium', tacticalStrategy: 'Deploy mineral-processing and mining engineering scholarships directly to Nkana graduates. Shift debate from nostalgia to future jobs.', details: 'Fully rehabilitated block with new computer lab and welding workshops. 450 students enrolled.', lat: -12.8050, lng: 28.2040 }
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
    lat: -11.1985,
    lng: 28.8912,
    candidates: [
      { name: 'Chabu Chilangwa', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Leading', chatterScore: 65, platformFocus: 'Traditional Networks', latestUpdate: 'Chilangwa leverages regional Bemba networks. Activates dormant PF branch cells.' },
      { name: 'Davies Mwila', party: 'CF Orange Alliance', color: C.cf, status: 'Trailing', chatterScore: 35, platformFocus: 'Luapula Radio', latestUpdate: 'Mwila draws moderate crowds but is squeezed by Chilangwa\'s strong machine.' },
      { name: 'Gertrude Bwalya', party: 'UPND', color: C.upnd, status: 'Trailing', chatterScore: 30, platformFocus: 'CDF Launches', latestUpdate: 'Bwalya faces severe fishing-ban and rural road grievances.' }
    ],
    projects: [
      { id: 'proj-man-1', name: 'Mansa General Hospital Maternity Block', type: 'Healthcare', funding: 'K6,200,000', status: 'Delayed', voterVisibility: 'High', tacticalStrategy: 'Delayed status is highly toxic. Immediate taskforce required to address contractor bottlenecks. Weaponized daily on Mansa radio.', details: 'Structure standing but abandoned at 60% complete due to funding bottleneck and supplier dispute.', lat: -11.1895, lng: 28.8833 }
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
    lat: -12.1798,
    lng: 26.3972,
    candidates: [
      { name: 'Stafford Mulusa', party: 'UPND', color: C.upnd, status: 'Leading', chatterScore: 68, platformFocus: 'Facebook / Direct Meetings', latestUpdate: 'Mulusa leverages Solwezi dual-carriageway road progress and mining supplier benefits.' },
      { name: 'Jackson Mwila', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Trailing', chatterScore: 24, platformFocus: 'Local Radios', latestUpdate: 'Mwila tries to tap into mining contractor payment grievances with limited success.' }
    ],
    projects: [
      { id: 'proj-sol-1', name: 'Solwezi-Kansanshi Dual Carriageway Rehabilitation', type: 'Infrastructure', funding: 'K12,500,000', status: 'Completed', voterVisibility: 'High', tacticalStrategy: 'Outstanding incumbent asset. Run drone videos on Facebook and local TV highlighting quick travel times. Combats general rural neglect charges.', details: '14km high-quality asphalt dual-carriageway finished with lighting, radically reducing mine transport bottlenecks.', lat: -12.1350, lng: 26.4020 }
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
    lat: -16.8062,
    lng: 26.9739,
    candidates: [
      { name: 'Cornelius Mweetwa', party: 'UPND', color: C.upnd, status: 'Leading', chatterScore: 78, platformFocus: 'Southern Radio / Rallies', latestUpdate: 'Mweetwa dominates local political space, focusing on universal free education and CDF drought borehole success.' },
      { name: 'Gift Mudenda', party: 'Tonse Alliance (PF)', color: C.pf, status: 'Trailing', chatterScore: 18, platformFocus: 'Community Meetings', latestUpdate: 'Mudenda struggles to find campaign ground. Struggles to set up active ward structures.' }
    ],
    projects: [
      { id: 'proj-cho-1', name: 'Choma Drought Solar-Borehole Network', type: 'Water Security', funding: 'K4,800,000', status: 'Completed', voterVisibility: 'High', tacticalStrategy: 'Mobilize agricultural clubs and women cooperatives around the 45 solar water points to offset national drought recovery panic.', details: '45 solar-powered deep boreholes built across rural wards, delivering clean irrigation water to 18,000 farmers during extreme dry season.', lat: -16.8120, lng: 26.9610 }
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
  const [mapStyle, setMapStyle] = useState<'dark' | 'hybrid' | 'roadmap'>('dark')
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'swings' | 'strongholds' | 'large_projects'>('all')
  
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const circlesRef = useRef<any[]>([])
  const projectMarkersRef = useRef<any[]>([])

  const [strategyStatus, setStrategyStatus] = useState<Record<string, boolean>>({
    'Munali': false,
    'Kabwata': false,
    'Ndola Central': false,
    'Kitwe Central': false,
    'Mansa Central': false,
    'Solwezi Central': false,
    'Choma Central': false,
  })

  // ── CNN Touchscreen Filtering Engine ──
  const filteredConstituencies = useMemo(() => {
    return CONSTITUENCIES.filter(c => {
      // First check search term matching
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.province.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false

      // Second check CNN Category filters
      if (activeFilter === 'critical') {
        return c.targetSwingWeight === 'Critical Swing'
      }
      if (activeFilter === 'swings') {
        return c.targetSwingWeight === 'Critical Swing' || c.targetSwingWeight === 'Lean Swing'
      }
      if (activeFilter === 'strongholds') {
        return c.targetSwingWeight === 'Incumbent Stronghold' || c.targetSwingWeight === 'Opposition Lock'
      }
      if (activeFilter === 'large_projects') {
        return c.projects.some(p => {
          const numFunding = parseInt(p.funding.replace(/[^0-9]/g, ''), 10)
          return numFunding >= 3000000 // K3,000,000 or greater
        })
      }
      return true
    })
  }, [searchTerm, activeFilter])

  const selectedConst = useMemo(() => {
    return CONSTITUENCIES.find(c => c.name === selectedConstName) ?? CONSTITUENCIES[0]
  }, [selectedConstName])

  // Aggregate stats for CNN map HUD
  const hudStats = useMemo(() => {
    const totalElectorate = filteredConstituencies.reduce((acc, c) => acc + c.registeredVoters, 0)
    const criticalCount = filteredConstituencies.filter(c => c.targetSwingWeight === 'Critical Swing').length
    const upndCount = filteredConstituencies.filter(c => c.incumbentParty === 'UPND').length
    const pfCount = filteredConstituencies.filter(c => c.incumbentParty === 'Tonse Alliance (PF)').length
    return { totalElectorate, criticalCount, upndCount, pfCount }
  }, [filteredConstituencies])

  const targetWeights = {
    'Critical Swing': { bg: `${C.gold}20`, border: C.gold, color: C.gold },
    'Lean Swing': { bg: `${C.zmp}20`, border: C.zmp, color: C.zmp },
    'Incumbent Stronghold': { bg: `${C.completed}20`, border: C.completed, color: C.completed },
    'Opposition Lock': { bg: `${C.delayed}20`, border: C.delayed, color: C.delayed },
  }

  // ── Dynamic Google Maps script loader ──
  useEffect(() => {
    if (typeof window === 'undefined') return

    if ((window as any).google && (window as any).google.maps) {
      setGoogleMapsLoaded(true)
      return
    }

    const callbackName = 'initGoogleMapsCallback'
    ;(window as any)[callbackName] = () => {
      setGoogleMapsLoaded(true)
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`
    script.async = true
    script.defer = true
    script.onerror = () => {
      setLoadError(true)
    }
    document.head.appendChild(script)

    return () => {
      delete (window as any)[callbackName]
    }
  }, [])

  // ── Map Constructor ──
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current) return

    const google = (window as any).google
    if (!google || !google.maps) return

    const zambiaCenter = { lat: -13.1339, lng: 27.8493 }
    const initialZoom = 6.2

    const mapInstance = new google.maps.Map(mapContainerRef.current, {
      center: zambiaCenter,
      zoom: initialZoom,
      mapTypeId: mapStyle === 'dark' ? google.maps.MapTypeId.ROADMAP : mapStyle,
      styles: mapStyle === 'dark' ? DARK_MAP_STYLE : [],
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.LEFT_BOTTOM
      }
    })

    mapInstanceRef.current = mapInstance

    return () => {
      if (google.maps.event) {
        google.maps.event.clearInstanceListeners(mapInstance)
      }
    }
  }, [googleMapsLoaded, mapStyle])

  // ── Re-render Markers & Translucent CNN bubbles based on selection & touchscreen filter ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const google = (window as any).google
    if (!google || !google.maps) return

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    // Clear old CNN bubbles
    circlesRef.current.forEach(c => c.setMap(null))
    circlesRef.current = []

    CONSTITUENCIES.forEach(c => {
      const isFiltered = filteredConstituencies.some(item => item.name === c.name)
      const selected = c.name === selectedConstName
      const isIncumbUPND = c.incumbentParty === 'UPND'
      const pinColor = isIncumbUPND ? C.upnd : C.pf

      const weightColor = c.targetSwingWeight === 'Critical Swing' ? C.gold :
                          c.targetSwingWeight === 'Lean Swing' ? C.zmp :
                          isIncumbUPND ? C.completed : C.delayed

      // Dim non-matching items instead of removing them completely (exactly like CNN touchscreen interaction!)
      const opacity = isFiltered ? 1 : 0.08
      const fillOpacity = isFiltered ? (selected ? 0.45 : 0.22) : 0.02
      const strokeOpacity = isFiltered ? (selected ? 0.8 : 0.4) : 0.05

      // 1. Draw CNN Voter Weight concentration bubble (radius based on registered voter magnitude)
      const circle = new google.maps.Circle({
        strokeColor: weightColor,
        strokeOpacity: strokeOpacity,
        strokeWeight: selected ? 2.5 : 1.2,
        fillColor: weightColor,
        fillOpacity: fillOpacity,
        map: map,
        center: { lat: c.lat, lng: c.lng },
        radius: Math.sqrt(c.registeredVoters) * 16.5 // Mathematical scaling factor
      })

      circle.addListener('click', () => {
        if (!isFiltered) return
        setSelectedConstName(c.name)
        setMapZoom('constituency')
      })
      circlesRef.current.push(circle)

      // 2. Draw standard Google Maps Pin inside the bubble core
      const marker = new google.maps.Marker({
        position: { lat: c.lat, lng: c.lng },
        map: map,
        title: `${c.name} Constituency`,
        label: isFiltered ? {
          text: c.name,
          color: '#ffffff',
          fontSize: selected ? '12px' : '9px',
          fontWeight: '900'
        } : null,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: selected ? 16 : 9,
          fillColor: selected ? C.gold : pinColor,
          fillOpacity: opacity,
          strokeColor: '#ffffff',
          strokeWeight: selected ? 2.5 : 1.5,
          strokeOpacity: opacity
        }
      })

      marker.addListener('click', () => {
        if (!isFiltered) return
        setSelectedConstName(c.name)
        setMapZoom('constituency')
      })

      markersRef.current.push(marker)
    })
  }, [googleMapsLoaded, selectedConstName, filteredConstituencies])

  // ── Render project hotspots inside zoomed-in constituency ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const google = (window as any).google
    if (!google || !google.maps) return

    projectMarkersRef.current.forEach(m => m.setMap(null))
    projectMarkersRef.current = []

    if (mapZoom !== 'constituency') return

    const currentConst = CONSTITUENCIES.find(c => c.name === selectedConstName)
    if (!currentConst) return

    currentConst.projects.forEach(proj => {
      const projColor = proj.status === 'Completed' ? C.completed : proj.status === 'In Progress' ? C.progress : C.delayed
      const symbol = proj.type === 'Healthcare' ? '🏥' : proj.type === 'Education' ? '🏫' : proj.type === 'Water Security' ? '💧' : '🚧'

      const marker = new google.maps.Marker({
        position: { lat: proj.lat, lng: proj.lng },
        map: map,
        title: proj.name,
        label: {
          text: symbol,
          fontSize: '14px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 18,
          fillColor: projColor,
          fillOpacity: 0.25,
          strokeColor: projColor,
          strokeWeight: 2,
        }
      })

      // CNN-style overlay InfoWindow
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #0c1220; font-family: system-ui, -apple-system, sans-serif; padding: 6px; max-width: 250px; line-height: 1.4;">
            <div style="font-weight: 800; font-size: 13px; color: ${projColor}; margin-bottom: 2px;">${proj.name}</div>
            <div style="font-size: 9px; font-weight: 700; color: #666; margin-bottom: 6px;">
              ${proj.type} · Funding: <strong>${proj.funding}</strong> · Status: <strong>${proj.status}</strong>
            </div>
            <p style="font-size: 11px; color: #444; margin: 0 0 8px;">${proj.details}</p>
            <div style="background: #fdf6e2; border-radius: 4px; padding: 6px; font-size: 10px; border-left: 3px solid #f5c400; color: #856404;">
              <strong>Strategic Narrative:</strong><br/>
              ${proj.tacticalStrategy}
            </div>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      projectMarkersRef.current.push(marker)
    })
  }, [googleMapsLoaded, selectedConstName, mapZoom])

  // ── Smooth Camera control panning ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const c = CONSTITUENCIES.find(item => item.name === selectedConstName)
    if (!c) return

    if (mapZoom === 'constituency') {
      map.panTo({ lat: c.lat, lng: c.lng })
      map.setZoom(13)
    } else {
      map.panTo({ lat: -13.1339, lng: 27.8493 })
      map.setZoom(6.2)
    }
  }, [selectedConstName, mapZoom])

  function toggleTaskCompleted(cName: string) {
    setStrategyStatus(prev => ({ ...prev, [cName]: !prev[cName] }))
  }

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Dynamic Command Header */}
      <div style={{ background: '#080F1A', borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: C.gold, fontWeight: 800, fontSize: 13, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🗺️</span> CNN ELECTION BOARD STYLE · constituency bubble tracker
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
            Bubbles scale with electorate volume. Color represents swing risk profile. Tap filters to query swing vectors and CDF project outputs.
          </div>
        </div>
        
        {/* Style & Zoom controls */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 2 }}>
            {[
              { id: 'dark', label: 'Dark Style' },
              { id: 'hybrid', label: 'Satellite' },
              { id: 'roadmap', label: 'Terrain' }
            ].map(style => (
              <button
                key={style.id}
                type="button"
                onClick={() => setMapStyle(style.id as 'dark' | 'hybrid' | 'roadmap')}
                style={{ background: mapStyle === style.id ? C.gold : 'transparent', color: mapStyle === style.id ? '#000' : C.muted, border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 9.5, fontWeight: 700, cursor: 'pointer' }}
              >
                {style.label}
              </button>
            ))}
          </div>

          <button 
            type="button" 
            onClick={() => setMapZoom('national')}
            style={{ background: mapZoom === 'national' ? C.gold : C.card, color: mapZoom === 'national' ? '#000' : C.muted, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            🔎 National View
          </button>
        </div>
      </div>

      {/* Main Command Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 360px', minHeight: 650 }}>
        
        {/* Left Side: Search & Constituency List */}
        <div style={{ background: C.card, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
          
          {/* CNN Touchscreen Filtering Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, padding: '8px 10px', gap: 4, background: '#080F1A' }}>
            {[
              { id: 'all', label: 'All Hotspots' },
              { id: 'critical', label: '🟡 Critical' },
              { id: 'swings', label: '🟠 Swings' },
              { id: 'strongholds', label: '🟢 Strongholds' },
              { id: 'large_projects', label: '🏥 Large CDF' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as any)}
                style={{ 
                  flex: '1 1 auto',
                  background: activeFilter === f.id ? C.gold : C.card2,
                  color: activeFilter === f.id ? '#000' : C.text,
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  padding: '5px 8px',
                  fontSize: '9px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

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

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 520 }}>
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
                No constituencies match selected search or CNN filter.
              </div>
            )}
          </div>
        </div>

        {/* Center: Live Google Map + CNN Style Absolute HUD cards */}
        <div style={{ background: C.ocean, position: 'relative', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
          
          {/* CNN-Style Battleground HUD Floating Card */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, background: 'rgba(6,12,20,0.9)', border: `1px solid ${C.gold}50`, borderRadius: 10, padding: '10px 14px', width: 220, pointerEvents: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', borderLeft: `4px solid ${C.gold}` }}>
            <span style={{ color: C.gold, fontSize: 9, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1 }}>📊 CNN LIVE BATTLEGROUND DATA</span>
            <div style={{ color: C.text, fontSize: 16, fontWeight: '900', marginTop: 4 }}>
              {hudStats.totalElectorate.toLocaleString()}<br/>
              <span style={{ fontSize: 9.5, color: C.muted, fontWeight: 'normal' }}>voters in active filter view</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 8, fontSize: 9.5 }}>
              <div>
                <span style={{ color: C.muted }}>Critical Swings:</span><br/>
                <strong style={{ color: C.gold }}>{hudStats.criticalCount} seats</strong>
              </div>
              <div>
                <span style={{ color: C.muted }}>Incumbent Lead:</span><br/>
                <strong style={{ color: C.upnd }}>{hudStats.upndCount} seats</strong>
              </div>
            </div>
          </div>

          {/* Left Zoom Indicator */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, background: 'rgba(6,12,20,0.85)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 10, pointerEvents: 'none' }}>
            <span style={{ color: C.muted }}>CNN Bubble Map:</span>{' '}
            <strong style={{ color: mapZoom === 'national' ? C.teal : C.gold }}>
              {mapZoom === 'national' ? 'NATIONAL HUB' : `${selectedConst.name.toUpperCase()} constituency`}
            </strong>
          </div>

          {/* Actual Google Map container */}
          <div 
            ref={mapContainerRef} 
            style={{ flex: 1, width: '100%', height: '100%', minHeight: 480 }}
          >
            {loadError && (
              <div style={{ color: C.delayed, padding: 40, textAlign: 'center', fontSize: 13, background: C.bg, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                <span>❌ Failed to load Google Maps Platform API.</span>
                <span style={{ color: C.muted, fontSize: 11 }}>Please verify that your NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is valid.</span>
              </div>
            )}
            {!googleMapsLoaded && !loadError && (
              <div style={{ color: C.muted, padding: 40, textAlign: 'center', fontSize: 12, background: C.bg, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                <div style={{ border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', width: 24, height: 24, animation: 'spin 1s linear infinite' }} />
                <span>Mounting CNN Election Board Live...</span>
              </div>
            )}
          </div>

          {/* CNN-Style Bottom Crawler Ticker */}
          <div style={{ background: '#CC0000', borderTop: `1px solid ${C.border}`, overflow: 'hidden', padding: '6px 0', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ background: '#000', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '3px 8px', fontFamily: 'monospace', letterSpacing: 1.5, zIndex: 10, flexShrink: 0, boxShadow: '4px 0 10px rgba(0,0,0,0.5)' }}>CNN ALERTS</span>
            <div className="ticker-wrap" style={{ flex: 1, overflow: 'hidden' }}>
              <span className="ticker-inner" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 10.5, color: '#fff', whiteSpace: 'nowrap', display: 'inline-block', animation: 'marquee 28s linear infinite' }}>
                &nbsp;&nbsp; ⚠ BATTLEGROUND MUNALI: CDF Maternity Wing 100% operational, sways urban health sentiment +3.5pts. &nbsp;&nbsp; 🟢 SOUTHERN PROVINCE INCUMBENT STRONGHOLD: Borehole networks deliver drought relief to 18,000 farmers. &nbsp;&nbsp; ⚠ COPPERBELT CONTRACTOR DEBATES: NDOLA Solar Hub counters load-shedding protests. &nbsp;&nbsp; 🔴 LUAPULA LOCK: PF regional machinery leverages fishing-ban grievances in Mansa. &nbsp;&nbsp;
              </span>
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
              🔎 Reset to Zambia National Overview
            </button>
          </div>

        </div>

      </div>

      {/* Global CSS spinner and ticker crawlers rules */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
      `}</style>
      
    </div>
  )
}
