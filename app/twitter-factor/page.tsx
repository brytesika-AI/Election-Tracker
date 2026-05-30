tsx'use client'

import { useMemo, useState } from 'react'
import { runForecast, DEFAULT_LEVERS, type ForecastLevers } from '@/app/lib/forecast'

export default function TwitterFactorPage() {
  const [twitterPts, setTwitterPts] = useState(0)

  const levers = useMemo<ForecastLevers>(() => {
    const turnout = Math.max(50, Math.min(75, DEFAULT_LEVERS.turnout + twitterPts))
    const undecidedToUpnd = Math.max(0, Math.min(100, DEFAULT_LEVERS.undecidedToUpnd + twitterPts * 2))
    return { ...DEFAULT_LEVERS, turnout, undecidedToUpnd }
  }, [twitterPts])

  const result = useMemo(() => runForecast(levers, 4000), [levers])

  return (
    <div style={{ padding: 28, fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <a href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 13 }}>&larr; Back</a>
      <h1 style={{ marginTop: 8 }}>Twitter factor</h1>
      <p style={{ color: '#6b7280', maxWidth: 720 }}>Adjust a hypothetical Twitter-driven swing (net points added to turnout and undecided breaking to UPND) and observe how the model responds.</p>

      <div style={{ maxWidth: 720, marginTop: 18 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Twitter effect (pts to turnout / undecided lift): {twitterPts.toFixed(1)}</label>
        <input type="range" min={-5} max={10} step={0.5} value={twitterPts} onChange={(e) => setTwitterPts(Number(e.target.value))} style={{ width: '100%' }} />
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
