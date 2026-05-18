'use client'

import { useMemo, useState } from 'react'
import { ELECTION_DATA } from '@/app/lib/data'

const C = {
  card: '#0E1724',
  card2: '#121C2C',
  line: '#1C2A3A',
  text: '#E2E8F0',
  muted: '#7A8FA6',
  gold: '#F5C400',
  upnd: '#FF6B00',
  pf: '#D71920',
  kalaba: '#27AE60',
  membe: '#E74C3C',
  kateka: '#8E44AD',
  teal: '#00C9A7',
}

const ZAMBIA_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    { type: 'Feature' as const, properties: { name: 'Lusaka' }, geometry: { type: 'Polygon' as const, coordinates: [[[27.85, -14.65], [28.9, -14.65], [29.1, -15.3], [28.8, -15.7], [28.0, -15.7], [27.5, -15.3], [27.85, -14.65]]] } },
    { type: 'Feature' as const, properties: { name: 'Copperbelt' }, geometry: { type: 'Polygon' as const, coordinates: [[[26.0, -11.0], [28.7, -11.0], [29.0, -12.0], [28.5, -13.0], [27.0, -13.5], [25.8, -12.5], [26.0, -11.0]]] } },
    { type: 'Feature' as const, properties: { name: 'Eastern' }, geometry: { type: 'Polygon' as const, coordinates: [[[31.0, -10.0], [32.9, -10.0], [33.0, -14.5], [32.0, -16.0], [30.5, -16.5], [29.5, -15.5], [29.1, -14.0], [30.0, -12.0], [31.0, -10.0]]] } },
    { type: 'Feature' as const, properties: { name: 'Southern' }, geometry: { type: 'Polygon' as const, coordinates: [[[25.5, -15.5], [27.5, -15.3], [28.0, -15.7], [28.8, -15.7], [29.1, -16.5], [28.0, -18.0], [26.5, -18.0], [25.0, -17.5], [24.5, -16.5], [25.5, -15.5]]] } },
    { type: 'Feature' as const, properties: { name: 'Central' }, geometry: { type: 'Polygon' as const, coordinates: [[[27.0, -13.5], [28.5, -13.0], [29.0, -12.0], [29.5, -13.0], [29.5, -14.0], [29.1, -14.0], [28.9, -14.65], [27.85, -14.65], [27.5, -15.3], [25.5, -15.5], [26.0, -13.5], [27.0, -13.5]]] } },
    { type: 'Feature' as const, properties: { name: 'Northern' }, geometry: { type: 'Polygon' as const, coordinates: [[[28.0, -8.0], [31.0, -8.0], [31.0, -10.0], [30.0, -12.0], [29.0, -12.0], [28.5, -13.0], [27.0, -13.5], [26.5, -12.0], [27.0, -10.0], [28.0, -8.0]]] } },
    { type: 'Feature' as const, properties: { name: 'Luapula' }, geometry: { type: 'Polygon' as const, coordinates: [[[28.0, -8.0], [28.8, -8.0], [29.5, -9.0], [29.5, -10.5], [28.7, -11.0], [28.0, -10.5], [27.0, -10.0], [27.0, -8.0], [28.0, -8.0]]] } },
    { type: 'Feature' as const, properties: { name: 'Muchinga' }, geometry: { type: 'Polygon' as const, coordinates: [[[31.0, -8.0], [32.0, -8.0], [32.9, -10.0], [31.0, -10.0], [29.5, -10.5], [29.5, -9.0], [31.0, -8.0]]] } },
    { type: 'Feature' as const, properties: { name: 'Western' }, geometry: { type: 'Polygon' as const, coordinates: [[[22.0, -14.0], [25.0, -14.0], [25.5, -15.5], [24.5, -16.5], [25.0, -17.5], [24.0, -18.0], [22.0, -18.0], [22.0, -14.0]]] } },
    { type: 'Feature' as const, properties: { name: 'North-Western' }, geometry: { type: 'Polygon' as const, coordinates: [[[22.0, -8.0], [26.5, -8.0], [27.0, -8.0], [27.0, -10.0], [26.5, -12.0], [26.0, -13.5], [25.0, -14.0], [22.0, -14.0], [22.0, -8.0]]] } },
  ],
}

type Province = typeof ELECTION_DATA.provinces[number]
type CandidateShare = { id: string; label: string; pct: number; color: string }
type Coordinate = [number, number]

const VIEWBOX = { width: 920, height: 560, padX: 76, padY: 36 }
const LABEL_OFFSETS: Record<string, { dx: number; dy: number; label: string }> = {
  Lusaka: { dx: 30, dy: 18, label: 'LUSAKA' },
  Copperbelt: { dx: -10, dy: -18, label: 'COPPERBELT' },
  Eastern: { dx: 24, dy: 6, label: 'EASTERN' },
  Southern: { dx: 0, dy: 22, label: 'SOUTHERN' },
  Central: { dx: 6, dy: 14, label: 'CENTRAL' },
  Northern: { dx: 18, dy: 0, label: 'NORTHERN' },
  Luapula: { dx: 2, dy: -26, label: 'LUAPULA' },
  Muchinga: { dx: 36, dy: -8, label: 'MUCHINGA' },
  Western: { dx: -18, dy: 12, label: 'WESTERN' },
  'North-Western': { dx: -34, dy: -16, label: 'N. WESTERN' },
}

function candidateShares(province: Province): CandidateShare[] {
  const kalaba = Math.max(1, Math.min(8, province.name === 'Luapula' ? 7 : province.name === 'Eastern' ? 5 : Math.round(ELECTION_DATA.nationalPoll.kalaba_cf)))
  const membe = Math.max(2, Math.min(9, ['Copperbelt', 'Lusaka'].includes(province.name) ? 6 : Math.round(ELECTION_DATA.nationalPoll.membe_sp)))
  const kateka = Math.max(1, Math.min(3, ['Lusaka', 'Central'].includes(province.name) ? 2 : 1))
  const undecided = Math.max(0, 100 - province.upnd - province.pf - kalaba - membe - kateka)

  return [
    { id: 'hh', label: 'HH', pct: province.upnd, color: C.upnd },
    { id: 'bm_mz', label: 'BM/MZ', pct: province.pf, color: C.pf },
    { id: 'kalaba', label: 'Kalaba', pct: kalaba, color: C.kalaba },
    { id: 'membe', label: "M'membe", pct: membe, color: C.membe },
    { id: 'kateka', label: 'Kateka', pct: kateka, color: C.kateka },
    { id: 'undecided', label: 'Undecided', pct: undecided, color: C.muted },
  ]
}

function leadingCandidate(province: Province) {
  return candidateShares(province).filter(share => share.id !== 'undecided').sort((a, b) => b.pct - a.pct)[0]
}

export default function ZambiaMap() {
  const [selected, setSelected] = useState<string | null>(null)

  const projected = useMemo(() => {
    const allPoints = ZAMBIA_GEOJSON.features.flatMap(feature => feature.geometry.coordinates[0]) as Coordinate[]
    const lons = allPoints.map(point => point[0])
    const lats = allPoints.map(point => point[1])
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)

    const project = ([lon, lat]: Coordinate) => {
      const x = VIEWBOX.padX + ((lon - minLon) / (maxLon - minLon)) * (VIEWBOX.width - VIEWBOX.padX * 2)
      const y = VIEWBOX.padY + ((maxLat - lat) / (maxLat - minLat)) * (VIEWBOX.height - VIEWBOX.padY * 2)
      return { x, y }
    }

    return ZAMBIA_GEOJSON.features.map(feature => {
      const province = ELECTION_DATA.provinces.find(item => item.name === feature.properties.name)
      const points = feature.geometry.coordinates[0] as Coordinate[]
      const projectedPoints = points.map(project)
      const path = projectedPoints.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ') + ' Z'
      const centroid = projectedPoints.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 })
      const labelBase = { x: centroid.x / projectedPoints.length, y: centroid.y / projectedPoints.length }
      const offset = LABEL_OFFSETS[feature.properties.name] ?? { dx: 0, dy: 0, label: feature.properties.name.toUpperCase() }
      const lead = province ? leadingCandidate(province) : null

      return {
        name: feature.properties.name,
        province,
        lead,
        path,
        label: {
          x: labelBase.x + offset.dx,
          y: labelBase.y + offset.dy,
          text: offset.label,
        },
      }
    })
  }, [])

  const selectedProv = selected ? ELECTION_DATA.provinces.find(province => province.name === selected) : null
  const selectedShares = selectedProv ? candidateShares(selectedProv).sort((a, b) => b.pct - a.pct) : []
  const selectedLead = selectedProv ? leadingCandidate(selectedProv) : null
  const leaderSummary = ELECTION_DATA.provinces.reduce<Record<string, { label: string; value: number; color: string }>>((acc, province) => {
    const lead = leadingCandidate(province)
    acc[lead.id] = acc[lead.id] ?? { label: `${lead.label} leads`, value: 0, color: lead.color }
    acc[lead.id].value += 1
    return acc
  }, {})
  const summaryItems = Object.values(leaderSummary).sort((a, b) => b.value - a.value)

  return (
    <div className="zambia-map-grid">
      <div className="zambia-map-card">
        <div className="zambia-map-card__head">
          <div>
            <span>Zambia Election Map</span>
            <strong>Zambia-only province lead map</strong>
            <em>Click any province for deep-dive analysis</em>
          </div>
          <div>
            <span>ECZ certified register</span>
            <strong>{ELECTION_DATA.voterTotal.toLocaleString()}</strong>
          </div>
        </div>

        <div className="zambia-map-card__summary" style={{ gridTemplateColumns: `repeat(${Math.max(1, summaryItems.length)}, minmax(0, 1fr))` }}>
          {summaryItems.map(item => (
            <div key={item.label}>
              <strong style={{ color: item.color }}>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="zambia-svg-map">
          <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="img" aria-label="Zambia province election map">
            <defs>
              <filter id="province-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="9" stdDeviation="9" floodColor="#000000" floodOpacity="0.42" />
              </filter>
              <radialGradient id="map-glow" cx="50%" cy="45%" r="62%">
                <stop offset="0%" stopColor="#F5C400" stopOpacity="0.13" />
                <stop offset="58%" stopColor="#07111F" stopOpacity="0.94" />
                <stop offset="100%" stopColor="#03070B" stopOpacity="1" />
              </radialGradient>
            </defs>
            <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#map-glow)" />
            <g filter="url(#province-shadow)">
              {projected.map(item => {
                const isSelected = selected === item.name
                return (
                  <path
                    key={item.name}
                    d={item.path}
                    className={`zambia-svg-map__province ${isSelected ? 'zambia-svg-map__province--selected' : ''}`}
                    fill={item.lead?.color ?? C.gold}
                    fillOpacity={isSelected ? 0.96 : 0.78}
                    stroke={isSelected ? '#FFFFFF' : '#DDE7F3'}
                    strokeWidth={isSelected ? 4 : 2.2}
                    onClick={() => setSelected(prev => prev === item.name ? null : item.name)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${item.name} province ${item.lead?.label ?? 'model'} lead`}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') setSelected(prev => prev === item.name ? null : item.name)
                    }}
                  />
                )
              })}
            </g>
            <g className="zambia-svg-map__labels">
              {projected.map(item => {
                const pillWidth = item.lead?.label === 'BM/MZ' ? 86 : 68
                return (
                  <g key={`${item.name}-label`} pointerEvents="none">
                    <text x={item.label.x} y={item.label.y} className="zambia-svg-map__province-name" textAnchor="middle">
                      {item.label.text}
                    </text>
                    <rect x={item.label.x - pillWidth / 2} y={item.label.y + 8} width={pillWidth} height="22" rx="11" fill="rgba(0,0,0,.66)" stroke={item.lead?.color ?? C.gold} strokeOpacity=".42" />
                    <text x={item.label.x} y={item.label.y + 23} className="zambia-svg-map__province-score" textAnchor="middle" fill={item.lead?.color ?? C.gold}>
                      {item.lead?.label} {item.lead?.pct}%
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
          <div className="zambia-svg-map__hint">Clickable Zambia map</div>
        </div>

        <div className="zambia-map-card__legend">
          {[
            ['HH', C.upnd],
            ['BM/MZ', C.pf],
            ['Kalaba', C.kalaba],
            ["M'membe", C.membe],
            ['Kateka', C.kateka],
          ].map(([label, color]) => (
            <span key={label as string}>
              <i style={{ borderColor: color as string, background: `${color}55` }} />
              {label as string}
            </span>
          ))}
          <small>Fill = highest candidate/ticket model share in each province</small>
        </div>
      </div>

      <aside className="zambia-map-panel">
        {selectedProv ? (
          <>
            <div className="zambia-map-panel__title" style={{ color: selectedLead?.color ?? C.gold }}>
              {selectedProv.name} Province
            </div>
            <span className="zambia-map-panel__pill" style={{ color: selectedLead?.color ?? C.gold, borderColor: selectedLead?.color ?? C.gold, background: `${selectedLead?.color ?? C.gold}20` }}>
              {selectedLead ? `${selectedLead.label.toUpperCase()} LEADS - ${selectedLead.pct}%` : 'MODEL LEAD'}
            </span>
            <div className="zambia-map-panel__metric">
              <span>Registered voters</span>
              <strong>{(selectedProv.voters / 1000).toFixed(0)}K</strong>
              <em>{((selectedProv.voters / ELECTION_DATA.voterTotal) * 100).toFixed(1)}% of national register</em>
            </div>
            <div className="zambia-map-panel__bars">
              {selectedShares.map(item => (
                <div key={item.label}>
                  <span>{item.label}<b style={{ color: item.color }}>{item.pct}%</b></span>
                  <i><em style={{ width: `${Math.max(0, item.pct)}%`, background: item.color }} /></i>
                </div>
              ))}
            </div>
            <div className="zambia-map-panel__readout">
              <span>Lead margin <b>{selectedShares.length > 1 ? (selectedShares[0].pct - selectedShares[1].pct).toFixed(1) : '0'} pts</b></span>
              <span>Estimated lead votes <b>{selectedLead ? Math.round(selectedProv.voters * selectedLead.pct / 100).toLocaleString() : '0'}</b></span>
              <span>Status <b>{selectedProv.lean === 'CONTESTED' ? 'Battleground' : `${selectedLead?.label} advantage`}</b></span>
            </div>
            <button type="button" className="zambia-map-panel__reset" onClick={() => setSelected(null)}>
              Clear selection
            </button>
          </>
        ) : (
          <>
            <div className="zambia-map-panel__title">Province Intelligence</div>
            <p>Click a province on the Zambia map to inspect voter weight, candidate shares, lead margin and why the province is classified that way.</p>
            <div className="zambia-map-panel__list">
              {ELECTION_DATA.provinces.map(province => {
                const lead = leadingCandidate(province)
                return (
                  <button key={province.name} type="button" onClick={() => setSelected(province.name)}>
                    <span>{province.name}</span>
                    <strong style={{ color: lead.color }}>{lead.label} {lead.pct}%</strong>
                    <em>Open</em>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
