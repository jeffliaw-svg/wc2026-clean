import type { NextApiRequest, NextApiResponse } from 'next'

const BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2'

async function fetchMarkets(seriesTicker: string): Promise<any[]> {
  const allMarkets: any[] = []
  let cursor: string | undefined

  do {
    const params = new URLSearchParams({
      series_ticker: seriesTicker,
      limit: '200',
    })
    if (cursor) params.set('cursor', cursor)

    const response = await fetch(`${BASE_URL}/markets?${params}`)
    if (!response.ok) throw new Error(`Kalshi API ${response.status}`)

    const data = await response.json()
    allMarkets.push(...(data.markets || []))
    cursor = data.cursor || undefined
  } while (cursor)

  return allMarkets
}

function extractTeamName(market: any): string {
  // Try subtitle first (usually just the team name), then parse title
  if (market.subtitle) return market.subtitle
  const title = market.title || ''
  // Handle formats like "Will Germany win Group E?" or "Germany to win Group E"
  const match = title.match(/(?:Will\s+)?(.+?)(?:\s+(?:win|advance|qualify|to win|to advance))/i)
  return match ? match[1].trim() : title
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Public market data - no authentication needed
    const [winMarkets, qualMarkets] = await Promise.all([
      fetchMarkets('KXWCGROUPWIN'),
      fetchMarkets('KXWCGROUPQUAL'),
    ])

    // Structure by group: { E: [{ team, pWin, pQualify }], ... }
    const groups: Record<string, { team: string, pWin: number, pQualify: number }[]> = {}

    for (const m of winMarkets) {
      const gm = m.event_ticker?.match(/KXWCGROUPWIN-26([A-L])/)
      if (!gm) continue
      const group = gm[1]
      if (!groups[group]) groups[group] = []

      const team = extractTeamName(m)
      const pWin = typeof m.yes_bid === 'number' && typeof m.yes_ask === 'number'
        ? (m.yes_bid + m.yes_ask) / 2
        : m.last_price || 0

      groups[group].push({ team, pWin, pQualify: 0 })
    }

    for (const m of qualMarkets) {
      const gm = m.event_ticker?.match(/KXWCGROUPQUAL-26([A-L])/)
      if (!gm) continue
      const group = gm[1]
      const team = extractTeamName(m)
      const pQual = typeof m.yes_bid === 'number' && typeof m.yes_ask === 'number'
        ? (m.yes_bid + m.yes_ask) / 2
        : m.last_price || 0

      const existing = groups[group]?.find(t =>
        t.team.toLowerCase() === team.toLowerCase()
      )
      if (existing) {
        existing.pQualify = pQual
      }
    }

    res.status(200).json({
      success: true,
      groups,
      counts: { win: winMarkets.length, qualify: qualMarkets.length },
      lastFetched: new Date().toISOString(),
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
