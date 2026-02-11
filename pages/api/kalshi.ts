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

// Extract price as a percentage (0-100) from a Kalshi market object.
// The integer cent fields (yes_bid, yes_ask, last_price) were deprecated Jan 15 2026.
// Use the *_dollars string fields instead (e.g. "0.5600" = 56%).
function extractPrice(market: any): number {
  // Prefer dollar string fields (current API)
  const bidStr = market.yes_bid_dollars
  const askStr = market.yes_ask_dollars
  if (bidStr && askStr) {
    const bid = parseFloat(bidStr)
    const ask = parseFloat(askStr)
    if (!isNaN(bid) && !isNaN(ask)) return ((bid + ask) / 2) * 100
  }

  // Try last_price_dollars
  const lastStr = market.last_price_dollars
  if (lastStr) {
    const last = parseFloat(lastStr)
    if (!isNaN(last)) return last * 100
  }

  // Legacy fallback: integer cent fields (may be 0 after deprecation)
  if (typeof market.yes_bid === 'number' && market.yes_bid > 0 &&
      typeof market.yes_ask === 'number' && market.yes_ask > 0) {
    return (market.yes_bid + market.yes_ask) / 2
  }
  if (typeof market.last_price === 'number' && market.last_price > 0) {
    return market.last_price
  }

  return 0
}

function extractTeamName(market: any): string {
  // Try yes_sub_title first (team name for the "yes" outcome), then subtitle, then parse title
  if (market.yes_sub_title) return market.yes_sub_title
  if (market.subtitle) return market.subtitle
  const title = market.title || ''
  const match = title.match(/(?:Will\s+)?(.+?)(?:\s+(?:win|advance|qualify|to win|to advance))/i)
  return match ? match[1].trim() : title
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [winMarkets, qualMarkets] = await Promise.all([
      fetchMarkets('KXWCGROUPWIN'),
      fetchMarkets('KXWCGROUPQUAL'),
    ])

    const groups: Record<string, { team: string, pWin: number, pQualify: number }[]> = {}

    for (const m of winMarkets) {
      const gm = m.event_ticker?.match(/KXWCGROUPWIN-26([A-L])/)
      if (!gm) continue
      const group = gm[1]
      if (!groups[group]) groups[group] = []

      const team = extractTeamName(m)
      const pWin = extractPrice(m)
      groups[group].push({ team, pWin, pQualify: 0 })
    }

    for (const m of qualMarkets) {
      const gm = m.event_ticker?.match(/KXWCGROUPQUAL-26([A-L])/)
      if (!gm) continue
      const group = gm[1]
      const team = extractTeamName(m)
      const pQual = extractPrice(m)

      const existing = groups[group]?.find(t =>
        t.team.toLowerCase() === team.toLowerCase()
      )
      if (existing) {
        existing.pQualify = pQual
      }
    }

    // Include first raw market for debugging price fields
    const sampleMarket = winMarkets[0] ? {
      ticker: winMarkets[0].ticker,
      title: winMarkets[0].title,
      subtitle: winMarkets[0].subtitle,
      yes_sub_title: winMarkets[0].yes_sub_title,
      yes_bid: winMarkets[0].yes_bid,
      yes_ask: winMarkets[0].yes_ask,
      yes_bid_dollars: winMarkets[0].yes_bid_dollars,
      yes_ask_dollars: winMarkets[0].yes_ask_dollars,
      last_price: winMarkets[0].last_price,
      last_price_dollars: winMarkets[0].last_price_dollars,
      event_ticker: winMarkets[0].event_ticker,
    } : null

    res.status(200).json({
      success: true,
      groups,
      counts: { win: winMarkets.length, qualify: qualMarkets.length },
      lastFetched: new Date().toISOString(),
      _debug: { sampleMarket },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
