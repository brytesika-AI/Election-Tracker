'use client'

import { useEffect, useMemo, useState } from 'react'
import { ELECTION_DATA } from '@/app/lib/data'

const C = {
  bg:      '#060C14',
  card:    '#0E1724',
  card2:   '#121C2C',
  line:    '#1C2A3A',
  text:    '#E2E8F0',
  muted:   '#7A8FA6',
  gold:    '#F5C400',
  upnd:    '#FF6B00',
  pf:      '#CC0000',
  contest: '#8B6914',
  teal:    '#00C9A7',
  ocean:   '#07111E',
}

// ── Name normalisation: GeoJSON names → our province names ──────────
const NAME_MAP: Record<string, string> = {
  'Western':      'Western',
  'North-Western': 'North-Western',
  'North Western': 'North-Western',
  'Copperbelt':   'Copperbelt',
  'Luapula':      'Luapula',
  'Northern':     'Northern',
  'Muchinga':     'Muchinga',
  'Eastern':      'Eastern',
  'Central':      'Central',
  'Lusaka':       'Lusaka',
  'Southern':     'Southern',
}

type GeoFeature = {
  type: string
  properties: { shapeName?: string; name?: string; NAME_1?: string; [k: string]: unknown }
  geometry: {
    type: string
    coordinates: number[][][] | number[][][][]
  }
}

type Coord = [number, number]
type Projected = { name: string; paths: string[]; cx: number; cy: number }

function getLean(p: typeof ELECTION_DATA.provinces[number]): 'UPND' | 'PF' | 'CONTESTED' {
  if (p.lean === 'UPND') return 'UPND'
  if (p.lean === 'PF')   return 'PF'
  return 'CONTESTED'
}

const W = 820, H = 600, PAD = 24

function buildProjection(features: GeoFeature[]) {
  const allCoords: Coord[] = []
  features.forEach(f => {
    const rings = f.geometry.type === 'MultiPolygon'
      ? (f.geometry.coordinates as number[][][][]).flat()
      : (f.geometry.coordinates as number[][][])
    rings.forEach(ring => ring.forEach(pt => allCoords.push([pt[0], pt[1]])))
  })
  const lons = allCoords.map(c => c[0])
  const lats = allCoords.map(c => c[1])
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)

  const project = ([lon, lat]: Coord): Coord => [
    PAD + ((lon - minLon) / (maxLon - minLon)) * (W - PAD * 2),
    PAD + ((maxLat - lat) / (maxLat - minLat)) * (H - PAD * 2),
  ]

  return (feature: GeoFeature): Projected => {
    const rawName =
      (feature.properties.shapeName as string) ||
      (feature.properties.NAME_1 as string) ||
      (feature.properties.name as string) || ''
    const name = NAME_MAP[rawName] ?? rawName

    const rings = feature.geometry.type === 'MultiPolygon'
      ? (feature.geometry.coordinates as number[][][][]).flat()
      : (feature.geometry.coordinates as number[][][])

    let allPts: Coord[] = []
    const paths = rings.map(ring => {
      const pts = ring.map(pt => project([pt[0], pt[1]]))
      allPts = allPts.concat(pts)
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + 'Z'
    })

    const cx = allPts.reduce((a, p) => a + p[0], 0) / allPts.length
    const cy = allPts.reduce((a, p) => a + p[1], 0) / allPts.length
    return { name, paths, cx, cy }
  }
}

export default function ZambiaMap() {
  const [features, setFeatures] = useState<GeoFeature[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  // Fetch accurate Zambia province GeoJSON from geoBoundaries open dataset
  useEffect(() => {
    let cancelled = false
    fetch('/zambia-provinces.geojson', { cache: 'force-cache', signal: AbortSignal.timeout(8000) })
      .then(r => r.json())
      .then(data => { if (!cancelled) { setFeatures(data.features ?? []); setLoading(false) } })
      .catch(() => { if (!cancelled) { setLoading(false); setError('Province map unavailable') } })
    return () => { cancelled = true }
  }, [])

  // Build province projections once features are loaded
  const projected = useMemo<Projected[]>(() => {
    if (!features.length) return []
    const project = buildProjection(features)
    return features.map(project)
  }, [features])

  const counts = useMemo(() => {
    const r = { UPND: 0, PF: 0, CONTESTED: 0 }
    ELECTION_DATA.provinces.forEach(p => { r[getLean(p)]++ })
    return r
  }, [])

  const hhFig  = ELECTION_DATA.figures.find(f => f.id === 'hh')!
  const pfFig  = ELECTION_DATA.figures.find(f => f.id === 'pf_ndc')!
  const selectedProv = selected ? ELECTION_DATA.provinces.find(p => p.name === selected) : null
  const selectedLean = selectedProv ? getLean(selectedProv) : null
  const selColor = selectedLean === 'UPND' ? C.upnd : selectedLean === 'PF' ? C.pf : C.gold

  function getProvinceStyle(name: string) {
    const prov = ELECTION_DATA.provinces.find(p => p.name === name)
    if (!prov) return { fill: C.card2, lean: null as null }
    const lean = getLean(prov)
    const fill = lean === 'UPND' ? C.upnd : lean === 'PF' ? C.pf : C.contest
    return { fill, lean, prov }
  }

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Electoral header ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', background: '#080F1A', borderBottom: `1px solid ${C.line}` }}>
        {/* HH */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: `${C.upnd}16` }}>
          <img src={hhFig.photo} alt="HH" width={52} height={52}
            style={{ borderRadius: '50%', objectFit: 'cover', border: `3px solid ${C.upnd}` }}
            onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=HH&background=FF6B00&color=fff` }} />
          <div>
            <div style={{ color: C.upnd, fontWeight: 800, fontSize: 15 }}>{hhFig.name}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>UPND · INCUMBENT</div>
          </div>
          <div style={{ marginLeft: 'auto', background: C.upnd, color: '#fff', borderRadius: 10, padding: '6px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{counts.UPND}</div>
            <div style={{ fontSize: 9, fontWeight: 700 }}>PROVINCES</div>
          </div>
        </div>

        {/* Centre */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080F1A' }}>
          <div style={{ color: C.gold, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em' }}>PROVINCE MODEL</div>
          <div style={{ color: C.muted, fontSize: 9, marginTop: 2 }}>{ELECTION_DATA.provinces.length} provinces</div>
          <div style={{ color: C.contest, fontSize: 9 }}>{counts.CONTESTED} toss-up</div>
        </div>

        {/* BM/MZ */}
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row-reverse', gap: 12, padding: '14px 18px', background: `${C.pf}16` }}>
          <img src={pfFig.photo} alt="BM/MZ" width={52} height={52}
            style={{ borderRadius: '50%', objectFit: 'cover', border: `3px solid ${C.pf}` }}
            onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=BM&background=CC0000&color=fff` }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: C.pf, fontWeight: 800, fontSize: 15 }}>{pfFig.name}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>Tonse / PF-Pamodzi</div>
          </div>
          <div style={{ marginRight: 'auto', background: C.pf, color: '#fff', borderRadius: 10, padding: '6px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{counts.PF}</div>
            <div style={{ fontSize: 9, fontWeight: 700 }}>PROVINCES</div>
          </div>
        </div>
      </div>

      {/* Province split bar */}
      <div style={{ display: 'flex', height: 6 }}>
        <div style={{ flex: counts.UPND, background: C.upnd }} />
        <div style={{ flex: counts.CONTESTED, background: C.contest }} />
        <div style={{ flex: counts.PF, background: C.pf }} />
      </div>

      {/* Vote-share row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 18px', background: '#080F1A', borderBottom: `1px solid ${C.line}`, fontSize: 11 }}>
        <span style={{ color: C.upnd, fontWeight: 700 }}>HH {ELECTION_DATA.nationalPoll.upnd}%</span>
        <span style={{ color: C.muted }}>National model · 50%+1 threshold to win first round</span>
        <span style={{ color: C.pf, fontWeight: 700 }}>BM/MZ {ELECTION_DATA.nationalPoll.mundubile_tonse}%</span>
      </div>

      {/* Map + detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px' }}>

        {/* SVG map */}
        <div style={{ position: 'relative', background: C.ocean, borderRight: `1px solid ${C.line}` }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: C.muted, fontSize: 13 }}>
              Loading Zambia province map…
            </div>
          ) : error || !projected.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: C.muted, fontSize: 12, gap: 8, padding: 20, textAlign: 'center' }}>
              <span style={{ fontSize: 24 }}>🗺️</span>
              <span>{error ?? 'Map data unavailable'}</span>
              <span style={{ fontSize: 10, color: `${C.muted}88` }}>Province intelligence is available in the list panel →</span>
            </div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}
              role="img" aria-label="Zambia province election model map">
              <defs>
                <pattern id="hatch-tossup" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                  <rect width="10" height="10" fill="#18222E" />
                  <line x1="0" y1="0" x2="0" y2="10" stroke={C.upnd} strokeWidth="2.2" strokeOpacity="0.5" />
                  <line x1="5" y1="0" x2="5" y2="10" stroke={C.pf} strokeWidth="2.2" strokeOpacity="0.5" />
                </pattern>
                <radialGradient id="ocean-bg" cx="50%" cy="45%" r="65%">
                  <stop offset="0%" stopColor="#1A2D45" />
                  <stop offset="100%" stopColor="#04080F" />
                </radialGradient>
                <filter id="prov-drop">
                  <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.5" />
                </filter>
              </defs>
              <rect width={W} height={H} fill="url(#ocean-bg)" />

              {/* Province fills */}
              <g filter="url(#prov-drop)">
                {projected.map(item => {
                  const style = getProvinceStyle(item.name)
                  const isSel = selected === item.name
                  const isContest = style.lean === 'CONTESTED'

                  return (
                    <g key={item.name}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelected(prev => prev === item.name ? null : item.name)}
                      tabIndex={0} role="button" aria-label={`${item.name} province`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelected(prev => prev === item.name ? null : item.name) }}>
                      {/* Base rectangle for hatch pattern bg */}
                      {isContest && item.paths.map((d, i) => <path key={`bg-${i}`} d={d} fill="#18222E" />)}
                      {item.paths.map((d, i) => (
                        <path key={i} d={d}
                          fill={isContest ? 'url(#hatch-tossup)' : style.fill ?? C.card2}
                          fillOpacity={isContest ? 1 : (isSel ? 0.97 : 0.82)}
                          stroke={isSel ? '#FFFFFF' : '#C8D8F0'}
                          strokeWidth={isSel ? 2.8 : 1.2}
                          strokeLinejoin="round"
                        />
                      ))}
                    </g>
                  )
                })}
              </g>

              {/* Province labels */}
              <g pointerEvents="none">
                {projected.map(item => {
                  const prov = ELECTION_DATA.provinces.find(p => p.name === item.name)
                  if (!prov) return null
                  const lean  = getLean(prov)
                  const lead  = Math.max(prov.upnd, prov.pf)
                  const lCol  = prov.upnd >= prov.pf ? C.upnd : C.pf
                  const label = item.name === 'North-Western' ? 'N-WESTERN' : item.name.toUpperCase()
                  const pillW = label.length * 5.5 + 22
                  const isTiny = ['Lusaka', 'Luapula'].includes(item.name)

                  return (
                    <g key={`lbl-${item.name}`}>
                      {!isTiny && (
                        <text x={item.cx} y={item.cy - 2} textAnchor="middle"
                          fontSize={item.name === 'North-Western' || item.name === 'Copperbelt' ? 8.5 : 9.5}
                          fontWeight="800" fill="#FFFFFF" letterSpacing="0.06em"
                          style={{ filter: 'drop-shadow(0 1px 3px #000)' }}>
                          {label}
                        </text>
                      )}
                      <rect x={item.cx - pillW / 2} y={item.cy + (isTiny ? -8 : 4)}
                        width={pillW} height={18} rx={9}
                        fill="rgba(0,0,0,0.78)"
                        stroke={lean === 'CONTESTED' ? C.gold : (prov.upnd >= prov.pf ? C.upnd : C.pf)}
                        strokeWidth={1} strokeOpacity={0.75} />
                      <text x={item.cx} y={item.cy + (isTiny ? 5 : 17)} textAnchor="middle"
                        fontSize={8.5} fontWeight="700"
                        fill={lean === 'CONTESTED' ? C.gold : lCol}>
                        {lean === 'CONTESTED' ? `TOSS-UP ${lead}%` : `${prov.upnd >= prov.pf ? 'HH' : 'BM/MZ'} ${lead}%`}
                      </text>
                    </g>
                  )
                })}
              </g>
            </svg>
          )}

          {/* Legend */}
          {!loading && !error && projected.length > 0 && (
            <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 11,
              background: 'rgba(6,12,20,0.92)', border: `1px solid ${C.line}`, borderRadius: 8,
              padding: '5px 10px', fontSize: 10 }}>
              {[
                { label: 'UPND leads',  bg: C.upnd,  hatch: false },
                { label: 'Opp. leads', bg: C.pf,    hatch: false },
                { label: 'Toss-up',     bg: '',      hatch: true  },
              ].map(it => (
                <span key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.text }}>
                  <span style={{
                    display: 'inline-block', width: 14, height: 11, borderRadius: 2,
                    background: it.hatch
                      ? `repeating-linear-gradient(45deg,${C.upnd}55,${C.upnd}55 2px,${C.pf}55 2px,${C.pf}55 5px)`
                      : it.bg,
                    border: `1px solid ${it.hatch ? C.gold : it.bg}88`,
                  }} />
                  {it.label}
                </span>
              ))}
              <span style={{ color: C.muted, paddingLeft: 7, borderLeft: `1px solid ${C.line}` }}>Click to explore</span>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div style={{ background: C.card, padding: 18, overflowY: 'auto', maxHeight: 580, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selectedProv ? (
            <>
              <div style={{ background: `${selColor}1A`, border: `1px solid ${selColor}44`, borderRadius: 10, padding: '11px 14px' }}>
                <div style={{ color: selColor, fontWeight: 800, fontSize: 15 }}>{selectedProv.name}</div>
                <div style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>
                  {selectedLean === 'UPND' ? '🟠 UPND LEADING' : selectedLean === 'PF' ? '🔴 OPPOSITION LEADING' : '⚠️ TOSS-UP'}
                  {' · '}{(selectedProv.voters / 1000).toFixed(0)}K voters
                  {' · '}{((selectedProv.voters / ELECTION_DATA.voterTotal) * 100).toFixed(1)}% of register
                </div>
              </div>

              {[
                { label: 'HH / UPND',  pct: selectedProv.upnd, color: C.upnd },
                { label: 'BM/MZ',      pct: selectedProv.pf,   color: C.pf },
                { label: 'Others / Undecided', pct: Math.max(0, 100 - selectedProv.upnd - selectedProv.pf), color: C.muted },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3, color: C.text }}>
                    <span>{s.label}</span>
                    <b style={{ color: s.color }}>{s.pct}%</b>
                  </div>
                  <div style={{ height: 6, background: C.line, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                {[
                  { k: 'Margin',       v: `${Math.abs(selectedProv.upnd - selectedProv.pf)}pts` },
                  { k: 'Status',       v: selectedProv.lean === 'CONTESTED' ? 'Battleground' : `${selectedProv.lean} lean` },
                  { k: 'Confidence',   v: selectedProv.confidence ?? 'medium' },
                  { k: 'Lead votes ~', v: Math.round(selectedProv.voters * Math.max(selectedProv.upnd, selectedProv.pf) / 100).toLocaleString() },
                ].map(s => (
                  <div key={s.k} style={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: 7, padding: '7px 9px' }}>
                    <div style={{ color: C.muted, fontSize: 9 }}>{s.k}</div>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 11, marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: 7, padding: '9px 11px', fontSize: 10, color: C.muted, lineHeight: 1.55 }}>
                <div style={{ color: C.gold, fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', marginBottom: 5 }}>MODEL RATIONALE</div>
                {selectedProv.rationale}
              </div>

              {selectedProv.issueDrivers?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {selectedProv.issueDrivers.map(d => (
                    <span key={d} style={{ fontSize: 9, background: `${C.teal}18`, border: `1px solid ${C.teal}44`, color: C.teal, borderRadius: 20, padding: '2px 8px' }}>{d}</span>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 10, color: C.muted, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
                <b style={{ color: C.text }}>2021 baseline: </b>{selectedProv.baseline2021}
              </div>

              <button type="button" onClick={() => setSelected(null)}
                style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.muted, borderRadius: 7, padding: '6px 0', cursor: 'pointer', fontSize: 11 }}>
                ← All provinces
              </button>
            </>
          ) : (
            <>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, letterSpacing: '0.06em' }}>PROVINCE INTELLIGENCE</div>
              <p style={{ color: C.muted, fontSize: 10, lineHeight: 1.5, margin: 0 }}>
                Click any province to see voter weight, candidate shares, model rationale and key issue drivers.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {ELECTION_DATA.provinces.map(prov => {
                  const lean = getLean(prov)
                  const col  = lean === 'UPND' ? C.upnd : lean === 'PF' ? C.pf : C.gold
                  return (
                    <button key={prov.name} type="button" onClick={() => setSelected(prov.name)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.card2, border: `1px solid ${C.line}`, borderRadius: 7, padding: '8px 11px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                          background: lean === 'CONTESTED' ? `linear-gradient(135deg,${C.upnd} 50%,${C.pf} 50%)` : col }} />
                        <span style={{ color: C.text, fontSize: 11, fontWeight: 600 }}>{prov.name}</span>
                      </div>
                      <span style={{ color: '#fff', background: col, fontSize: 9, fontWeight: 700, borderRadius: 5, padding: '2px 7px' }}>
                        {lean === 'CONTESTED' ? 'TOSS-UP' : lean === 'UPND' ? `HH ${prov.upnd}%` : `BM/MZ ${prov.pf}%`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
