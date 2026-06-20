import type { NextApiRequest, NextApiResponse } from 'next'

const TEAM_GROUPS: Record<string, string> = {
  'Mexico': 'A', 'South Africa': 'A', 'South Korea': 'A', 'Czechia': 'A',
  'Canada': 'B', 'Bosnia and Herzegovina': 'B', 'Qatar': 'B', 'Switzerland': 'B',
  'Brazil': 'C', 'Morocco': 'C', 'Scotland': 'C', 'Haiti': 'C',
  'United States': 'D', 'Paraguay': 'D', 'Australia': 'D', 'Türkiye': 'D',
  'Germany': 'E', 'Ecuador': 'E', "Côte d'Ivoire": 'E', 'Curaçao': 'E',
  'Netherlands': 'F', 'Japan': 'F', 'Tunisia': 'F', 'Sweden': 'F',
  'Belgium': 'G', 'Egypt': 'G', 'Iran': 'G', 'New Zealand': 'G',
  'Spain': 'H', 'Uruguay': 'H', 'Saudi Arabia': 'H', 'Cape Verde': 'H',
  'France': 'I', 'Senegal': 'I', 'Norway': 'I', 'Iraq': 'I',
  'Argentina': 'J', 'Austria': 'J', 'Algeria': 'J', 'Jordan': 'J',
  'Portugal': 'K', 'Colombia': 'K', 'Uzbekistan': 'K', 'DR Congo': 'K',
  'England': 'L', 'Croatia': 'L', 'Ghana': 'L', 'Panama': 'L',
}

const ESPN_NAME_MAP: Record<string, string> = {
  'Turkey': 'Türkiye',
  'Türkiye': 'Türkiye',
  'Ivory Coast': "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  "Côte d'Ivoire": "Côte d'Ivoire",
  'Curacao': 'Curaçao',
  'Curaçao': 'Curaçao',
  'Czech Republic': 'Czechia',
  'Czechia': 'Czechia',
  'Korea Republic': 'South Korea',
  'South Korea': 'South Korea',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
  'Bosnia and Herzegovina': 'Bosnia and Herzegovina',
  'Cabo Verde': 'Cape Verde',
  'Cape Verde': 'Cape Verde',
  'Congo DR': 'DR Congo',
  'DR Congo': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  'IR Iran': 'Iran',
  'Iran': 'Iran',
  'USA': 'United States',
  'United States': 'United States',
}

function normalizeTeamName(name: string): string {
  return ESPN_NAME_MAP[name] || name
}

type MatchResult = { teamA: string; teamB: string; scoreA: number; scoreB: number }

async function fetchESPNResults(): Promise<Record<string, MatchResult[]> | null> {
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260720'
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WC2026Tracker/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!resp.ok) return null
    const data = await resp.json()
    const events = data?.events
    if (!Array.isArray(events)) return null

    const results: Record<string, MatchResult[]> = {}

    for (const event of events) {
      const comp = event?.competitions?.[0]
      if (!comp) continue
      const completed = comp?.status?.type?.completed
      if (!completed) continue

      const competitors = comp?.competitors
      if (!Array.isArray(competitors) || competitors.length !== 2) continue

      const home = competitors.find((c: any) => c.homeAway === 'home')
      const away = competitors.find((c: any) => c.homeAway === 'away')
      if (!home || !away) continue

      const teamA = normalizeTeamName(home?.team?.displayName || home?.team?.shortDisplayName || '')
      const teamB = normalizeTeamName(away?.team?.displayName || away?.team?.shortDisplayName || '')
      const scoreA = parseInt(home?.score, 10)
      const scoreB = parseInt(away?.score, 10)

      if (!teamA || !teamB || isNaN(scoreA) || isNaN(scoreB)) continue

      const group = TEAM_GROUPS[teamA] || TEAM_GROUPS[teamB]
      if (!group) continue

      if (!results[group]) results[group] = []
      const alreadyExists = results[group].some(r =>
        (r.teamA === teamA && r.teamB === teamB) || (r.teamA === teamB && r.teamB === teamA)
      )
      if (!alreadyExists) {
        results[group].push({ teamA, teamB, scoreA, scoreB })
      }
    }

    return Object.keys(results).length > 0 ? results : null
  } catch {
    return null
  }
}

const FALLBACK_RESULTS: Record<string, MatchResult[]> = {
  A: [
    { teamA: 'Mexico', teamB: 'South Africa', scoreA: 2, scoreB: 0 },
    { teamA: 'South Korea', teamB: 'Czechia', scoreA: 2, scoreB: 1 },
    { teamA: 'Mexico', teamB: 'South Korea', scoreA: 1, scoreB: 0 },
    { teamA: 'Czechia', teamB: 'South Africa', scoreA: 1, scoreB: 1 },
  ],
  B: [
    { teamA: 'Canada', teamB: 'Bosnia and Herzegovina', scoreA: 1, scoreB: 1 },
    { teamA: 'Qatar', teamB: 'Switzerland', scoreA: 1, scoreB: 1 },
    { teamA: 'Switzerland', teamB: 'Bosnia and Herzegovina', scoreA: 4, scoreB: 1 },
    { teamA: 'Canada', teamB: 'Qatar', scoreA: 6, scoreB: 0 },
  ],
  C: [
    { teamA: 'Brazil', teamB: 'Morocco', scoreA: 1, scoreB: 1 },
    { teamA: 'Haiti', teamB: 'Scotland', scoreA: 0, scoreB: 1 },
    { teamA: 'Scotland', teamB: 'Morocco', scoreA: 0, scoreB: 1 },
    { teamA: 'Brazil', teamB: 'Haiti', scoreA: 3, scoreB: 0 },
  ],
  D: [
    { teamA: 'United States', teamB: 'Paraguay', scoreA: 4, scoreB: 1 },
    { teamA: 'Australia', teamB: 'Türkiye', scoreA: 2, scoreB: 0 },
    { teamA: 'United States', teamB: 'Australia', scoreA: 2, scoreB: 0 },
    { teamA: 'Türkiye', teamB: 'Paraguay', scoreA: 0, scoreB: 1 },
  ],
  E: [
    { teamA: 'Germany', teamB: 'Curaçao', scoreA: 7, scoreB: 1 },
    { teamA: "Côte d'Ivoire", teamB: 'Ecuador', scoreA: 1, scoreB: 0 },
  ],
  F: [
    { teamA: 'Netherlands', teamB: 'Japan', scoreA: 2, scoreB: 2 },
    { teamA: 'Sweden', teamB: 'Tunisia', scoreA: 5, scoreB: 1 },
  ],
  G: [
    { teamA: 'Belgium', teamB: 'Egypt', scoreA: 1, scoreB: 1 },
    { teamA: 'Iran', teamB: 'New Zealand', scoreA: 2, scoreB: 2 },
  ],
  H: [
    { teamA: 'Spain', teamB: 'Cape Verde', scoreA: 0, scoreB: 0 },
    { teamA: 'Saudi Arabia', teamB: 'Uruguay', scoreA: 1, scoreB: 1 },
  ],
  I: [
    { teamA: 'France', teamB: 'Senegal', scoreA: 3, scoreB: 1 },
    { teamA: 'Norway', teamB: 'Iraq', scoreA: 4, scoreB: 1 },
  ],
  J: [
    { teamA: 'Argentina', teamB: 'Algeria', scoreA: 3, scoreB: 0 },
    { teamA: 'Austria', teamB: 'Jordan', scoreA: 3, scoreB: 1 },
  ],
  K: [
    { teamA: 'Portugal', teamB: 'DR Congo', scoreA: 1, scoreB: 1 },
    { teamA: 'Colombia', teamB: 'Uzbekistan', scoreA: 3, scoreB: 1 },
  ],
  L: [
    { teamA: 'England', teamB: 'Croatia', scoreA: 4, scoreB: 2 },
    { teamA: 'Ghana', teamB: 'Panama', scoreA: 1, scoreB: 0 },
  ],
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const liveResults = await fetchESPNResults()
  const results = liveResults || FALLBACK_RESULTS
  const source = liveResults ? 'espn-live' : 'fallback'

  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60')
  res.status(200).json({
    success: true,
    results,
    source,
    fetchedAt: new Date().toISOString(),
  })
}
