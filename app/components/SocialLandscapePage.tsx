'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ELECTION_DATA } from '@/app/lib/data'

const C = {
  bg: '#060C14',
  card: '#0E1724',
  card2: '#121C2C',
  line: '#1C2A3A',
  text: '#E2E8F0',
  muted: '#7A8FA6',
  gold: '#F5C400',
  teal: '#00C9A7',
  warn: '#FF3B30',
  twitter: '#1DA1F2',
  tiktok: '#FE2C55',
}

type PlatformKind = 'twitter' | 'tiktok'

type SocialSentiment = {
  candidateId: string
  candidateName: string
  platform: string
  sampleCount: number
  liveData: boolean
  dataSource: string
  analysis: {
    sentiment: 'positive' | 'negative' | 'neutral'
    score: number
    summary: string
    topThemes: string[]
    devilsAdvocate?: string
    strategicCounter?: string
    youthGrievance?: string
  }
  mode: string
  timestamp: string
}

type SocialResponse = {
  results: SocialSentiment[]
  fetchedAt: string
  apifyEnabled: boolean
  aiEnabled: boolean
  scrapeTriggered: boolean
  apifyRunId?: string | null
}

const PLATFORM = {
  twitter: {
    label: 'Twitter/X',
    endpoint: '/api/twitter-sentiment',
    color: C.twitter,
    audience: 'Urban elite, journalists, party operators, diaspora and politically active youth',
    baseWeight: 0.075,
    ceiling: 4.8,
    factorWeights: {
      'Load shedding': 1.2,
      'Cost of living': 1.15,
      'Free education': 0.75,
      Infrastructure: 0.7,
      'Alliance surge': 1.05,
      'Northern mobilisation': 1,
      'Youth coalition': 0.95,
      'Second round': 1.1,
      'Integrity brand': 0.72,
      'Coalition pressure': 0.85,
      'Kingmaker role': 0.8,
      'Luapula base': 0.68,
      'Mining royalties': 1,
      'Youth mobilisation': 1.05,
      'Press freedom': 0.72,
      'Inequality debate': 0.9,
    } as Record<string, number>,
  },
  tiktok: {
    label: 'TikTok',
    endpoint: '/api/tiktok-sentiment',
    color: C.tiktok,
    audience: '18-35 voter attention, creator clips, youth grievance and high-velocity political memes',
    baseWeight: 0.105,
    ceiling: 6.2,
    factorWeights: {
      'Load shedding': 1.15,
      'Youth jobs': 1.25,
      'Free education': 0.8,
      'Cost of living': 1.15,
      'Alliance momentum': 1.05,
      'Youth jobs manifesto': 1.2,
      'Northern mobilisation': 0.95,
      'Digital growth': 1.1,
      'Integrity brand': 0.72,
      'Coalition pressure': 0.8,
      'Digital absence': -0.85,
      'Kingmaker potential': 0.72,
      'Mining inequality': 1.2,
      'TikTok virality': 1.25,
      'Youth anger': 1.15,
      'Anti-establishment': 1,
    } as Record<string, number>,
  },
} satisfies Record<PlatformKind, {
  label: string
  endpoint: string
  color: string
  audience: string
  baseWeight: number
  ceiling: number
  factorWeights: Record<string, number>
}>

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function signed(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}`
}

function sentimentMovement(score: number, platform: PlatformKind) {
  const cfg = PLATFORM[platform]
  return clamp((score - 50) * cfg.baseWeight, -cfg.ceiling, cfg.ceiling)
}

function getFigure(candidateId: string) {
  return ELECTION_DATA.figures.find(figure => figure.id === candidateId)
}

function factorLevel(score: number, mentions: number) {
  const base = score >= 62 ? 'HIGH' : score >= 52 ? 'MEDIUM' : score >= 43 ? 'WATCH' : 'NEGATIVE'
  return mentions > 1 && base === 'MEDIUM' ? 'HIGH' : base
}

function Card({ children, accent }: { children: ReactNode; accent?: string }) {
  return (
    <section style={{
      border: `1px solid ${accent ?? C.line}`,
      borderRadius: 8,
      background: C.card,
      padding: 16,
      minWidth: 0,
    }}>
      {children}
    </section>
  )
}

function Metric({ label, value, note, color }: { label: string; value: string; note: string; color: string }) {
  return (
    <Card accent={`${color}88`}>
      <div style={{ color: C.muted, fontSize: 10, fontFamily: 'monospace', fontWeight: 900, letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontSize: 30, lineHeight: 1, fontWeight: 950, marginTop: 8 }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.45, marginTop: 8 }}>{note}</div>
    </Card>
  )
}

export default function SocialLandscapePage({ platform }: { platform: PlatformKind }) {
  const cfg = PLATFORM[platform]
  const [data, setData] = useState<SocialResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${cfg.endpoint}${force ? '?refresh=1' : ''}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setData(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load social data')
    } finally {
      setLoading(false)
    }
  }, [cfg.endpoint])

  useEffect(() => {
    const timer = setTimeout(() => load(), 0)
    return () => clearTimeout(timer)
  }, [load])

  const rows = useMemo(() => {
    return (data?.results ?? []).map(result => {
      const figure = getFigure(result.candidateId)
      const baseline = figure?.poll ?? 0
      const movement = sentimentMovement(result.analysis.score, platform)
      const landscapeShare = clamp(baseline + movement, 0, 70)
      const factorIntensity = result.analysis.topThemes.reduce((sum, theme) => {
        return sum + Math.abs(cfg.factorWeights[theme] ?? 0.65)
      }, 0)

      return {
        ...result,
        figure,
        baseline,
        movement,
        landscapeShare,
        factorIntensity,
      }
    }).sort((a, b) => b.landscapeShare - a.landscapeShare)
  }, [cfg.factorWeights, data?.results, platform])

  const factors = useMemo(() => {
    const byName = new Map<string, { name: string; scores: number[]; candidates: string[]; netShift: number }>()
    for (const row of rows) {
      for (const theme of row.analysis.topThemes) {
        const entry = byName.get(theme) ?? { name: theme, scores: [], candidates: [], netShift: 0 }
        entry.scores.push(row.analysis.score)
        entry.candidates.push(row.figure?.shortName ?? row.candidateName)
        entry.netShift += row.movement * (cfg.factorWeights[theme] ?? 0.65)
        byName.set(theme, entry)
      }
    }

    return Array.from(byName.values()).map(entry => {
      const avgScore = entry.scores.reduce((sum, score) => sum + score, 0) / entry.scores.length
      return {
        ...entry,
        avgScore,
        level: factorLevel(avgScore, entry.scores.length),
      }
    }).sort((a, b) => Math.abs(b.netShift) - Math.abs(a.netShift)).slice(0, 8)
  }, [cfg.factorWeights, rows])

  const leader = rows[0]
  const liveRows = rows.filter(row => row.liveData).length
  const netLandscape = rows.reduce((sum, row) => sum + Math.abs(row.movement), 0)
  const volatility = clamp(Math.round(netLandscape * 9), 0, 100)

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: 20 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <header className="social-landscape-hero" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) auto',
          gap: 18,
          alignItems: 'end',
          border: `1px solid ${cfg.color}66`,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${cfg.color}24, rgba(14,23,36,.96) 42%, rgba(3,7,11,.98))`,
          padding: 22,
          marginBottom: 14,
        }}>
          <div>
            <div style={{ color: cfg.color, fontFamily: 'monospace', fontSize: 11, fontWeight: 900, letterSpacing: 1.2 }}>
              {cfg.label.toUpperCase()} LANDSCAPE ROOM
            </div>
            <h1 style={{ margin: '8px 0 0', fontSize: 36, lineHeight: 1, fontWeight: 950 }}>
              Main factors, movement levels and vote-share pressure
            </h1>
            <p style={{ margin: '12px 0 0', maxWidth: 760, color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
              {cfg.audience}. Percentages below show modelled movement from social sentiment into the election landscape, not certified polling.
            </p>
          </div>
          <nav className="social-landscape-nav" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link href="/" style={navStyle(C.line, C.text)}>Dashboard</Link>
            <Link href="/twitter" style={navStyle(C.twitter, platform === 'twitter' ? '#fff' : C.twitter)}>Twitter/X</Link>
            <Link href="/tiktok" style={navStyle(C.tiktok, platform === 'tiktok' ? '#fff' : C.tiktok)}>TikTok</Link>
            <button onClick={() => load(true)} disabled={loading} style={{
              border: 'none',
              borderRadius: 6,
              background: cfg.color,
              color: '#fff',
              padding: '9px 12px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 10,
              fontWeight: 900,
            }}>
              {loading ? 'REFRESHING' : 'LIVE REFRESH'}
            </button>
          </nav>
        </header>

        {error && (
          <div style={{ border: `1px solid ${C.warn}`, borderRadius: 8, background: `${C.warn}16`, color: C.warn, padding: 12, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div className="social-landscape-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
          <Metric label="DATA STATUS" value={liveRows > 0 ? 'LIVE' : 'FALLBACK'} note={`${liveRows}/${rows.length || 4} candidates on live cached data`} color={liveRows > 0 ? C.teal : C.gold} />
          <Metric label="LANDSCAPE MOVEMENT" value={`${netLandscape.toFixed(1)} pts`} note="Sum of absolute candidate movement from platform signal" color={cfg.color} />
          <Metric label="VOLATILITY" value={`${volatility}%`} note="How sharply this platform can alter the campaign picture" color={volatility > 55 ? C.warn : C.gold} />
          <Metric label="CURRENT LEADER" value={leader?.figure?.shortName ?? 'WAIT'} note={leader ? `${leader.landscapeShare.toFixed(1)}% adjusted landscape read` : 'Loading candidate data'} color={leader?.figure?.color ?? C.muted} />
        </div>

        <div className="social-landscape-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(340px, .75fr)', gap: 14, marginBottom: 14 }}>
          <Card accent={cfg.color}>
            <SectionTitle kicker="MOVING PERCENTAGES" title="Candidate landscape shifts" />
            <div style={{ display: 'grid', gap: 10 }}>
              {rows.map(row => {
                const color = row.figure?.color ?? cfg.color
                return (
                  <div key={row.candidateId} style={{ border: `1px solid ${color}55`, borderRadius: 8, padding: 12, background: C.card2 }}>
                    <div className="social-landscape-candidate-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(110px,.7fr) 90px 90px 90px', gap: 10, alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: 13 }}>{row.figure?.name ?? row.candidateName}</strong>
                        <div style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{row.analysis.sentiment.toUpperCase()} sentiment | {row.sampleCount} samples</div>
                      </div>
                      <NumberBlock label="baseline" value={`${row.baseline.toFixed(1)}%`} color={C.muted} />
                      <NumberBlock label="movement" value={`${signed(row.movement)} pts`} color={row.movement >= 0 ? C.teal : C.warn} />
                      <NumberBlock label="adjusted" value={`${row.landscapeShare.toFixed(1)}%`} color={color} />
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: '#1A2535', overflow: 'hidden', marginTop: 10 }}>
                      <div style={{ width: `${Math.min(100, row.landscapeShare * 1.45)}%`, height: '100%', background: color }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {row.analysis.topThemes.map(theme => (
                        <span key={theme} style={themePill(cfg.factorWeights[theme] ?? 0.65, cfg.color)}>{theme}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card accent={C.gold}>
            <SectionTitle kicker="MAIN FACTORS" title="Factor levels and landscape effect" />
            <div style={{ display: 'grid', gap: 8 }}>
              {factors.map(factor => {
                const levelColor = factor.level === 'HIGH' ? C.teal : factor.level === 'MEDIUM' ? C.gold : factor.level === 'WATCH' ? cfg.color : C.warn
                return (
                  <div key={factor.name} style={{ border: `1px solid ${levelColor}55`, borderRadius: 8, background: C.card2, padding: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: 12 }}>{factor.name}</strong>
                        <div style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{factor.candidates.join(' | ')}</div>
                      </div>
                      <span style={{
                        border: `1px solid ${levelColor}`,
                        borderRadius: 999,
                        color: levelColor,
                        padding: '3px 7px',
                        fontSize: 9,
                        fontFamily: 'monospace',
                        fontWeight: 900,
                      }}>{factor.level}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', marginTop: 9 }}>
                      <div style={{ height: 7, borderRadius: 999, background: '#1A2535', overflow: 'hidden' }}>
                        <div style={{ width: `${clamp(factor.avgScore, 0, 100)}%`, height: '100%', background: levelColor }} />
                      </div>
                      <span style={{ color: factor.netShift >= 0 ? C.teal : C.warn, fontSize: 11, fontFamily: 'monospace', fontWeight: 900 }}>
                        {signed(factor.netShift)} pts
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <Card accent={C.line}>
          <SectionTitle kicker="ACTION READ" title="What changes the landscape next" />
          <div className="social-landscape-action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            {rows.map(row => (
              <div key={row.candidateId} style={{ border: `1px solid ${(row.figure?.color ?? cfg.color)}55`, borderRadius: 8, background: C.card2, padding: 12 }}>
                <strong style={{ color: row.figure?.color ?? cfg.color, fontSize: 12 }}>{row.figure?.shortName ?? row.candidateName}</strong>
                <p style={{ color: C.text, fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>{row.analysis.summary}</p>
                {row.analysis.youthGrievance && <p style={{ color: C.gold, fontSize: 10, lineHeight: 1.5, margin: '8px 0 0' }}>{row.analysis.youthGrievance}</p>}
                <p style={{ color: C.muted, fontSize: 10, lineHeight: 1.5, margin: '8px 0 0' }}>{row.analysis.strategicCounter}</p>
              </div>
            ))}
          </div>
        </Card>

        <footer style={{ color: C.muted, fontSize: 10, lineHeight: 1.5, marginTop: 14, fontFamily: 'monospace' }}>
          Last fetched: {data?.fetchedAt ?? 'loading'} | Apify {data?.apifyEnabled ? 'enabled' : 'not configured'} | Cloudflare AI {data?.aiEnabled ? 'enabled' : 'not configured'} | Movement is a platform-weighted planning model.
        </footer>
      </div>
    </main>
  )
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: C.gold, fontFamily: 'monospace', fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>{kicker}</div>
      <h2 style={{ color: '#fff', fontSize: 18, lineHeight: 1.1, margin: '4px 0 0', fontWeight: 950 }}>{title}</h2>
    </div>
  )
}

function NumberBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ color: C.muted, fontSize: 9, fontFamily: 'monospace', fontWeight: 900 }}>{label}</div>
      <div style={{ color, fontSize: 17, fontWeight: 950, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function navStyle(border: string, color: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    border: `1px solid ${border}`,
    borderRadius: 6,
    color,
    padding: '8px 11px',
    textDecoration: 'none',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 900,
  }
}

function themePill(weight: number, color: string): CSSProperties {
  const isDrag = weight < 0
  return {
    border: `1px solid ${isDrag ? C.warn : color}66`,
    borderRadius: 999,
    color: isDrag ? C.warn : color,
    background: `${isDrag ? C.warn : color}14`,
    padding: '3px 7px',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 900,
  }
}
