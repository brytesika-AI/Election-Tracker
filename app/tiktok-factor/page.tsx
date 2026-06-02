'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { runForecast, DEFAULT_LEVERS, type ForecastLevers } from '@/app/lib/forecast'

export default function TikTokFactorPage() {
  const [tiktokBoost, setTiktokBoost] = useState(0)

  const levers = useMemo<ForecastLevers>(() => {
    // TikTok primarily boosts youth turnout and shifts undecideds strongly to UPND
    const turnout = Math.max(50, Math.min(75, DEFAULT_LEVERS.turnout + tiktokBoost * 1.2))
    const undecidedToUpnd = Math.max(0, Math.min(100, DEFAULT_LEVERS.undecidedToUpnd + tiktokBoost * 3))
    return { ...DEFAULT_LEVERS, turnout, undecidedToUpnd }
  }, [tiktokBoost])

  const result = useMemo(() => runForecast(levers, 4000), [levers])

  return (
    <div style={{ padding: 28, fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 13 }}>&larr; Back</Link>
      <h1 style={{ marginTop: 8 }}>TikTok factor</h1>
      <p style={{ color: '#6b7280', maxWidth: 720 }}>Simulate a youth turnout and persuasion boost driven by viral TikTok engagement. This adjusts turnout and undecided flow to UPND.</p>

      <div style={{ maxWidth: 720, marginTop: 18 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>TikTok boost (pts): {tiktokBoost.toFixed(1)}</label>
        <input type="range" min={-5} max={15} step={0.5} value={tiktokBoost} onChange={(e) => setTiktokBoost(Number(e.target.value))} style={{ width: '100%' }} />
      </div>

      <div style={{ marginTop: 22, display: 'flex', gap: 12, maxWidth: 720 }}>
        <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <div style={{ color: '#6b7280', fontSize: 13 }}>P(UPND first-round win)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#e11d48' }}>{result.firstRoundWinPct.toFixed(1)}%</div>
        </div>
        <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <div style={{ color: '#6b7280', fontSize: 13 }}>P(runoff)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{result.runoffPct.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ marginTop: 16, color: '#6b7280' }}>UPND mean share (adjusted): {result.adjustedUpnd.toFixed(1)}%</div>
    </div>
  )
}
