'use client'

import { useState, useCallback, useEffect } from 'react'
import { ELECTION_DATA } from '@/app/lib/data'

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#060C14',
  card:    '#0E1724',
  card2:   '#121C2C',
  border:  '#1C2A3A',
  text:    '#E2E8F0',
  muted:   '#7A8FA6',
  upnd:    '#FF6B00',
  pf:      '#CC0000',
  gold:    '#F5C400',
  teal:    '#00C9A7',
  blue:    '#0077E6',
  purple:  '#8E44AD',
  green:   '#198A00',
  warn:    '#E67E22',
}

// ── Agent definitions ────────────────────────────────────────────────────────
const AGENTS = [
  {
    id: 'oracle',
    name: 'ORACLE',
    icon: '🔮',
    role: 'Probabilistic Forecaster',
    desc: 'Monte Carlo probability engine — first-round vs runoff vs loss',
    color: C.gold,
    accent: '#2A2010',
  },
  {
    id: 'strategis',
    name: 'STRATEGIS',
    icon: '🎯',
    role: 'Campaign Strategist',
    desc: 'Province targeting · resource allocation · messaging matrix',
    color: C.teal,
    accent: '#0A1E1C',
  },
  {
    id: 'sentinex',
    name: 'SENTINEX',
    icon: '🛡️',
    role: 'Risk & Integrity Monitor',
    desc: 'Electoral threats · disinformation · legal/petition risk',
    color: C.pf,
    accent: '#1E0A0A',
  },
  {
    id: 'economist',
    name: 'ECONOMIST',
    icon: '📊',
    role: 'Economic Vote Impact',
    desc: 'Inflation · mealie meal · load shedding · copper as vote drivers',
    color: C.blue,
    accent: '#0A1222',
  },
  {
    id: 'coalition',
    name: 'COALITION',
    icon: '🤝',
    role: 'Alliance Dynamics',
    desc: 'Vote transfer math · runoff scenario · party consolidation',
    color: C.purple,
    accent: '#15082A',
  },
]

// ── Types ────────────────────────────────────────────────────────────────────
type AgentId = 'oracle' | 'strategis' | 'sentinex' | 'economist' | 'coalition'

type OracleResult = {
  verdict: string; firstRoundWinPct: number; runoffPct: number; lossPct: number
  lowTurnoutFirstRound: number; baseTurnoutFirstRound: number; highTurnoutFirstRound: number
  pivotProvince: string; pivotReason: string; runoffTransferSummary: string
  keyInsight: string; recommendations: string[]
}
type StrategisResult = {
  verdict: string; netVotesNeeded: number
  defenseProvinces: string[]; contestProvinces: string[]; concedeProvinces: string[]
  topThreeActions: string[]; timeAllocation: { defend: number; contest: number; concede: number }
  pivotMessage: string; biggestRisk: string; keyInsight: string
}
type SentinexRisk = { category: string; level: string; detail: string; mitigation: string }
type SentinexResult = {
  overallRisk: string; overallScore: number; risks: SentinexRisk[]
  alertProvince: string; keyInsight: string; watchList: string[]
}
type EconomistIndicator = { name: string; value: string; voteImpact: number; affectedProvinces: string[]; direction: string }
type EconomistResult = {
  overallEconomicPressure: string; netEconomicDrag: number; indicators: EconomistIndicator[]
  adjustedUPND: number; keyInsight: string; relief: string
}
type CoalitionResult = {
  firstRoundCall: string; runoffWinner: string; runoffUPND: number; runoffBMMZ: number
  kalabaTransfer: { toUPND: number; toBMMZ: number }
  membeTransfer: { toUPND: number; toBMMZ: number }
  undecidedSplit: { toUPND: number; toBMMZ: number; abstain: number }
  northernConsolidation: string; makebiBonusEastern: string
  criticalAlliance: string; keyInsight: string
}

type AllResults = {
  oracle?: OracleResult; strategis?: StrategisResult; sentinex?: SentinexResult
  economist?: EconomistResult; coalition?: CoalitionResult
  mode?: string; daysToElection?: number; timestamp?: string
}

// ── Mini gauge bar ────────────────────────────────────────────────────────────
function GaugeBar({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ background: '#1A2535', borderRadius: 3, height: 6 }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3, height: 6, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

// ── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = { LOW: C.green, MEDIUM: C.warn, HIGH: C.pf, CRITICAL: '#FF0040' }
  const c = map[level] ?? C.muted
  return (
    <span style={{
      background: c + '22', border: `1px solid ${c}66`, color: c,
      borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: 1,
    }}>
      {level}
    </span>
  )
}

// ── Province tier pill ────────────────────────────────────────────────────────
function ProvPill({ name, tier }: { name: string; tier: 'defend' | 'contest' | 'concede' }) {
  const map = { defend: C.upnd, contest: C.gold, concede: C.pf }
  const c = map[tier]
  return (
    <span style={{
      background: c + '20', border: `1px solid ${c}50`, color: c,
      borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 600, marginRight: 4, marginBottom: 4, display: 'inline-block',
    }}>
      {name}
    </span>
  )
}

// ── Probability ring (SVG) ────────────────────────────────────────────────────
function ProbRing({ pct, color, label, size = 88 }: { pct: number; color: string; label: string; size?: number }) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A2535" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ marginTop: -size * 0.52, fontSize: size * 0.22, fontWeight: 800, color }}>
        {Math.round(pct)}%
      </div>
      <div style={{ marginTop: size * 0.18, fontSize: 10, color: C.muted, letterSpacing: 0.5 }}>{label}</div>
    </div>
  )
}

// ── Thinking pulse animation ──────────────────────────────────────────────────
function ThinkingDots({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', marginLeft: 8 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: color,
          animation: `pulse 1.2s ease-in-out ${i * 0.3}s infinite`,
        }} />
      ))}
      <style>{`@keyframes pulse{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style>
    </span>
  )
}

// ── Main ScenarioHub component ────────────────────────────────────────────────
export default function ScenarioHub() {
  const [activeAgent, setActiveAgent] = useState<AgentId>('oracle')
  const [results, setResults] = useState<AllResults>({})
  const [loading, setLoading] = useState<Set<AgentId>>(new Set())
  const [ran, setRan] = useState(false)
  const [partyLens, setPartyLens] = useState<'UPND' | 'BM_MZ' | 'NEUTRAL'>('NEUTRAL')

  const D = ELECTION_DATA
  const hhPoll = D.nationalPoll.upnd
  const bmPoll = D.nationalPoll.mundubile_tonse
  const daysLeft = Math.round((new Date('2026-08-13').getTime() - Date.now()) / 86400000)
  const agent = AGENTS.find(a => a.id === activeAgent)!

  const runAll = useCallback(async () => {
    setRan(true)
    setLoading(new Set(['oracle', 'strategis', 'sentinex', 'economist', 'coalition']))
    try {
      const res = await fetch('/api/scenario-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'all', upnd: hhPoll, bm_mz: bmPoll }),
      })
      const data = await res.json()
      if (data.success) {
        setResults(data)
      }
    } catch { /* network error */ }
    setLoading(new Set())
  }, [hhPoll, bmPoll])

  const runSingle = useCallback(async (agentId: AgentId) => {
    setLoading(prev => new Set([...prev, agentId]))
    try {
      const res = await fetch('/api/scenario-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentId, upnd: hhPoll, bm_mz: bmPoll }),
      })
      const data = await res.json()
      if (data.success) {
        setResults(prev => ({ ...prev, [agentId]: data.result }))
      }
    } catch { /* */ }
    setLoading(prev => { const s = new Set(prev); s.delete(agentId); return s })
  }, [hhPoll, bmPoll])

  // Auto-run on mount
  useEffect(() => { runAll() }, [runAll])

  const isLoading = loading.has(activeAgent)
  const r = results

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'inherit', color: C.text }}>
      {/* ── Header bar ── */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: C.gold }}>WAR ROOM</div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 0.5 }}>MULTI-AGENT SCENARIO ANALYSIS</div>
          </div>
        </div>

        {/* Live metrics */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.upnd }}>{hhPoll.toFixed(1)}%</div>
            <div style={{ fontSize: 9, color: C.muted }}>HH LIVE POLL</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.pf }}>{bmPoll.toFixed(1)}%</div>
            <div style={{ fontSize: 9, color: C.muted }}>BM/MZ POLL</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: daysLeft < 90 ? C.pf : C.gold }}>{daysLeft}d</div>
            <div style={{ fontSize: 9, color: C.muted }}>TO AUG 13</div>
          </div>
          <div style={{
            background: r.mode === 'ai' ? C.teal + '22' : '#1A2535',
            border: `1px solid ${r.mode === 'ai' ? C.teal : C.border}`,
            borderRadius: 4, padding: '4px 10px', fontSize: 10, color: r.mode === 'ai' ? C.teal : C.muted,
          }}>
            {r.mode === 'ai' ? '● AI LIVE' : '● DEMO'}
          </div>
        </div>

        {/* Party lens selector */}
        <div style={{ display: 'flex', gap: 4, background: C.card2, borderRadius: 6, padding: 3 }}>
          {(['UPND', 'BM_MZ', 'NEUTRAL'] as const).map(p => (
            <button key={p} onClick={() => setPartyLens(p)} style={{
              padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
              background: partyLens === p ? (p === 'UPND' ? C.upnd : p === 'BM_MZ' ? C.pf : C.gold) : 'transparent',
              color: partyLens === p ? '#fff' : C.muted,
            }}>
              {p === 'BM_MZ' ? 'BM/MZ' : p}
            </button>
          ))}
        </div>

        <button onClick={runAll} disabled={loading.size > 0} style={{
          background: C.gold, color: '#000', border: 'none', borderRadius: 6,
          padding: '7px 16px', fontWeight: 800, fontSize: 11, cursor: 'pointer', letterSpacing: 0.5,
        }}>
          {loading.size > 0 ? '⟳ RUNNING...' : '▶ RUN ALL AGENTS'}
        </button>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* ── Left sidebar — agent list ── */}
        <div style={{
          width: 220, background: C.card, borderRight: `1px solid ${C.border}`,
          overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{ padding: '16px 14px 8px', fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700 }}>
            INTELLIGENCE AGENTS
          </div>
          {AGENTS.map(ag => {
            const isActive = activeAgent === ag.id
            const isRun = !!r[ag.id as AgentId]
            const isRunning = loading.has(ag.id as AgentId)
            return (
              <div key={ag.id}
                onClick={() => setActiveAgent(ag.id as AgentId)}
                style={{
                  padding: '12px 14px', cursor: 'pointer', borderLeft: `3px solid ${isActive ? ag.color : 'transparent'}`,
                  background: isActive ? ag.accent : 'transparent',
                  transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 18 }}>{ag.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: isActive ? ag.color : C.text, letterSpacing: 0.8 }}>
                      {ag.name}
                      {isRunning && <ThinkingDots color={ag.color} />}
                    </div>
                    <div style={{ fontSize: 9, color: C.muted }}>{ag.role}</div>
                  </div>
                  {isRun && !isRunning && (
                    <span style={{ marginLeft: 'auto', fontSize: 9, color: C.teal }}>✓</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{ag.desc}</div>
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={e => { e.stopPropagation(); runSingle(ag.id as AgentId) }}
                    disabled={isRunning}
                    style={{
                      background: ag.color + '22', border: `1px solid ${ag.color}44`, color: ag.color,
                      borderRadius: 4, padding: '3px 8px', fontSize: 9, cursor: 'pointer', fontWeight: 700,
                    }}>
                    {isRunning ? 'RUNNING...' : 'RE-RUN'}
                  </button>
                </div>
              </div>
            )
          })}

          {/* ── Data summary panel ── */}
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>LIVE DATA INPUTS</div>
            {[
              { label: 'Inflation', val: `${D.macroIndicators.inflation}%`, note: 'May 2026', color: C.teal },
              { label: 'Mealie Meal', val: `K${D.macroIndicators.mealMealPriceK}/25kg`, note: '↓ from K344', color: C.teal },
              { label: 'Kwacha/USD', val: `K${D.macroIndicators.kwachaUSD}`, note: '↑ rally', color: C.teal },
              { label: 'Copper LME', val: `$${(D.macroIndicators.copperPriceLME_USD_t ?? 13090).toLocaleString()}/t`, note: '↑', color: C.teal },
              { label: 'Youth Unempl.', val: `${D.macroIndicators.unemploymentYouth}%`, note: '19-22 cohort', color: C.warn },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: C.muted }}>{row.label}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: row.color }}>{row.val}</div>
                  <div style={{ fontSize: 8, color: C.muted }}>{row.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main content area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Loading state */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 16 }}>
              <div style={{ fontSize: 40 }}>{agent.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: agent.color }}>
                {agent.name} analysing{Array.from({ length: 3 }, (_, i) => '').join('')}
                <ThinkingDots color={agent.color} />
              </div>
              <div style={{ fontSize: 12, color: C.muted, maxWidth: 300, textAlign: 'center' }}>{agent.desc}</div>
            </div>
          )}

          {/* ── ORACLE panel ── */}
          {!isLoading && activeAgent === 'oracle' && r.oracle && (() => {
            const o = r.oracle!
            return (
              <div>
                <SectionHeader icon="🔮" title="ORACLE" subtitle="Probabilistic Forecast · Monte Carlo Scenario Engine" color={C.gold} />

                {/* Probability rings */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  <Card title="FIRST ROUND WIN" accent={C.gold}>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                      <ProbRing pct={o.firstRoundWinPct} color={C.gold} label="P(>50%+1)" />
                    </div>
                  </Card>
                  <Card title="RUNOFF LIKELY" accent={C.warn}>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                      <ProbRing pct={o.runoffPct} color={C.warn} label="P(Runoff)" />
                    </div>
                  </Card>
                  <Card title="LOSS / UPSET" accent={C.pf}>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                      <ProbRing pct={o.lossPct} color={C.pf} label="P(<44%)" />
                    </div>
                  </Card>
                </div>

                {/* Turnout scenarios */}
                <Card title="TURNOUT SCENARIO MATRIX" accent={C.gold} mb={12}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '8px 0' }}>
                    {[
                      { label: '🔴 Low Turnout (55%)', val: o.lowTurnoutFirstRound, note: 'PF machinery advantage' },
                      { label: '🟡 Base Turnout (62%)', val: o.baseTurnoutFirstRound, note: 'Model central estimate' },
                      { label: '🟢 High Turnout (70%)', val: o.highTurnoutFirstRound, note: 'UPND youth mobilisation' },
                    ].map(s => (
                      <div key={s.label} style={{ background: C.card2, borderRadius: 6, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: s.val > 50 ? C.teal : C.warn }}>{s.val}%</div>
                        <div style={{ fontSize: 9, color: C.muted }}>{s.note}</div>
                        <div style={{ fontSize: 10, color: s.val > 50 ? C.teal : C.pf, marginTop: 4 }}>
                          {s.val > 50 ? '✓ 1st round' : '⚠ Runoff risk'}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Pivot province */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <Card title="PIVOT PROVINCE" accent={C.gold}>
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.gold, marginBottom: 4 }}>{o.pivotProvince}</div>
                      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{o.pivotReason}</div>
                    </div>
                  </Card>
                  <Card title="RUNOFF TRANSFER SUMMARY" accent={C.warn}>
                    <div style={{ padding: '8px 0', fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                      {o.runoffTransferSummary}
                    </div>
                  </Card>
                </div>

                {/* Key insight */}
                <InsightBox text={o.keyInsight} color={C.gold} />

                {/* Recommendations */}
                <Card title="MODEL RECOMMENDATIONS" accent={C.teal}>
                  <div style={{ padding: '8px 0' }}>
                    {o.recommendations.map((rec, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <span style={{ color: C.teal, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                        <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{rec}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )
          })()}

          {/* ── STRATEGIS panel ── */}
          {!isLoading && activeAgent === 'strategis' && r.strategis && (() => {
            const s = r.strategis!
            return (
              <div>
                <SectionHeader icon="🎯" title="STRATEGIS" subtitle="Campaign Resource Allocator · Province Targeting Matrix" color={C.teal} />

                {/* Verdict + key stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'STATUS', val: s.verdict, color: s.verdict === 'ON_TRACK' ? C.teal : C.warn },
                    { label: 'NET VOTES NEEDED', val: s.netVotesNeeded.toLocaleString(), color: C.gold },
                    { label: 'DEFEND', val: `${s.timeAllocation.defend}%`, color: C.upnd },
                    { label: 'CONTEST', val: `${s.timeAllocation.contest}%`, color: C.gold },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{stat.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.val}</div>
                    </div>
                  ))}
                </div>

                {/* Province tiers */}
                <Card title="PROVINCE TIER MATRIX" accent={C.teal} mb={12}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '8px 0' }}>
                    <div>
                      <div style={{ fontSize: 9, color: C.upnd, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>🟠 DEFEND — HOLD AT ALL COST</div>
                      {s.defenseProvinces.map(p => <ProvPill key={p} name={p} tier="defend" />)}
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: C.gold, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>🟡 CONTEST — SWING TARGETS</div>
                      {s.contestProvinces.map(p => <ProvPill key={p} name={p} tier="contest" />)}
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: C.pf, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>🔴 CONCEDE — MIN RESOURCE</div>
                      {s.concedeProvinces.map(p => <ProvPill key={p} name={p} tier="concede" />)}
                    </div>
                  </div>
                </Card>

                {/* Time allocation bar */}
                <Card title="CAMPAIGN TIME ALLOCATION" accent={C.teal} mb={12}>
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ background: '#1A2535', borderRadius: 4, height: 24, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${s.timeAllocation.defend}%`, background: C.upnd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                        {s.timeAllocation.defend}%
                      </div>
                      <div style={{ width: `${s.timeAllocation.contest}%`, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#000' }}>
                        {s.timeAllocation.contest}%
                      </div>
                      <div style={{ width: `${s.timeAllocation.concede}%`, background: C.pf, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                        {s.timeAllocation.concede}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                      {[['DEFEND', C.upnd], ['CONTEST', C.gold], ['CONCEDE', C.pf]].map(([l, c]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                          <span style={{ fontSize: 9, color: C.muted }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Top actions */}
                <Card title="TOP 3 STRATEGIC ACTIONS" accent={C.gold} mb={12}>
                  {s.topThreeActions.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '10px', background: C.card2, borderRadius: 6 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: C.gold, lineHeight: 1 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{a}</span>
                    </div>
                  ))}
                </Card>

                {/* Pivot message + biggest risk */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Card title="PIVOT MESSAGE" accent={C.teal}>
                    <div style={{ padding: '8px 0', fontStyle: 'italic', fontSize: 13, color: C.text, lineHeight: 1.6, borderLeft: `3px solid ${C.teal}`, paddingLeft: 12 }}>
                      "{s.pivotMessage}"
                    </div>
                  </Card>
                  <Card title="BIGGEST RISK" accent={C.pf}>
                    <div style={{ padding: '8px 0', fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                      ⚠️ {s.biggestRisk}
                    </div>
                  </Card>
                </div>

                <InsightBox text={s.keyInsight} color={C.teal} />
              </div>
            )
          })()}

          {/* ── SENTINEX panel ── */}
          {!isLoading && activeAgent === 'sentinex' && r.sentinex && (() => {
            const sx = r.sentinex!
            const levelOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }
            const sorted = [...sx.risks].sort((a, b) => (levelOrder[b.level as keyof typeof levelOrder] ?? 0) - (levelOrder[a.level as keyof typeof levelOrder] ?? 0))
            return (
              <div>
                <SectionHeader icon="🛡️" title="SENTINEX" subtitle="Electoral Risk Monitor · Integrity Tracker" color={C.pf} />

                {/* Overall risk */}
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, marginBottom: 16 }}>
                  <Card title="OVERALL RISK" accent={C.pf}>
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: sx.overallRisk === 'HIGH' ? C.pf : sx.overallRisk === 'MEDIUM' ? C.warn : C.teal }}>
                        {sx.overallRisk}
                      </div>
                      <div style={{ fontSize: 36, fontWeight: 800, color: C.text, margin: '8px 0' }}>{sx.overallScore}<span style={{ fontSize: 14, color: C.muted }}>/100</span></div>
                      <div style={{ fontSize: 10, color: C.muted }}>INTEGRITY SCORE</div>
                      <GaugeBar pct={sx.overallScore} color={sx.overallScore > 70 ? C.teal : sx.overallScore > 50 ? C.warn : C.pf} label="" />
                    </div>
                  </Card>
                  <Card title="ALERT PROVINCE + WATCH LIST" accent={C.warn}>
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>HIGHEST RISK PROVINCE</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.warn }}>{sx.alertProvince}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>ACTIVE WATCH LIST</div>
                        {sx.watchList.map((w, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                            <span style={{ color: C.pf }}>◆</span>
                            <span style={{ fontSize: 11, color: C.muted }}>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Risk matrix */}
                <Card title="RISK MATRIX — 6 CATEGORIES" accent={C.pf} mb={12}>
                  <div style={{ display: 'grid', gap: 8, padding: '8px 0' }}>
                    {sorted.map((risk, i) => (
                      <div key={i} style={{
                        background: C.card2, borderRadius: 6, padding: 12,
                        borderLeft: `3px solid ${risk.level === 'HIGH' || risk.level === 'CRITICAL' ? C.pf : risk.level === 'MEDIUM' ? C.warn : C.teal}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <RiskBadge level={risk.level} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{risk.category}</span>
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{risk.detail}</div>
                        <div style={{ fontSize: 11, color: C.teal }}>Mitigation: {risk.mitigation}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <InsightBox text={sx.keyInsight} color={C.pf} />
              </div>
            )
          })()}

          {/* ── ECONOMIST panel ── */}
          {!isLoading && activeAgent === 'economist' && r.economist && (() => {
            const ec = r.economist!
            return (
              <div>
                <SectionHeader icon="📊" title="ECONOMIST" subtitle="Economic Indicator Vote Impact · Live ZamStats Verified" color={C.blue} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'ECONOMIC PRESSURE', val: ec.overallEconomicPressure, color: ec.overallEconomicPressure === 'HIGH' ? C.pf : C.warn },
                    { label: 'NET VOTE DRAG', val: `${ec.netEconomicDrag > 0 ? '+' : ''}${ec.netEconomicDrag.toFixed(1)}pt`, color: ec.netEconomicDrag < 0 ? C.pf : C.teal },
                    { label: 'ADJUSTED UPND', val: `${ec.adjustedUPND.toFixed(1)}%`, color: ec.adjustedUPND > 50 ? C.teal : C.warn },
                  ].map(s => (
                    <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                <Card title="INDICATOR IMPACT MATRIX" accent={C.blue} mb={12}>
                  <div style={{ padding: '8px 0' }}>
                    {ec.indicators.map((ind, i) => (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '150px 100px 80px 1fr 80px',
                        gap: 10, alignItems: 'center', padding: '8px 0',
                        borderBottom: i < ec.indicators.length - 1 ? `1px solid ${C.border}` : 'none',
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{ind.name}</span>
                        <span style={{ fontSize: 11, color: C.muted }}>{ind.value}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: ind.direction === 'DRAG' ? C.pf : C.teal }}>
                          {ind.direction === 'DRAG' ? '▼' : '▲'} {Math.abs(ind.voteImpact).toFixed(1)}pt
                        </span>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {ind.affectedProvinces.map(p => (
                            <span key={p} style={{ fontSize: 9, background: C.card2, borderRadius: 3, padding: '2px 5px', color: C.muted }}>{p}</span>
                          ))}
                        </div>
                        <span style={{
                          fontSize: 9, padding: '2px 6px', borderRadius: 4, textAlign: 'center', fontWeight: 700,
                          background: ind.direction === 'DRAG' ? C.pf + '22' : C.teal + '22',
                          color: ind.direction === 'DRAG' ? C.pf : C.teal,
                        }}>
                          {ind.direction}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="FASTEST ECONOMIC RELIEF ACTION" accent={C.teal} mb={12}>
                  <div style={{ padding: '8px 0', fontSize: 12, color: C.text, lineHeight: 1.7 }}>
                    💡 {ec.relief}
                  </div>
                </Card>

                <InsightBox text={ec.keyInsight} color={C.blue} />
              </div>
            )
          })()}

          {/* ── COALITION panel ── */}
          {!isLoading && activeAgent === 'coalition' && r.coalition && (() => {
            const co = r.coalition!
            return (
              <div>
                <SectionHeader icon="🤝" title="COALITION" subtitle="Vote Transfer Mathematics · Alliance Dynamics · Runoff Modelling" color={C.purple} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: '1ST ROUND CALL', val: co.firstRoundCall.replace('_', ' '), color: co.firstRoundCall === 'UPND_WIN' ? C.teal : C.warn },
                    { label: 'RUNOFF: UPND', val: `${co.runoffUPND}%`, color: C.upnd },
                    { label: 'RUNOFF: BM/MZ', val: `${co.runoffBMMZ}%`, color: C.pf },
                  ].map(s => (
                    <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Vote transfer matrix */}
                <Card title="VOTE TRANSFER MATRIX — RUNOFF" accent={C.purple} mb={12}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '8px 0' }}>
                    {[
                      { src: 'KALABA (CF)', toUPND: co.kalabaTransfer.toUPND, toBMMZ: co.kalabaTransfer.toBMMZ },
                      { src: "M'MEMBE (SP)", toUPND: co.membeTransfer.toUPND, toBMMZ: co.membeTransfer.toBMMZ },
                      { src: 'UNDECIDED', toUPND: co.undecidedSplit.toUPND, toBMMZ: co.undecidedSplit.toBMMZ },
                    ].map(tr => (
                      <div key={tr.src} style={{ background: C.card2, borderRadius: 6, padding: 12 }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 10, fontWeight: 700 }}>{tr.src}</div>
                        <GaugeBar pct={tr.toUPND} color={C.upnd} label={`→ UPND ${tr.toUPND}%`} />
                        <GaugeBar pct={tr.toBMMZ} color={C.pf} label={`→ BM/MZ ${tr.toBMMZ}%`} />
                      </div>
                    ))}
                  </div>
                </Card>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <Card title="NORTHERN CONSOLIDATION" accent={C.purple}>
                    <div style={{ padding: '8px 0', fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                      {co.northernConsolidation}
                    </div>
                  </Card>
                  <Card title="MAKEBI EASTERN BONUS" accent={C.pf}>
                    <div style={{ padding: '8px 0', fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                      {co.makebiBonusEastern}
                    </div>
                  </Card>
                </div>

                <Card title="CRITICAL ALLIANCE MOVE" accent={C.gold} mb={12}>
                  <div style={{ padding: '8px 0', fontSize: 12, color: C.text, lineHeight: 1.7, borderLeft: `3px solid ${C.gold}`, paddingLeft: 12 }}>
                    ⚡ {co.criticalAlliance}
                  </div>
                </Card>

                <InsightBox text={co.keyInsight} color={C.purple} />
              </div>
            )
          })()}

          {/* Empty / not run state */}
          {!isLoading && !ran && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 16 }}>
              <div style={{ fontSize: 40 }}>⚡</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.gold }}>WAR ROOM READY</div>
              <div style={{ fontSize: 12, color: C.muted }}>Click RUN ALL AGENTS to deploy all 5 intelligence agents</div>
            </div>
          )}
        </div>

        {/* ── Right panel — scenario 3×3 matrix ── */}
        <div style={{
          width: 240, background: C.card, borderLeft: `1px solid ${C.border}`,
          overflowY: 'auto', padding: 14, flexShrink: 0,
        }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>
            SCENARIO MATRIX
          </div>

          {/* Scenario bars */}
          {D.scenarios.map(sc => (
            <div key={sc.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: C.text, fontWeight: 600 }}>{sc.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: sc.color }}>{sc.value}%</span>
              </div>
              <div style={{ background: '#1A2535', borderRadius: 3, height: 5 }}>
                <div style={{ width: `${sc.value}%`, background: sc.color, borderRadius: 3, height: 5 }} />
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>{sc.desc.slice(0, 60)}…</div>
              {/* Threshold line indicator */}
              <div style={{ position: 'relative', height: 12, marginTop: 2 }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, height: 12, width: 1, background: '#334', }}></div>
                <div style={{ position: 'absolute', left: 'calc(50% + 2px)', top: 2, fontSize: 8, color: '#334' }}>50%</div>
              </div>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>LIVE INDICATORS</div>

            {/* Breaking news widget */}
            <div style={{ background: C.card2, borderRadius: 6, padding: 10, marginBottom: 8, borderLeft: `2px solid ${C.pf}` }}>
              <div style={{ fontSize: 8, color: C.pf, letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>BREAKING · 29 MAY</div>
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
                Xavier Chungu (LDP) interrogated by Zambia Police under State Security Act. Candidacy status unclear.
              </div>
            </div>

            <div style={{ background: C.card2, borderRadius: 6, padding: 10, marginBottom: 8, borderLeft: `2px solid ${C.warn}` }}>
              <div style={{ fontSize: 8, color: C.warn, letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>BISHOPS COUNCIL</div>
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
                Formal warning to UPND over political violence and harassment of independent candidates.
              </div>
            </div>

            <div style={{ background: C.card2, borderRadius: 6, padding: 10, marginBottom: 8, borderLeft: `2px solid ${C.teal}` }}>
              <div style={{ fontSize: 8, color: C.teal, letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>KWACHA RALLY</div>
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
                K19.87/USD — ~10% stronger since Dec 2025. Bloomberg's top-performing currency. Copper $13,090/t.
              </div>
            </div>

            <div style={{ background: C.card2, borderRadius: 6, padding: 10, borderLeft: `2px solid ${C.teal}` }}>
              <div style={{ fontSize: 8, color: C.teal, letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>INFLATION EASES</div>
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
                6.6% May 2026 — lowest since Feb 2018. Mealie meal K289/25kg (↓ from K344 last year).
              </div>
            </div>
          </div>

          {/* Party lens summary */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 12 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>
              {partyLens === 'UPND' ? 'UPND STRATEGIC VIEW' : partyLens === 'BM_MZ' ? 'BM/MZ STRATEGIC VIEW' : 'NEUTRAL ANALYST VIEW'}
            </div>
            {partyLens === 'UPND' && (
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
                Priority: Convert Copperbelt/Lusaka undecideds. Lock Southern/Western. Time allocation 65% battleground.
              </div>
            )}
            {partyLens === 'BM_MZ' && (
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
                Priority: Full Northern/Luapula/Muchinga/Eastern consolidation. Force runoff. Kalaba CF endorsement critical.
              </div>
            )}
            {partyLens === 'NEUTRAL' && (
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
                HH is the clear front-runner at 55%+. Runoff is the opposition's only realistic path. Copperbelt is the swing province.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helper sub-components ─────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, color }: { icon: string; title: string; subtitle: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${color}33` }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 18, fontWeight: 900, color, letterSpacing: 1 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#7A8FA6' }}>{subtitle}</div>
      </div>
    </div>
  )
}

function Card({ title, accent, children, mb = 0 }: { title: string; accent: string; children: React.ReactNode; mb?: number }) {
  return (
    <div style={{
      background: '#0E1724', border: `1px solid #1C2A3A`,
      borderTop: `2px solid ${accent}`, borderRadius: 8, padding: 16, marginBottom: mb,
    }}>
      <div style={{ fontSize: 9, color: accent, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function InsightBox({ text, color }: { text: string; color: string }) {
  return (
    <div style={{
      background: color + '11', border: `1px solid ${color}33`,
      borderRadius: 8, padding: '12px 16px', marginTop: 12, marginBottom: 12,
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 16 }}>💡</span>
      <span style={{ fontSize: 12, color: color, lineHeight: 1.6, fontStyle: 'italic' }}>{text}</span>
    </div>
  )
}
