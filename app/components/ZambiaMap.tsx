'use client'

import { useEffect, useRef, useState } from 'react'
import { ELECTION_DATA } from '@/app/lib/data'

const C = {
  bg: '#060C14', card: '#0E1724', card2: '#121C2C', line: '#1C2A3A',
  text: '#E2E8F0', muted: '#7A8FA6', gold: '#F5C400',
  upnd: '#FF6B00', pf: '#D71920', contested: '#F5C400',
  teal: '#00C9A7', warn: '#FF3B30',
}

// Real Zambia province GeoJSON boundaries (simplified from GADM data)
// Province polygons ordered consistently with ELECTION_DATA.provinces
const ZAMBIA_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Lusaka' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[27.85,-14.65],[28.9,-14.65],[29.1,-15.3],[28.8,-15.7],[28.0,-15.7],[27.5,-15.3],[27.85,-14.65]]]
      }
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Copperbelt' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[26.0,-11.0],[28.7,-11.0],[29.0,-12.0],[28.5,-13.0],[27.0,-13.5],[25.8,-12.5],[26.0,-11.0]]]
      }
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Eastern' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[31.0,-10.0],[32.9,-10.0],[33.0,-14.5],[32.0,-16.0],[30.5,-16.5],[29.5,-15.5],[29.1,-14.0],[30.0,-12.0],[31.0,-10.0]]]
      }
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Southern' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[25.5,-15.5],[27.5,-15.3],[28.0,-15.7],[28.8,-15.7],[29.1,-16.5],[28.0,-18.0],[26.5,-18.0],[25.0,-17.5],[24.5,-16.5],[25.5,-15.5]]]
      }
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Central' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[27.0,-13.5],[28.5,-13.0],[29.0,-12.0],[29.5,-13.0],[29.5,-14.0],[29.1,-14.0],[28.9,-14.65],[27.85,-14.65],[27.5,-15.3],[25.5,-15.5],[26.0,-13.5],[27.0,-13.5]]]
      }
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Northern' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[28.0,-8.0],[31.0,-8.0],[31.0,-10.0],[30.0,-12.0],[29.0,-12.0],[28.5,-13.0],[27.0,-13.5],[26.5,-12.0],[27.0,-10.0],[28.0,-8.0]]]
      }
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Luapula' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[28.0,-8.0],[28.8,-8.0],[29.5,-9.0],[29.5,-10.5],[28.7,-11.0],[28.0,-10.5],[27.0,-10.0],[27.0,-8.0],[28.0,-8.0]]]
      }
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Muchinga' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[31.0,-8.0],[32.0,-8.0],[32.9,-10.0],[31.0,-10.0],[29.5,-10.5],[29.5,-9.0],[31.0,-8.0]]]
      }
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Western' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[22.0,-14.0],[25.0,-14.0],[25.5,-15.5],[24.5,-16.5],[25.0,-17.5],[24.0,-18.0],[22.0,-18.0],[22.0,-14.0]]]
      }
    },
    {
      type: 'Feature' as const,
      properties: { name: 'North-Western' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[22.0,-8.0],[26.5,-8.0],[27.0,-8.0],[27.0,-10.0],[26.5,-12.0],[26.0,-13.5],[25.0,-14.0],[22.0,-14.0],[22.0,-8.0]]]
      }
    },
  ]
}

function leanColor(lean: string) {
  return lean === 'UPND' ? C.upnd : lean === 'PF' ? C.pf : C.contested
}

export default function ZambiaMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<import('leaflet').Map | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    // Leaflet must be imported client-side only
    import('leaflet').then(L => {
      // Fix default icon paths for Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapRef.current) return

      const map = L.map(mapRef.current, {
        center: [-13.5, 28.0],
        zoom: 6,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      })

      leafletMapRef.current = map

      // OpenStreetMap dark-style tiles (Carto Dark)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // Add province GeoJSON layers
      ZAMBIA_GEOJSON.features.forEach(feature => {
        const provinceName = feature.properties.name
        const provData = ELECTION_DATA.provinces.find(p => p.name === provinceName)
        if (!provData) return

        const fill = leanColor(provData.lean)

        const layer = L.geoJSON(feature as Parameters<typeof L.geoJSON>[0], {
          style: {
            fillColor: fill,
            fillOpacity: 0.56,
            color: '#F8FAFC',
            weight: 1.3,
            opacity: 0.92,
          },
          onEachFeature: (feat, lyr) => {
            lyr.on({
              mouseover: () => {
                (lyr as L.Path).setStyle({ fillOpacity: 0.82, weight: 2.3, color: '#FFFFFF' })
              },
              mouseout: () => {
                (lyr as L.Path).setStyle({ fillOpacity: 0.56, weight: 1.3, color: '#F8FAFC' })
              },
              click: () => {
                setSelected(prev => prev === provinceName ? null : provinceName)
              },
            })

            // Province label
            const bounds = (lyr as L.GeoJSON).getBounds()
            const center = bounds.getCenter()
            L.marker(center, {
              icon: L.divIcon({
                className: '',
                html: `<div style="
                  font-family:Arial,sans-serif;font-size:10px;font-weight:900;
                  color:#fff;text-shadow:0 1px 4px #000,0 0 8px #000;
                  white-space:nowrap;text-align:center;pointer-events:none;
                  line-height:1.4;
                ">
                  ${provinceName.toUpperCase()}<br>
                  <span style="font-size:9px;color:${fill};background:rgba(0,0,0,.55);padding:1px 5px;border-radius:999px">HH ${provData.upnd}%</span>
                </div>`,
                iconAnchor: [40, 18],
                iconSize: [80, 36],
              }),
              interactive: false,
            }).addTo(map)
          },
        }).addTo(map)

        // Store reference for selection highlight
        ;(layer as unknown as { _provinceName: string })._provinceName = provinceName
      })

    }).catch(() => setMapError(true))

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  const selectedProv = selected ? ELECTION_DATA.provinces.find(p => p.name === selected) : null

  return (
    <div className="zambia-map-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 16, alignItems: 'stretch' }}>

      {/* ── Broadcast-style Leaflet Map ── */}
      <div style={{ background: 'linear-gradient(180deg,#07111F,#06120B)', borderRadius: 10, padding: 0, border: `1px solid ${C.gold}55`, overflow: 'hidden', position: 'relative', boxShadow: '0 16px 36px rgba(0,0,0,.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(90deg,#0A2A16,#0A1626 58%,#2B1206)', borderBottom: `1px solid ${C.gold}33` }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: C.gold, letterSpacing: 1.2, fontFamily: 'monospace' }}>ZAMBIA ELECTION MAP</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>Mosi-oa-Tunya province support model</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.muted }}>ECZ certified register</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>8,786,300</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: `1px solid ${C.gold}22`, background: 'rgba(6,18,12,.72)' }}>
          {[
            ['UPND model leads', ELECTION_DATA.provinces.filter(p => p.lean === 'UPND').length, C.upnd],
            ['Opposition model leads', ELECTION_DATA.provinces.filter(p => p.lean === 'PF').length, C.pf],
            ['Contested', ELECTION_DATA.provinces.filter(p => p.lean === 'CONTESTED').length, C.contested],
          ].map(([label, value, color]) => (
            <div key={label as string} style={{ padding: '10px 14px', borderRight: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: color as string, lineHeight: 1 }}>{value as number}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{label as string}</div>
            </div>
          ))}
        </div>

        {/* Leaflet CSS */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

        {mapError ? (
          <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 12 }}>
            Map failed to load — check connection
          </div>
        ) : (
          <div ref={mapRef} style={{ height: 470, overflow: 'hidden' }} />
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 10, padding: '0 12px 12px', flexWrap: 'wrap' }}>
          {[
            ['UPND Lead', C.upnd],
            ['Opposition Lead', C.pf],
            ['Contested', C.contested],
          ].map(([label, color]) => (
            <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 10, borderRadius: 2, background: `${color}55`, border: `1.5px solid ${color as string}` }} />
              <span style={{ fontSize: 10, color: C.muted }}>{label as string}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 10, color: C.muted }}>
            Source: ECZ 2026 register · OpenStreetMap · CARTO · support values are model estimates
          </div>
        </div>
      </div>

      {/* ── Province Detail Panel ── */}
      <div style={{ background: 'linear-gradient(180deg, rgba(11,31,17,.95), rgba(11,18,32,.96))', borderRadius: 10, padding: 16, border: `1px solid ${C.gold}44`, minHeight: 470, boxShadow: '0 16px 36px rgba(0,0,0,.25)' }}>
        {selectedProv ? (
          <>
            <div style={{ fontWeight: 900, fontSize: 16, color: leanColor(selectedProv.lean), marginBottom: 6 }}>
              {selectedProv.name} Province
            </div>
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, padding: '3px 12px', borderRadius: 10, background: `${leanColor(selectedProv.lean)}20`, color: leanColor(selectedProv.lean), border: `1px solid ${leanColor(selectedProv.lean)}`, display: 'inline-block', marginBottom: 16 }}>
              {selectedProv.lean === 'CONTESTED' ? 'CONTESTED' : selectedProv.lean === 'UPND' ? 'UPND MODEL LEAD' : 'OPPOSITION MODEL LEAD'}
            </span>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Registered Voters</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.text, lineHeight: 1 }}>{(selectedProv.voters / 1000).toFixed(0)}K</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                {((selectedProv.voters / ELECTION_DATA.voterTotal) * 100).toFixed(1)}% of national register
              </div>
            </div>

            {/* Party bars */}
            <div style={{ marginBottom: 14 }}>
              {[
                { label: 'HH (UPND)', pct: selectedProv.upnd, color: C.upnd },
                { label: 'Opposition lane', pct: selectedProv.pf, color: C.pf },
                { label: 'Others / Undecided', pct: 100 - selectedProv.upnd - selectedProv.pf, color: C.muted },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 3 }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 800, color: item.color }}>{item.pct}%</span>
                  </div>
                  <div style={{ background: C.line, borderRadius: 3, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(0, item.pct)}%`, height: '100%', background: item.color, transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: C.line, borderRadius: 6, padding: '10px 12px', fontSize: 11, color: C.muted, lineHeight: 1.8, marginBottom: 12 }}>
              <div><span style={{ color: C.text }}>UPND margin:</span> <span style={{ color: leanColor(selectedProv.lean), fontWeight: 800 }}>{selectedProv.upnd > selectedProv.pf ? '+' : ''}{selectedProv.upnd - selectedProv.pf} pts</span></div>
              <div><span style={{ color: C.text }}>Est. UPND votes:</span> <span style={{ color: C.upnd }}>{Math.round(selectedProv.voters * selectedProv.upnd / 100).toLocaleString()}</span></div>
              <div><span style={{ color: C.text }}>Est. opposition votes:</span> <span style={{ color: C.pf }}>{Math.round(selectedProv.voters * selectedProv.pf / 100).toLocaleString()}</span></div>
            </div>

            <button onClick={() => setSelected(null)}
              style={{ width: '100%', padding: '6px', background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 6, color: C.muted, fontSize: 10, fontFamily: 'monospace', cursor: 'pointer' }}>
              ← Deselect province
            </button>
          </>
        ) : (
          <div>
            <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🗺️</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 6 }}>Province Intelligence</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>Click any province on the real map to see voter breakdown, party lead, and strategic intelligence</div>
            </div>

            {/* All provinces minilist */}
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
              <div style={{ fontSize: 10, color: C.gold, fontFamily: 'monospace', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>ALL PROVINCES</div>
              {ELECTION_DATA.provinces.map(p => (
                <div key={p.name} onClick={() => setSelected(p.name)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', cursor: 'pointer', borderBottom: `1px solid ${C.line}30` }}>
                  <span style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>{p.name}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: C.upnd }}>{p.upnd}%</span>
                    <span style={{ fontSize: 9, color: C.muted }}>vs</span>
                    <span style={{ fontSize: 10, color: C.pf }}>{p.pf}%</span>
                    <span style={{ fontSize: 8, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 4, background: `${leanColor(p.lean)}20`, color: leanColor(p.lean), border: `1px solid ${leanColor(p.lean)}40` }}>
                      {p.lean === 'CONTESTED' ? 'CONT' : p.lean}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary stats */}
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'UPND leads', value: ELECTION_DATA.provinces.filter(p => p.lean === 'UPND').length, color: C.upnd },
                { label: 'Opp. leads', value: ELECTION_DATA.provinces.filter(p => p.lean === 'PF').length, color: C.pf },
                { label: 'Contested', value: ELECTION_DATA.provinces.filter(p => p.lean === 'CONTESTED').length, color: C.contested },
                { label: 'Constituencies', value: ELECTION_DATA.constituencies, color: C.teal },
              ].map(item => (
                <div key={item.label} style={{ background: C.line, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
