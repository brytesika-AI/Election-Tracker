'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { ELECTION_DATA, JudgeVerdict } from '@/app/lib/data'
import ZambiaMap from '@/app/components/ZambiaMap'

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
function HeritageHero({ countdown }: { countdown: { days: number; hours: number; minutes: number } }) {
  return (
    <section
      className="heritage-hero"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(3,12,9,.94) 0%, rgba(6,18,23,.83) 45%, rgba(6,12,20,.72) 100%), url(${VICTORIA_FALLS_IMAGE})`,
      }}
    >
      <div className="heritage-hero__glow" />
      <div className="heritage-hero__content">
        <div className="heritage-hero__copy">
          <div className="heritage-hero__kicker">MOSI-OA-TUNYA INTELLIGENCE ROOM</div>
          <h2>Zambia 2026 Election Pulse</h2>
          <p>
            A national campaign dashboard grounded in ECZ facts, open intelligence, province-level signals, and the visual language of Zambia.
          </p>
          <div className="heritage-hero__chips">
            <span>Victoria Falls backdrop</span>
            <span>Fish eagle mark</span>
            <span>Flag palette</span>
            <span>Province intelligence</span>
          </div>
        </div>
        <div className="heritage-hero__eagle" aria-hidden="true">
          <ZambiaEagle size={142} />
          <div>
            <span>Election Day</span>
            <strong>{countdown.days}d {countdown.hours}h {countdown.minutes}m</strong>
            <small>13 August 2026</small>
          </div>
        </div>
      </div>
      <div className="heritage-hero__attribution">
        Victoria Falls image: Zambia Tourism / Wikimedia Commons. Eagle image: South Luangwa African fish eagle, I&apos;ve Got It On Film! / CC BY 2.0
      </div>
    </section>
  )
}

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
      setVerdicts(json.verdicts)
      setJudgeMode(json.mode === 'ai' ? 'ai' : 'demo')
    } catch { setJudgeMode('demo') } finally { setJudgeLoading(false) }
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchFbSentiment(), fetchTwSentiment(), fetchTtSentiment()])
    setLastUpdated(new Date()); setRefreshing(false)
  }, [fetchFbSentiment, fetchTwSentiment, fetchTtSentiment])

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
    'Mundubile / Tonse': ELECTION_DATA.allianceTrend[i],
    'Kalaba (CF)':       ELECTION_DATA.kalabaTrend[i],
    "M'membe (SP)":    ELECTION_DATA.membeTrend[i],
    projected: i >= projFrom,
  }))

  const pollData = [
    { name: 'HH (UPND)',         value: 47.2, color: C.upnd },
    { name: 'Mundubile / Tonse', value: 20.3, color: C.pf   },
    { name: "M'membe (SP)",      value: 4.1,  color: C.sp   },
    { name: 'Kalaba (CF)',       value: 3.8,  color: C.dp   },
    { name: 'Undecided/Other',   value: 24.6, color: C.muted},
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
  const provData = ELECTION_DATA.provinces.map(p => ({
    name: p.name, 'Voters (K)': Math.round(p.voters / 1000),
    color: p.lean === 'UPND' ? C.upnd : p.lean === 'PF' ? C.pf : C.gold,
  }))

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
      risk: 'Mundubile/Tonse alignment is the clearest northern opposition lane.',
      action: 'Track alliance cohesion, legal vehicle clarity and Bemba-language radio share before the trend hardens.',
    },
  ]
  const selectedLens = campaignLenses.find(lens => lens.id === activeLens) ?? campaignLenses[0]
  const projectionModes = [
    {
      id: 'intel' as const,
      label: 'CIA-style OSINT',
      call: 'UPND advantage, contested downside',
      confidence: 68,
      color: C.teal,
      method: 'Key Judgments, confidence levels, alternative hypotheses and indicator watchlists.',
      projection: 'HH remains the best-positioned candidate if economic irritation does not consolidate into a single opposition vehicle.',
      triggers: ['Opposition alliance legal clarity', 'Load-shedding sentiment break point', 'Copperbelt urban swing', 'Youth unemployment narratives'],
      caveat: 'Analytic confidence is moderate because social-platform signals are noisy and not a substitute for verified polling.',
    },
    {
      id: 'electiondesk' as const,
      label: 'CNN-style Desk',
      call: 'Lean UPND',
      confidence: 72,
      color: C.gold,
      method: 'Projection gates: current lead, province path, remaining undecided pool, turnout assumptions and confidence threshold.',
      projection: 'No race call. Dashboard status is Lean UPND, with Northern/Luapula/Muchinga and Copperbelt watched as opposition pickup lanes.',
      triggers: ['UPND above 50% in two consecutive model refreshes', 'Mundubile/Tonse below 18%', 'Undecided under 18%', 'Copperbelt margin above +7 UPND'],
      caveat: 'Election-desk language here is modeled. It is not a media network call and not an ECZ result.',
    },
    {
      id: 'fusion' as const,
      label: 'Palantir-style Fusion',
      call: 'Incumbent path intact',
      confidence: 74,
      color: C.ndc,
      method: 'Fuses voter register, province leans, economy, OSINT, platform sentiment, issue risk and scenario deltas.',
      projection: 'The integrated graph points to an incumbent path through Lusaka, Southern, Western and North-Western, with Copperbelt as the decisive stress test.',
      triggers: ['Province-level anomaly detection', 'Narrative velocity by platform', 'Issue-to-region correlation', 'Field-event and media spike matching'],
      caveat: 'Fusion output is only as strong as source freshness, labels and missing-data handling.',
    },
  ]
  const selectedProjection = projectionModes.find(mode => mode.id === projectionMode) ?? projectionModes[1]

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
              &nbsp;&nbsp; LIVE · ZAMBIA 2026 ELECTION · 13 AUG 2026 · HH MODEL: 47.2% · MUNDUBILE/TONSE: 20.3% · M&#39;MEMBE: 4.1% · KALABA: 3.8% · VOTERS: 8,786,300 ECZ · 226 CONSTITUENCIES ·
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
        <HeritageHero countdown={countdown} />

        <div style={{ background: '#0B1220', border: `1px solid ${C.gold}`, borderLeft: `5px solid ${C.gold}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, lineHeight: 1 }}>2026</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: C.text, marginBottom: 3 }}>Data audit status</div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55 }}>
              Official facts are ECZ/ZamStats/BoZ sourced. Candidate support, trends, issue scores and scenario strength are model estimates for planning, not certified polling or ECZ results.
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
            Voters: 8,786,300<br />Constituencies: 226
          </div>
        </div>

        {/* ── KPI ROW ─────────────────────────────────────── */}
        <SectionLabel layer="LIVE DATA" title="Real-Time Election Intelligence"
          sub="Aggregated from Facebook, Twitter/X, Lusaka Times, Zambian Observer, ZNBC · Updated every 6 hours" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
          <KpiCard label="HH MODEL LEAD" value="+26.9 pts" sub="vs Mundubile/Tonse lane (20.3%)" trend="Modelled — monitor" borderColor={C.teal} />
          <KpiCard label="DAYS TO ELECTION" value={`${countdown.days}d`} sub="13 August 2026" trend={`${countdown.hours}h ${countdown.minutes}m remaining`} borderColor={C.gold} />
          <KpiCard label="REGISTERED VOTERS" value="8,786,300" sub="ECZ certified 2026" trend="226 constituencies" borderColor={C.ndc} />
          <KpiCard label="OPPOSITION LANE" value="+2.3 pts/mo" sub="Mundubile/Tonse model trend" trend="Ticket details fluid" borderColor={C.warn} />
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
        <SectionLabel layer="PROJECTION DESK" title="Intelligence + Election Desk Projection"
          sub="Open-source analytic layer inspired by intelligence estimates, election-night desks and data-fusion platforms" />
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
              Projection rule: never call a race from sentiment alone. Require province path, turnout assumptions, undecided compression and official-result flow.
            </div>
          </div>
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
                <Line type="monotone" dataKey="Mundubile / Tonse" stroke={C.pf}   strokeWidth={2.5} dot={{ r: 2.5 }} strokeDasharray="5 3" />
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
                <Radar name="Mundubile / Tonse" dataKey="PF" stroke={C.pf} fill={C.pf} fillOpacity={0.15} strokeWidth={1.5} />
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

          <ChartCard title="SCENARIO MODELLING — HH VOTE PROJECTION" sub="Majority threshold: 50% · Baseline: 47.2%">
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
                <ReferenceLine y={50} stroke={C.gold} strokeDasharray="5 3" label={{ value: '50% threshold', fill: C.gold, fontSize: 9 }} />
                <Bar dataKey="Vote %" radius={[4,4,0,0]}>
                  {simData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── GEOSPATIAL MAP ───────────────────────────────── */}
        <SectionLabel layer="GEOSPATIAL" title="Zambia Province Electoral Map — Where the Votes Are"
          sub="Click any province to see registered voters, party support, and strategic intelligence by region" />
        <div style={{ marginBottom: 16 }}>
          <ZambiaMap />
        </div>

        {/* ── NLP HEADLINE ANALYZER ────────────────────────── */}
        <SectionLabel layer="NLP ANALYSIS" title="VADER Political Headline Sentiment Engine"
          sub="Real Zambian political headlines scored by AI — compound score from −1.0 (negative) to +1.0 (positive)" />
        <div style={{ background: C.card, border: `1px solid ${C.teal}`, borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${C.teal}22`, border: `2px solid ${C.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🧠</div>
              <div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 11, color: C.teal }}>VADER-ZAMBIA NLP ENGINE · POLITICAL HEADLINE SENTIMENT</div>
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
            VADER algorithm · Zambia domain lexicon · Compound score: −1.0 (negative) to +1.0 (positive) · Threshold ±0.05
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
                  Live: HH · Mundubile/Tonse · Harry Kalaba · Fred M&#39;membe · AI analysis of posts &amp; public comments
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
                  Live: HH · Mundubile/Tonse · Kalaba · M&#39;membe · Devil&#39;s advocate + strategic counter per candidate
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

      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ background: '#000', borderTop: `3px solid ${C.zo}`, padding: '20px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, fontSize: 11, fontFamily: 'monospace', color: C.muted, marginBottom: 16 }}>
          {[
            ['INTELLIGENCE SOURCES', ['Facebook (HH, Mundubile/Tonse, Kalaba, M\'membe)', 'Twitter/X · WhatsApp signal tracking', 'Afrobarometer R10 · public media monitoring', 'iVerify Zambia · OONI · CIVICUS', 'ECZ · ZamStats · BoZ · World Bank']],
            ['VOTER REGISTER (ECZ 2026)', ['Total: 8,786,300 · 226 constituencies', 'Lusaka: 1,430,889', 'Copperbelt: 1,296,446', 'Eastern: 1,129,444', 'Southern: 1,103,275', 'Other provinces: 3,826,246']],
            ['ECONOMIC CONTEXT', ['Inflation (ZamStats): 6.8%', 'BoZ Policy Rate: 13.25%', 'Kwacha/USD: ~K26.8', 'GDP Growth (WB): 4.2%', 'Youth unemployment 19-22: 32.6%', 'Mealie Meal 25kg: monitored']],
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
