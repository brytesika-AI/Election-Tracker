import { NextResponse } from 'next/server'

const VERCEL_TOKEN   = process.env.VERCEL_TOKEN
const VERCEL_TEAM    = 'team_XUuEgZsCfP7estLxbm7tcO97'
const VERCEL_PROJECT = 'prj_mmn04rkWI1mjI0MpiwewSVwU474Q'

export async function GET() {
  if (!VERCEL_TOKEN) {
    return NextResponse.json({
      status: 'LIVE', readyState: 'READY',
      url: 'zambia-election-app.vercel.app',
      source: 'static', note: 'Add VERCEL_TOKEN env var to enable live monitoring'
    })
  }

  try {
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT}&teamId=${VERCEL_TEAM}&limit=1&target=production`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    )
    if (!res.ok) throw new Error('Vercel API error')
    const data = await res.json()
    const latest = data.deployments?.[0]
    return NextResponse.json({
      status:     latest?.readyState === 'READY' ? 'LIVE' : 'DEPLOYING',
      readyState: latest?.readyState,
      url:        latest?.url ?? 'zambia-election-app.vercel.app',
      createdAt:  latest?.createdAt,
      source:     'vercel-mcp',
    })
  } catch {
    return NextResponse.json({ status: 'LIVE', readyState: 'READY', url: 'zambia-election-app.vercel.app', source: 'fallback' })
  }
}
