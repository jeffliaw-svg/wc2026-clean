import type { NextApiRequest, NextApiResponse } from 'next'

// FIFA points from the January 19, 2026 FIFA/Coca-Cola Men's World Ranking.
// These serve as fallback if the live FIFA API is unavailable.
// Source: https://inside.fifa.com/fifa-world-ranking/men
const FALLBACK_FIFA_POINTS: Record<string, number> = {
  // Pot 1
  "Argentina": 1867.25,
  "France": 1870.00,
  "Spain": 1853.08,
  "England": 1823.39,
  "Brazil": 1775.85,
  "Belgium": 1730.71,
  "Netherlands": 1761.71,
  "Portugal": 1756.12,
  "Germany": 1724.15,
  "Italy": 1731.51,
  "USA": 1680.00,
  "United States": 1680.00,
  "Colombia": 1727.33,
  "Uruguay": 1695.91,
  "Croatia": 1712.38,
  "Mexico": 1658.82,
  "Canada": 1601.29,

  // Pot 2
  "Japan": 1665.50,
  "Morocco": 1682.63,
  "Switzerland": 1672.69,
  "Denmark": 1669.87,
  "Austria": 1630.81,
  "Senegal": 1706.83,
  "Iran": 1617.02,
  "South Korea": 1611.84,
  "Australia": 1583.86,
  "Ecuador": 1591.73,

  // Pot 3
  "Norway": 1553.14,
  "Egypt": 1583.49,
  "Paraguay": 1492.72,
  "Côte d'Ivoire": 1496.84,
  "Serbia": 1567.29,
  "Turkey": 1597.71,
  "Scotland": 1530.46,
  "Wales": 1513.64,
  "Poland": 1559.53,
  "Romania": 1505.51,
  "Tunisia": 1503.38,
  "Panama": 1466.18,

  // Pot 4
  "New Zealand": 1362.48,
  "Curaçao": 1341.53,
  "Saudi Arabia": 1536.13,
  "South Africa": 1485.33,
  "Jamaica": 1442.94,
  "Costa Rica": 1441.42,

  // Additional qualified teams
  "Algeria": 1484.71,
  "Jordan": 1441.36,
  "Uzbekistan": 1456.93,
  "Ghana": 1430.51,
  "Haiti": 1371.58,
  "Cape Verde": 1399.43,
  "Qatar": 1461.79,

  // Playoff placeholders (estimated)
  "UEFA Playoff A": 1550.00,
  "UEFA Playoff B": 1550.00,
  "UEFA Playoff C": 1530.00,
  "UEFA Playoff D": 1550.00,
  "TBD Playoff": 1400.00,
  "Intercontinental Playoff 1": 1400.00,
  "Intercontinental Playoff 2": 1400.00,
}

// FIFA Hidden API: ranking-overview endpoint
// This is an undocumented XHR endpoint used by fifa.com itself.
// It returns JSON with rankings[].rankingItem.totalPoints per team.
// dateId values correspond to specific ranking release dates.
const FIFA_API_DATE_IDS = ['id13974', 'id13973', 'id13972']
const FIFA_API_BASE = 'https://www.fifa.com/api/ranking-overview'

type FifaRankingItem = {
  rankingItem: {
    name: string
    totalPoints: number
    rank: number
    previousPoints: number
  }
}

async function fetchFifaRankings(): Promise<Record<string, number> | null> {
  for (const dateId of FIFA_API_DATE_IDS) {
    try {
      const url = `${FIFA_API_BASE}?locale=en&dateId=${dateId}`
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WC2026Tracker/1.0)' },
        signal: AbortSignal.timeout(5000),
      })
      if (!resp.ok) continue

      const data = await resp.json()
      const rankings: FifaRankingItem[] = data?.rankings
      if (!Array.isArray(rankings) || rankings.length === 0) continue

      const teams: Record<string, number> = {}
      for (const entry of rankings) {
        const name = entry.rankingItem?.name
        const points = entry.rankingItem?.totalPoints
        if (name && typeof points === 'number') {
          teams[name] = points
        }
      }
      if (Object.keys(teams).length > 50) {
        // Also add "United States" alias if "USA" exists or vice versa
        if (teams['USA'] && !teams['United States']) teams['United States'] = teams['USA']
        if (teams['United States'] && !teams['USA']) teams['USA'] = teams['United States']
        return teams
      }
    } catch {
      // Try next dateId
    }
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Try live FIFA API first, fall back to hardcoded points
  const liveRankings = await fetchFifaRankings()
  const teams = liveRankings || FALLBACK_FIFA_POINTS
  const source = liveRankings ? 'fifa-api' : 'fallback'

  res.status(200).json({
    success: true,
    teams,
    count: Object.keys(teams).length,
    source,
    lastUpdated: liveRankings ? new Date().toISOString().split('T')[0] : '2026-01-19',
    ratingSystem: 'fifa-points',
  })
}
