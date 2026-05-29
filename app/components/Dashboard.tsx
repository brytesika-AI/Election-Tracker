'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { ELECTION_DATA, JudgeVerdict } from '@/app/lib/data'
import ZambiaMap from '@/app/components/ZambiaMap'
import ScenarioHub from '@/app/components/ScenarioHub'

// ── Palette ──────────────────────────────────────────────
const C = {
  zg: '#198A00', zr: '#CC0000', zo: '#E07B00', zbk: '#0A0A0A',
  upnd: '#FF6B00', pf: '#CC0000', ndc: '#0077E6', dp: '#27AE60', sp: '#E74C3C',
  bg: '#060C14', card: '#0E1724', card2: '#121C2C', line: '#1C2A3A',
  text: '#E2E8F0', muted: '#7A8FA6', gold: '#F5C400',
  teal: '#00C9A7', warn: '#FF3B30',
}

const VICTORIA_FALLS_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/5/50/Zambia_Victoria_Falls.jpg'
const ZAMBIA_EAGLE_IMAGE = 'https://commons.wikimedia.org/wiki/Special:FilePath/African%20fish%20eagle%2C%20South%20Luangwa%20National%20Park%20%2851871517311%29.jpg?width=640'

type FbLeaderSentiment = {
  leaderId: string; leaderName: string; fbPage: string; sampleCount: number
  postsCount: number; commentsCount: number; liveData: boolean
  analysis: { sentiment: 'positive' | 'negative' | 'neutral'; score: number; summary: string; topThemes: string[]; devilsAdvocate?: string; strategicCounter?: string }
  source: string; mcpLayer: string; mode: string; timestamp: string
}

type SocialSentiment = {
  candidateId: string; candidateName: string; platform: string; sampleCount: number
  liveData: boolean; dataSource: string
  analysis: { sentiment: 'positive' | 'negative' | 'neutral'; score: number; summary: string; topThemes: string[]; devilsAdvocate?: string; strategicCounter?: string; youthGrievance?: string }
  mode: string; timestamp: string
}

type NlpHeadline = {
  headline: string; source: string; url: string; timestamp: string
  sentiment_score: number; sentiment_class: 'positive' | 'negative' | 'neutral'; score_display: number
}

type NlpResult = {
  results: NlpHeadline[]
  summary: { total: number; positive: number; negative: number; neutral: number; avgCompound: number; avgDisplayScore: number; overallSentiment: string }
  engine: string; lexiconSize: number; processedAt: string
}

// ── Zambia Fish Eagle SVG ─────────────────────────────────
function ZambiaEagle({ size = 44 }: { size?: number }) {
  return (
    <img
      src={ZAMBIA_EAGLE_IMAGE}
      alt="African fish eagle in South Luangwa National Park"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        objectPosition: 'center 36%',
        border: `2px solid ${C.gold}`,
        boxShadow: '0 8px 22px rgba(0,0,0,.38)',
        background: '#06120B',
      }}
    />
  )
}

// ── Zambia Flag strip ─────────────────────────────────────
function ZambiaFlag({ size = 40 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', width: size * 1.5, height: size, borderRadius: 3, overflow: 'hidden', border: '1px solid #1C2A3A', flexShrink: 0 }}>
      <div style={{ flex: 3, background: '#198A00' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, background: '#0A0A0A' }} />
        <div style={{ flex: 1, background: '#CC0000' }} />
        <div style={{ flex: 1, background: '#E07B00' }} />
      </div>
    </div>
  )
}

// ── Countdown ────────────────────────────────────────────
function useCountdown(targetDate: string) {
  const [diff, setDiff] = useState({ days: 0, hours: 0, minutes: 0 })
  useEffect(() => {
    const calc = () => {
      const ms = new Date(targetDate).getTime() - Date.now()
      if (ms <= 0) return
      setDiff({ days: Math.floor(ms / 86400000), hours: Math.floor((ms % 86400000) / 3600000), minutes: Math.floor((ms % 3600000) / 60000) })
    }
    calc(); const id = setInterval(calc, 60000); return () => clearInterval(id)
  }, [targetDate])
  return diff
}

// ── KPI Card ─────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, borderColor }: { label: string; value: string; sub: string; trend?: string; borderColor: string }) {
  return (
    <div className="card-hover rounded-lg p-4 text-center" style={{ background: C.card2, border: `2px solid ${borderColor}` }}>
      <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: borderColor, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
      {trend && <div style={{ fontSize: 11, fontWeight: 700, color: borderColor, marginTop: 5 }}>{trend}</div>}
    </div>
  )
}

// ── Party Badge ──────────────────────────────────────────
function PartyBadge({ party, color }: { party: string; color: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 9, fontWeight: 800, fontFamily: 'monospace', background: `${color}22`, color, border: `1px solid ${color}` }}>
      {party}
    </span>
  )
}

// ── Quoted Post ───────────────────────────────────────────
function QuotedPost({ text, src, color }: { text: string; src: string; color: string }) {
  return (
    <div style={{ background: `${color}08`, border: `1px solid ${color}22`, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: C.text, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 6 }}>&ldquo;{text}&rdquo;</div>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>— {src}</div>
    </div>
  )
}

// ── Figure Card ──────────────────────────────────────────
function CandidatePhoto({ photo, shortName, color, size = 80 }: { photo?: string; shortName: string; color: string; size?: number }) {
  const [imgError, setImgError] = useState(false)
  if (photo && !imgError) {
    return (
      <img
        src={photo}
        alt={shortName}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `3px solid ${color}`, display: 'block', margin: '0 auto' }}
      />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: `3px solid ${color}`, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: size * 0.28, fontWeight: 900, color }}>
      {shortName}
    </div>
  )
}

function FigureCard({ f, rank, showQuotes }: { f: typeof ELECTION_DATA.figures[0]; rank: number; showQuotes: boolean }) {
  const aiColor = f.aiScore >= 60 ? C.teal : f.aiScore >= 30 ? C.gold : C.warn
  return (
    <div className="card-hover rounded-xl" style={{ background: C.card, border: `2px solid ${f.color}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Coloured top bar */}
      <div style={{ height: 5, background: f.color, width: '100%' }} />

      <div style={{ padding: '16px 16px 12px' }}>
        {rank === 1 && (
          <div style={{ position: 'absolute', top: 14, right: 12, background: C.zg, color: 'white', fontSize: 9, fontFamily: 'monospace', fontWeight: 800, padding: '3px 10px', borderRadius: 10 }}>INCUMBENT</div>
        )}

        {/* Photo */}
        <div style={{ marginBottom: 12 }}>
          <CandidatePhoto photo={('photo' in f ? (f as {photo?: string}).photo : undefined)} shortName={f.shortName} color={f.color} size={80} />
        </div>

        <div style={{ fontWeight: 800, fontSize: 15, color: f.color, textAlign: 'center', marginBottom: 5 }}>{f.name}</div>
        <div style={{ textAlign: 'center', marginBottom: 6 }}><PartyBadge party={f.party} color={f.color} /></div>
        <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 1.4, marginBottom: 12 }}>{f.role}</div>
        {f.id === 'pf_ndc' && (
          <div style={{ background: `${f.color}14`, border: `1px solid ${f.color}44`, borderRadius: 6, padding: '7px 9px', marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: f.color, fontFamily: 'monospace', fontWeight: 900, marginBottom: 3 }}>TICKET STRUCTURE</div>
            <div style={{ fontSize: 11, color: C.text, lineHeight: 1.45 }}>Candidate: Brian Mundubile · Running-mate/cooperation lane: Makebi Zulu</div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>Verify final ECZ nomination filing</div>
          </div>
        )}

        {/* Poll bar */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 4 }}>
            <span>Model Estimate</span>
            <span style={{ fontWeight: 800, color: f.color, fontSize: 14 }}>{f.poll.toFixed(1)}%</span>
          </div>
          <div style={{ background: C.line, borderRadius: 4, height: 10, position: 'relative', overflow: 'hidden' }}>
            <div className="bar-fill" style={{ width: `${(f.poll / 65) * 100}%`, height: '100%', background: f.color, opacity: 0.9 }} />
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: f.trend >= 0 ? C.teal : C.warn, textAlign: 'center', marginBottom: 12 }}>
          {f.trend >= 0 ? '▲' : '▼'} {f.trend >= 0 ? '+' : ''}{f.trend.toFixed(1)} pts/month trend
        </div>

        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7, marginBottom: 10 }}>
          <div>📍 <span style={{ color: C.teal }}>{f.stronghold}</span></div>
          <div>⚠ <span style={{ color: C.warn }}>{f.weakness}</span></div>
        </div>

        {/* Scenario strength */}
        <div style={{ background: `${C.card2}`, borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>Scenario Strength</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: aiColor }}>{f.aiScore}%</span>
          </div>
          <div style={{ background: C.line, borderRadius: 3, height: 8, overflow: 'hidden' }}>
            <div className="bar-fill" style={{ width: `${f.aiScore}%`, height: '100%', background: aiColor }} />
          </div>
        </div>

        {/* AI Narrative */}
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, borderTop: `1px solid ${C.line}`, paddingTop: 10, marginBottom: showQuotes ? 12 : 0, fontStyle: 'italic' }}>
          {f.narrative}
        </div>

        {/* Quoted social posts */}
        {showQuotes && f.quotedPosts && (
          <div>
            <div style={{ fontSize: 10, color: C.gold, fontFamily: 'monospace', fontWeight: 700, marginBottom: 8 }}>💬 PUBLIC POSTS SAMPLE</div>
            {f.quotedPosts.map((p, i) => <QuotedPost key={i} text={p.text} src={p.src} color={f.color} />)}
          </div>
        )}

        <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', marginTop: 10 }}>{f.socialHandle}</div>
      </div>
    </div>
  )
}

// ── Judge Card ────────────────────────────────────────────
function JudgeCard({ v, loading }: { v: JudgeVerdict | null; loading: boolean }) {
  const verdictColor = v?.verdict === 'VALIDATED' ? C.teal : v?.verdict === 'CAUTION' ? C.gold : C.warn
  return (
    <div className="card-hover rounded-xl p-4" style={{ background: C.card, border: `2px solid ${verdictColor || C.line}` }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div className="spin" style={{ width: 32, height: 32, margin: '0 auto 12px', borderRadius: '50%', border: `3px solid ${C.line}`, borderTopColor: C.zg }} />
          <div style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace' }}>AI ANALYSIS IN PROGRESS...</div>
        </div>
      ) : v ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${verdictColor}20`, border: `2px solid ${verdictColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {v.judgeId === 'data' ? '🔬' : v.judgeId === 'strategy' ? '🎯' : '📡'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: verdictColor, fontFamily: 'monospace' }}>{v.judgeName}</div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {v.judgeId === 'data' ? 'Data Integrity Validator' : v.judgeId === 'strategy' ? 'Campaign Strategy Evaluator' : 'Sentiment Verification Agent'}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <span style={{ padding: '4px 16px', borderRadius: 12, fontSize: 11, fontWeight: 900, fontFamily: 'monospace', background: `${verdictColor}22`, color: verdictColor, border: `1px solid ${verdictColor}` }}>{v.verdict}</span>
            <span style={{ fontSize: 11, color: C.muted, marginLeft: 10 }}>{v.confidence}% confidence</span>
          </div>
          <div style={{ background: C.line, borderRadius: 2, height: 6, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ width: `${v.confidence}%`, height: '100%', background: verdictColor, transition: 'width 1s' }} />
          </div>
          <p style={{ fontSize: 12, color: C.text, lineHeight: 1.65, marginBottom: 12, opacity: 0.9 }}>{v.summary}</p>
          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
            {v.findings.map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: C.muted, lineHeight: 1.9, paddingLeft: 14, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: verdictColor }}>▸</span>{f}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 10, fontFamily: 'monospace' }}>{new Date(v.timestamp).toLocaleString()}</div>
        </>
      ) : null}
    </div>
  )
}

// ── Section Label ─────────────────────────────────────────
function SectionLabel({ layer, title, sub }: { layer: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 14, marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ width: 4, height: 22, background: C.gold, borderRadius: 2, flexShrink: 0 }} />
        <div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: C.gold, letterSpacing: 1 }}>{layer}</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: C.text, marginLeft: 10 }}>{title}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginLeft: 14 }}>{sub}</div>
    </div>
  )
}

// ── Chart Card ────────────────────────────────────────────
function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px' }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>{sub}</div>
      {children}
    </div>
  )
}

// ── MCPBadge ──────────────────────────────────────────────
function McpBadge({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, background: `${color}12`, border: `1px solid ${color}40` }}>
      <div className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 8, fontFamily: 'monospace', color, fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 8, fontFamily: 'monospace', color: C.muted }}>{status}</span>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────
export default function Dashboard() {
  const [verdicts, setVerdicts]       = useState<JudgeVerdict[]>([])
  const [judgeLoading, setJudgeLoading] = useState(false)
  const [judgeMode, setJudgeMode]     = useState<'idle' | 'demo' | 'ai'>('idle')
  const [fbSentiment, setFbSentiment]       = useState<FbLeaderSentiment[]>([])
  const [fbLoading, setFbLoading]           = useState(false)
  const [twSentiment, setTwSentiment]       = useState<SocialSentiment[]>([])
  const [twLoading, setTwLoading]           = useState(false)
  const [ttSentiment, setTtSentiment]       = useState<SocialSentiment[]>([])
  const [ttLoading, setTtLoading]           = useState(false)
  const [refreshing, setRefreshing]         = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => new Date())
  const [mode, setMode]               = useState<'daily' | 'weekly'>('weekly')
  const [showQuotes, setShowQuotes]   = useState(false)
  const [activeLens, setActiveLens] = useState<'energy' | 'cost' | 'youth' | 'copperbelt' | 'opposition'>('energy')
  const [projectionMode, setProjectionMode] = useState<'intel' | 'electiondesk' | 'fusion'>('electiondesk')
  const [airtableStatus, setAirtableStatus] = useState('LIVE')
  const [vercelStatus, setVercelStatus]     = useState('LIVE')
  const [nlpData, setNlpData]               = useState<NlpResult | null>(null)
  const [nlpLoading, setNlpLoading]         = useState(false)
  const [activeCandidateId, setActiveCandidateId] = useState('hh')
  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'provinces' | 'strategy' | 'model' | 'history' | 'integrity' | 'warroom'>('overview')
  const countdown = useCountdown(ELECTION_DATA.electionDate)

  const fetchNlpSentiment = useCallback(async () => {
    setNlpLoading(true)
    try {
      const res = await fetch('/api/nlp-sentiment')
      const json = await res.json()
      setNlpData(json)
    } catch { /* keep existing */ } finally { setNlpLoading(false) }
  }, [])

  const fetchFbSentiment = useCallback(async () => {
    setFbLoading(true)
    try {
      const res = await fetch('/api/facebook-sentiment')
      const json = await res.json()
      setFbSentiment(json.results ?? [])
    } catch { /* keep existing */ } finally { setFbLoading(false) }
  }, [])

  const fetchTwSentiment = useCallback(async () => {
    setTwLoading(true)
    try {
      const res = await fetch('/api/twitter-sentiment')
      const json = await res.json()
      setTwSentiment(json.results ?? [])
    } catch { /* keep existing */ } finally { setTwLoading(false) }
  }, [])

  const fetchTtSentiment = useCallback(async () => {
    setTtLoading(true)
    try {
      const res = await fetch('/api/tiktok-sentiment')
      const json = await res.json()
      setTtSentiment(json.results ?? [])
    } catch { /* keep existing */ } finally { setTtLoading(false) }
  }, [])

  const callJudges = useCallback(async () => {
    setJudgeLoading(true); setVerdicts([])
    try {
      const res = await fetch('/api/ai-judges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const json = await res.json()
      setVerdicts(json.verdicts ?? [])
      setJudgeMode(json.mode === 'ai' ? 'ai' : 'demo')
    } catch { setJudgeMode('demo') } finally { setJudgeLoading(false) }
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchFbSentiment(), fetchTwSentiment(), fetchTtSentiment(), fetchNlpSentiment()])
    setLastUpdated(new Date()); setRefreshing(false)
  }, [fetchFbSentiment, fetchTwSentiment, fetchTtSentiment, fetchNlpSentiment])

  useEffect(() => {
    const id = window.setTimeout(() => {
      fetchFbSentiment()
      fetchTwSentiment()
      fetchTtSentiment()
      fetchNlpSentiment()
      // Check Vercel health
      fetch('/api/vercel-health').then(r => r.json()).then(d => setVercelStatus(d.status)).catch(() => {})
      // Check Airtable
      fetch('/api/airtable-data').then(r => r.json()).then(d => setAirtableStatus(d.source === 'airtable' ? 'SYNCED' : 'STATIC')).catch(() => {})
    }, 0)
    return () => window.clearTimeout(id)
  }, [fetchFbSentiment, fetchNlpSentiment, fetchTtSentiment, fetchTwSentiment])

  // ── Chart data ──────────────────────────────────────────
  const projFrom = ELECTION_DATA.projectedFromIndex ?? 18
  const timelineData = ELECTION_DATA.months.map((m, i) => ({
    month: m,
    'HH (UPND)':       ELECTION_DATA.upndTrend[i],
    'Mundubile + Makebi': ELECTION_DATA.allianceTrend[i],
    'Kalaba (CF)':       ELECTION_DATA.kalabaTrend[i],
    "M'membe (SP)":    ELECTION_DATA.membeTrend[i],
    projected: i >= projFrom,
  }))

  const pollData = [
    ...ELECTION_DATA.figures.map(f => ({ name: `${f.shortName} (${f.party.split(' ')[0]})`, value: f.poll, color: f.color })),
    { name: 'Undecided/Other',   value: ELECTION_DATA.nationalPoll.others_undecided, color: C.muted},
  ]

  const platData = ELECTION_DATA.platforms.map((p, i) => ({
    platform: p,
    Positive: ELECTION_DATA.platPositive[i],
    Negative: ELECTION_DATA.platNegative[i],
    Neutral:  ELECTION_DATA.platNeutral[i],
  }))

  const issueData = ELECTION_DATA.issues.map(is => ({
    issue: is.label.length > 12 ? is.label.substring(0, 12) : is.label,
    UPND: is.upnd, PF: is.pf,
  }))

  const simData = ELECTION_DATA.scenarios.map(s => ({ label: s.label, 'Vote %': s.value, color: s.color, desc: s.desc }))
  const firstRoundGap = Math.max(0, ELECTION_DATA.presidentialThreshold - ELECTION_DATA.nationalPoll.upnd)
  const runoffRisk = ELECTION_DATA.nationalPoll.upnd > ELECTION_DATA.presidentialThreshold ? 'LOW' : 'HIGH'
  const provData = ELECTION_DATA.provinces.map(p => ({
    name: p.name, 'Voters (K)': Math.round(p.voters / 1000),
    color: p.lean === 'UPND' ? C.upnd : p.lean === 'PF' ? C.pf : C.gold,
  }))
  const sortedFigures = [...ELECTION_DATA.figures].sort((a, b) => b.poll - a.poll)
  const leader = sortedFigures[0]
  const runnerUp = sortedFigures[1]
  const nationalAccounted = ELECTION_DATA.figures.reduce((sum, f) => sum + f.poll, 0)
  const outrightStatus = leader.poll > ELECTION_DATA.presidentialThreshold
    ? `${leader.shortName} above first-round gate`
    : 'No outright winner yet'
  const runoffData = [
    { name: leader.shortName, value: leader.poll, color: leader.color, note: `${firstRoundGap.toFixed(1)} pts short of 50%+1` },
    { name: runnerUp.shortName, value: runnerUp.poll, color: runnerUp.color, note: `${(leader.poll - runnerUp.poll).toFixed(1)} pts behind leader` },
    { name: 'All others', value: Math.max(0, nationalAccounted - leader.poll - runnerUp.poll), color: C.gold, note: 'Minor candidates and issue lanes' },
    { name: 'Undecided', value: ELECTION_DATA.nationalPoll.others_undecided, color: C.muted, note: 'Available pool before first round' },
  ]
  const lowerStripItems = [
    { label: 'Leader', value: `${leader.shortName} ${leader.poll.toFixed(1)}%`, color: leader.color },
    { label: 'Next', value: `${runnerUp.shortName} ${runnerUp.poll.toFixed(1)}%`, color: runnerUp.color },
    { label: '50%+1 gap', value: `${firstRoundGap.toFixed(1)} pts`, color: C.warn },
    { label: 'Undecided', value: `${ELECTION_DATA.nationalPoll.others_undecided.toFixed(1)}%`, color: C.gold },
    { label: 'Call', value: runoffRisk === 'HIGH' ? 'Rerun risk' : 'First-round path', color: runoffRisk === 'HIGH' ? C.warn : C.teal },
  ]
  // ── Historical elections chart data ──
  const historicalChartData = ELECTION_DATA.historicalElections.map(e => ({
    year: String(e.year) + (e.type === 'BY-ELECTION' ? '*' : ''),
    winner: e.winnerPct,
    runnerUp: e.runnerUpPct,
    turnout: e.turnout,
    winnerParty: e.winnerParty,
    runnerUpParty: e.runnerUpParty,
    context: e.context,
  }))

  // ── 20-factor scores data ──
  const factorScoreData = ELECTION_DATA.electionFactors.map(f => ({
    label: f.label.length > 22 ? f.label.substring(0, 22) + '…' : f.label,
    UPND: f.upndAdvantage,
    Opposition: f.oppositionAdvantage,
    riskFlag: f.riskFlag,
    weight: f.weight,
    trend: f.trend,
  }))

  // ── Runoff scenario data ──
  const runoffScenarioData = ELECTION_DATA.runoffProbability.scenarioMatrix.map(s => ({
    scenario: s.scenario.length > 26 ? s.scenario.substring(0, 26) + '…' : s.scenario,
    'Win Prob %': s.firstRoundWin,
    'Vote Share': s.upndShare,
    note: s.note,
  }))

  // ── Institutional trust data ──
  const trustData = Object.values(ELECTION_DATA.institutionalTrust).map(t => ({
    institution: t.label,
    score: t.score,
    trend: t.trend,
    color: t.score >= 65 ? C.teal : t.score >= 50 ? C.gold : C.warn,
  }))

  const dashboardTabs = [
    { id: 'overview' as const, label: 'Overview', note: 'Race, call and map' },
    { id: 'provinces' as const, label: 'Provinces', note: 'Popularity and mood' },
    { id: 'strategy' as const, label: 'Strategy', note: 'Tickets and scenarios' },
    { id: 'history' as const, label: 'History & Risk', note: 'Elections 1991–2026 · 20 factors' },
    { id: 'integrity' as const, label: 'Integrity', note: 'Runoff engine · Institutions · Agriculture · Mining' },
    { id: 'warroom' as const, label: '⚡ WAR ROOM', note: '5-agent AI scenario hub' },
    { id: 'model' as const, label: 'Model Notes', note: 'Sources and validation' },
  ]
  const mundubileTicket = ELECTION_DATA.figures.find(f => f.id === 'pf_ndc')
  const ticketReadout = [
    { label: 'Candidate', value: 'Brian Mundubile', note: 'Northern/PF-linked machinery and Tonse visibility' },
    { label: 'Running mate / cooperation', value: 'Makebi Zulu', note: 'Eastern/Pamodzi transfer potential; verify final ECZ filing' },
    { label: 'Model status', value: 'Combined opposition lane', note: 'The dashboard models them together because their strategic value is vote consolidation' },
  ]
  const provincePopularity = ELECTION_DATA.provinces.map((p) => {
    const kalaba = Math.max(1, Math.min(8, p.name === 'Luapula' ? 7 : p.name === 'Eastern' ? 5 : Math.round(ELECTION_DATA.nationalPoll.kalaba_cf)))
    const membe = Math.max(2, Math.min(9, ['Copperbelt', 'Lusaka'].includes(p.name) ? 6 : Math.round(ELECTION_DATA.nationalPoll.membe_sp)))
    const kateka = Math.max(1, Math.min(3, ['Lusaka', 'Central'].includes(p.name) ? 2 : 1))
    const allocated = p.upnd + p.pf + kalaba + membe + kateka
    return {
      ...p,
      hh: p.upnd,
      mundubile: p.pf,
      kalaba,
      membe,
      kateka,
      undecided: Math.max(0, 100 - allocated),
      mood: p.lean === 'UPND' ? 'Government advantage' : p.lean === 'PF' ? 'Opposition pressure' : 'Competitive / persuadable',
      sentiment: p.lean === 'UPND' ? 58 : p.lean === 'PF' ? 44 : 50,
    }
  })
  const strongholdSplit = [
    { label: 'UPND anchors', provinces: 'Southern, Western, North-Western, Central', value: 4, color: C.upnd },
    { label: 'Opposition anchors', provinces: 'Northern, Luapula, Muchinga, Eastern', value: 4, color: C.pf },
    { label: 'True battleground', provinces: 'Lusaka and Copperbelt', value: 2, color: C.gold },
  ]
  const sentimentByProvince = provincePopularity.map(p => ({
    name: p.name,
    score: p.sentiment,
    mood: p.mood,
    color: p.sentiment >= 55 ? C.teal : p.sentiment <= 45 ? C.warn : C.gold,
  }))
  const publicDecisionStack = [
    { layer: 'State', question: 'What is true now?', answer: 'HH leads, but is below 50%+1; Mundubile-Makebi is the main consolidated opposition lane.', color: C.teal },
    { layer: 'Time', question: 'What is changing?', answer: 'The opposition lane is trending up, while UPND must convert undecided voters before the first-round gate.', color: C.gold },
    { layer: 'Causality', question: 'Why is it moving?', answer: 'Energy, mealie meal, youth jobs, PF structure alignment, and Bemba/Nyanja radio narratives drive movement.', color: C.warn },
    { layer: 'Simulation', question: 'What could happen?', answer: 'Run first-round win vs rerun scenarios under ticket clarity, Copperbelt swing, and undecided allocation.', color: C.ndc },
    { layer: 'Optimization', question: 'What should be done?', answer: 'Prioritize actions that close the 2.8 pt 50%+1 gap or prepare credible runoff-transfer strategy.', color: C.zg },
  ]
  const candidateStrategyPackets = ELECTION_DATA.candidateStrategyPackets.map((packet) => {
    const figure = ELECTION_DATA.figures.find(f => f.id === packet.candidateId)
    const serializedPacket = JSON.stringify([packet.analysis, packet.scenarios, packet.strategy, packet.validation]).toLowerCase()
    const validationRules = [
      { pass: Boolean(packet.schemaVersion), check: 'schemaVersion present', error: 'schemaVersion missing' },
      { pass: Boolean(figure), check: 'candidate mapped to figure registry', error: 'candidateId does not match a tracked candidate' },
      { pass: Number.isFinite(packet.analysis.baselineShare), check: 'baselineShare is numeric', error: 'analysis.baselineShare must be numeric' },
      { pass: Number.isFinite(packet.analysis.thresholdGap) && packet.analysis.thresholdGap >= 0, check: 'thresholdGap is numeric and non-negative', error: 'analysis.thresholdGap must be numeric and non-negative' },
      { pass: packet.scenarios.length >= 3, check: 'scenario plan has three or more cases', error: 'at least three scenarios required' },
      { pass: packet.strategy.length >= 3, check: 'strategy has three or more actions', error: 'at least three strategy actions required' },
      { pass: serializedPacket.includes('50%+1') || serializedPacket.includes('rerun'), check: '50%+1 or rerun rule included', error: '50%+1 or rerun rule must be explicit' },
    ]
    const errors = validationRules.filter(rule => !rule.pass).map(rule => rule.error)
    const passedChecks = validationRules.filter(rule => rule.pass).map(rule => rule.check)

    return {
      ...packet,
      figure,
      validationResult: {
        status: errors.length === 0 ? packet.validation.status : 'invalid',
        passedChecks,
        errors,
        checkedAt: ELECTION_DATA.electionDate,
      },
      displayJson: {
        schemaVersion: packet.schemaVersion,
        candidateId: packet.candidateId,
        candidate: figure ? `${figure.name} (${figure.party})` : 'unmatched',
        analysis: packet.analysis,
        scenarios: packet.scenarios,
        strategy: packet.strategy,
        validationResult: {
          status: errors.length === 0 ? packet.validation.status : 'invalid',
          passedChecks,
          errors,
        },
      },
    }
  })
  const activeCandidatePacket = candidateStrategyPackets.find(packet => packet.candidateId === activeCandidateId) ?? candidateStrategyPackets[0]

  const tooltipStyle = { background: C.card2, border: `1px solid ${C.line}`, borderRadius: 6 }
  const campaignLenses = [
    {
      id: 'energy' as const,
      label: 'Energy',
      score: '+4.2 pts',
      color: C.gold,
      risk: 'Highest irritation driver on Twitter/X and TikTok.',
      action: 'Lead with a visible load-shedding recovery clock, province-by-province power updates, and short videos from repair sites.',
    },
    {
      id: 'cost' as const,
      label: 'Cost of Living',
      score: '+3.8 pts',
      color: C.warn,
      risk: 'Mealie meal, fuel and household pressure still define the kitchen-table mood.',
      action: 'Show price relief in Lusaka, Copperbelt and Northern first. Pair policy claims with shop-floor proof and radio explainers.',
    },
    {
      id: 'youth' as const,
      label: 'Youth',
      score: '+2.6 pts',
      color: C.teal,
      risk: 'Youth unemployment weakens trust even when macro numbers improve.',
      action: 'Run creator-led job, bursary and skills stories on TikTok/X with comments mined daily for counter-messaging.',
    },
    {
      id: 'copperbelt' as const,
      label: 'Copperbelt',
      score: '+3.1 pts',
      color: C.ndc,
      risk: 'Urban Copperbelt is the fastest route to a narrow national swing.',
      action: 'Prioritise mining jobs, contractor payments, market trader costs and Kitwe/Ndola field visibility.',
    },
    {
      id: 'opposition' as const,
      label: 'Opposition Surge',
      score: '-2.3 pts/mo',
      color: C.pf,
      risk: 'Mundubile-Makebi consolidation is the clearest PF-linked northern/eastern opposition lane.',
      action: 'Track candidate/running-mate confirmation, legal vehicle clarity, PF structure movement and Bemba/Nyanja radio share before the trend hardens.',
    },
  ]
  const selectedLens = campaignLenses.find(lens => lens.id === activeLens) ?? campaignLenses[0]
  const projectionModes = [
    {
      id: 'intel' as const,
      label: 'Source Reliability',
      call: 'UPND advantage, contested downside',
      confidence: 68,
      color: C.teal,
      method: 'Structured analytic techniques: key judgments, source reliability grades, red-team alternatives and indicator watchlists.',
      projection: 'HH remains best-positioned, but at 47.2% the model is below Zambia’s more-than-50% first-round threshold, so runoff exposure is real.',
      triggers: ['Mundubile-Makebi ticket clarity', 'Load-shedding sentiment break point', 'Copperbelt urban swing', 'Youth unemployment narratives', 'News spike confirming policy delivery'],
      whitebox: 'Separates official facts from estimates, grades each signal by reliability, and shows which indicators would change the call.',
      caveat: 'Analytic confidence is moderate because social-platform signals are noisy and not a substitute for verified polling.',
    },
    {
      id: 'electiondesk' as const,
      label: 'Projection Gates',
      call: 'Lean UPND',
      confidence: 72,
      color: C.gold,
      method: 'Bayesian projection gates: current lead, province path, undecided pool, turnout assumptions, margin of error and confidence threshold.',
      projection: 'No first-round win call unless UPND clears more than 50% of valid-vote model share. Current status is Lean UPND but runoff-risk, with Copperbelt and Northern/Luapula/Muchinga as the stress tests.',
      triggers: ['UPND above 50% in two consecutive model refreshes', 'UPND 50%+1 path after undecided allocation', 'Mundubile-Makebi below 18%', 'Undecided under 18%', 'Copperbelt margin above +7 UPND'],
      whitebox: 'Shows the legal threshold, province path, undecided assumptions and runoff gate before any candidate is moved from Lean to First-Round Majority.',
      caveat: 'Projection language here is modeled. It is not a media network call and not an ECZ result.',
    },
    {
      id: 'fusion' as const,
      label: 'Fusion Graph',
      call: 'Incumbent path intact',
      confidence: 74,
      color: C.ndc,
      method: 'Fuses voter register, clustered districts, province leans, economy, open intelligence, platform sentiment, issue risk and scenario deltas.',
      projection: 'The graph points to an incumbent lead through Lusaka, Southern, Western and North-Western, but the win condition is not lead size alone: it must clear 50%+1 or plan for a runoff.',
      triggers: ['Province-level anomaly detection', 'Narrative velocity by platform', 'Issue-to-region correlation', 'Reporting-order bias checks', 'News corroboration from ZNBC/News Diggers/The Mast/GDELT'],
      whitebox: 'Links each candidate score to visible evidence nodes: province, issue, platform, turnout, news credibility, threshold gap and missing-data penalty.',
      caveat: 'Fusion output is only as strong as source freshness, labels and missing-data handling.',
    },
  ]
  const selectedProjection = projectionModes.find(mode => mode.id === projectionMode) ?? projectionModes[1]
  const agenticModel = [
    {
      agent: 'Data Scientist Agent',
      method: 'District clustering',
      input: 'ECZ 2016/2021 patterns, province register, constituency history, turnout bands.',
      output: 'JSON output: districtCluster, turnoutBand, confidence and evidenceNodes for every projection update.',
      color: C.ndc,
    },
    {
      agent: 'Pollster Agent',
      method: 'Bayesian polling blend',
      input: 'Afrobarometer-style surveys, local polls, demographic shifts, undecided pool and margin of error.',
      output: 'JSON output: candidateIntervals, undecidedAllocation, marginOfError and pollingCaveats.',
      color: C.gold,
    },
    {
      agent: 'Analyst Agent',
      method: 'Structured red team',
      input: 'Elite dynamics, coalition cohesion, tribal/regional voting patterns, copper prices, load shedding and campaign finance signals.',
      output: 'JSON output: alternativeHypotheses, redTeamRisks, causalDrivers and keyWatchIndicators.',
      color: C.warn,
    },
    {
      agent: 'Real-Time Agent',
      method: 'Reporting-order correction',
      input: 'Live ECZ/result feeds when available, station order, rural/urban lag, radio/community sentiment and anomaly alerts.',
      output: 'JSON output: reportingBias, correctedEstimate, anomalyFlags and resultFlowConfidence.',
      color: C.teal,
    },
  ]
  const whiteboxWeights = [
    { label: 'Official ECZ facts', value: 30, note: 'register, constituency map, certified results flow', color: C.zg },
    { label: 'Historical clusters', value: 20, note: '2016/2021 district behaviour and turnout bands', color: C.ndc },
    { label: 'Polling blend', value: 18, note: 'survey averages, uncertainty, undecided allocation', color: C.gold },
    { label: 'Issue pressure', value: 14, note: 'cost of living, electricity, jobs, copper economy', color: C.warn },
    { label: 'News + open intelligence', value: 10, note: 'ZNBC, News Diggers, The Mast, GDELT, radio and OSINT verification', color: C.teal },
    { label: 'Social velocity', value: 8, note: 'Facebook, X, TikTok directional movement only', color: C.pf },
  ]
  const decisionStack = [
    {
      layer: 'STATE',
      question: 'What is true now?',
      signal: 'ECZ register, province leans, ticket status, issue sentiment, platform narratives, news validation.',
      output: 'State includes the 50%+1 win rule, news validation, and Mundubile-Makebi as a consolidated opposition lane until ECZ filings confirm final ticket.',
      color: C.teal,
    },
    {
      layer: 'TIME',
      question: 'How is it changing?',
      signal: '20-month trend, +2.3 pts/month opposition lane, undecided compression, countdown to nominations.',
      output: 'Watch whether ticket clarity accelerates Northern, Luapula, Muchinga and Eastern movement.',
      color: C.gold,
    },
    {
      layer: 'CAUSALITY',
      question: 'Why is it moving?',
      signal: 'Cost of living, load shedding, PF structure consolidation, youth unemployment and radio narratives.',
      output: 'If Makebi unlocks Eastern/PF-Pamodzi transfer and Mundubile holds northern machinery, UPND margin narrows.',
      color: C.warn,
    },
    {
      layer: 'SIMULATION',
      question: 'What futures are plausible?',
      signal: 'Ticket cohesion, Copperbelt swing, youth turnout, energy recovery, news-cycle shocks and opposition vote leakage.',
      output: 'Run first-round-majority vs runoff scenarios for unified PF-linked ticket, fragmented field, and UPND recovery through energy/cost relief.',
      color: C.ndc,
    },
    {
      layer: 'OPTIMIZATION',
      question: 'What should be done next?',
      signal: 'Impact vs feasibility across regions, platforms and message types.',
      output: 'Prioritize actions that close the 50%+1 gap: verify ticket, map province transfer, target Copperbelt, publish proof points and make news-verifiable delivery visible.',
      color: C.zg,
    },
  ]
  const undecidedConversion = [
    {
      candidate: 'HH / UPND',
      pool: 'Urban cost-of-living undecided',
      path: 'Convert through measurable electricity recovery, mealie meal price proof, and local delivery evidence in Lusaka/Copperbelt.',
      proof: 'Needs +2.8 pts to clear the 50%+1 gate from the current 47.2% baseline.',
      color: C.upnd,
    },
    {
      candidate: 'Mundubile-Makebi',
      pool: 'PF-leaning but uncertain northern/eastern voters',
      path: 'Convert through ticket clarity, alliance discipline, Bemba/Nyanja radio reach, and a credible jobs/cost plan that is not only PF nostalgia.',
      proof: 'Trend is +2.3 pts/month, but formal vehicle/ticket uncertainty caps undecided conversion.',
      color: C.pf,
    },
    {
      candidate: 'Kalaba / CF Orange',
      pool: 'Integrity-first and coalition-minded undecided',
      path: 'Convert by showing a realistic route to influence: coalition terms, Luapula/Eastern organisation, and a visible reform bargain.',
      proof: 'At 3-4%, he matters more as first-round spoiler/runoff-transfer actor than standalone frontrunner.',
      color: C.dp,
    },
    {
      candidate: "M'membe / SP",
      pool: 'Youth and mining-inequality undecided',
      path: 'Convert by translating resource-nationalism into practical Copperbelt jobs, royalties, contractor payments and small-business policy.',
      proof: 'Social velocity is real, but ideological risk limits older/moderate voter transfer.',
      color: C.sp,
    },
  ]
  const classificationRows = [
    { label: 'Lean UPND', why: 'HH leads nationally and has strong Southern/Western/North-Western anchors, but sits below the 50%+1 first-round gate.', evidence: '47.2% baseline, +26.9 pt lead over Mundubile-Makebi, 2.8 pt threshold gap.', color: C.upnd },
    { label: 'Runoff Risk: High', why: 'A lead is not enough in Zambia; the model requires more than 50% of valid votes cast before calling a first-round majority path.', evidence: 'Status quo scenario remains below 50%; undecided/other pool is 24.6%.', color: C.warn },
    { label: 'Mundubile-Makebi Opposition Lane', why: 'Classified as a consolidated lane because PF-linked northern/eastern machinery and Makebi/Pamodzi transfer potential are modelled together until ECZ filings settle.', evidence: '20.3% baseline, +2.3 pts/month trend, Northern/Luapula/Muchinga strength.', color: C.pf },
    { label: 'News Signal', why: 'News is treated as corroboration and event pressure, not polling. Stories must map to issue, province, candidate and threshold impact.', evidence: 'ZNBC, News Diggers, Lusaka Times, The Mast, Zambian Observer, GDELT-style events.', color: C.teal },
  ]

  return (
    <div
      className="zambia-shell"
      style={{
        minHeight: '100vh',
        backgroundImage: `radial-gradient(circle at 14% 8%, rgba(25,138,0,.22), transparent 30%), radial-gradient(circle at 88% 14%, rgba(224,123,0,.18), transparent 32%), linear-gradient(180deg, rgba(6,12,20,.94), rgba(4,9,13,.98)), url(${VICTORIA_FALLS_IMAGE})`,
      }}
    >

      {/* ── HEADER ─────────────────────────────────────── */}
      <header className="zambia-header" style={{ borderBottom: `4px solid ${C.zo}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 64 }}>

          {/* Eagle + Brand */}
          <div style={{ background: 'linear-gradient(135deg,#198A00,#0F5F12)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, boxShadow: 'inset -1px 0 0 rgba(245,196,0,.25)' }}>
            <ZambiaEagle size={48} />
            <div>
              <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: 'white', letterSpacing: 1, lineHeight: 1.2 }}>SENTIMENT</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: 'white', letterSpacing: 1, lineHeight: 1.2 }}>COMMAND</div>
              <div style={{ fontSize: 7, color: '#CCFFCC', fontFamily: 'monospace', letterSpacing: 2, marginTop: 2 }}>ZAMBIA 2026</div>
            </div>
          </div>

          {/* Title */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px', background: 'linear-gradient(90deg, rgba(10,10,10,.76), rgba(11,29,22,.58))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ZambiaFlag size={32} />
              <div>
                <h1 style={{ fontSize: 15, fontWeight: 900, color: 'white', fontFamily: 'monospace', letterSpacing: 0.5 }}>
                  🦅 ZAMBIA ELECTION INTELLIGENCE · HH vs MUNDUBILE · KALABA · M&#39;MEMBE · LIVE
                </h1>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                  Powered by @BryteSikaStrategy · Facebook · Twitter/X · Lusaka Times · Zambian Observer · ZNBC
                </div>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right', flexShrink: 0, background: 'rgba(0,0,0,.36)' }}>
            <div style={{ fontSize: 7, color: C.muted, fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>ELECTION COUNTDOWN</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.warn, fontFamily: 'monospace' }}>{countdown.days}d {countdown.hours}h {countdown.minutes}m</div>
            <div style={{ fontSize: 8, color: C.muted }}>13 August 2026</div>
          </div>

          {/* Flag bar */}
          <div style={{ display: 'flex', width: 48 }}>
            <div style={{ flex: 3, background: C.zg }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, background: '#0A0A0A' }} />
              <div style={{ flex: 1, background: C.zr }} />
              <div style={{ flex: 1, background: C.zo }} />
            </div>
          </div>
        </div>

        {/* Gold ticker */}
        <div style={{ background: C.gold, overflow: 'hidden', padding: '3px 0' }}>
          <div className="ticker-wrap">
            <span className="ticker-inner" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: '#000' }}>
              &nbsp;&nbsp; LIVE · ZAMBIA 2026 ELECTION · 13 AUG 2026 · HH MODEL: 47.2% · MUNDUBILE-MAKEBI: 20.3% · M&#39;MEMBE: 4.1% · KALABA: 3.8% · VOTERS: 8,786,300 ECZ · 226 CONSTITUENCIES ·
              MODEL CONFIDENCE: 72% · OPPOSITION ALIGNMENT +2.3pts/mo ⚠ · INFLATION: 6.8% · BoZ RATE: 13.25% · SOURCES: ECZ · ZAMSTATS · BOZ · FACEBOOK · TWITTER/X · ZNBC · AIRTABLE · &nbsp;&nbsp;
            </span>
          </div>
        </div>
      </header>

      {/* ── CONTROL BAR ─────────────────────────────────── */}
      <div style={{ background: C.card2, borderBottom: `1px solid ${C.line}`, padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: C.teal, flexShrink: 0 }} />
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: C.teal }}>
          {lastUpdated ? `Updated: ${lastUpdated.toLocaleString()}` : 'Loading...'}
        </span>
        <button onClick={handleRefresh} disabled={refreshing}
          style={{ padding: '5px 14px', background: C.zg, color: 'white', border: 'none', borderRadius: 4, fontSize: 10, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
          {refreshing ? '...' : '⟳ REFRESH'}
        </button>
        <button onClick={() => setMode(m => m === 'daily' ? 'weekly' : 'daily')}
          style={{ padding: '5px 14px', background: C.gold, color: '#000', border: 'none', borderRadius: 4, fontSize: 10, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
          {mode === 'daily' ? 'DAILY MODE' : 'WEEKLY MODE'}
        </button>
        <button onClick={() => setShowQuotes(q => !q)}
          style={{ padding: '5px 14px', background: showQuotes ? '#1877F2' : C.card, color: showQuotes ? 'white' : C.muted, border: `1px solid #1877F2`, borderRadius: 4, fontSize: 10, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
          {showQuotes ? '💬 HIDE POSTS' : '💬 SHOW POSTS'}
        </button>
        {judgeMode !== 'idle' && (
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: judgeMode === 'ai' ? C.teal : C.gold }}>
            {judgeMode === 'ai' ? '✓ AI ACTIVE' : '◎ DEMO MODE'}
          </span>
        )}
        {/* MCP Status badges */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <McpBadge label="VERCEL" status={vercelStatus} color={C.teal} />
          <McpBadge label="AIRTABLE" status={airtableStatus} color="#18BFFF" />
          <McpBadge label="AI ENGINE" status="ACTIVE" color={C.zo} />
        </div>
      </div>

      <div style={{ padding: '16px 20px 40px', maxWidth: 1800, margin: '0 auto' }}>
        <div className="context-strip" style={{ backgroundImage: `linear-gradient(90deg, rgba(3,12,9,.94), rgba(6,18,23,.86), rgba(6,12,20,.74)), url(${VICTORIA_FALLS_IMAGE})` }}>
          <div>
            <span>MOSI-OA-TUNYA INTELLIGENCE ROOM</span>
            <strong>Zambia 2026 Election Pulse</strong>
          </div>
          <p>ECZ facts, open intelligence, province signals and the 50%+1 presidential threshold.</p>
          <div className="context-strip__meta">
            <span>Voters: 8,786,300</span>
            <span>226 constituencies</span>
          </div>
        </div>

        {/* ── KPI ROW ─────────────────────────────────────── */}
        <SectionLabel layer="ELECTION BOARD" title="Simple Zambia 2026 Dashboard"
          sub="The model runs behind the scenes; this front view keeps the election call, rerun gate, provinces, strongholds and voter mood easy to read." />
        <div className="election-desk">
          <div className="race-board race-board--compact">
            <div className="race-board__title">
              <span>Race To 50%+1</span>
              <strong>{firstRoundGap.toFixed(1)} pts short of first-round win</strong>
            </div>
            <div className="race-board__scores race-board__scores--all">
              {sortedFigures.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className={`race-board__candidate ${activeCandidateId === candidate.id ? 'race-board__candidate--active' : ''}`}
                  onClick={() => setActiveCandidateId(candidate.id)}
                  style={{ borderColor: candidate.color }}
                >
                  <div style={{ color: candidate.color }}>{candidate.shortName}</div>
                  <strong>{candidate.poll.toFixed(1)}%</strong>
                  <span>{candidate.party}</span>
                  <div className="race-board__meter">
                    <i style={{ width: `${Math.min(100, (candidate.poll / ELECTION_DATA.presidentialThreshold) * 100)}%`, background: candidate.color }} />
                  </div>
                  <em>Click for analysis</em>
                </button>
              ))}
            </div>
          </div>

          <div className="leader-comparison" aria-label="Leading candidate comparison">
            <div className="leader-comparison__item" style={{ borderColor: `${leader.color}88` }}>
              <span>Leader</span>
              <strong style={{ color: leader.color }}>{leader.shortName}</strong>
              <em>{leader.poll.toFixed(1)}% model share</em>
            </div>
            <div className="leader-comparison__gap">
              <span>Lead margin</span>
              <strong>{(leader.poll - runnerUp.poll).toFixed(1)} pts</strong>
              <em>{firstRoundGap.toFixed(1)} pts short of 50%+1 gate</em>
            </div>
            <div className="leader-comparison__item" style={{ borderColor: `${runnerUp.color}88` }}>
              <span>Closest challenger</span>
              <strong style={{ color: runnerUp.color }}>{runnerUp.shortName}</strong>
              <em>{runnerUp.poll.toFixed(1)}% model share</em>
            </div>
          </div>

          <div className="map-clickthrough">
            <div>
              <SectionLabel layer="FILLED MAP" title="Province Winners At A Glance"
                sub="Click a province for its breakdown; click a candidate above for the strategic narrative." />
              <ZambiaMap />
              <div className="results-lower-third">
                <div className="results-lower-third__label">
                  <strong>Election Map</strong>
                  <span>Modelled province lead · not official ECZ results</span>
                </div>
                {lowerStripItems.map(item => (
                  <div key={item.label} className="results-lower-third__item" style={{ borderColor: `${item.color}66` }}>
                    <span>{item.label}</span>
                    <strong style={{ color: item.color }}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {activeCandidatePacket && (
              <aside className="candidate-analysis-panel" style={{ borderColor: activeCandidatePacket.figure?.color ?? C.line }}>
                <div className="candidate-analysis-panel__head">
                  <div>
                    <span style={{ color: activeCandidatePacket.figure?.color ?? C.gold }}>Candidate Click-Through</span>
                    <h3>{activeCandidatePacket.figure?.name ?? activeCandidatePacket.candidateId}</h3>
                    <p>{activeCandidatePacket.figure?.party}</p>
                  </div>
                  {activeCandidatePacket.figure && (
                    <CandidatePhoto photo={activeCandidatePacket.figure.photo} shortName={activeCandidatePacket.figure.shortName} color={activeCandidatePacket.figure.color} size={66} />
                  )}
                </div>

                <div className="candidate-analysis-panel__call">
                  <strong>{activeCandidatePacket.analysis.currentCall}</strong>
                  <span>{activeCandidatePacket.analysis.baselineShare.toFixed(1)}% baseline · {activeCandidatePacket.analysis.thresholdGap.toFixed(1)} pts to 50%+1</span>
                </div>

                <div className="candidate-analysis-panel__section">
                  <h4>What the model sees</h4>
                  <p>{activeCandidatePacket.analysis.mainPath}</p>
                  <div className="narrative-tags">
                    {activeCandidatePacket.analysis.keyRisks.map(risk => <span key={risk}>{risk}</span>)}
                  </div>
                </div>

                <div className="candidate-analysis-panel__section">
                  <h4>Scenario plan</h4>
                  {activeCandidatePacket.scenarios.map(scenario => (
                    <div key={scenario.name} className="narrative-row">
                      <strong>{scenario.name}</strong>
                      <span>{scenario.projectedShare.toFixed(1)}% · {scenario.probability}</span>
                      <p>{scenario.trigger}</p>
                    </div>
                  ))}
                </div>

                <div className="candidate-analysis-panel__section">
                  <h4>Possible strategy</h4>
                  <ul>
                    {activeCandidatePacket.strategy.slice(0, 4).map(action => <li key={action}>{action}</li>)}
                  </ul>
                </div>

                <div className="candidate-analysis-panel__validation">
                  <span>{activeCandidatePacket.validationResult.status}</span>
                  {activeCandidatePacket.validationResult.passedChecks.length} validation checks passed
                </div>
              </aside>
            )}
          </div>

          <details className="dashboard-drilldown">
            <summary>More dashboard views</summary>
            <div className="simple-dashboard simple-dashboard--drilldown">
              <div className="simple-dashboard__call" style={{ borderColor: leader.color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.gold, fontFamily: 'monospace', fontWeight: 900, letterSpacing: 1 }}>OUTRIGHT WINNER</div>
                    <h2 style={{ color: C.text, fontSize: 34, lineHeight: 1.02, margin: '8px 0 6px', fontWeight: 950 }}>{outrightStatus}</h2>
                    <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
                      {leader.shortName} leads the model, but Zambia requires more than 50% of valid votes. The public call stays at lead, not first-round win, until that gate clears.
                    </div>
                  </div>
                  <CandidatePhoto photo={leader.photo} shortName={leader.shortName} color={leader.color} size={72} />
                </div>
                <div className="candidate-bars">
                  {sortedFigures.map(f => (
                    <div key={f.id} className="candidate-bars__row">
                      <div style={{ minWidth: 112 }}>
                        <div style={{ color: f.color, fontSize: 12, fontWeight: 900 }}>{f.shortName}</div>
                        <div style={{ color: C.muted, fontSize: 9 }}>{f.party}</div>
                      </div>
                      <div className="candidate-bars__track">
                        <div style={{ width: `${Math.min(100, f.poll * 1.75)}%`, background: f.color }} />
                      </div>
                      <div style={{ color: C.text, fontSize: 16, fontWeight: 950, minWidth: 56, textAlign: 'right' }}>{f.poll.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="simple-dashboard__side">
                <div className="simple-card">
                  <div style={{ color: C.warn, fontSize: 10, fontFamily: 'monospace', fontWeight: 900, letterSpacing: 1 }}>RERUN FIGURES</div>
                  <div style={{ color: C.text, fontSize: 24, fontWeight: 950, marginTop: 8 }}>{firstRoundGap.toFixed(1)} pts short</div>
                  <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, margin: '6px 0 12px' }}>If no candidate crosses 50%+1, the model shifts to a runoff-transfer view.</div>
                  {runoffData.map(item => (
                    <div key={item.name} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ color: item.color, fontSize: 11, fontWeight: 900 }}>{item.name}</span>
                        <span style={{ color: C.text, fontSize: 11, fontWeight: 900 }}>{item.value.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 999, background: C.line, overflow: 'hidden', margin: '4px 0' }}>
                        <div style={{ width: `${Math.min(100, item.value * 1.8)}%`, background: item.color, height: '100%' }} />
                      </div>
                      <div style={{ color: C.muted, fontSize: 9 }}>{item.note}</div>
                    </div>
                  ))}
                </div>
                <div className="simple-card">
                  <div style={{ color: C.teal, fontSize: 10, fontFamily: 'monospace', fontWeight: 900, letterSpacing: 1 }}>QUICK READ</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                    <KpiCard label="LEADER" value={leader.shortName} sub={leader.name} borderColor={leader.color} />
                    <KpiCard label="NEXT CANDIDATE" value={runnerUp.shortName} sub={runnerUp.name} borderColor={runnerUp.color} />
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>

        <div className="dashboard-tabs" role="tablist" aria-label="Dashboard sections">
          {dashboardTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeDashboardTab === tab.id}
              className={`dashboard-tabs__tab ${activeDashboardTab === tab.id ? 'dashboard-tabs__tab--active' : ''}`}
              onClick={() => setActiveDashboardTab(tab.id)}
            >
              <strong>{tab.label}</strong>
              <span>{tab.note}</span>
            </button>
          ))}
        </div>

        {activeDashboardTab === 'overview' && (() => {
          const EM = ELECTION_DATA.explainableModel
          const PT = ELECTION_DATA.pollTriangulation
          const tierColor: Record<string, string> = {
            'LIVED HARDSHIP': C.warn, 'STRUCTURAL': C.upnd, 'DELIVERY OFFSET': C.teal, 'MACRO CONTEXT': C.muted,
          }
          const wb = EM.computation
          const waterfall = [
            { label: '2021 baseline', val: wb.baseline, color: C.gold, delta: false },
            { label: 'Lived hardship', val: wb.livedHardshipDrag, color: C.warn, delta: true },
            { label: 'Structural', val: wb.structuralDrag, color: C.upnd, delta: true },
            { label: 'Delivery offset', val: wb.deliveryOffset, color: C.teal, delta: true },
            { label: 'Macro context', val: wb.macroContextLift, color: C.ndc, delta: true },
            { label: 'Model output', val: wb.output, color: C.zg, delta: false },
          ]
          const weights = [
            { k: 'Lived hardship', v: EM.weightSummary.livedHardship, c: C.warn },
            { k: 'Structural', v: EM.weightSummary.structural, c: C.upnd },
            { k: 'Delivery offset', v: EM.weightSummary.deliveryOffset, c: C.teal },
            { k: 'Macro context', v: EM.weightSummary.macroContext, c: C.muted },
          ]
          return (
        <>
          <SectionLabel layer="OWN PREDICTION" title="How We Get to 47.2% — Explainable Model"
            sub="Bottom-up, hardship-weighted computation from the 2021 baseline. Every weight and delta is shown so the assumptions can be challenged — this is our own estimate, not a copied poll." />

          {/* Headline call + computation waterfall */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(14,23,36,.96), rgba(8,31,17,.9))', border: `1px solid ${C.zg}66`, borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 900, color: C.muted, letterSpacing: 1 }}>UPND FIRST-ROUND SHARE</div>
              <div style={{ fontSize: 52, fontWeight: 950, color: C.zg, lineHeight: 1 }}>{EM.output}%</div>
              <div style={{ fontSize: 11, color: C.text, marginTop: 6, fontWeight: 700 }}>{EM.call.replace(/_/g, ' ')}</div>
              <div style={{ fontSize: 11, color: C.warn, marginTop: 8, lineHeight: 1.5 }}>
                {EM.firstRoundGap} pts short of the {EM.firstRoundThreshold}%+1 win line → <strong>runoff is the base case</strong>
              </div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 900, color: C.gold, marginBottom: 12 }}>AUDITABLE ARITHMETIC · baseline + Σ(deltas) = output</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, justifyContent: 'space-between' }}>
                {waterfall.map(w => (
                  <div key={w.label} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 950, color: w.color, marginBottom: 6 }}>
                      {w.delta ? (w.val > 0 ? '+' : '') : ''}{w.val}
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: w.color, opacity: w.delta ? 0.6 : 1, marginBottom: 6 }} />
                    <div style={{ fontSize: 9, color: C.muted, lineHeight: 1.3 }}>{w.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                {wb.check}
              </div>
            </div>
          </div>

          {/* Weight summary */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.text, fontWeight: 800, marginBottom: 4 }}>What the model weights — by what Zambians actually feel</div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55, marginBottom: 12 }}>{EM.weightSummary.headline}</div>
            {weights.map(w => (
              <div key={w.k} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 120, fontSize: 11, color: C.text, fontWeight: 700 }}>{w.k}</div>
                <div style={{ flex: 1, height: 16, background: C.line, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${w.v}%`, height: '100%', background: w.c, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#000' }}>{w.v}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Drivers */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.text, fontWeight: 800, marginBottom: 12 }}>Every driver, ranked by salience — with evidence</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {EM.drivers.map(d => (
                <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '150px 70px 1fr', gap: 12, alignItems: 'start', borderLeft: `3px solid ${tierColor[d.tier] ?? C.muted}`, paddingLeft: 12, paddingTop: 6, paddingBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.text, fontWeight: 700, lineHeight: 1.3 }}>{d.label}</div>
                    <div style={{ fontSize: 8, color: tierColor[d.tier] ?? C.muted, fontFamily: 'monospace', fontWeight: 900, marginTop: 3 }}>{d.tier} · w{d.salienceWeight}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 950, color: d.pointDelta > 0 ? C.teal : C.warn }}>{d.pointDelta > 0 ? '+' : ''}{d.pointDelta}</div>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{d.why}</div>
                    <div style={{ fontSize: 9, color: '#556', fontFamily: 'monospace', marginTop: 4 }}>📊 {d.indicator} · src: {d.evidence}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Poll triangulation cross-check */}
          <SectionLabel layer="CROSS-CHECK" title="Poll Triangulation — Why Not Just Trust the 55% Online Poll"
            sub="We do not copy one poll. We gather every side — party, social, academic, independent — flag each for bias, bias-adjust, then compare to our own model." />
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 90px 90px 1fr', gap: 10, fontSize: 9, fontFamily: 'monospace', fontWeight: 900, color: C.muted, borderBottom: `1px solid ${C.line}`, paddingBottom: 8, marginBottom: 8 }}>
              <div>SOURCE</div><div style={{ textAlign: 'center' }}>RAW</div><div style={{ textAlign: 'center' }}>ADJUSTED</div><div>WHY ADJUSTED</div>
            </div>
            {PT.sources.map(s => (
              <div key={s.source} style={{ display: 'grid', gridTemplateColumns: '1.6fr 90px 90px 1fr', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.line}` }}>
                <div>
                  <div style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>{s.source}</div>
                  <div style={{ fontSize: 8, color: C.muted, fontFamily: 'monospace', marginTop: 2 }}>{s.lean} · reliability {s.reliability}</div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 900, color: C.muted, textDecoration: 'line-through' }}>{s.rawUpnd}</div>
                <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 950, color: C.gold }}>{s.adjustedUpnd}</div>
                <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.45 }}>{s.adjustment}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160, background: C.card2, border: `1px solid ${C.line}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace', fontWeight: 900 }}>BIAS-ADJUSTED CONSENSUS</div>
                <div style={{ fontSize: 28, fontWeight: 950, color: C.gold }}>{PT.biasAdjustedConsensus}%</div>
              </div>
              <div style={{ flex: 1, minWidth: 160, background: C.card2, border: `1px solid ${C.line}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace', fontWeight: 900 }}>OUR OWN MODEL</div>
                <div style={{ fontSize: 28, fontWeight: 950, color: C.zg }}>{PT.ownModelOutput}%</div>
              </div>
              <div style={{ flex: 1, minWidth: 160, background: `${C.teal}1A`, border: `1px solid ${C.teal}66`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 9, color: C.teal, fontFamily: 'monospace', fontWeight: 900 }}>AGREEMENT</div>
                <div style={{ fontSize: 28, fontWeight: 950, color: C.teal }}>{PT.agreement}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
              {PT.interpretation}
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#556', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8 }}>
            {EM.disclaimer} · Model last computed {EM.lastComputed}.
          </div>
        </>
          )
        })()}

        {activeDashboardTab === 'provinces' && (
        <>
        <div className="simple-grid">
          <ChartCard title="POPULARITY PER PRESIDENTIAL CANDIDATE PER PROVINCE" sub="Clean province readout; detailed weighting is kept in the model layer">
            <div className="province-popularity">
              {provincePopularity.map(p => (
                <div key={p.name} className="province-popularity__row">
                  <div>
                    <div style={{ color: C.text, fontSize: 12, fontWeight: 900 }}>{p.name}</div>
                    <div style={{ color: C.muted, fontSize: 9 }}>{Math.round(p.voters / 1000)}k voters</div>
                    <div style={{ color: p.lean === 'CONTESTED' ? C.gold : p.lean === 'PF' ? C.pf : C.upnd, fontSize: 9, marginTop: 2 }}>{p.classification}</div>
                  </div>
                  {[
                    ['HH', p.hh, C.upnd],
                    ['BM/MZ', p.mundubile, C.pf],
                    ['HK', p.kalaba, C.dp],
                    ['FM', p.membe, C.sp],
                    ['CK', p.kateka, '#8E44AD'],
                  ].map(([name, value, color]) => (
                    <div key={`${p.name}-${name}`} style={{ minWidth: 58 }}>
                      <div style={{ color: color as string, fontSize: 10, fontWeight: 900 }}>{name}</div>
                      <div style={{ height: 6, borderRadius: 999, background: C.line, overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ width: `${value as number}%`, background: color as string, height: '100%' }} />
                      </div>
                      <div style={{ color: C.muted, fontSize: 9, marginTop: 2 }}>{value}%</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="STRONGHOLD SPLIT" sub="How the province map currently breaks into anchors and battlegrounds">
            <div style={{ display: 'grid', gap: 12 }}>
              {strongholdSplit.map(s => (
                <div key={s.label} style={{ border: `1px solid ${s.color}55`, borderRadius: 8, padding: 12, background: `${s.color}0D` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div style={{ color: s.color, fontWeight: 900, fontSize: 13 }}>{s.label}</div>
                    <div style={{ color: C.text, fontWeight: 950 }}>{s.value}/10</div>
                  </div>
                  <div style={{ height: 9, borderRadius: 999, background: C.line, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${s.value * 10}%`, background: s.color, height: '100%' }} />
                  </div>
                  <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>{s.provinces}</div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <ChartCard title="VOTER SENTIMENT PER PROVINCE" sub="Simple mood score, driven by issue pressure, strongholds and public sentiment signals">
          <div className="sentiment-strip">
            {sentimentByProvince.map(p => (
              <div key={p.name} style={{ border: `1px solid ${p.color}55`, borderRadius: 8, padding: 10, background: `${p.color}0D` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: C.text, fontSize: 12, fontWeight: 900 }}>{p.name}</span>
                  <span style={{ color: p.color, fontSize: 13, fontWeight: 950 }}>{p.score}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: C.line, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${p.score}%`, background: p.color, height: '100%' }} />
                </div>
                <div style={{ color: C.muted, fontSize: 10, lineHeight: 1.45 }}>{p.mood}</div>
              </div>
            ))}
          </div>
        </ChartCard>
        </>
        )}

        {activeDashboardTab === 'strategy' && (
        <>
        <div className="ticket-stack">
          <div className="ticket-stack__ticket" style={{ borderColor: mundubileTicket?.color ?? C.pf }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start', marginBottom: 12 }}>
              <div>
                <div style={{ color: C.gold, fontFamily: 'monospace', fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>CANDIDATE + RUNNING MATE</div>
                <div style={{ color: C.text, fontSize: 24, fontWeight: 950, lineHeight: 1.08, marginTop: 6 }}>Mundubile-Makebi ticket lane</div>
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>
                  Shown as one ticket/cooperation lane because the strategic effect is consolidation: northern PF-linked machinery plus eastern/Pamodzi transfer potential.
                </div>
              </div>
              {mundubileTicket && <CandidatePhoto photo={mundubileTicket.photo} shortName={mundubileTicket.shortName} color={mundubileTicket.color} size={68} />}
            </div>
            <div style={{ display: 'grid', gap: 9 }}>
              {ticketReadout.map(item => (
                <div key={item.label} style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: '9px 10px', background: 'rgba(18,28,44,.62)' }}>
                  <div style={{ color: C.pf, fontSize: 10, fontFamily: 'monospace', fontWeight: 900, marginBottom: 3 }}>{item.label.toUpperCase()}</div>
                  <div style={{ color: C.text, fontSize: 13, fontWeight: 900 }}>{item.value}</div>
                  <div style={{ color: C.muted, fontSize: 10, lineHeight: 1.45, marginTop: 3 }}>{item.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ticket-stack__decision">
            <div style={{ color: C.teal, fontFamily: 'monospace', fontSize: 10, fontWeight: 900, letterSpacing: 1, marginBottom: 10 }}>5-LAYER DECISION STACK</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {publicDecisionStack.map((layer, idx) => (
                <div key={layer.layer} style={{ display: 'grid', gridTemplateColumns: '30px 88px 1fr', gap: 9, alignItems: 'start', borderTop: idx === 0 ? 'none' : `1px solid ${C.line}`, paddingTop: idx === 0 ? 0 : 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: `${layer.color}20`, color: layer.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontFamily: 'monospace', fontSize: 10 }}>{idx + 1}</div>
                  <div>
                    <div style={{ color: layer.color, fontSize: 11, fontWeight: 950 }}>{layer.layer}</div>
                    <div style={{ color: C.muted, fontSize: 9, lineHeight: 1.35 }}>{layer.question}</div>
                  </div>
                  <div style={{ color: C.text, fontSize: 11, lineHeight: 1.5 }}>{layer.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SectionLabel layer="STRATEGY NARRATIVES" title="Candidate Scenario Plans"
          sub="Readable whitebox analysis. Structured JSON still powers validation in the backend data layer." />
        <div className="json-strategy-grid narrative-strategy-grid">
          {candidateStrategyPackets.map(packet => (
            <button
              key={packet.candidateId}
              type="button"
              className="json-strategy-card narrative-strategy-card"
              onClick={() => setActiveCandidateId(packet.candidateId)}
              style={{ borderColor: packet.figure?.color ?? C.line }}
            >
              <div className="json-strategy-card__head">
                <div>
                  <div style={{ color: packet.figure?.color ?? C.text, fontSize: 12, fontWeight: 950 }}>
                    {packet.figure?.shortName ?? packet.candidateId}
                  </div>
                  <div style={{ color: C.muted, fontSize: 10, lineHeight: 1.45 }}>
                    {packet.analysis.currentCall} · {packet.analysis.baselineShare.toFixed(1)}% baseline · {packet.analysis.thresholdGap.toFixed(1)} pts to 50%+1
                  </div>
                </div>
                <span className="json-strategy-card__status" style={{ borderColor: packet.validationResult.status === 'invalid' ? C.warn : C.teal, color: packet.validationResult.status === 'invalid' ? C.warn : C.teal }}>
                  {packet.validationResult.status}
                </span>
              </div>
              <p>{packet.analysis.mainPath}</p>
              <strong>Best path: {packet.scenarios[0]?.name}</strong>
              <small>{packet.strategy[0]}</small>
              <em>Click to open in the analysis panel</em>
            </button>
          ))}
        </div>
        </>
        )}

        {/* ── HISTORY & RISK TAB ───────────────────────── */}
        {activeDashboardTab === 'history' && (
        <>
          <SectionLabel layer="ELECTION HISTORY" title="Zambia Presidential Elections 1991–2026"
            sub="ECZ official results and AU/SADC observer records. * = by-election. Turnout line shows electoral participation." />

          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 4 }}>WINNER vs RUNNER-UP VOTE SHARE BY ELECTION</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Stacked by election year. * = by-election (lower turnout expected). Hover for context.</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={historicalChartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <XAxis dataKey="year" tick={{ fill: C.muted, fontSize: 11 }} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} domain={[0, 80]} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.line}` }}
                  formatter={(value: unknown, name: unknown) => [`${value as number}%`, name as string]} />
                <Legend wrapperStyle={{ color: C.muted, fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="winner" name="Winner %" fill={C.teal} radius={[3, 3, 0, 0]} />
                <Bar dataKey="runnerUp" name="Runner-up %" fill={C.gold} radius={[3, 3, 0, 0]} />
                <ReferenceLine y={50} stroke={C.warn} strokeDasharray="4 4" label={{ value: '50%+1 gate', fill: C.warn, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 4 }}>VOTER TURNOUT HISTORY (%)</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>General elections in orange, by-elections in grey. Shaded band shows projected 2026 range (55–70%). Turnout is the single most important model uncertainty variable.</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ELECTION_DATA.turnoutHistory} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="year" tick={{ fill: C.muted, fontSize: 11 }} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.line}` }}
                  formatter={(value: unknown) => [`${value as number}%`, 'Turnout']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload as { note?: string } | undefined
                    return `${label}: ${item?.note ?? ''}`
                  }} />
                <Bar dataKey="turnout" radius={[3, 3, 0, 0]}>
                  {ELECTION_DATA.turnoutHistory.map((entry, idx) => (
                    <Cell key={idx} fill={entry.type === 'BY-ELECTION' ? C.muted : entry.year === 2026 ? C.warn : C.zo} />
                  ))}
                </Bar>
                <ReferenceLine y={62} stroke={C.warn} strokeDasharray="4 4" label={{ value: '2026 est 62%', fill: C.warn, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
            {ELECTION_DATA.historicalElections.map(e => (
              <div key={e.year} style={{ background: C.card, border: `1px solid ${e.winnerParty === 'UPND' ? C.upnd : e.winnerParty === 'PF' ? C.pf : C.ndc}33`, borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                  <div style={{ fontWeight: 900, fontSize: 16, color: C.gold, fontFamily: 'monospace', minWidth: 42 }}>{e.year}</div>
                  <div style={{ background: `${e.type === 'BY-ELECTION' ? C.muted : C.teal}22`, color: e.type === 'BY-ELECTION' ? C.muted : C.teal, fontSize: 9, fontFamily: 'monospace', fontWeight: 700, padding: '2px 8px', borderRadius: 10, border: `1px solid ${e.type === 'BY-ELECTION' ? C.muted : C.teal}44` }}>{e.type}</div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>{e.winner} ({e.winnerParty})</div>
                  <div style={{ color: e.winnerPct > 50 ? C.teal : C.warn, fontWeight: 900, fontFamily: 'monospace', fontSize: 13 }}>{e.winnerPct}%</div>
                  <div style={{ color: C.muted, fontSize: 11, marginLeft: 'auto' }}>Turnout: {e.turnout}%</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ height: 10, borderRadius: 4, background: e.winnerParty === 'UPND' ? C.upnd : e.winnerParty === 'PF' ? C.pf : C.ndc, flex: e.winnerPct }} />
                  <div style={{ height: 10, borderRadius: 4, background: C.gold, flex: e.runnerUpPct }} />
                  <div style={{ height: 10, borderRadius: 4, background: C.line, flex: Math.max(0, 100 - e.winnerPct - e.runnerUpPct) }} />
                </div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, marginBottom: 6 }}>{e.context}</div>
                <div style={{ fontSize: 10, color: `${C.warn}CC`, fontStyle: 'italic' }}>📘 Model lesson: {e.modelLesson}</div>
              </div>
            ))}
          </div>

          <SectionLabel layer="20-FACTOR RISK MATRIX" title="Electoral Factor Domain Scores"
            sub="UPND advantage vs Opposition advantage for each of the 20 factors. Weight = electoral importance (1-10). 🚨 = active risk flag." />

          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 4 }}>UPND vs OPPOSITION ADVANTAGE BY FACTOR</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Higher score = stronger position for each side. These are independent scales, not a zero-sum competition.</div>
            <ResponsiveContainer width="100%" height={480}>
              <BarChart data={factorScoreData} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: C.muted, fontSize: 9 }} tickFormatter={v => `${v}`} />
                <YAxis type="category" dataKey="label" width={185} tick={{ fill: C.muted, fontSize: 9 }} />
                <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.line}` }}
                  formatter={(value: unknown, name: unknown) => [`${value as number}/100`, name as string]} />
                <Legend wrapperStyle={{ color: C.muted, fontSize: 10 }} />
                <Bar dataKey="UPND" fill={C.upnd} radius={[0, 3, 3, 0]} maxBarSize={10} />
                <Bar dataKey="Opposition" fill={C.pf} radius={[0, 3, 3, 0]} maxBarSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 24 }}>
            {ELECTION_DATA.electionFactors.map(f => (
              <div key={f.id} style={{ background: C.card, border: `1px solid ${f.riskFlag ? C.warn + '66' : C.line}`, borderRadius: 8, padding: '10px 12px', position: 'relative' }}>
                {f.riskFlag && <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 12 }}>🚨</div>}
                <div style={{ fontSize: 9, color: C.gold, fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>DOMAIN {f.domain} · WEIGHT {f.weight}/10</div>
                <div style={{ fontWeight: 900, fontSize: 12, color: f.riskFlag ? C.warn : C.text, marginBottom: 6, paddingRight: 20 }}>{f.label}</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div style={{ flex: 1, background: `${C.upnd}22`, border: `1px solid ${C.upnd}44`, borderRadius: 6, padding: '4px 7px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: C.upnd, fontFamily: 'monospace', fontWeight: 700 }}>UPND</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: C.upnd }}>{f.upndAdvantage}</div>
                  </div>
                  <div style={{ flex: 1, background: `${C.pf}22`, border: `1px solid ${C.pf}44`, borderRadius: 6, padding: '4px 7px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: C.pf, fontFamily: 'monospace', fontWeight: 700 }}>OPPO</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: C.pf }}>{f.oppositionAdvantage}</div>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace', marginBottom: 5 }}>TREND: <span style={{ color: f.trend.includes('RISK') || f.trend.includes('HURTS') ? C.warn : f.trend.includes('UPND') ? C.teal : C.gold }}>{f.trend}</span></div>
                <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{f.upndNote}</div>
              </div>
            ))}
          </div>
        </>
        )}

        {/* ── INTEGRITY TAB ────────────────────────────────── */}
        {activeDashboardTab === 'integrity' && (
        <>
          <SectionLabel layer="RUNOFF PROBABILITY ENGINE" title="First-Round Win vs Runoff Risk"
            sub="Monte Carlo simulation over UPND vote share distribution. P(UPND ≥ 50.01%) = 34% at baseline. Scenarios show how key levers shift this probability." />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div style={{ background: C.card, border: `2px solid ${C.warn}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 10, color: C.warn, fontFamily: 'monospace', fontWeight: 700, marginBottom: 6 }}>BASELINE RUNOFF RISK</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: C.warn, fontFamily: 'monospace', lineHeight: 1 }}>{ELECTION_DATA.runoffProbability.runoffProbability}%</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Probability of second ballot (no first-round winner)</div>
              <div style={{ background: C.line, height: 8, borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: `${ELECTION_DATA.runoffProbability.runoffProbability}%`, height: '100%', background: C.warn }} />
              </div>
            </div>
            <div style={{ background: C.card, border: `2px solid ${C.teal}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 10, color: C.teal, fontFamily: 'monospace', fontWeight: 700, marginBottom: 6 }}>FIRST-ROUND WIN PROBABILITY</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: C.teal, fontFamily: 'monospace', lineHeight: 1 }}>{ELECTION_DATA.runoffProbability.firstRoundWinProbability}%</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Probability UPND clears 50%+1 in a single round (model output 47.2% → minority of simulations)</div>
              <div style={{ background: C.line, height: 8, borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: `${ELECTION_DATA.runoffProbability.firstRoundWinProbability}%`, height: '100%', background: C.teal }} />
              </div>
            </div>
            <div style={{ background: C.card, border: `2px solid ${C.gold}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 10, color: C.gold, fontFamily: 'monospace', fontWeight: 700, marginBottom: 6 }}>UPND UNCERTAINTY BAND</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: C.gold, fontFamily: 'monospace', lineHeight: 1 }}>
                {ELECTION_DATA.nationalPollUncertainty.upnd.low}–{ELECTION_DATA.nationalPollUncertainty.upnd.high}%
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>68% confidence interval · Point estimate: {ELECTION_DATA.nationalPollUncertainty.upnd.point}%</div>
              <div style={{ background: C.line, height: 8, borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: `${ELECTION_DATA.nationalPollUncertainty.upnd.confidence}%`, height: '100%', background: C.gold }} />
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>Confidence: {ELECTION_DATA.nationalPollUncertainty.upnd.confidence}%</div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 4 }}>SCENARIO RUNOFF MATRIX — P(FIRST-ROUND WIN) BY SCENARIO</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Each bar shows the probability UPND clears 50%+1 under different conditions. Status quo at 34% — policy delivery and opposition fragmentation are the key levers.</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={runoffScenarioData} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
                <XAxis dataKey="scenario" tick={{ fill: C.muted, fontSize: 9 }} angle={-30} textAnchor="end" height={80} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.line}` }}
                  formatter={(value: unknown, name: unknown) => [`${value as number}%`, name as string]} />
                <ReferenceLine y={50} stroke={C.warn} strokeDasharray="4 4" label={{ value: '50% P', fill: C.warn, fontSize: 9 }} />
                <Bar dataKey="Win Prob %" radius={[3, 3, 0, 0]}>
                  {runoffScenarioData.map((entry, idx) => (
                    <Cell key={idx} fill={entry['Win Prob %'] >= 50 ? C.teal : entry['Win Prob %'] >= 30 ? C.gold : C.warn} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 4 }}>UNCERTAINTY BANDS — ALL CANDIDATES</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Point estimate ± confidence interval. Fear-of-disclosure correction may shift actual result 2–4pt. These are not certified polls.</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {ELECTION_DATA.figures.map(f => {
                const unc = ELECTION_DATA.nationalPollUncertainty[f.id as keyof typeof ELECTION_DATA.nationalPollUncertainty] as {point:number;low:number;high:number;confidence:number} | undefined
                if (!unc || typeof unc !== 'object' || !('point' in unc)) return null
                return (
                  <div key={f.id} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontWeight: 800, color: f.color, fontSize: 12, minWidth: 140 }}>{f.shortName} ({f.party.split(' ')[0]})</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 900, color: f.color }}>{unc.point}%</div>
                      <div style={{ color: C.muted, fontSize: 10 }}>Range: {unc.low}% – {unc.high}%</div>
                      <div style={{ marginLeft: 'auto', fontSize: 10, color: C.muted }}>Confidence: {unc.confidence}%</div>
                    </div>
                    <div style={{ position: 'relative', height: 12, background: C.line, borderRadius: 6, overflow: 'visible' }}>
                      <div style={{ position: 'absolute', left: `${(unc.low / 60) * 100}%`, width: `${((unc.high - unc.low) / 60) * 100}%`, height: '100%', background: `${f.color}55`, borderRadius: 4 }} />
                      <div style={{ position: 'absolute', left: `${(unc.point / 60) * 100}%`, transform: 'translateX(-50%)', width: 4, height: '100%', background: f.color, borderRadius: 2 }} />
                      {f.id === 'hh' && (
                        <div style={{ position: 'absolute', left: `${(50 / 60) * 100}%`, width: 2, height: '100%', background: C.warn, borderRadius: 1 }} />
                      )}
                    </div>
                    {f.id === 'hh' && <div style={{ fontSize: 9, color: C.warn, marginTop: 4 }}>▲ 50%+1 gate — orange line. Upper band reaches the gate; first-round win requires the high scenario.</div>}
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 14, fontStyle: 'italic', borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>{ELECTION_DATA.nationalPollUncertainty.methodologyNote}</div>
          </div>

          <SectionLabel layer="INSTITUTIONAL TRUST" title="ECZ · Courts · Police · Media · Observers"
            sub="Afrobarometer Round 10 (INESOR/UNZA) · MISA Zambia · CCMG · CIVICUS. Scores are 0–100. Below 50 = trust deficit." />

          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {trustData.map(t => (
                <div key={t.institution} style={{ background: C.card2, border: `1px solid ${t.color}44`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>{t.trend}</div>
                  <div style={{ fontWeight: 900, fontSize: 13, color: C.text, marginBottom: 8 }}>{t.institution}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: t.color, fontFamily: 'monospace', lineHeight: 1, marginBottom: 8 }}>{t.score}</div>
                  <div style={{ background: C.line, height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${t.score}%`, height: '100%', background: t.color }} />
                  </div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 6 }}>
                    {Object.values(ELECTION_DATA.institutionalTrust).find(inst => inst.label === t.institution)?.note}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SectionLabel layer="ELECTION INTEGRITY" title="Process, Observer, Logistics & Dispute Risk"
            sub="CCMG · ECZ · ACLED · ConCourt precedent. Overall integrity score: 65/100 — MODERATELY CREDIBLE, WATCH." />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 20 }}>
            {Object.entries(ELECTION_DATA.integritySignals).filter(([k]) => k !== 'overallIntegrityScore' && k !== 'overallIntegrityRating').map(([key, val]) => {
              if (typeof val !== 'object' || !('risk' in val)) return null
              const riskColor = val.risk.startsWith('LOW') ? C.teal : val.risk.startsWith('MEDIUM') ? C.gold : val.risk.startsWith('HIGH') ? C.warn : C.muted
              return (
                <div key={key} style={{ background: C.card, border: `1px solid ${riskColor}44`, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace', fontWeight: 700 }}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
                    <div style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: riskColor, background: `${riskColor}22`, padding: '2px 7px', borderRadius: 8, border: `1px solid ${riskColor}44` }}>{val.risk}</div>
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{val.note}</div>
                  <div style={{ fontSize: 9, color: C.gold, marginTop: 6, fontFamily: 'monospace' }}>Source: {val.source}</div>
                </div>
              )
            })}
          </div>

          <SectionLabel layer="AGRICULTURE & MINING" title="Household Economy Swing Indicators"
            sub="FISP delivery, rainfall, copper prices, and contractor payments are the 3–5pt swing variables in Copperbelt and Northern/Eastern provinces." />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: C.card, border: `1px solid ${C.zg}55`, borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.teal, marginBottom: 4 }}>🌽 AGRICULTURE INDICATORS</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>{ELECTION_DATA.agricultureIndicators.season2025_26}</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { label: 'Season', value: ELECTION_DATA.agricultureIndicators.season2025_26 },
                  { label: 'Rainfall', value: ELECTION_DATA.agricultureIndicators.rainfallStatus },
                  { label: 'Maize Price (50kg)', value: `K${ELECTION_DATA.agricultureIndicators.maizePriceZMW_50kg} — ${ELECTION_DATA.agricultureIndicators.maizePriceTrend}` },
                  { label: 'FISP Delayed', value: ELECTION_DATA.agricultureIndicators.FISPDeliveryStatus.delayed.join(', ') || 'None' },
                  { label: 'FRA Purchases', value: ELECTION_DATA.agricultureIndicators.FRAMaizePurchases },
                  { label: 'Drought Provinces', value: ELECTION_DATA.agricultureIndicators.droughtAffectedProvinces.join(', ') },
                ].map(item => (
                  <div key={item.label} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
                    <div style={{ fontSize: 9, color: C.gold, fontFamily: 'monospace', fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: C.text, marginTop: 3 }}>{item.value}</div>
                  </div>
                ))}
                <div style={{ background: `${C.warn}11`, border: `1px solid ${C.warn}44`, borderRadius: 6, padding: '8px 10px', marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: C.warn, fontWeight: 700, marginBottom: 4 }}>Electoral Effect</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{ELECTION_DATA.agricultureIndicators.votingEffect}</div>
                </div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.ndc}55`, borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.ndc, marginBottom: 4 }}>⛏ MINING & COPPERBELT INDICATORS</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>{ELECTION_DATA.miningIndicators.resourceNationalismRisk}</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { label: 'Copper Price (LME)', value: `$${ELECTION_DATA.miningIndicators.copperPriceLME_USD_t.toLocaleString()}/t — ${ELECTION_DATA.miningIndicators.copperPriceTrend}` },
                  { label: 'KCM Status', value: ELECTION_DATA.miningIndicators.kcmStatus },
                  { label: 'Mopani Status', value: ELECTION_DATA.miningIndicators.mopaniStatus },
                  { label: 'CB Formal Employment', value: `~${ELECTION_DATA.miningIndicators.copperbeltFormalEmployment.toLocaleString()} workers` },
                  { label: 'Contractor Payment Risk', value: ELECTION_DATA.miningIndicators.contractorPaymentRisk },
                  { label: 'Supplier Grievances', value: ELECTION_DATA.miningIndicators.localSupplierGrievances },
                ].map(item => (
                  <div key={item.label} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
                    <div style={{ fontSize: 9, color: C.gold, fontFamily: 'monospace', fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: C.text, marginTop: 3 }}>{item.value}</div>
                  </div>
                ))}
                <div style={{ background: `${C.warn}11`, border: `1px solid ${C.warn}44`, borderRadius: 6, padding: '8px 10px', marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: C.warn, fontWeight: 700, marginBottom: 4 }}>Electoral Effect</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{ELECTION_DATA.miningIndicators.votingEffect}</div>
                </div>
              </div>
            </div>
          </div>
        </>
        )}

        {activeDashboardTab === 'warroom' && (
          <ScenarioHub />
        )}

        {activeDashboardTab === 'model' && (
        <details className="model-details">
          <summary>Advanced model notes, agents and source detail</summary>

        <div style={{ background: '#0B1220', border: `1px solid ${C.gold}`, borderLeft: `5px solid ${C.gold}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, lineHeight: 1 }}>2026</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: C.text, marginBottom: 3 }}>Data audit status</div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55 }}>
              Official facts are ECZ/ZamStats/BoZ sourced. Zambia&apos;s presidential win condition is more than 50% of valid votes cast; below that, the model treats the race as runoff-risk. All provinces are now audited against ECZ 2021 provincial baselines plus Zambia-specific issue pressure: cost of living, electricity, jobs, farming, mining, roads, water, CDF/free education and opposition ticket consolidation. Candidate support, trends and strategy scores are model estimates for planning, not certified polling or ECZ results.
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
            Voters: 8,786,300<br />Constituencies: 226
          </div>
        </div>

        <ChartCard title="COUNTRY-SPECIFIC VOTER PRESSURE LAYER" sub="National Zambia issues used before province-level adjustments are applied">
          <div className="country-pressure-grid">
            {ELECTION_DATA.nationalVoterPressures.map(item => (
              <div key={item.issue} className="country-pressure-card">
                <strong>{item.issue}</strong>
                <p>{item.countrySignal}</p>
                <small>{item.modelEffect}</small>
              </div>
            ))}
          </div>
        </ChartCard>

        <SectionLabel layer="LIVE DATA" title="Real-Time Election Intelligence"
          sub="Aggregated from Facebook, Twitter/X, Lusaka Times, Zambian Observer, ZNBC · Updated every 6 hours" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 16 }}>
          <KpiCard label="HH MODEL LEAD" value="+26.9 pts" sub="vs Mundubile-Makebi lane (20.3%)" trend="Modelled — monitor" borderColor={C.teal} />
          <KpiCard label="50%+1 GAP" value={`${firstRoundGap.toFixed(1)} pts`} sub="needed to clear first round" trend={`Runoff risk: ${runoffRisk}`} borderColor={C.warn} />
          <KpiCard label="DAYS TO ELECTION" value={`${countdown.days}d`} sub="13 August 2026" trend={`${countdown.hours}h ${countdown.minutes}m remaining`} borderColor={C.gold} />
          <KpiCard label="REGISTERED VOTERS" value="8,786,300" sub="ECZ certified 2026" trend="226 constituencies" borderColor={C.ndc} />
          <KpiCard label="OPPOSITION LANE" value="+2.3 pts/mo" sub="Mundubile-Makebi model trend" trend="Verify ECZ ticket filing" borderColor={C.warn} />
          <KpiCard label="MODEL CONFIDENCE" value={`${ELECTION_DATA.aiConfidence}%`} sub="Audit-adjusted" trend="Official facts separated" borderColor={C.zg} />
        </div>

        {/* ── FIGURE CARDS ─── HH vs Opposition ────────────── */}
        <SectionLabel layer="CANDIDATES" title="Candidate Profiles — HH vs Opposition"
          sub="AI-scored profiles for all 5 candidates · Polling, trend, strongholds, and public narrative analysis" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
          {ELECTION_DATA.figures.map((f, i) => <FigureCard key={f.id} f={f} rank={i + 1} showQuotes={showQuotes} />)}
        </div>

        {/* ── PAST PRESIDENTS ──────────────────────────────── */}
        <SectionLabel layer="OPERATIONS" title="Interactive Campaign Lens"
          sub="Tap a pressure point to change the tactical readout before reviewing the charts" />
        <div className="operator-lens" style={{ background: 'linear-gradient(135deg, rgba(14,23,36,.96), rgba(8,31,17,.9))', border: `1px solid ${selectedLens.color}66`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 16, alignItems: 'stretch' }}>
          <div className="operator-lens__tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {campaignLenses.map(lens => {
              const active = lens.id === activeLens
              return (
                <button key={lens.id} onClick={() => setActiveLens(lens.id)}
                  style={{ minHeight: 82, padding: '10px 8px', borderRadius: 8, border: `1px solid ${active ? lens.color : C.line}`, background: active ? `${lens.color}20` : 'rgba(18,28,44,.72)', color: active ? lens.color : C.text, cursor: 'pointer', textAlign: 'left', boxShadow: active ? `0 0 0 1px ${lens.color}33, 0 10px 26px rgba(0,0,0,.24)` : 'none' }}>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 900, marginBottom: 7 }}>{lens.label.toUpperCase()}</div>
                  <div style={{ fontSize: 20, fontWeight: 950, lineHeight: 1 }}>{lens.score}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 6 }}>scenario impact</div>
                </button>
              )
            })}
          </div>
          <div style={{ background: 'rgba(4,9,13,.54)', border: `1px solid ${selectedLens.color}40`, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: selectedLens.color, fontFamily: 'monospace', fontWeight: 900, letterSpacing: 1 }}>ACTIVE LENS</div>
                <div style={{ fontSize: 20, color: C.text, fontWeight: 900 }}>{selectedLens.label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: C.muted }}>Projected effect</div>
                <div style={{ fontSize: 24, color: selectedLens.color, fontWeight: 950 }}>{selectedLens.score}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12 }}>
              <div style={{ borderLeft: `3px solid ${C.warn}`, paddingLeft: 10 }}>
                <div style={{ fontSize: 10, color: C.warn, fontFamily: 'monospace', fontWeight: 900, marginBottom: 5 }}>RISK SIGNAL</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{selectedLens.risk}</div>
              </div>
              <div style={{ borderLeft: `3px solid ${selectedLens.color}`, paddingLeft: 10 }}>
                <div style={{ fontSize: 10, color: selectedLens.color, fontFamily: 'monospace', fontWeight: 900, marginBottom: 5 }}>NEXT MOVE</div>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{selectedLens.action}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CHARTS ROW 1 ─────────────────────────────────── */}
        <SectionLabel layer="PROJECTION DESK" title="Whitebox Election Projection Model"
          sub="Explainable source reliability, projection gates and fusion graph analysis for candidate-by-candidate reasoning" />
        <div className="projection-desk" style={{ background: 'linear-gradient(135deg, rgba(4,9,13,.96), rgba(12,25,40,.94))', border: `1px solid ${selectedProjection.color}66`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: '300px minmax(0,1fr) 360px', gap: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {projectionModes.map(modeItem => {
              const active = modeItem.id === projectionMode
              return (
                <button key={modeItem.id} onClick={() => setProjectionMode(modeItem.id)}
                  style={{ padding: '12px 13px', borderRadius: 8, border: `1px solid ${active ? modeItem.color : C.line}`, background: active ? `${modeItem.color}1F` : 'rgba(18,28,44,.64)', color: active ? modeItem.color : C.text, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 900, marginBottom: 5 }}>{modeItem.label.toUpperCase()}</div>
                  <div style={{ fontSize: 12, color: active ? C.text : C.muted, lineHeight: 1.4 }}>{modeItem.call}</div>
                </button>
              )
            })}
          </div>

          <div style={{ border: `1px solid ${selectedProjection.color}33`, borderRadius: 8, padding: '14px 16px', background: 'rgba(14,23,36,.62)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: selectedProjection.color, fontFamily: 'monospace', fontWeight: 900, letterSpacing: 1 }}>CURRENT ANALYTIC CALL</div>
                <div style={{ fontSize: 26, fontWeight: 950, color: C.text, lineHeight: 1.1 }}>{selectedProjection.call}</div>
              </div>
              <div style={{ minWidth: 132, textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: C.muted }}>Confidence</div>
                <div style={{ fontSize: 30, color: selectedProjection.color, fontWeight: 950 }}>{selectedProjection.confidence}%</div>
              </div>
            </div>
            <div style={{ height: 10, background: C.line, borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: `${selectedProjection.confidence}%`, height: '100%', background: `linear-gradient(90deg, ${selectedProjection.color}, ${C.gold})` }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: C.gold, fontFamily: 'monospace', fontWeight: 900, marginBottom: 6 }}>METHOD</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65 }}>{selectedProjection.method}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: selectedProjection.color, fontFamily: 'monospace', fontWeight: 900, marginBottom: 6 }}>PROJECTION</div>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.65 }}>{selectedProjection.projection}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: `${selectedProjection.color}12`, border: `1px solid ${selectedProjection.color}33` }}>
              <div style={{ fontSize: 10, color: selectedProjection.color, fontFamily: 'monospace', fontWeight: 900, marginBottom: 5 }}>WHITEBOX EXPLANATION</div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{selectedProjection.whitebox}</div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.line}`, fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
              <span style={{ color: C.warn, fontWeight: 900 }}>Caveat:</span> {selectedProjection.caveat}
            </div>
          </div>

          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: '14px 16px', background: 'rgba(6,18,12,.5)' }}>
            <div style={{ fontSize: 10, color: C.gold, fontFamily: 'monospace', fontWeight: 900, letterSpacing: 1, marginBottom: 10 }}>WATCH INDICATORS</div>
            {selectedProjection.triggers.map((trigger, idx) => (
              <div key={trigger} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 8, alignItems: 'start', padding: '8px 0', borderTop: idx === 0 ? 'none' : `1px solid ${C.line}` }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${selectedProjection.color}20`, color: selectedProjection.color, fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}>{idx + 1}</div>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.45 }}>{trigger}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: `${selectedProjection.color}12`, border: `1px solid ${selectedProjection.color}33`, fontSize: 11, color: C.muted, lineHeight: 1.55 }}>
              Projection rule: never call a race from sentiment alone. A first-round win requires more than 50% of valid votes cast; otherwise the model flags a runoff scenario and reweights second-round transfer paths.
            </div>
          </div>
        </div>

        <SectionLabel layer="DECISION STACK" title="5 Layer Strategy Operating System"
          sub="State → Time → Causality → Simulation → Optimization, adapted for election intelligence decisions" />
        <SectionLabel layer="HYBRID MODEL" title="Agentic Election Prediction System"
          sub="District clustering + Bayesian polling blend + structured red team + real-time reporting-order correction for Zambia" />
        <div className="hybrid-model" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 14, marginBottom: 16 }}>
          <div style={{ background: 'rgba(14,23,36,.92)', border: `1px solid ${C.gold}55`, borderRadius: 10, padding: 16 }}>
            <div className="hybrid-model__agents" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {agenticModel.map(agent => (
                <div key={agent.agent} className="card-hover" style={{ border: `1px solid ${agent.color}55`, background: `${agent.color}0D`, borderRadius: 8, padding: '12px 11px', minHeight: 190 }}>
                  <div style={{ fontSize: 10, color: agent.color, fontFamily: 'monospace', fontWeight: 950, marginBottom: 7 }}>{agent.agent.toUpperCase()}</div>
                  <div style={{ color: C.text, fontSize: 14, fontWeight: 900, marginBottom: 8 }}>{agent.method}</div>
                  <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 10 }}>{agent.input}</div>
                  <div style={{ borderTop: `1px solid ${agent.color}35`, paddingTop: 8, color: C.text, fontSize: 11, lineHeight: 1.5 }}>{agent.output}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(4,9,13,.72)', border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.gold, fontFamily: 'monospace', fontWeight: 950, letterSpacing: 1, marginBottom: 10 }}>WHITEBOX WEIGHTS</div>
            <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 8, background: `${C.teal}12`, border: `1px solid ${C.teal}40`, color: C.text, fontSize: 11, lineHeight: 1.55 }}>
              Agent communication mode: strict JSON objects with typed fields, confidence scores, caveats and evidence nodes.
            </div>
            {whiteboxWeights.map(weight => (
              <div key={weight.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: C.text, fontWeight: 800 }}>{weight.label}</div>
                  <div style={{ fontSize: 11, color: weight.color, fontFamily: 'monospace', fontWeight: 900 }}>{weight.value}%</div>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: C.line, overflow: 'hidden' }}>
                  <div style={{ width: `${weight.value * 3.1}%`, maxWidth: '100%', height: '100%', background: weight.color }} />
                </div>
                <div style={{ fontSize: 9, color: C.muted, lineHeight: 1.45, marginTop: 3 }}>{weight.note}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: '9px 11px', borderRadius: 8, background: `${C.warn}10`, border: `1px solid ${C.warn}35`, fontSize: 11, color: C.muted, lineHeight: 1.55 }}>
              Zambia adjustment: live results must be corrected for rural/urban reporting lag because early urban batches can create false momentum.
            </div>
          </div>
        </div>

        <SectionLabel layer="UNDECIDED VOTERS" title="Undecided Conversion + Classification Reasons"
          sub="How each candidate can move undecided voters, and why the model classifies lanes as Lean, Runoff Risk, Opposition Lane or News Signal" />
        <div className="undecided-model" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 14, marginBottom: 16 }}>
          <div style={{ background: 'rgba(14,23,36,.92)', border: `1px solid ${C.gold}55`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.gold, fontFamily: 'monospace', fontWeight: 950, letterSpacing: 1, marginBottom: 10 }}>UNDECIDED PATHWAYS</div>
            <div className="undecided-model__cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {undecidedConversion.map(item => (
                <div key={item.candidate} className="card-hover" style={{ border: `1px solid ${item.color}55`, background: `${item.color}0D`, borderRadius: 8, padding: '12px 11px' }}>
                  <div style={{ fontSize: 12, color: item.color, fontWeight: 900, marginBottom: 5 }}>{item.candidate}</div>
                  <div style={{ fontSize: 10, color: C.gold, fontFamily: 'monospace', fontWeight: 900, marginBottom: 6 }}>{item.pool.toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: C.text, lineHeight: 1.55, marginBottom: 8 }}>{item.path}</div>
                  <div style={{ borderTop: `1px solid ${item.color}35`, paddingTop: 7, fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{item.proof}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(4,9,13,.72)', border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.teal, fontFamily: 'monospace', fontWeight: 950, letterSpacing: 1, marginBottom: 10 }}>WHY CLASSIFIED THIS WAY</div>
            {classificationRows.map((row, idx) => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 9, padding: '9px 0', borderTop: idx === 0 ? 'none' : `1px solid ${C.line}` }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${row.color}20`, color: row.color, fontFamily: 'monospace', fontSize: 10, fontWeight: 900 }}>{idx + 1}</div>
                <div>
                  <div style={{ fontSize: 12, color: row.color, fontWeight: 900, marginBottom: 4 }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{row.why}</div>
                  <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.45, marginTop: 4 }}>{row.evidence}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="decision-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
          {decisionStack.map((layer, idx) => (
            <div key={layer.layer} className="card-hover" style={{ background: 'rgba(14,23,36,.92)', border: `1px solid ${layer.color}66`, borderRadius: 8, padding: '14px 13px', minHeight: 190 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: layer.color, fontFamily: 'monospace', fontWeight: 950, letterSpacing: 1 }}>{layer.layer}</div>
                <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${layer.color}20`, color: layer.color, fontFamily: 'monospace', fontSize: 10, fontWeight: 900 }}>{idx + 1}</div>
              </div>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 900, lineHeight: 1.25, marginBottom: 8 }}>{layer.question}</div>
              <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 10 }}>{layer.signal}</div>
              <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 9, color: layer.color, fontSize: 11, lineHeight: 1.5, fontWeight: 700 }}>{layer.output}</div>
            </div>
          ))}
        </div>

        <SectionLabel layer="TRENDS" title="20-Month Support Model — Jan 2025 to Aug 2026"
          sub="Scenario model · Jul–Aug 2026 are projected estimates · not ECZ polling ▸" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 16 }}>
          <ChartCard title="HH vs Opposition — Support Trajectory + Forecast" sub="Modelled estimates · Jul–Aug 2026 projected from trend rates · ▸ = forecast zone">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timelineData}>
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: C.muted }} />
                <YAxis tick={{ fontSize: 8, fill: C.muted }} tickFormatter={v => v + '%'} domain={[0, 60]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => typeof v === 'number' ? v.toFixed(1) + '%' : v} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <ReferenceLine y={50} stroke={C.gold} strokeDasharray="5 3" strokeWidth={0.8} />
                <ReferenceLine x="Jul'26▸" stroke={C.gold} strokeDasharray="4 3" strokeWidth={1.2} label={{ value: 'PROJECTED ▸', fill: C.gold, fontSize: 9, position: 'top' }} />
                <Line type="monotone" dataKey="HH (UPND)"       stroke={C.upnd} strokeWidth={3}   dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Mundubile + Makebi" stroke={C.pf}   strokeWidth={2.5} dot={{ r: 2.5 }} strokeDasharray="5 3" />
                <Line type="monotone" dataKey="Kalaba (CF)"       stroke={C.dp}   strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="3 2" />
                <Line type="monotone" dataKey="M'membe (SP)"     stroke={C.sp}   strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="2 3" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="National Support Estimate — May 2026" sub="Modelled estimate · ECZ voter register: 8,786,300 · opposition labels updated from current public reporting">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pollData} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2} label={({ value }) => `${value.toFixed(1)}%`} labelLine={false}>
                  {pollData.map((entry, i) => <Cell key={i} fill={entry.color} stroke={C.bg} strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => typeof v === 'number' ? v.toFixed(1) + '%' : v} />
                <Legend wrapperStyle={{ fontSize: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── CHARTS ROW 2 ─────────────────────────────────── */}
        <SectionLabel layer="SENTIMENT" title="What Voters Are Saying — By Platform & Issue"
          sub="How positive or negative people are about UPND on each platform, and which issues drive their views" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <ChartCard title="PLATFORM SENTIMENT — UPND (30 DAYS)" sub="Facebook, Twitter/X, Lusaka Times, Observer, ZNBC, WhatsApp Groups">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={platData}>
                <XAxis dataKey="platform" tick={{ fontSize: 8, fill: C.muted }} />
                <YAxis tick={{ fontSize: 8, fill: C.muted }} tickFormatter={v => v + '%'} domain={[0, 80]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => typeof v === 'number' ? v + '%' : v} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="Positive" fill={C.teal}  radius={[3,3,0,0]} />
                <Bar dataKey="Negative" fill={C.warn}  radius={[3,3,0,0]} />
                <Bar dataKey="Neutral"  fill={C.muted} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="VOTER ISSUE RADAR — HH (UPND) vs PF" sub="0-100 AI sentiment scale per policy area">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={issueData} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke={C.line} />
                <PolarAngleAxis dataKey="issue" tick={{ fontSize: 7.5, fill: C.muted }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 7, fill: C.line }} />
                <Radar name="HH/UPND" dataKey="UPND" stroke={C.upnd} fill={C.upnd} fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Mundubile + Makebi" dataKey="PF" stroke={C.pf} fill={C.pf} fillOpacity={0.15} strokeWidth={1.5} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── PROVINCIAL & SIMULATION ──────────────────────── */}
        <SectionLabel layer="PROVINCES & SCENARIOS" title="Where Voters Are — and What Could Change the Result"
          sub="Province-by-province voter breakdown · Simulated HH vote share if key policies are delivered" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <ChartCard title="VOTER REGISTER & PARTY LEAD BY PROVINCE" sub="ECZ 2025 estimates · Orange = contested · Green = UPND · Red = PF">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={provData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 8, fill: C.muted }} tickFormatter={v => v + 'K'} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: C.muted }} width={70} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="Voters (K)" radius={[0,3,3,0]}>
                  {provData.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="SCENARIO MODELLING — HH VOTE PROJECTION" sub={`50%+1 first-round gate · Baseline: 47.2% · gap: ${firstRoundGap.toFixed(1)} pts`}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={simData}>
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: C.muted }} />
                <YAxis tick={{ fontSize: 8, fill: C.muted }} tickFormatter={v => v + '%'} domain={[42, 66]} />
                <Tooltip contentStyle={tooltipStyle}
                  content={({ active, payload }) => active && payload?.length ? (
                    <div style={{ ...tooltipStyle, padding: '8px 12px' }}>
                      <div style={{ fontWeight: 700, color: C.text }}>{payload[0].payload.label}</div>
                      <div style={{ color: payload[0].payload.color, fontSize: 14, fontWeight: 900 }}>{(payload[0].value as number).toFixed(1)}%</div>
                      <div style={{ fontSize: 9, color: C.muted, maxWidth: 180 }}>{payload[0].payload.desc}</div>
                    </div>
                  ) : null} />
                <ReferenceLine y={50} stroke={C.gold} strokeDasharray="5 3" label={{ value: '50%+1 gate', fill: C.gold, fontSize: 9 }} />
                <Bar dataKey="Vote %" radius={[4,4,0,0]}>
                  {simData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── NLP HEADLINE ANALYZER ────────────────────────── */}
        <SectionLabel layer="NEWS INTELLIGENCE" title="Zambian News Sentiment + Event Monitor"
          sub="ZNBC, News Diggers, Lusaka Times, The Mast, Zambian Observer and GDELT-style event signals scored for strategy and 50%+1 runoff risk" />
        <div style={{ background: C.card, border: `1px solid ${C.teal}`, borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${C.teal}22`, border: `2px solid ${C.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🧠</div>
              <div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 11, color: C.teal }}>NEWS + VADER-ZAMBIA NLP ENGINE · POLITICAL HEADLINE SENTIMENT</div>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace', marginTop: 2 }}>
                  {nlpData ? `${nlpData.lexiconSize}-word Zambian political lexicon · ${nlpData.engine}` : 'Loading NLP engine...'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {nlpData && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: C.muted }}>Media Sentiment</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: nlpData.summary.overallSentiment === 'positive' ? C.teal : nlpData.summary.overallSentiment === 'negative' ? C.warn : C.gold }}>
                    {nlpData.summary.overallSentiment.toUpperCase()} · {nlpData.summary.avgDisplayScore}/100
                  </div>
                </div>
              )}
              <button onClick={fetchNlpSentiment} disabled={nlpLoading}
                style={{ padding: '8px 16px', background: C.teal, color: 'white', border: 'none', borderRadius: 6, fontFamily: 'monospace', fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                {nlpLoading ? '⟳ SCORING...' : '⟳ REFRESH'}
              </button>
            </div>
          </div>

          {/* Summary pills */}
          {nlpData && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'POSITIVE', count: nlpData.summary.positive, color: C.teal },
                { label: 'NEGATIVE', count: nlpData.summary.negative, color: C.warn },
                { label: 'NEUTRAL', count: nlpData.summary.neutral, color: C.gold },
              ].map(item => (
                <div key={item.label} style={{ padding: '4px 14px', borderRadius: 12, background: `${item.color}18`, border: `1px solid ${item.color}`, fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: item.color }}>
                  {item.label}: {item.count}
                </div>
              ))}
              <div style={{ padding: '4px 14px', borderRadius: 12, background: `${C.muted}18`, border: `1px solid ${C.muted}`, fontSize: 10, fontFamily: 'monospace', color: C.muted }}>
                avg compound: {nlpData.summary.avgCompound > 0 ? '+' : ''}{nlpData.summary.avgCompound}
              </div>
            </div>
          )}

          {/* Headlines grid */}
          {nlpData ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {nlpData.results.map((h, i) => {
                const sentColor = h.sentiment_class === 'positive' ? C.teal : h.sentiment_class === 'negative' ? C.warn : C.gold
                return (
                  <div key={i} style={{ background: C.card2, border: `1px solid ${sentColor}30`, borderLeft: `3px solid ${sentColor}`, borderRadius: 6, padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 44 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: sentColor }}>{h.score_display}</div>
                      <div style={{ fontSize: 8, color: C.muted, fontFamily: 'monospace' }}>/100</div>
                      <div style={{ fontSize: 7, fontFamily: 'monospace', marginTop: 3, padding: '2px 4px', borderRadius: 4, background: `${sentColor}20`, color: sentColor }}>{h.sentiment_class.toUpperCase()}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: C.text, lineHeight: 1.55, marginBottom: 4, fontStyle: 'italic' }}>&ldquo;{h.headline}&rdquo;</div>
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
                        {h.source} · compound: <span style={{ color: sentColor }}>{h.sentiment_score > 0 ? '+' : ''}{h.sentiment_score}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontFamily: 'monospace', fontSize: 10 }}>
              {nlpLoading ? '🧠 VADER NLP engine scoring headlines...' : 'Click Refresh to run NLP analysis'}
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: 10, color: C.muted, textAlign: 'center', fontFamily: 'monospace' }}>
            News rule: stories must be mapped to issue, province, candidate and 50%+1 threshold impact before they influence strategy. VADER algorithm · Zambia domain lexicon · Compound score: −1.0 to +1.0
          </div>
        </div>

        {/* ── FACEBOOK SENTIMENT ────────────────────────────── */}
        <SectionLabel layer="SOCIAL MEDIA" title="Facebook Public Page Monitoring — AI Sentiment Analysis"
          sub="Fetches live posts & comments from each candidate's public Facebook page · AI-classified sentiment analysis · Refreshes on demand" />
        <div style={{ background: C.card, border: `1px solid #1877F2`, borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'white', flexShrink: 0 }}>f</div>
              <div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 11, color: '#1877F2' }}>FACEBOOK PAGE MONITORING · AI SENTIMENT</div>
                <div style={{ fontSize: 8, color: C.muted, fontFamily: 'monospace', marginTop: 2 }}>
                  Live: HH · Mundubile-Makebi · Harry Kalaba · Fred M&#39;membe · AI analysis of posts &amp; public comments
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {fbSentiment.length > 0 && fbSentiment[0].liveData && (
                <span style={{ fontSize: 9, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4, background: '#00C9A720', color: '#00C9A7', border: '1px solid #00C9A740' }}>
                  🟢 LIVE DATA
                </span>
              )}
              <button onClick={fetchFbSentiment} disabled={fbLoading}
                style={{ padding: '8px 16px', background: '#1877F2', color: 'white', border: 'none', borderRadius: 6, fontFamily: 'monospace', fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                {fbLoading ? '⟳ FETCHING...' : '⟳ REFRESH'}
              </button>
            </div>
          </div>
          {fbSentiment.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {fbSentiment.map(fb => {
                const sentColor = fb.analysis.sentiment === 'positive' ? C.teal : fb.analysis.sentiment === 'negative' ? C.warn : C.gold
                const fig = ELECTION_DATA.figures.find(f => f.id === fb.leaderId)
                const lColor = fig?.color ?? C.muted
                return (
                  <div key={fb.leaderId} className="card-hover rounded-xl p-4" style={{ background: C.card2, border: `1.5px solid ${lColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: `${lColor}20`, border: `2px solid ${lColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: lColor }}>
                        {fig?.shortName ?? fb.leaderId.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: lColor }}>{fb.leaderName}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>fb/{fb.fbPage}</div>
                      </div>
                      {fb.liveData && (
                        <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: '#00C9A720', color: '#00C9A7', border: '1px solid #00C9A740', flexShrink: 0 }}>LIVE</span>
                      )}
                    </div>
                    {fb.liveData && (
                      <div style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace', marginBottom: 8, background: C.line, borderRadius: 4, padding: '4px 8px' }}>
                        {fb.postsCount} posts · {fb.commentsCount} comments fetched
                      </div>
                    )}
                    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: `${sentColor}20`, color: sentColor, border: `1px solid ${sentColor}` }}>
                      {fb.analysis.sentiment.toUpperCase()}
                    </span>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 10, marginBottom: 4 }}>Public Sentiment Score</div>
                    <div style={{ background: C.line, borderRadius: 3, height: 10, marginBottom: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${fb.analysis.score}%`, height: '100%', background: sentColor, transition: 'width 0.8s' }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: sentColor, textAlign: 'right', marginBottom: 10 }}>{fb.analysis.score}/100</div>
                    <p style={{ fontSize: 11, color: C.text, lineHeight: 1.65, marginBottom: 10, opacity: 0.9 }}>{fb.analysis.summary}</p>
                    <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 6 }}>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Top Themes</div>
                      {fb.analysis.topThemes.map((t, i) => (
                        <div key={i} style={{ fontSize: 11, color: C.muted, lineHeight: 1.8, paddingLeft: 12, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0, color: lColor }}>▸</span>{t}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 9, color: '#444', marginTop: 10, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{fb.sampleCount} texts</span>
                      <span style={{ padding: '1px 5px', borderRadius: 3, background: fb.mcpLayer === 'apify' ? '#F5C40020' : fb.mcpLayer === 'brightdata' ? '#00C9A720' : fb.mcpLayer === 'fb-api' ? '#1877F220' : '#33333330', color: fb.mcpLayer === 'apify' ? '#F5C400' : fb.mcpLayer === 'brightdata' ? '#00C9A7' : fb.mcpLayer === 'fb-api' ? '#1877F2' : '#555' }}>
                        {fb.mcpLayer === 'apify' ? '⚡ Apify MCP' : fb.mcpLayer === 'brightdata' ? '⚡ BrightData MCP' : fb.mcpLayer === 'fb-api' ? 'FB API' : '◎ curated'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontFamily: 'monospace', fontSize: 10 }}>
              {fbLoading ? '⟳ Fetching Facebook pages and running AI analysis...' : 'Click REFRESH to fetch live Facebook data and run AI sentiment analysis'}
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 9, color: '#444', fontFamily: 'monospace', borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
            MCP priority: Apify → BrightData → FB Graph API → curated samples · AI sentiment analysis · Set APIFY_API_TOKEN in Vercel to enable live scraping
          </div>
        </div>

        {/* ── TWITTER/X SENTIMENT ───────────────────────────────── */}
        <SectionLabel layer="TWITTER/X" title="Twitter/X Candidate Sentiment — AI Analysis + Strategy Guide"
          sub="Live tweets scored by AI · Devil's advocate critique + strategic counter-move for each candidate" />
        <div style={{ background: C.card, border: `1px solid #1DA1F2`, borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1DA1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: 'white', flexShrink: 0 }}>𝕏</div>
              <div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 11, color: '#1DA1F2' }}>TWITTER/X MONITORING · AI SENTIMENT + STRATEGY</div>
                <div style={{ fontSize: 8, color: C.muted, fontFamily: 'monospace', marginTop: 2 }}>
                  Live: HH · Mundubile-Makebi · Kalaba · M&#39;membe · Devil&#39;s advocate + strategic counter per candidate
                </div>
              </div>
            </div>
            <button onClick={fetchTwSentiment} disabled={twLoading}
              style={{ padding: '8px 16px', background: '#1DA1F2', color: 'white', border: 'none', borderRadius: 6, fontFamily: 'monospace', fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
              {twLoading ? '⟳ FETCHING...' : '⟳ REFRESH'}
            </button>
          </div>
          {twSentiment.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {twSentiment.map(tw => {
                const sentColor = tw.analysis.sentiment === 'positive' ? C.teal : tw.analysis.sentiment === 'negative' ? C.warn : C.gold
                const fig = ELECTION_DATA.figures.find(f => f.id === tw.candidateId)
                const lColor = fig?.color ?? C.muted
                return (
                  <div key={tw.candidateId} className="card-hover rounded-xl p-4" style={{ background: C.card2, border: `1.5px solid ${lColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `${lColor}20`, border: `2px solid ${lColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: lColor }}>{fig?.shortName ?? tw.candidateId.toUpperCase().slice(0,2)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: lColor }}>{tw.candidateName}</div>
                        <div style={{ fontSize: 9, color: '#1DA1F2', fontFamily: 'monospace' }}>𝕏 Twitter/X</div>
                      </div>
                      {tw.liveData && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: '#00C9A720', color: '#00C9A7', border: '1px solid #00C9A740', flexShrink: 0 }}>LIVE</span>}
                    </div>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: `${sentColor}20`, color: sentColor, border: `1px solid ${sentColor}`, display: 'inline-block', marginBottom: 8 }}>
                      {tw.analysis.sentiment.toUpperCase()} · {tw.analysis.score}/100
                    </span>
                    <p style={{ fontSize: 11, color: C.text, lineHeight: 1.6, marginBottom: 8, opacity: 0.9 }}>{tw.analysis.summary}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {tw.analysis.topThemes.map((t, i) => (
                        <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `${lColor}15`, color: lColor, border: `1px solid ${lColor}30` }}>{t}</span>
                      ))}
                    </div>
                    {tw.analysis.devilsAdvocate && (
                      <div style={{ background: `${C.warn}10`, border: `1px solid ${C.warn}30`, borderLeft: `3px solid ${C.warn}`, borderRadius: 5, padding: '8px 10px', marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: C.warn, fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>⚔ DEVIL&#39;S ADVOCATE</div>
                        <div style={{ fontSize: 10, color: C.text, lineHeight: 1.6, opacity: 0.9 }}>{tw.analysis.devilsAdvocate}</div>
                      </div>
                    )}
                    {tw.analysis.strategicCounter && (
                      <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderLeft: `3px solid ${C.teal}`, borderRadius: 5, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, color: C.teal, fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>✅ STRATEGIC COUNTER</div>
                        <div style={{ fontSize: 10, color: C.text, lineHeight: 1.6, opacity: 0.9 }}>{tw.analysis.strategicCounter}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontFamily: 'monospace', fontSize: 10 }}>
              {twLoading ? '⟳ Fetching Twitter/X and running AI analysis...' : 'Loading Twitter/X sentiment...'}
            </div>
          )}
        </div>

        {/* ── TIKTOK YOUTH SENTIMENT ────────────────────────────── */}
        <SectionLabel layer="TIKTOK · YOUTH" title="TikTok Youth Sentiment — 18-35 Voter Intelligence"
          sub="How young Zambians talk about each candidate on TikTok · Youth grievance + candidate strategy guide" />
        <div style={{ background: C.card, border: `1px solid #FE2C55`, borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#FE2C55,#25F4EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎵</div>
              <div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 11, color: '#FE2C55' }}>TIKTOK YOUTH INTELLIGENCE · 18–35 VOTER SENTIMENT</div>
                <div style={{ fontSize: 8, color: C.muted, fontFamily: 'monospace', marginTop: 2 }}>
                  Youth grievance · devil&#39;s advocate · strategic counter-move per candidate · 32.6% highest youth-cohort unemployment context
                </div>
              </div>
            </div>
            <button onClick={fetchTtSentiment} disabled={ttLoading}
              style={{ padding: '8px 16px', background: '#FE2C55', color: 'white', border: 'none', borderRadius: 6, fontFamily: 'monospace', fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
              {ttLoading ? '⟳ FETCHING...' : '⟳ REFRESH'}
            </button>
          </div>
          {ttSentiment.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {ttSentiment.map(tt => {
                const sentColor = tt.analysis.sentiment === 'positive' ? C.teal : tt.analysis.sentiment === 'negative' ? C.warn : C.gold
                const fig = ELECTION_DATA.figures.find(f => f.id === tt.candidateId)
                const lColor = fig?.color ?? C.muted
                return (
                  <div key={tt.candidateId} className="card-hover rounded-xl p-4" style={{ background: C.card2, border: `1.5px solid ${lColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `${lColor}20`, border: `2px solid ${lColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: lColor }}>{fig?.shortName ?? tt.candidateId.toUpperCase().slice(0,2)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: lColor }}>{tt.candidateName}</div>
                        <div style={{ fontSize: 9, color: '#FE2C55', fontFamily: 'monospace' }}>🎵 TikTok Youth</div>
                      </div>
                      {tt.liveData && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: '#00C9A720', color: '#00C9A7', border: '1px solid #00C9A740', flexShrink: 0 }}>LIVE</span>}
                    </div>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: `${sentColor}20`, color: sentColor, border: `1px solid ${sentColor}`, display: 'inline-block', marginBottom: 8 }}>
                      {tt.analysis.sentiment.toUpperCase()} · {tt.analysis.score}/100
                    </span>
                    <p style={{ fontSize: 11, color: C.text, lineHeight: 1.6, marginBottom: 8, opacity: 0.9 }}>{tt.analysis.summary}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {tt.analysis.topThemes.map((t, i) => (
                        <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `${lColor}15`, color: lColor, border: `1px solid ${lColor}30` }}>{t}</span>
                      ))}
                    </div>
                    {tt.analysis.youthGrievance && (
                      <div style={{ background: `${C.sp}10`, border: `1px solid ${C.sp}30`, borderLeft: `3px solid ${C.sp}`, borderRadius: 5, padding: '8px 10px', marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: C.sp, fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>🎤 YOUTH GRIEVANCE</div>
                        <div style={{ fontSize: 10, color: C.text, lineHeight: 1.6, opacity: 0.9 }}>{tt.analysis.youthGrievance}</div>
                      </div>
                    )}
                    {tt.analysis.devilsAdvocate && (
                      <div style={{ background: `${C.warn}10`, border: `1px solid ${C.warn}30`, borderLeft: `3px solid ${C.warn}`, borderRadius: 5, padding: '8px 10px', marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: C.warn, fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>⚔ DEVIL&#39;S ADVOCATE</div>
                        <div style={{ fontSize: 10, color: C.text, lineHeight: 1.6, opacity: 0.9 }}>{tt.analysis.devilsAdvocate}</div>
                      </div>
                    )}
                    {tt.analysis.strategicCounter && (
                      <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderLeft: `3px solid ${C.teal}`, borderRadius: 5, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, color: C.teal, fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>✅ STRATEGIC COUNTER</div>
                        <div style={{ fontSize: 10, color: C.text, lineHeight: 1.6, opacity: 0.9 }}>{tt.analysis.strategicCounter}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontFamily: 'monospace', fontSize: 10 }}>
              {ttLoading ? '⟳ Fetching TikTok youth data and running AI analysis...' : 'Loading TikTok youth sentiment...'}
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 9, color: '#444', fontFamily: 'monospace', borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
            Youth context: 32.6% unemployment in the 19-22 cohort · certified youth voters are 46.3% of the register · TikTok fastest growing in 18-35 bracket · Apify clockworks~tiktok-scraper
          </div>
        </div>

        {/* ── INTELLIGENCE FRAMEWORK ─────────────────────────── */}
        <SectionLabel layer="INTELLIGENCE" title="How the AI Analyses the Election"
          sub="Our platform moves from live monitoring, to trend analysis, to root causes, to scenario planning, and finally to clear action recommendations" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { icon: '📡', name: 'Live Monitoring',     color: C.zg,   q: 'What is happening right now?',   items: ['Real-time data aggregation','Facebook · Twitter/X · WhatsApp','Lusaka Times · Observer · ZNBC','8,786,300-voter register mapped','Province-level sentiment tracking'] },
            { icon: '📈', name: 'Trend Analysis',      color: C.ndc,  q: 'How is support changing?',        items: ['18-month trajectory modelling','Rising opposition momentum tracked','Load-shedding impact on polls','Budget 2026 voter impact scored','Coalition watch: Kalaba & others'] },
            { icon: '🔍', name: 'Root Cause Analysis', color: C.teal, q: 'Why are voters feeling this way?',items: ['AI identifies what drives opinion','Fuel & food costs → negative posts','PF nostalgia in northern regions',"TikTok youth drift to M'membe",'Kwacha performance vs Twitter/X'] },
            { icon: '🎯', name: 'Scenario Planning',   color: C.gold, q: 'What could change the result?',   items: ['6 policy impact scenarios tested','Energy fix → +4.2 pts projected','Cost relief → +3.8 pts projected','Combined strategy → +6.1 pts','Mundubile ceiling if surge holds'] },
            { icon: '✅', name: 'Action Priorities',   color: C.upnd, q: 'What should happen next?',         items: ['Ranked action recommendations','Energy roadmap: publish & deliver','TikTok/X rapid response capability','Mealie relief: visible & targeted','Northern Province rally strategy'] },
          ].map(l => (
            <div key={l.name} className="card-hover rounded-xl p-4" style={{ border: `1.5px solid ${l.color}`, background: `${l.color}08` }}>
              <div style={{ textAlign: 'center', fontSize: 32, marginBottom: 6 }}>{l.icon}</div>
              <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 13, color: l.color, marginBottom: 5 }}>{l.name}</div>
              <div style={{ textAlign: 'center', fontSize: 10, color: C.muted, fontStyle: 'italic', marginBottom: 12, minHeight: 32 }}>{l.q}</div>
              <div style={{ borderTop: `1px solid ${l.color}30`, paddingTop: 10 }}>
                {l.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.text, lineHeight: 2, paddingLeft: 14, position: 'relative', opacity: 0.85 }}>
                    <span style={{ position: 'absolute', left: 0, color: l.color }}>▸</span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── COUNTER-MEASURES ─────────────────────────────── */}
        <SectionLabel layer="PLAYBOOK" title="Counter-Measure Planning — How UPND Should Respond"
          sub="AI-recommended actions for each threat UPND faces, with estimated vote impact if implemented" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
          {ELECTION_DATA.counterMeasures.map(cm => (
            <div key={cm.threat} className="card-hover rounded-xl p-4" style={{ background: C.card, border: `1.5px solid ${cm.color}` }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: cm.color, marginBottom: 8, lineHeight: 1.3 }}>{cm.threat}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: cm.color, marginBottom: 8 }}>{cm.pollImpact}</div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: `${cm.color}20`, color: cm.color, border: `1px solid ${cm.color}`, display: 'inline-block', marginBottom: 12 }}>{cm.priority}</span>
              <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                {cm.actions.map((a, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.text, lineHeight: 1.8, paddingLeft: 16, position: 'relative', opacity: 0.9, marginBottom: 2 }}>
                    <span style={{ position: 'absolute', left: 0, color: cm.color }}>{i + 1}.</span>{a}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── STRATEGY PANEL ────────────────────────────────── */}
        <SectionLabel layer="STRATEGY" title="AI Priority Recommendations — UPND 2026"
          sub="What the data says should happen next — ranked by projected vote impact" />
        <div style={{ background: C.card, border: `1px solid ${C.zg}`, borderRadius: 8, padding: 18, marginBottom: 16 }}>
          {[
            { n: '01', color: C.zg,   pri: 'HIGH',   title: 'ENERGY ROADMAP — PUBLISH & DELIVER', desc: 'Announce 18-month Zesco/solar roadmap. #1 highest impact action: +4.2pts. Each week of resolved load shedding = +0.8pt. Most urgent given 44% negative energy sentiment on Twitter/X and TikTok.' },
            { n: '02', color: C.teal, pri: 'HIGH',   title: 'TIKTOK & TWITTER/X RAPID RESPONSE DESK', desc: "24/7 AI-curated rebuttal content unit. Mundubile and M'membe gaining 18-35 audience on these platforms. Highest negative sentiment platforms for UPND. Critical capability gap." },
            { n: '03', color: C.upnd, pri: 'HIGH',   title: 'MEALIE MEAL + FUEL VISIBLE RELIEF', desc: 'Province-by-province targeted subsidy: Lusaka, Copperbelt, Northern first. Make delivery visible via state media, Facebook live, ZNBC. +3.8pts projected. Copperbelt is the swing province.' },
            { n: '04', color: C.warn, pri: 'HIGH',   title: 'NORTHERN PROVINCE — COUNTER MUNDUBILE SURGE', desc: 'Mundubile gaining +1.8pts/month. HH in-person rally tour: Northern, Luapula, Muchinga. Bemba-language radio + podcast. Local MP mobilisation. Target before September 2026.' },
            { n: '05', color: C.gold, pri: 'MEDIUM', title: 'INFRASTRUCTURE VISIBILITY CAMPAIGN', desc: 'Roads, clinics, schools 2021-2026 score 72/100 — highest UPND asset. Severely under-communicated. AI-generated visual content per province. Facebook video + ZNBC special programmes.' },
            { n: '06', color: C.sp,   pri: 'WATCH',  title: "M'MEMBE URBAN YOUTH — MONITOR & COUNTER", desc: "M'membe TikTok reach growing in 18-35 bracket. Deploy UPND youth creator network. Frame M'membe's socialist policies as investment killer. Escalate if SP crosses 5.5%." },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 0', borderBottom: `1px solid ${C.line}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'white', flexShrink: 0 }}>{s.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: s.color, marginBottom: 5 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65 }}>{s.desc}</div>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, padding: '4px 12px', borderRadius: 10, flexShrink: 0, marginTop: 4, background: s.pri === 'HIGH' ? `${C.warn}20` : s.pri === 'WATCH' ? `${C.sp}20` : `${C.gold}15`, color: s.pri === 'HIGH' ? C.warn : s.pri === 'WATCH' ? C.sp : C.gold, border: `1px solid ${s.pri === 'HIGH' ? C.warn : s.pri === 'WATCH' ? C.sp : C.gold}` }}>{s.pri}</span>
            </div>
          ))}
        </div>

        {/* ── ECONOMIC INDICATORS ──────────────────────────── */}
        <SectionLabel layer="ECONOMICS" title="Macroeconomic Context — Key Voter Pressure Points"
          sub="Real-world economic data that directly shapes voter sentiment in Zambia 2026" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'INFLATION (CPI)', value: '6.8%', sub: 'ZamStats Apr 2026', color: C.warn, note: 'Voter pressure: cost of living' },
            { label: 'BoZ POLICY RATE', value: '13.25%', sub: 'Bank of Zambia', color: C.gold, note: 'High borrowing cost impact' },
            { label: 'KWACHA/USD', value: 'K26.8', sub: 'Approx. May 2026', color: C.ndc, note: 'Stability vs 2021 baseline K23' },
            { label: 'GDP GROWTH', value: '4.2%', sub: 'World Bank 2026 proj.', color: C.teal, note: '↑ Positive macro signal' },
            { label: 'YOUTH UNEMPLOYMENT', value: '32.6%', sub: 'ZamStats 2024, age 19-22', color: C.sp, note: 'Youth voter risk factor' },
            { label: 'MEALIE MEAL 25KG', value: '~K400', sub: 'National avg price', color: C.zr, note: '↑ Key voter grievance' },
          ].map(ind => (
            <div key={ind.label} className="card-hover rounded-lg p-4 text-center" style={{ background: C.card2, border: `2px solid ${ind.color}` }}>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{ind.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: ind.color, marginBottom: 4 }}>{ind.value}</div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{ind.sub}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: ind.color }}>{ind.note}</div>
            </div>
          ))}
        </div>

        {/* ── OPEN INTELLIGENCE SOURCES ───────────────────────── */}
        <SectionLabel layer="OSINT" title="Open Intelligence Source Matrix"
          sub="Public sources to cross-check election claims, campaign narratives, civic-space risks, economic pressure, and geospatial context" />
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[
              {
                category: 'Official Election',
                color: C.zg,
                sources: [
                  { name: 'ECZ', url: 'https://www.elections.org.zm/', use: 'Register, roadmap, results, constituencies' },
                  { name: 'National Assembly', url: 'https://www.parliament.gov.zm/', use: 'Delimitation, MPs, parliamentary notices' },
                  { name: 'ZambiaLII', url: 'https://zambialii.org/', use: 'Constitution, election law, court materials' },
                ],
              },
              {
                category: 'Economy',
                color: C.teal,
                sources: [
                  { name: 'ZamStats', url: 'https://www.zamstats.gov.zm/', use: 'CPI, labour force, demographics' },
                  { name: 'Bank of Zambia', url: 'https://www.boz.zm/', use: 'Policy rate, exchange-rate context' },
                  { name: 'World Bank', url: 'https://www.worldbank.org/en/country/zambia', use: 'Growth forecasts, macro context' },
                ],
              },
              {
                category: 'Election Integrity',
                color: C.gold,
                sources: [
                  { name: 'CCMG Zambia', url: 'https://ccmgzambia.org/', use: 'Long-term observation, code violations' },
                  { name: 'iVerify Zambia', url: 'https://iverify.org/', use: 'Mis/disinformation checks' },
                  { name: 'CIVICUS Monitor', url: 'https://monitor.civicus.org/', use: 'Civic space and rights context' },
                ],
              },
              {
                category: 'Open Web Signals',
                color: C.ndc,
                sources: [
                  { name: 'Google Trends', url: 'https://trends.google.com/', use: 'Search interest by region and topic' },
                  { name: 'GDELT', url: 'https://www.gdeltproject.org/', use: 'Global news/event monitoring' },
                  { name: 'DataReportal', url: 'https://datareportal.com/', use: 'Digital audience and platform context' },
                ],
              },
              {
                category: 'Geospatial',
                color: C.zo,
                sources: [
                  { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/', use: 'Base maps, settlements, roads' },
                  { name: 'HDX', url: 'https://data.humdata.org/', use: 'Administrative boundaries and humanitarian data' },
                  { name: 'OONI Explorer', url: 'https://explorer.ooni.org/', use: 'Internet measurement and access checks' },
                ],
              },
              {
                category: 'Media Watch',
                color: C.warn,
                sources: [
                  { name: 'ZNBC', url: 'https://znbc.co.zm/', use: 'Public broadcaster signals' },
                  { name: 'News Diggers!', url: 'https://diggers.news/', use: 'Independent reporting and investigations' },
                  { name: 'MISA Zambia', url: 'https://zambia.misa.org/', use: 'Press freedom and media safety' },
                ],
              },
            ].map(group => (
              <div key={group.category} className="card-hover" style={{ background: C.card2, border: `1px solid ${group.color}55`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: group.color, fontFamily: 'monospace', marginBottom: 10 }}>{group.category.toUpperCase()}</div>
                {group.sources.map(source => (
                  <a key={source.name} href={source.url} target="_blank" rel="noreferrer"
                    style={{ display: 'block', textDecoration: 'none', padding: '8px 0', borderTop: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 2 }}>{source.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.45 }}>{source.use}</div>
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 10, color: C.muted, lineHeight: 1.6, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            OSINT rule: official numbers come first, civil-society and media sources corroborate behaviour on the ground, and social/open-web signals are treated as directional indicators until verified.
          </div>
        </div>

        {/* ── NEWS SOURCES ─────────────────────────────────── */}
        <SectionLabel layer="SOURCES" title="Zambia 2026 Election — Verified News & Intelligence Sources"
          sub="Cross-check any claim with these authoritative sources. AI can make mistakes — always verify." />
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {[
              {
                category: '🏛️ Official & Polling',
                color: C.zg,
                sources: [
                  { name: 'Electoral Commission of Zambia (ECZ)', desc: '226 constituencies · 8,786,300 voters certified for 2026 · official results' },
                  { name: 'ZANIS', desc: 'Government official public relations service' },
                  { name: 'Afrobarometer Round 10', desc: 'Pan-African survey · Zambia 2024 module — public opinion data' },
                ],
              },
              {
                category: '📰 Independent Print & Online',
                color: C.ndc,
                sources: [
                  { name: 'News Diggers!', desc: 'Investigative journalism, highly influential' },
                  { name: 'The Mast', desc: 'Prominent independent daily' },
                  { name: 'Daily Nation', desc: 'Private daily, political coverage' },
                  { name: 'Zambia Daily Mail & Times', desc: 'State-owned broad coverage' },
                ],
              },
              {
                category: '📺 Broadcast & TV',
                color: C.zo,
                sources: [
                  { name: 'ZNBC', desc: 'Public broadcaster — TV & Radio' },
                  { name: 'Diamond TV', desc: 'Influential private television' },
                  { name: 'Prime TV', desc: 'Private channel, wide viewership' },
                  { name: 'MUVI Television', desc: 'Independent, widely watched' },
                  { name: 'Radio Phoenix', desc: 'Political debates & analysis' },
                ],
              },
              {
                category: '🌍 International & Economic',
                color: C.teal,
                sources: [
                  { name: 'Mail & Guardian Africa', desc: 'In-depth Zambia political analysis' },
                  { name: 'DW Africa', desc: 'Regional coverage & election insights' },
                  { name: 'IFES', desc: 'Expert election analysis & technical data' },
                  { name: 'ZamStats', desc: 'CPI 6.8% · official economic statistics' },
                  { name: 'Bank of Zambia', desc: 'Policy rate 13.25% · monetary policy' },
                  { name: 'DataReportal / platform monitoring', desc: 'Social audience context · app uses configured platform scrapers when credentials exist' },
                ],
              },
              {
                category: '🔍 Integrity & Press Freedom',
                color: C.gold,
                sources: [
                  { name: 'iVerify Zambia', desc: 'UN/EU misinformation verification — check any claim here first' },
                  { name: 'OONI Zambia', desc: 'Open Observatory Network Interference — internet freedom data' },
                  { name: 'CIVICUS Monitor', desc: 'Civic space rating: OBSTRUCTED — freedom of assembly data' },
                  { name: 'MISA Zambia', desc: 'Press freedom & journalist safety monitor' },
                  { name: 'PAZA', desc: 'Media ethics, electoral reporting standards' },
                ],
              },
            ].map(group => (
              <div key={group.category}>
                <div style={{ fontSize: 12, fontWeight: 800, color: group.color, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${group.color}40` }}>{group.category}</div>
                {group.sources.map(s => (
                  <div key={s.name} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 2 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}`, fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.6 }}>
            <span style={{ color: C.gold, fontWeight: 700 }}>⚠ Verification Reminder:</span> For official results, always check the Electoral Commission of Zambia (ECZ) website.
            Use <span style={{ color: C.teal }}>iVerify Zambia</span> to check any news that seems inaccurate or misleading.
            AI analysis on this platform supplements — it does not replace — authoritative sources.
          </div>
        </div>

        </details>
        )}

      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ background: '#000', borderTop: `3px solid ${C.zo}`, padding: '20px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, fontSize: 11, fontFamily: 'monospace', color: C.muted, marginBottom: 16 }}>
          {[
            ['INTELLIGENCE SOURCES', ['Facebook (HH, Mundubile-Makebi, Kalaba, M\'membe)', 'Twitter/X · WhatsApp signal tracking', 'Afrobarometer R10 · public media monitoring', 'iVerify Zambia · OONI · CIVICUS', 'ECZ · ZamStats · BoZ · World Bank']],
            ['VOTER REGISTER (ECZ 2026)', ['Total: 8,786,300 · 226 constituencies', 'Lusaka: 1,430,889', 'Copperbelt: 1,296,446', 'Eastern: 1,129,444', 'Southern: 1,103,275', 'Other provinces: 3,826,246']],
            ['ECONOMIC CONTEXT', ['Inflation (ZamStats): 6.6% ↓ (lowest since Feb 2018)', 'BoZ Policy Rate: 13.25%', 'Kwacha/USD: K19.87 ↑ (6-year high)', 'Copper LME: $13,090/t ↑', 'Mealie Meal 25kg: K289 ↓', 'Youth unemployment 19-22: 32.6%']],
            ['ENGAGEMENT PACKAGE', ['Package: PREMIUM 90-day', 'Real-time + daily AI reports', 'Dedicated Account Manager', 'Alert threshold: ±3 points', 'Election Day: 13 Aug 2026', 'Next report: Sunday']],
          ].map(([h, items]) => (
            <div key={h as string}>
              <div style={{ color: C.gold, fontWeight: 800, fontSize: 11, marginBottom: 10, letterSpacing: 0.5 }}>{h}</div>
              {(items as string[]).map(item => <div key={item} style={{ lineHeight: 2.2 }}>{item}</div>)}
            </div>
          ))}
        </div>
        {/* ── AI Validation Strip ── */}
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 10, color: C.zo, fontFamily: 'monospace', fontWeight: 800 }}>⚖ AI VALIDATION</span>
              {verdicts.length > 0 ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  {verdicts.map(v => (
                    <span key={v.judgeId} style={{ fontSize: 9, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 4,
                      background: v.verdict === 'VALIDATED' ? '#00C9A720' : v.verdict === 'CAUTION' ? '#F5C40020' : '#FF3B3020',
                      color: v.verdict === 'VALIDATED' ? '#00C9A7' : v.verdict === 'CAUTION' ? '#F5C400' : '#FF3B30',
                      border: `1px solid ${v.verdict === 'VALIDATED' ? '#00C9A740' : v.verdict === 'CAUTION' ? '#F5C40040' : '#FF3B3040'}` }}>
                      {v.judgeName.replace('Judge ', '')} · {v.verdict} {v.confidence}%
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace' }}>3 independent agents · Oracle · Strategis · Sentinex</span>
              )}
            </div>
            <button onClick={callJudges} disabled={judgeLoading}
              style={{ padding: '4px 12px', background: 'transparent', color: C.zo, border: `1px solid ${C.zo}40`, borderRadius: 4, fontSize: 9, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
              {judgeLoading ? '⚖ VALIDATING...' : '⚖ RUN VALIDATION'}
            </button>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
            🦅 SentimentCommand · AI-Powered Election Intelligence · Zambia 2026
          </div>
          <div style={{ fontSize: 12, color: C.gold, fontFamily: 'monospace', fontWeight: 700 }}>
            © @BryteSikaStrategy · Confidential — Authorised Use Only
          </div>
        </div>
      </footer>
    </div>
  )
}
