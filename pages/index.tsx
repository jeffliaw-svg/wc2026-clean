import { useState } from 'react'
import Head from 'next/head'

type TeamResult = {
  name: string
  rating: number
  first: number
  second: number
  third: number
  fourth: number
}

type MatchProb = {
  teamA: string
  teamB: string
  pA: number
  pDraw: number
  pB: number
}

// ─── All 12 Groups ───────────────────────────────────────────────
// Fallback FIFA points (Jan 19, 2026). Overridden at runtime by live API.
const groupTeams: Record<string, { name: string; rating: number }[]> = {
  A: [
    { name: 'Mexico', rating: 1658.82 },
    { name: 'South Africa', rating: 1485.33 },
    { name: 'South Korea', rating: 1611.84 },
    { name: 'UEFA Playoff D', rating: 1550.00 },
  ],
  B: [
    { name: 'Canada', rating: 1601.29 },
    { name: 'UEFA Playoff A', rating: 1550.00 },
    { name: 'Qatar', rating: 1461.79 },
    { name: 'Switzerland', rating: 1672.69 },
  ],
  C: [
    { name: 'Brazil', rating: 1775.85 },
    { name: 'Morocco', rating: 1682.63 },
    { name: 'Scotland', rating: 1530.46 },
    { name: 'Haiti', rating: 1371.58 },
  ],
  D: [
    { name: 'United States', rating: 1680.00 },
    { name: 'Paraguay', rating: 1492.72 },
    { name: 'Australia', rating: 1583.86 },
    { name: 'UEFA Playoff C', rating: 1530.00 },
  ],
  E: [
    { name: 'Germany', rating: 1724.15 },
    { name: 'Ecuador', rating: 1591.73 },
    { name: "C\u00f4te d'Ivoire", rating: 1496.84 },
    { name: 'Cura\u00e7ao', rating: 1341.53 },
  ],
  F: [
    { name: 'Netherlands', rating: 1761.71 },
    { name: 'Japan', rating: 1665.50 },
    { name: 'Tunisia', rating: 1503.38 },
    { name: 'UEFA Playoff B', rating: 1550.00 },
  ],
  G: [
    { name: 'Belgium', rating: 1730.71 },
    { name: 'Egypt', rating: 1583.49 },
    { name: 'Iran', rating: 1617.02 },
    { name: 'New Zealand', rating: 1362.48 },
  ],
  H: [
    { name: 'Spain', rating: 1853.08 },
    { name: 'Uruguay', rating: 1695.91 },
    { name: 'Saudi Arabia', rating: 1536.13 },
    { name: 'Cape Verde', rating: 1399.43 },
  ],
  I: [
    { name: 'France', rating: 1870.00 },
    { name: 'Senegal', rating: 1706.83 },
    { name: 'Norway', rating: 1553.14 },
    { name: 'Intercontinental Playoff 2', rating: 1400.00 },
  ],
  J: [
    { name: 'Argentina', rating: 1867.25 },
    { name: 'Austria', rating: 1630.81 },
    { name: 'Algeria', rating: 1484.71 },
    { name: 'Jordan', rating: 1441.36 },
  ],
  K: [
    { name: 'Portugal', rating: 1756.12 },
    { name: 'Colombia', rating: 1727.33 },
    { name: 'Uzbekistan', rating: 1456.93 },
    { name: 'Intercontinental Playoff 1', rating: 1400.00 },
  ],
  L: [
    { name: 'England', rating: 1823.39 },
    { name: 'Croatia', rating: 1712.38 },
    { name: 'Ghana', rating: 1430.51 },
    { name: 'Panama', rating: 1466.18 },
  ],
}

// ─── All 16 R32 Match Definitions ────────────────────────────────
// "2A" = runner-up Group A, "1E" = winner Group E
// type: 'runner' = both sides are runners-up (deterministic groups)
// type: 'winner_vs_runner' = group winner vs specific runner-up
// type: 'winner_vs_3rd' = group winner vs best 3rd (variable opponent)
//   — for 3rd-place matches we simulate the winner's group only,
//     since the 3rd-place opponent is uncertain pre-tournament.
//     We approximate by averaging across the candidate 3rd-place pools.

type R32Match = {
  matchNum: number
  title: string
  date: string
  matchup: string
  venue: string
  groups: [string, string]           // [groupA, groupB] that feed this match
  posA: '1st' | '2nd'               // which finishing position from groupA
  posB: '1st' | '2nd' | '3rd'       // which finishing position from groupB
  type: 'runner' | 'winner_vs_runner' | 'winner_vs_3rd'
  thirdPlacePools?: string[]         // candidate groups for 3rd-place qualifier
}

const r32Matches: R32Match[] = [
  {
    matchNum: 73, title: 'Match 73 \u2013 Round of 32',
    date: 'Sat, Jun 28 \u2022 3:00 PM ET',
    matchup: '2nd Group A vs 2nd Group B', venue: 'SoFi Stadium, Los Angeles, CA',
    groups: ['A', 'B'], posA: '2nd', posB: '2nd', type: 'runner',
  },
  {
    matchNum: 74, title: 'Match 74 \u2013 Round of 32',
    date: 'Sun, Jun 29 \u2022 4:30 PM ET',
    matchup: '1st Group E vs 3rd Place', venue: 'Gillette Stadium, Foxborough, MA',
    groups: ['E', 'E'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['A', 'B', 'C', 'D', 'F'],
  },
  {
    matchNum: 75, title: 'Match 75 \u2013 Round of 32',
    date: 'Sun, Jun 29 \u2022 9:00 PM ET',
    matchup: '1st Group F vs 2nd Group C', venue: 'Estadio BBVA, Monterrey, Mexico',
    groups: ['F', 'C'], posA: '1st', posB: '2nd', type: 'winner_vs_runner',
  },
  {
    matchNum: 76, title: 'Match 76 \u2013 Round of 32',
    date: 'Sun, Jun 29 \u2022 1:00 PM ET',
    matchup: '1st Group C vs 2nd Group F', venue: 'NRG Stadium, Houston, TX',
    groups: ['C', 'F'], posA: '1st', posB: '2nd', type: 'winner_vs_runner',
  },
  {
    matchNum: 77, title: 'Match 77 \u2013 Round of 32',
    date: 'Mon, Jun 30 \u2022 5:00 PM ET',
    matchup: '1st Group I vs 3rd Place', venue: 'MetLife Stadium, East Rutherford, NJ',
    groups: ['I', 'I'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['C', 'D', 'F', 'G', 'H'],
  },
  {
    matchNum: 78, title: 'Match 78 \u2013 Round of 32',
    date: 'Mon, Jun 30 \u2022 1:00 PM ET',
    matchup: '2nd Group E vs 2nd Group I', venue: 'AT&T Stadium, Arlington, TX',
    groups: ['E', 'I'], posA: '2nd', posB: '2nd', type: 'runner',
  },
  {
    matchNum: 79, title: 'Match 79 \u2013 Round of 32',
    date: 'Mon, Jun 30 \u2022 9:00 PM ET',
    matchup: '1st Group A vs 3rd Place', venue: 'Estadio Azteca, Mexico City, Mexico',
    groups: ['A', 'A'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['C', 'E', 'F', 'H', 'I'],
  },
  {
    matchNum: 80, title: 'Match 80 \u2013 Round of 32',
    date: 'Tue, Jul 1 \u2022 12:00 PM ET',
    matchup: '1st Group L vs 3rd Place', venue: 'Mercedes-Benz Stadium, Atlanta, GA',
    groups: ['L', 'L'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['E', 'H', 'I', 'J', 'K'],
  },
  {
    matchNum: 81, title: 'Match 81 \u2013 Round of 32',
    date: 'Tue, Jul 1 \u2022 8:00 PM ET',
    matchup: '1st Group D vs 3rd Place', venue: "Levi's Stadium, Santa Clara, CA",
    groups: ['D', 'D'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['B', 'E', 'F', 'I', 'J'],
  },
  {
    matchNum: 82, title: 'Match 82 \u2013 Round of 32',
    date: 'Tue, Jul 1 \u2022 4:00 PM ET',
    matchup: '1st Group G vs 3rd Place', venue: 'Lumen Field, Seattle, WA',
    groups: ['G', 'G'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['A', 'E', 'H', 'I', 'J'],
  },
  {
    matchNum: 83, title: 'Match 83 \u2013 Round of 32',
    date: 'Wed, Jul 2 \u2022 7:00 PM ET',
    matchup: '2nd Group K vs 2nd Group L', venue: 'BMO Field, Toronto, Canada',
    groups: ['K', 'L'], posA: '2nd', posB: '2nd', type: 'runner',
  },
  {
    matchNum: 84, title: 'Match 84 \u2013 Round of 32',
    date: 'Wed, Jul 2 \u2022 3:00 PM ET',
    matchup: '1st Group H vs 2nd Group J', venue: 'SoFi Stadium, Los Angeles, CA',
    groups: ['H', 'J'], posA: '1st', posB: '2nd', type: 'winner_vs_runner',
  },
  {
    matchNum: 85, title: 'Match 85 \u2013 Round of 32',
    date: 'Wed, Jul 2 \u2022 11:00 PM ET',
    matchup: '1st Group B vs 3rd Place', venue: 'BC Place, Vancouver, Canada',
    groups: ['B', 'B'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['E', 'F', 'G', 'I', 'J'],
  },
  {
    matchNum: 86, title: 'Match 86 \u2013 Round of 32',
    date: 'Thu, Jul 3 \u2022 6:00 PM ET',
    matchup: '1st Group J vs 2nd Group H', venue: 'Hard Rock Stadium, Miami, FL',
    groups: ['J', 'H'], posA: '1st', posB: '2nd', type: 'winner_vs_runner',
  },
  {
    matchNum: 87, title: 'Match 87 \u2013 Round of 32',
    date: 'Thu, Jul 3 \u2022 9:30 PM ET',
    matchup: '1st Group K vs 3rd Place', venue: 'Arrowhead Stadium, Kansas City, MO',
    groups: ['K', 'K'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['D', 'E', 'I', 'J', 'L'],
  },
  {
    matchNum: 88, title: 'Match 88 \u2013 Round of 32',
    date: 'Thu, Jul 3 \u2022 2:00 PM ET',
    matchup: '2nd Group D vs 2nd Group G', venue: 'AT&T Stadium, Arlington, TX',
    groups: ['D', 'G'], posA: '2nd', posB: '2nd', type: 'runner',
  },
]

export default function Home() {
  const [selectedMatch, setSelectedMatch] = useState<number>(73)
  const [results, setResults] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [ratingSource, setRatingSource] = useState<string>('')

  const currentMatch = r32Matches.find(m => m.matchNum === selectedMatch)!

  // ============================================================
  // Poisson Goal Model — Maher 1982 / Dixon & Coles 1997
  // ============================================================
  const MU = Math.log(1.26)
  const BETA = 0.00149
  const RHO = -0.05

  const factorial = (n: number): number => {
    let f = 1
    for (let i = 2; i <= n; i++) f *= i
    return f
  }

  const poissonPmf = (lambda: number, k: number): number =>
    Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k)

  const ratingsToLambda = (ratingA: number, ratingB: number) => {
    const dr = ratingA - ratingB
    return {
      lambdaA: Math.exp(MU + BETA * dr),
      lambdaB: Math.exp(MU - BETA * dr),
    }
  }

  const dixonColesTau = (x: number, y: number, lamA: number, lamB: number): number => {
    if (x === 0 && y === 0) return 1 - lamA * lamB * RHO
    if (x === 0 && y === 1) return 1 + lamA * RHO
    if (x === 1 && y === 0) return 1 + lamB * RHO
    if (x === 1 && y === 1) return 1 - RHO
    return 1
  }

  const calcMatchProbs = (ratingA: number, ratingB: number) => {
    const { lambdaA, lambdaB } = ratingsToLambda(ratingA, ratingB)
    let pA = 0, pDraw = 0, pB = 0
    for (let a = 0; a <= 10; a++) {
      for (let b = 0; b <= 10; b++) {
        const p = poissonPmf(lambdaA, a) * poissonPmf(lambdaB, b) *
          dixonColesTau(a, b, lambdaA, lambdaB)
        if (a > b) pA += p
        else if (a === b) pDraw += p
        else pB += p
      }
    }
    const total = pA + pDraw + pB
    return { pA: pA / total, pDraw: pDraw / total, pB: pB / total }
  }

  const calcGroupMatchProbs = (teams: { name: string; rating: number }[]): MatchProb[] => {
    const probs: MatchProb[] = []
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const { pA, pDraw, pB } = calcMatchProbs(teams[i].rating, teams[j].rating)
        probs.push({ teamA: teams[i].name, teamB: teams[j].name, pA: pA * 100, pDraw: pDraw * 100, pB: pB * 100 })
      }
    }
    return probs
  }

  const poissonSample = (lambda: number): number => {
    const L = Math.exp(-lambda)
    let k = 0, p = 1
    do { k++; p *= Math.random() } while (p > L)
    return Math.max(0, k - 1)
  }

  const simulateMatch = (ratingA: number, ratingB: number) => {
    const { lambdaA, lambdaB } = ratingsToLambda(ratingA, ratingB)
    return { homeGoals: poissonSample(lambdaA), awayGoals: poissonSample(lambdaB) }
  }

  const simulateGroup = (teams: { name: string; rating: number }[]): { name: string; rating: number }[] => {
    const standings = teams.map(t => ({
      name: t.name, rating: t.rating, points: 0, gd: 0, gf: 0,
    }))
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const result = simulateMatch(standings[i].rating, standings[j].rating)
        standings[i].gf += result.homeGoals
        standings[j].gf += result.awayGoals
        standings[i].gd += result.homeGoals - result.awayGoals
        standings[j].gd += result.awayGoals - result.homeGoals
        if (result.homeGoals > result.awayGoals) {
          standings[i].points += 3
        } else if (result.awayGoals > result.homeGoals) {
          standings[j].points += 3
        } else {
          standings[i].points += 1
          standings[j].points += 1
        }
      }
    }
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.gd !== a.gd) return b.gd - a.gd
      return b.gf - a.gf
    })
    return standings.map(s => ({ name: s.name, rating: s.rating }))
  }

  const simulateKnockoutMatch = (ratingA: number, ratingB: number): 'A' | 'B' => {
    const result = simulateMatch(ratingA, ratingB)
    if (result.homeGoals !== result.awayGoals)
      return result.homeGoals > result.awayGoals ? 'A' : 'B'
    const { lambdaA, lambdaB } = ratingsToLambda(ratingA, ratingB)
    const etA = poissonSample(lambdaA * 0.33)
    const etB = poissonSample(lambdaB * 0.33)
    if (etA !== etB) return etA > etB ? 'A' : 'B'
    const pA = 0.5 + (ratingA - ratingB) * 0.0002
    return Math.random() < pA ? 'A' : 'B'
  }

  // ─── Main Simulation ──────────────────────────────────────────

  const runSimulation = async () => {
    setCalculating(true)

    try {
      const ratingResponse = await fetch('/api/fivethirtyeight')
      const ratingData = await ratingResponse.json()
      if (!ratingData.success || !ratingData.teams) throw new Error('Failed to fetch ratings')
      const ratings: Record<string, number> = ratingData.teams
      setRatingSource(ratingData.source === 'fifa-api' ? 'Live FIFA Rankings' : `FIFA Rankings (${ratingData.lastUpdated})`)

      const iterations = 10000
      const match = currentMatch

      // Resolve live ratings for a group
      const resolveGroup = (groupId: string) =>
        groupTeams[groupId].map(t => ({ ...t, rating: ratings[t.name] || t.rating }))

      if (match.type === 'runner') {
        // ── Runner-up vs Runner-up (Matches 73, 78, 83, 88) ──
        const [gA, gB] = match.groups
        const teamsA = resolveGroup(gA)
        const teamsB = resolveGroup(gB)

        const positionsA: Record<string, number[]> = {}
        const positionsB: Record<string, number[]> = {}
        teamsA.forEach(t => (positionsA[t.name] = [0, 0, 0, 0]))
        teamsB.forEach(t => (positionsB[t.name] = [0, 0, 0, 0]))
        const matchWins: Record<string, number> = {}
        teamsA.forEach(t => (matchWins[t.name] = 0))
        teamsB.forEach(t => (matchWins[t.name] = 0))

        for (let i = 0; i < iterations; i++) {
          const standingsA = simulateGroup(teamsA)
          const standingsB = simulateGroup(teamsB)
          standingsA.forEach((team, pos) => positionsA[team.name][pos]++)
          standingsB.forEach((team, pos) => positionsB[team.name][pos]++)
          const runnerA = standingsA[1]
          const runnerB = standingsB[1]
          const winner = simulateKnockoutMatch(runnerA.rating, runnerB.rating)
          matchWins[winner === 'A' ? runnerA.name : runnerB.name]++
        }

        const toResults = (teams: typeof teamsA, positions: typeof positionsA) =>
          teams.map(team => ({
            name: team.name, rating: team.rating,
            first: (positions[team.name][0] / iterations) * 100,
            second: (positions[team.name][1] / iterations) * 100,
            third: (positions[team.name][2] / iterations) * 100,
            fourth: (positions[team.name][3] / iterations) * 100,
          })).sort((a, b) => b.first - a.first)

        const totalWins = Object.values(matchWins).reduce((a, b) => a + b, 0)
        const teamWinPcts = [...teamsA, ...teamsB]
          .map(t => ({ name: t.name, pct: (matchWins[t.name] / totalWins) * 100 }))
          .filter(t => t.pct > 0)
          .sort((a, b) => b.pct - a.pct)

        setResults({
          groupA: toResults(teamsA, positionsA),
          groupB: toResults(teamsB, positionsB),
          groupALabel: `Group ${gA}`,
          groupBLabel: `Group ${gB}`,
          matchWinPcts: teamWinPcts,
          matchProbsA: calcGroupMatchProbs(teamsA),
          matchProbsB: calcGroupMatchProbs(teamsB),
        })

      } else if (match.type === 'winner_vs_runner') {
        // ── Winner vs Runner-up (Matches 75, 76, 84, 86) ──
        const [gA, gB] = match.groups
        const teamsA = resolveGroup(gA)
        const teamsB = resolveGroup(gB)

        const positionsA: Record<string, number[]> = {}
        const positionsB: Record<string, number[]> = {}
        teamsA.forEach(t => (positionsA[t.name] = [0, 0, 0, 0]))
        teamsB.forEach(t => (positionsB[t.name] = [0, 0, 0, 0]))
        const matchWins: Record<string, number> = {}
        teamsA.forEach(t => (matchWins[t.name] = 0))
        teamsB.forEach(t => (matchWins[t.name] = 0))

        for (let i = 0; i < iterations; i++) {
          const standingsA = simulateGroup(teamsA)
          const standingsB = simulateGroup(teamsB)
          standingsA.forEach((team, pos) => positionsA[team.name][pos]++)
          standingsB.forEach((team, pos) => positionsB[team.name][pos]++)
          // posA='1st' from groupA, posB='2nd' from groupB
          const winnerTeam = standingsA[0]   // 1st place
          const runnerTeam = standingsB[1]   // 2nd place
          const winner = simulateKnockoutMatch(winnerTeam.rating, runnerTeam.rating)
          matchWins[winner === 'A' ? winnerTeam.name : runnerTeam.name]++
        }

        const toResults = (teams: typeof teamsA, positions: typeof positionsA) =>
          teams.map(team => ({
            name: team.name, rating: team.rating,
            first: (positions[team.name][0] / iterations) * 100,
            second: (positions[team.name][1] / iterations) * 100,
            third: (positions[team.name][2] / iterations) * 100,
            fourth: (positions[team.name][3] / iterations) * 100,
          })).sort((a, b) => b.first - a.first)

        const totalWins = Object.values(matchWins).reduce((a, b) => a + b, 0)
        const teamWinPcts = [...teamsA, ...teamsB]
          .map(t => ({ name: t.name, pct: (matchWins[t.name] / totalWins) * 100 }))
          .filter(t => t.pct > 0)
          .sort((a, b) => b.pct - a.pct)

        setResults({
          groupA: toResults(teamsA, positionsA),
          groupB: toResults(teamsB, positionsB),
          groupALabel: `Group ${gA} (provides 1st)`,
          groupBLabel: `Group ${gB} (provides 2nd)`,
          matchWinPcts: teamWinPcts,
          matchProbsA: calcGroupMatchProbs(teamsA),
          matchProbsB: calcGroupMatchProbs(teamsB),
        })

      } else {
        // ── Winner vs 3rd Place (Matches 74, 77, 79, 80, 81, 82, 85, 87) ──
        // We simulate the winner's group fully, and approximate the 3rd-place
        // opponent by simulating each candidate pool group and using its 3rd-place
        // finisher. For each iteration, we randomly pick one of the candidate groups
        // to supply the 3rd-place team.
        const gA = match.groups[0]
        const teamsA = resolveGroup(gA)
        const pools = match.thirdPlacePools || []
        const poolTeams = pools.map(g => resolveGroup(g))

        const positionsA: Record<string, number[]> = {}
        teamsA.forEach(t => (positionsA[t.name] = [0, 0, 0, 0]))
        const matchWins: Record<string, number> = {}
        teamsA.forEach(t => (matchWins[t.name] = 0))
        const thirdPlaceAppearances: Record<string, number> = {}
        const thirdPlaceWins: Record<string, number> = {}

        for (let i = 0; i < iterations; i++) {
          const standingsA = simulateGroup(teamsA)
          standingsA.forEach((team, pos) => positionsA[team.name][pos]++)

          // Pick random candidate pool and simulate its group for 3rd place
          const poolIdx = Math.floor(Math.random() * poolTeams.length)
          const standingsPool = simulateGroup(poolTeams[poolIdx])
          const thirdTeam = standingsPool[2] // 3rd place

          thirdPlaceAppearances[thirdTeam.name] = (thirdPlaceAppearances[thirdTeam.name] || 0) + 1

          const winnerTeam = standingsA[0]
          const winner = simulateKnockoutMatch(winnerTeam.rating, thirdTeam.rating)
          if (winner === 'A') {
            matchWins[winnerTeam.name] = (matchWins[winnerTeam.name] || 0) + 1
          } else {
            thirdPlaceWins[thirdTeam.name] = (thirdPlaceWins[thirdTeam.name] || 0) + 1
          }
        }

        const toResults = (teams: typeof teamsA, positions: typeof positionsA) =>
          teams.map(team => ({
            name: team.name, rating: team.rating,
            first: (positions[team.name][0] / iterations) * 100,
            second: (positions[team.name][1] / iterations) * 100,
            third: (positions[team.name][2] / iterations) * 100,
            fourth: (positions[team.name][3] / iterations) * 100,
          })).sort((a, b) => b.first - a.first)

        // Build win probabilities: group winner candidates + 3rd place opponents
        const allWinPcts: { name: string; pct: number }[] = []
        teamsA.forEach(t => {
          if (matchWins[t.name]) allWinPcts.push({ name: t.name, pct: (matchWins[t.name] / iterations) * 100 })
        })
        Object.entries(thirdPlaceWins).forEach(([name, wins]) => {
          allWinPcts.push({ name: `${name} (3rd)`, pct: (wins / iterations) * 100 })
        })
        allWinPcts.sort((a, b) => b.pct - a.pct)

        // 3rd-place opponent breakdown
        const thirdOppPcts = Object.entries(thirdPlaceAppearances)
          .map(([name, count]) => ({ name, pct: (count / iterations) * 100 }))
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 8)

        setResults({
          groupA: toResults(teamsA, positionsA),
          groupALabel: `Group ${gA}`,
          matchWinPcts: allWinPcts,
          matchProbsA: calcGroupMatchProbs(teamsA),
          thirdPlaceOpponents: thirdOppPcts,
          thirdPlacePools: pools,
        })
      }
    } catch (error) {
      console.error('Simulation error:', error)
      alert('Error running simulation. Check console for details.')
      setResults(null)
    }

    setCalculating(false)
  }

  // ─── Render Helpers ────────────────────────────────────────────

  const renderGroupTable = (label: string, teamResults: TeamResult[]) => (
    <div>
      <h4 style={{ color: '#003366', marginBottom: '10px', fontSize: '18px' }}>{label}</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#003366', color: 'white' }}>
            <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Team</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>FIFA Pts</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>P(1st)</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', background: '#00509e' }}>P(2nd)</th>
          </tr>
        </thead>
        <tbody>
          {teamResults.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
              <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '14px' }}>{r.name}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#888' }}>{r.rating.toFixed(0)}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>{r.first.toFixed(1)}%</td>
              <td style={{ padding: '10px', textAlign: 'right', color: '#003366', fontWeight: 'bold', fontSize: '15px', background: i % 2 === 0 ? '#f0f8ff' : '#e6f2ff' }}>
                {r.second.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderMatchDetail = (label: string, matchProbs: MatchProb[]) => (
    <div>
      <h4 style={{ color: '#003366', marginBottom: '10px', fontSize: '16px' }}>{label} &mdash; Individual Matches</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#555', color: 'white' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Match</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Win</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Draw</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Loss</th>
          </tr>
        </thead>
        <tbody>
          {matchProbs.map((m, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
              <td style={{ padding: '8px' }}><strong>{m.teamA}</strong> vs {m.teamB}</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#1a6b3c', fontWeight: 'bold' }}>{m.pA.toFixed(1)}%</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#666' }}>{m.pDraw.toFixed(1)}%</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#cc3333' }}>{m.pB.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <Head>
        <title>WC 2026 R32 Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <h1 style={{ color: '#003366', fontSize: '28px', marginBottom: '5px' }}>
        2026 World Cup &mdash; Round of 32 Tracker
      </h1>
      <p style={{ color: '#666', fontSize: '14px', marginTop: 0, marginBottom: '20px' }}>
        All 16 knockout matches &bull; Poisson simulation &bull; 10,000 iterations
      </p>

      {/* ── Match selector grid ── */}
      <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
        {r32Matches.map(m => (
          <button
            key={m.matchNum}
            onClick={() => { setSelectedMatch(m.matchNum); setResults(null); setShowDetail(false) }}
            style={{
              padding: '8px 10px',
              background: selectedMatch === m.matchNum ? '#003366' : '#f5f5f5',
              color: selectedMatch === m.matchNum ? 'white' : '#003366',
              border: `2px solid ${selectedMatch === m.matchNum ? '#003366' : '#ccc'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'left',
            }}
          >
            <div>M{m.matchNum}</div>
            <div style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.8, marginTop: '2px' }}>
              {m.matchup.replace('vs ', 'v ')}
            </div>
          </button>
        ))}
      </div>

      {/* ── Match info card ── */}
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#003366' }}>{currentMatch.title}</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>{currentMatch.date}</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{currentMatch.matchup}</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{currentMatch.venue}</div>
        {currentMatch.type === 'winner_vs_3rd' && currentMatch.thirdPlacePools && (
          <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
            3rd-place opponent from: Groups {currentMatch.thirdPlacePools.join(', ')}
          </div>
        )}
      </div>

      {/* ── Run simulation button ── */}
      <button
        onClick={runSimulation}
        disabled={calculating}
        style={{
          padding: '15px 30px',
          background: calculating ? '#ccc' : '#003366',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: calculating ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {calculating ? 'Calculating...' : 'Run Simulation (10,000 iterations)'}
      </button>

      {/* ── Results ── */}
      {results && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#003366', marginBottom: '20px' }}>Group Stage Probabilities</h3>

          {/* Two-group layout for runner/winner_vs_runner, single-group for 3rd place */}
          {results.groupB ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              {renderGroupTable(results.groupALabel, results.groupA)}
              {renderGroupTable(results.groupBLabel, results.groupB)}
            </div>
          ) : (
            <div style={{ maxWidth: '550px' }}>
              {renderGroupTable(results.groupALabel, results.groupA)}
            </div>
          )}

          {/* 3rd-place opponent breakdown */}
          {results.thirdPlaceOpponents && (
            <div style={{ marginTop: '20px', maxWidth: '550px' }}>
              <h4 style={{ color: '#003366', marginBottom: '10px', fontSize: '16px' }}>
                Likely 3rd-Place Opponents (from Groups {results.thirdPlacePools.join(', ')})
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#555', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Team</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>P(Opponent)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.thirdPlaceOpponents.map((t: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ padding: '8px' }}>{t.name}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{t.pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Toggle detail */}
          <button
            onClick={() => setShowDetail(!showDetail)}
            style={{
              marginTop: '15px', padding: '8px 16px', background: 'white',
              color: '#003366', border: '1px solid #003366', borderRadius: '6px',
              cursor: 'pointer', fontSize: '13px',
            }}
          >
            {showDetail ? 'Hide' : 'Show'} Individual Match Results
          </button>

          {showDetail && results.matchProbsA && (
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: results.matchProbsB ? '1fr 1fr' : '1fr', gap: '30px' }}>
              {renderMatchDetail(results.groupALabel, results.matchProbsA)}
              {results.matchProbsB && renderMatchDetail(results.groupBLabel, results.matchProbsB)}
            </div>
          )}

          {/* Match win probabilities */}
          {results.matchWinPcts && results.matchWinPcts.length > 0 && (
            <div style={{ marginTop: '25px', background: '#003366', padding: '20px', borderRadius: '8px', color: 'white' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
                Match {selectedMatch} Win Probability
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {results.matchWinPcts.slice(0, 8).map((t: any, i: number) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.1)', padding: '10px 15px',
                    borderRadius: '6px', minWidth: '120px',
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.name}</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '4px' }}>{t.pct.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
            <strong>Model:</strong> Poisson regression (Maher 1982 / Dixon-Coles 1997).{' '}
            &lambda;<sub>A</sub> = exp(&mu; + &beta; &times; (R<sub>A</sub> &minus; R<sub>B</sub>)),{' '}
            where &mu; = ln(1.26) and &beta; = 0.00149 (calibrated to FIFA Elo formula).{' '}
            Dixon-Coles &tau; correction (&rho; = &minus;0.05). 10,000 MC iterations.
            {ratingSource && <> | Ratings: {ratingSource}</>}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e0e0e0', fontSize: '12px', color: '#888' }}>
        Poisson regression model (Maher 1982, Dixon &amp; Coles 1997) with FIFA Elo-based rankings.
        {ratingSource && <> | Source: {ratingSource}</>}
      </div>
    </div>
  )
}
