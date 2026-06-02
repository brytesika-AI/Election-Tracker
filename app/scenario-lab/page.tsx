'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  runForecast,
  DEFAULT_LEVERS,
  SCENARIO_PRESETS,
  type ForecastLevers,
} from '@/app/lib/forecast'
import { HISTORICAL_RESULTS, REGISTER_2026, NEW_CONSTITUENCIES_2026 } from '@/app/lib/historical'

const pct = (n: number) => `${n.toFixed(1)}%`

const COLORS = {
  bg: '#0b1220',
  panel: '#121a2b',
  panel2: '#0f1626',
  border: '#23304a',
  text: '#e6ecf7',
  sub: '#94a3b8',
  upnd: '#e11d48',
  opp: '#22c55e',
  accent: '#38bdf8',
  amber: '#f59e0b',
}

interface LeverDef {
  key: keyof ForecastLevers
  label: string
  min: number
  max: number
  step: number
  suffix: string
  hint: string
}

const LEVERS: LeverDef[] = [
  { key: 'turnout', label: 'National turnout', min: 50, max: 75, step: 0.5, suffix: '%', hint: 'Higher turnout modestly helps the UPND urban base.' },
  { key: 'undecidedToUpnd', label: 'Undecided breaking to UPND', min: 0, max: 100, step: 1, suffix: '%', hint: 'Share of the undecided residual going to UPND.' },
  { key: 'economicDrag', label: 'Additional economic pain on UPND', min: -5, max: 10, step: 0.5, suffix: 'pt', hint: 'Cost-of-living / load-shedding drag beyond what is already priced in. Negative = relief.' },
  { key: 'kalabaTransferToUpnd', label: 'Kalaba (CF) runoff transfer to UPND', min: 0, max: 100, step: 1, suffix: '%', hint: 'Where Citizens First voters go in a second round.' },
  { key: 'membeTransferToUpnd', label: "M'membe (SP) runoff transfer to UPND", min: 0, max: 100, step: 1, suffix: '%', hint: 'Where Socialist Party voters go in a second round.' },
  { key: 'katekaTransferToUpnd', label: 'Kateka (NHP) runoff transfer to UPND', min: 0, max: 100, step: 1, suffix: '%', hint: 'Where governance-reform voters go in a second round.' },
  { key: 'uncertainty', label: 'Model uncertainty (1 sigma)', min: 1, max: 6, step: 0.5, suffix: 'pt', hint: 'Width of the polling error band used in the simulation.' },
]

function Tag({ kind }: { kind: 'live' | 'model' | 'fact' }) {
  const map = {
    live: { t: 'LIVE DATA', c: COLORS.opp },
    model: { t: 'MODEL ESTIMATE', c: COLORS.amber },
    fact: { t: 'HISTORICAL FACT', c: COLORS.accent },
  }[kind]
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: map.c, border: `1px solid ${map.c}`, borderRadius: 4, padding: '2px 6px' }}>
      {map.t}
    </span>
  )
}

export default function ScenarioLabPage() {
  const [levers, setLevers] = useState<ForecastLevers>(DEFAULT_LEVERS)
  const result = useMemo(() => runForecast(levers, 6000), [levers])

  const presetRows = useMemo(
    () => SCENARIO_PRESETS.map((p) => {
      const merged = { ...DEFAULT_LEVERS, ...p.levers }
      const r = runForecast(merged, 2500)
      return { preset: p, firstRound: r.firstRoundWinPct, runoff: r.runoffPct }
    }),
    []
  )

  const set = (key: keyof ForecastLevers, value: number) =>
    setLevers((prev) => ({ ...prev, [key]: value }))

  const lo = 40
  const hi = 56
  const span = hi - lo
  const x = (v: number) => `${((v - lo) / span) * 100}%`

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: '28px 18px 64px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/" style={{ color: COLORS.sub, textDecoration: 'none', fontSize: 13 }}>&larr; Back to dashboard</Link>

        <h1 style={{ fontSize: 30, fontWeight: 800, margin: '14px 0 4px' }}>Scenario Lab</h1>
        <p style={{ color: COLORS.sub, margin: '0 0 14px', maxWidth: 760, lineHeight: 1.5 }}>
          Move the levers to see how the Zambia 2026 presidential outcome shifts. The engine runs a
          Monte&nbsp;Carlo simulation ({result.iterations.toLocaleString()} draws) over your inputs and a polling-error
          band, and reports the probability of a first-round win versus a runoff with confidence intervals.
        </p>

        <div style={{ background: '#3b1d1d', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.5, marginBottom: 22 }}>
          <strong>This is a what-if model, not a prediction of the actual result.</strong> Current candidate
          shares are <span style={{ color: COLORS.amber }}>model estimates / assumptions</span>, shown so you can
          stress-test them. Historical results below are <span style={{ color: COLORS.accent }}>ECZ official record</span>.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
          <div style={{ flex: '1 1 380px', background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Model levers</h2>
              <button
                onClick={() => setLevers(DEFAULT_LEVERS)}
                style={{ background: 'transparent', color: COLORS.accent, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>
            {LEVERS.map((d) => (
              <div key={d.key} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{d.label}</span>
                  <span style={{ color: COLORS.accent, fontWeight: 700 }}>
                    {Number(levers[d.key]).toFixed(d.step < 1 ? 1 : 0)}{d.suffix}
                  </span>
                </div>
                <input
                  type="range"
                  min={d.min}
                  max={d.max}
                  step={d.step}
                  value={levers[d.key]}
                  onChange={(e) => set(d.key, Number(e.target.value))}
                  style={{ width: '100%', accentColor: COLORS.upnd }}
                />
                <div style={{ fontSize: 11, color: COLORS.sub, marginTop: 2 }}>{d.hint}</div>
              </div>
            ))}
          </div>

          <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: COLORS.sub }}>P(UPND first-round win)</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: COLORS.upnd }}>{pct(result.firstRoundWinPct)}</div>
              </div>
              <div style={{ flex: 1, background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: COLORS.sub }}>P(runoff)</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: COLORS.amber }}>{pct(result.runoffPct)}</div>
              </div>
            </div>

            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                <span>UPND first-round share (mean &amp; 80% CI)</span>
                <span style={{ fontWeight: 700 }}>{pct(result.adjustedUpnd)}</span>
              </div>
              <div style={{ position: 'relative', height: 44, background: COLORS.panel2, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                <div style={{ position: 'absolute', left: x(50), top: -4, bottom: -4, width: 2, background: COLORS.text, opacity: 0.7 }} />
                <div style={{ position: 'absolute', left: x(50), top: -18, transform: 'translateX(-50%)', fontSize: 10, color: COLORS.sub }}>50%+1</div>
                <div style={{ position: 'absolute', top: 18, height: 8, borderRadius: 4, left: x(result.ci80[0]), width: `calc(${x(result.ci80[1])} - ${x(result.ci80[0])})`, background: COLORS.upnd, opacity: 0.45 }} />
                <div style={{ position: 'absolute', top: 10, left: x(result.adjustedUpnd), transform: 'translateX(-50%)', width: 4, height: 24, background: COLORS.upnd, borderRadius: 2 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.sub, marginTop: 6 }}>
                <span>{lo}%</span>
                <span>80% CI: {pct(result.ci80[0])} - {pct(result.ci80[1])} &nbsp;|&nbsp; 95%: {pct(result.ci95[0])} - {pct(result.ci95[1])}</span>
                <span>{hi}%</span>
              </div>
            </div>

            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>If it goes to a runoff (UPND vs BM/MZ)</div>
              <div style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
                <div style={{ width: `${result.runoffUpnd}%`, background: COLORS.upnd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  UPND {pct(result.runoffUpnd)}
                </div>
                <div style={{ width: `${result.runoffBmmz}%`, background: COLORS.opp, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  BM/MZ {pct(result.runoffBmmz)}
                </div>
              </div>
              <div style={{ fontSize: 12, color: COLORS.sub, marginTop: 8 }}>
                Modelled P(UPND wins a runoff): <strong style={{ color: COLORS.text }}>{pct(result.runoffWinProbUpnd)}</strong>
              </div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '30px 0 10px' }}>Scenario table</h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
            <thead>
              <tr style={{ background: COLORS.panel2, textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Scenario</th>
                <th style={{ padding: '10px 12px' }}>What changes</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>P(1st-round win)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>P(runoff)</th>
                <th style={{ padding: '10px 12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {presetRows.map(({ preset, firstRound, runoff }) => (
                <tr key={preset.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{preset.name}</td>
                  <td style={{ padding: '10px 12px', color: COLORS.sub }}>{preset.description}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: COLORS.upnd, fontWeight: 700 }}>{pct(firstRound)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: COLORS.amber, fontWeight: 700 }}>{pct(runoff)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      onClick={() => setLevers({ ...DEFAULT_LEVERS, ...preset.levers })}
                      style={{ background: COLORS.accent, color: '#04121f', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Load
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '30px 0 10px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Historical calibration</h2>
          <Tag kind="fact" />
        </div>
        <div style={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
            <thead>
              <tr style={{ background: COLORS.panel2, textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Year</th>
                <th style={{ padding: '10px 12px' }}>Winner</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Margin</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Turnout</th>
                <th style={{ padding: '10px 12px' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {HISTORICAL_RESULTS.map((h) => (
                <tr key={h.year} style={{ borderTop: `1px solid ${COLORS.border}`, verticalAlign: 'top' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{h.year}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {h.candidates[0].name} <span style={{ color: COLORS.sub }}>({h.winnerParty} {pct(h.candidates[0].pct)})</span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{pct(h.marginPct)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{pct(h.turnoutPct)}</td>
                  <td style={{ padding: '10px 12px', color: COLORS.sub, maxWidth: 360 }}>{h.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 12, color: COLORS.sub, marginTop: 22, lineHeight: 1.6 }}>
          2026 register: {REGISTER_2026.toLocaleString()} voters, of which {NEW_CONSTITUENCIES_2026} of 226
          constituencies are new and carry no voting history (extra forecast noise). Historical results are ECZ
          official record (sources: elections.org.zm, EISA 2021). The simulation is a transparent what-if tool and
          must not be published as a prediction of the 2026 outcome.
        </p>
      </div>
    </div>
  )
}
