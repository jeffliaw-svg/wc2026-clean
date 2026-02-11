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

export default function Home() {
  const [selectedMatch, setSelectedMatch] = useState<number>(78)
  const [results, setResults] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [ratingSource, setRatingSource] = useState<string>('')

  const matches: Record<number, {
    title: string
    date: string
    matchup: string
    venue: string
    groups: string[]
    round: string
  }> = {
    78: {
      title: 'Match 78 - Round of 32',
      date: 'Monday, June 30, 2026 \u2022 1:00 PM CT',
      matchup: '2nd Group E vs 2nd Group I',
      venue: 'AT&T Stadium, Arlington, TX',
      groups: ['E', 'I'],
      round: 'R32',
    },
    88: {
      title: 'Match 88 - Round of 32',
      date: 'Thursday, July 3, 2026 \u2022 2:00 PM CT',
      matchup: '2nd Group D vs 2nd Group G',
      venue: 'AT&T Stadium, Arlington, TX',
      groups: ['D', 'G'],
      round: 'R32',
    },
    93: {
      title: 'Match 93 - Round of 16',
      date: 'Sunday, July 6, 2026 \u2022 3:00 PM CT',
      matchup: 'Winner Match 83 vs Winner Match 84',
      venue: 'AT&T Stadium, Arlington, TX',
      groups: [],
      round: 'R16',
    },
    101: {
      title: 'Semifinal',
      date: 'Tuesday, July 14, 2026 \u2022 3:00 PM CT',
      matchup: 'TBD vs TBD',
      venue: 'AT&T Stadium, Arlington, TX',
      groups: [],
      round: 'SF',
    },
  }

  // Group teams with FIFA points as fallback ratings.
  // These are overridden at runtime by live FIFA rankings when available.
  const groupTeams: Record<string, { name: string; rating: number }[]> = {
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
    G: [
      { name: 'Belgium', rating: 1730.71 },
      { name: 'Egypt', rating: 1583.49 },
      { name: 'Iran', rating: 1617.02 },
      { name: 'New Zealand', rating: 1362.48 },
    ],
    I: [
      { name: 'France', rating: 1870.00 },
      { name: 'Senegal', rating: 1706.83 },
      { name: 'Norway', rating: 1553.14 },
      { name: 'TBD Playoff', rating: 1400.00 },
    ],
  }

  const currentMatch = matches[selectedMatch]

  // ============================================================
  // Poisson Goal Model — Research-Backed Formulation
  //
  // Based on the log-linear Poisson regression (Maher 1982,
  // Dixon & Coles 1997) adapted for a single-number rating system.
  //
  // Formula:
  //   log(λ_A) = μ + β × (R_A − R_B)
  //   log(λ_B) = μ − β × (R_A − R_B)
  //
  // Where:
  //   μ = log(1.26) ≈ 0.231
  //       Average goals per team per match in modern World Cups
  //       (2002-2022 avg: 2.52 total goals / 2 = 1.26 per team)
  //
  //   β = 0.00149
  //       Calibrated by minimizing squared error between the
  //       Poisson model's win expectancy and the FIFA Elo formula:
  //       W_e = 1 / (1 + 10^(-dr/600))
  //       across rating differences from 50 to 770 FIFA points.
  //
  //   R_A, R_B = FIFA ranking points (Elo-based since 2018)
  //
  // Dixon-Coles τ correction (1997):
  //   Adjusts joint probabilities for scorelines 0-0, 0-1, 1-0, 1-1
  //   to correct the independent Poisson model's underestimate of draws.
  //   ρ ≈ -0.05 (fitted from international football data)
  // ============================================================

  const MU = Math.log(1.26)  // ≈ 0.231
  const BETA = 0.00149
  const RHO = -0.05  // Dixon-Coles dependence parameter

  const factorial = (n: number): number => {
    let f = 1
    for (let i = 2; i <= n; i++) f *= i
    return f
  }

  const poissonPmf = (lambda: number, k: number): number => {
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k)
  }

  // Convert FIFA points difference to expected goals (λ)
  const ratingsToLambda = (ratingA: number, ratingB: number): { lambdaA: number; lambdaB: number } => {
    const dr = ratingA - ratingB
    return {
      lambdaA: Math.exp(MU + BETA * dr),
      lambdaB: Math.exp(MU - BETA * dr),
    }
  }

  // Dixon-Coles τ correction for low-scoring results
  const dixonColesTau = (x: number, y: number, lamA: number, lamB: number): number => {
    if (x === 0 && y === 0) return 1 - lamA * lamB * RHO
    if (x === 0 && y === 1) return 1 + lamA * RHO
    if (x === 1 && y === 0) return 1 + lamB * RHO
    if (x === 1 && y === 1) return 1 - RHO
    return 1
  }

  // Analytical match probabilities using Poisson + Dixon-Coles
  const calcMatchProbs = (ratingA: number, ratingB: number): { pA: number; pDraw: number; pB: number } => {
    const { lambdaA, lambdaB } = ratingsToLambda(ratingA, ratingB)
    let pA = 0, pDraw = 0, pB = 0
    const maxGoals = 10
    for (let a = 0; a <= maxGoals; a++) {
      for (let b = 0; b <= maxGoals; b++) {
        const pIndep = poissonPmf(lambdaA, a) * poissonPmf(lambdaB, b)
        const tau = dixonColesTau(a, b, lambdaA, lambdaB)
        const p = pIndep * tau
        if (a > b) pA += p
        else if (a === b) pDraw += p
        else pB += p
      }
    }
    // Renormalize (tau can shift total slightly from 1.0)
    const total = pA + pDraw + pB
    return { pA: pA / total, pDraw: pDraw / total, pB: pB / total }
  }

  // Get all 6 match probabilities for a 4-team group
  const calcGroupMatchProbs = (teams: { name: string; rating: number }[]): MatchProb[] => {
    const probs: MatchProb[] = []
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const { pA, pDraw, pB } = calcMatchProbs(teams[i].rating, teams[j].rating)
        probs.push({
          teamA: teams[i].name,
          teamB: teams[j].name,
          pA: pA * 100,
          pDraw: pDraw * 100,
          pB: pB * 100,
        })
      }
    }
    return probs
  }

  // Poisson random sample for simulation
  const poissonSample = (lambda: number): number => {
    const L = Math.exp(-lambda)
    let k = 0
    let p = 1
    do {
      k++
      p *= Math.random()
    } while (p > L)
    return Math.max(0, k - 1)
  }

  // Simulate a single match (group stage: can draw)
  const simulateMatch = (ratingA: number, ratingB: number) => {
    const { lambdaA, lambdaB } = ratingsToLambda(ratingA, ratingB)
    return { homeGoals: poissonSample(lambdaA), awayGoals: poissonSample(lambdaB) }
  }

  // Simulate group stage: round-robin, standings by pts > gd > gf
  const simulateGroup = (teams: { name: string; rating: number }[]): string[] => {
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
    return standings.map(s => s.name)
  }

  // Simulate knockout match: 90 min → extra time → penalties
  const simulateKnockoutMatch = (ratingA: number, ratingB: number): 'A' | 'B' => {
    const result = simulateMatch(ratingA, ratingB)
    if (result.homeGoals !== result.awayGoals) {
      return result.homeGoals > result.awayGoals ? 'A' : 'B'
    }
    // Extra time: slightly reduced intensity (scale lambdas by ~0.33 for 30 min)
    const { lambdaA, lambdaB } = ratingsToLambda(ratingA, ratingB)
    const etA = poissonSample(lambdaA * 0.33)
    const etB = poissonSample(lambdaB * 0.33)
    if (etA !== etB) return etA > etB ? 'A' : 'B'
    // Penalties: slight edge to higher-rated team
    const pA = 0.5 + (ratingA - ratingB) * 0.0002
    return Math.random() < pA ? 'A' : 'B'
  }

  // --- Main simulation ---

  const runSimulation = async () => {
    setCalculating(true)

    try {
      const ratingResponse = await fetch('/api/fivethirtyeight')
      const ratingData = await ratingResponse.json()
      if (!ratingData.success || !ratingData.teams) throw new Error('Failed to fetch team ratings')
      const ratings = ratingData.teams
      setRatingSource(ratingData.source === 'fifa-api' ? 'Live FIFA Rankings' : `FIFA Rankings (${ratingData.lastUpdated})`)
      const iterations = 10000

      if (currentMatch.round === 'R32') {
        const [groupA, groupB] = currentMatch.groups
        const teamsA = groupTeams[groupA].map(t => ({ ...t, rating: ratings[t.name] || t.rating }))
        const teamsB = groupTeams[groupB].map(t => ({ ...t, rating: ratings[t.name] || t.rating }))

        // Track positions across all iterations
        const positionsA: Record<string, number[]> = {}
        const positionsB: Record<string, number[]> = {}
        teamsA.forEach(t => (positionsA[t.name] = [0, 0, 0, 0]))
        teamsB.forEach(t => (positionsB[t.name] = [0, 0, 0, 0]))

        // Track knockout match outcomes
        const matchWins: Record<string, number> = {}
        teamsA.forEach(t => (matchWins[t.name] = 0))
        teamsB.forEach(t => (matchWins[t.name] = 0))

        for (let i = 0; i < iterations; i++) {
          const standingsA = simulateGroup(teamsA)
          const standingsB = simulateGroup(teamsB)
          standingsA.forEach((team, pos) => positionsA[team][pos]++)
          standingsB.forEach((team, pos) => positionsB[team][pos]++)

          const runnerA = standingsA[1]
          const runnerB = standingsB[1]
          const rA = teamsA.find(t => t.name === runnerA)!.rating
          const rB = teamsB.find(t => t.name === runnerB)!.rating
          const winner = simulateKnockoutMatch(rA, rB)
          matchWins[winner === 'A' ? runnerA : runnerB]++
        }

        const toResults = (teams: typeof teamsA, positions: typeof positionsA) =>
          teams.map(team => ({
            name: team.name,
            rating: team.rating,
            first: (positions[team.name][0] / iterations) * 100,
            second: (positions[team.name][1] / iterations) * 100,
            third: (positions[team.name][2] / iterations) * 100,
            fourth: (positions[team.name][3] / iterations) * 100,
          })).sort((a, b) => b.first - a.first)

        const totalMatchWins = Object.values(matchWins).reduce((a, b) => a + b, 0)
        const teamWinPcts = [...teamsA, ...teamsB]
          .map(t => ({ name: t.name, pct: (matchWins[t.name] / totalMatchWins) * 100 }))
          .filter(t => t.pct > 0)
          .sort((a, b) => b.pct - a.pct)

        // Analytical individual match probabilities
        const matchProbsA = calcGroupMatchProbs(teamsA)
        const matchProbsB = calcGroupMatchProbs(teamsB)

        setResults({
          groupA: toResults(teamsA, positionsA),
          groupB: toResults(teamsB, positionsB),
          groupALabel: `Group ${groupA}`,
          groupBLabel: `Group ${groupB}`,
          matchWinPcts: teamWinPcts,
          matchProbsA,
          matchProbsB,
        })
      } else if (selectedMatch === 93) {
        const groups = ['D', 'E', 'G', 'I']
        const allGroupTeams: Record<string, { name: string; rating: number }[]> = {}
        groups.forEach(g => {
          allGroupTeams[g] = groupTeams[g].map(t => ({ ...t, rating: ratings[t.name] || t.rating }))
        })

        const r16Appearances: Record<string, number> = {}
        const r16Wins: Record<string, number> = {}

        for (let i = 0; i < iterations; i++) {
          const standings: Record<string, string[]> = {}
          groups.forEach(g => { standings[g] = simulateGroup(allGroupTeams[g]) })

          const r2E = allGroupTeams['E'].find(t => t.name === standings['E'][1])!.rating
          const r2I = allGroupTeams['I'].find(t => t.name === standings['I'][1])!.rating
          const r2D = allGroupTeams['D'].find(t => t.name === standings['D'][1])!.rating
          const r2G = allGroupTeams['G'].find(t => t.name === standings['G'][1])!.rating

          const w78 = simulateKnockoutMatch(r2E, r2I) === 'A' ? standings['E'][1] : standings['I'][1]
          const w88 = simulateKnockoutMatch(r2D, r2G) === 'A' ? standings['D'][1] : standings['G'][1]

          r16Appearances[w78] = (r16Appearances[w78] || 0) + 1
          r16Appearances[w88] = (r16Appearances[w88] || 0) + 1

          const rW78 = [...allGroupTeams['E'], ...allGroupTeams['I']].find(t => t.name === w78)!.rating
          const rW88 = [...allGroupTeams['D'], ...allGroupTeams['G']].find(t => t.name === w88)!.rating
          const r16Winner = simulateKnockoutMatch(rW78, rW88) === 'A' ? w78 : w88
          r16Wins[r16Winner] = (r16Wins[r16Winner] || 0) + 1
        }

        setResults({
          r16: true,
          r16Results: Object.entries(r16Wins)
            .map(([name, wins]) => ({
              name,
              appearances: ((r16Appearances[name] || 0) / iterations) * 100,
              winPct: (wins / iterations) * 100,
            }))
            .sort((a, b) => b.winPct - a.winPct),
          note: 'Simulates groups D, E, G, I through R32 to project R16 at AT&T Stadium.',
        })
      } else if (selectedMatch === 101) {
        const groups = ['D', 'E', 'G', 'I']
        const allGroupTeams: Record<string, { name: string; rating: number }[]> = {}
        groups.forEach(g => {
          allGroupTeams[g] = groupTeams[g].map(t => ({ ...t, rating: ratings[t.name] || t.rating }))
        })

        const sfWins: Record<string, number> = {}

        for (let i = 0; i < iterations; i++) {
          const standings: Record<string, string[]> = {}
          groups.forEach(g => { standings[g] = simulateGroup(allGroupTeams[g]) })

          const getRating = (name: string) => {
            for (const g of groups) {
              const t = allGroupTeams[g].find(t => t.name === name)
              if (t) return t.rating
            }
            return 1500
          }

          const w78 = simulateKnockoutMatch(getRating(standings['E'][1]), getRating(standings['I'][1])) === 'A'
            ? standings['E'][1] : standings['I'][1]
          const w88 = simulateKnockoutMatch(getRating(standings['D'][1]), getRating(standings['G'][1])) === 'A'
            ? standings['D'][1] : standings['G'][1]

          const r16Winner = simulateKnockoutMatch(getRating(w78), getRating(w88)) === 'A' ? w78 : w88
          const winner1E = standings['E'][0]
          const qfWinner = simulateKnockoutMatch(getRating(r16Winner), getRating(winner1E)) === 'A'
            ? r16Winner : winner1E

          sfWins[qfWinner] = (sfWins[qfWinner] || 0) + 1
        }

        setResults({
          sf: true,
          sfResults: Object.entries(sfWins)
            .map(([name, wins]) => ({ name, winPct: (wins / iterations) * 100 }))
            .sort((a, b) => b.winPct - a.winPct),
          note: 'Projects semifinal from groups D, E, G, I through R32, R16, and QF.',
        })
      }
    } catch (error) {
      console.error('Simulation error:', error)
      alert('Error running simulation. Check console for details.')
      setResults(null)
    }

    setCalculating(false)
  }

  // --- Render helpers ---

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
              <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#888' }}>
                {r.rating.toFixed(0)}
              </td>
              <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>
                {r.first.toFixed(1)}%
              </td>
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
              <td style={{ padding: '8px' }}>
                <strong>{m.teamA}</strong> vs {m.teamB}
              </td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#1a6b3c', fontWeight: 'bold' }}>
                {m.pA.toFixed(1)}%
              </td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#666' }}>
                {m.pDraw.toFixed(1)}%
              </td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#cc3333' }}>
                {m.pB.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <Head>
        <title>WC 2026 Dallas Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <h1 style={{ color: '#003366', fontSize: '28px', marginBottom: '5px' }}>
        2026 World Cup Dallas Tracker
      </h1>
      <p style={{ color: '#666', fontSize: '14px', marginTop: 0, marginBottom: '20px' }}>
        AT&amp;T Stadium, Arlington TX &mdash; 9 matches
      </p>

      {/* Match selector */}
      <div style={{ marginBottom: '25px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {Object.entries(matches).map(([matchId, match]) => (
          <button
            key={matchId}
            onClick={() => { setSelectedMatch(Number(matchId)); setResults(null); setShowDetail(false) }}
            style={{
              padding: '10px 16px',
              background: selectedMatch === Number(matchId) ? '#003366' : '#f5f5f5',
              color: selectedMatch === Number(matchId) ? 'white' : '#003366',
              border: '2px solid #003366',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            <div>{matchId === '101' ? 'Semifinal' : `Match ${matchId}`}</div>
            <div style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.8, marginTop: '2px' }}>
              {match.round}
            </div>
          </button>
        ))}
      </div>

      {/* Match info card */}
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#003366' }}>{currentMatch.title}</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>{currentMatch.date}</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{currentMatch.matchup}</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{currentMatch.venue}</div>
      </div>

      {/* Run simulation button */}
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

      {/* R32 Results */}
      {results && results.groupA && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#003366', marginBottom: '20px' }}>Group Stage Probabilities</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {renderGroupTable(results.groupALabel, results.groupA)}
            {renderGroupTable(results.groupBLabel, results.groupB)}
          </div>

          {/* Toggle detail view */}
          <button
            onClick={() => setShowDetail(!showDetail)}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              background: 'white',
              color: '#003366',
              border: '1px solid #003366',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {showDetail ? 'Hide' : 'Show'} Individual Match Results
          </button>

          {/* Individual match detail */}
          {showDetail && results.matchProbsA && (
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              {renderMatchDetail(results.groupALabel, results.matchProbsA)}
              {renderMatchDetail(results.groupBLabel, results.matchProbsB)}
            </div>
          )}

          {/* Match prediction */}
          {results.matchWinPcts && results.matchWinPcts.length > 0 && (
            <div style={{ marginTop: '25px', background: '#003366', padding: '20px', borderRadius: '8px', color: 'white' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
                Match {selectedMatch} Win Probability
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {results.matchWinPcts.slice(0, 6).map((t: any, i: number) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '10px 15px',
                    borderRadius: '6px',
                    minWidth: '120px',
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
            Dixon-Coles &tau; correction (&rho; = &minus;0.05) adjusts for draw underestimation.{' '}
            10,000 Monte Carlo iterations. Standings by points &gt; GD &gt; GF.
            {ratingSource && <> | Ratings: {ratingSource}</>}
          </div>
        </div>
      )}

      {/* R16 Results */}
      {results && results.r16 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#003366', marginBottom: '15px' }}>Round of 16 Projections</h3>
          <table style={{ width: '100%', maxWidth: '600px', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#003366', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Team</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>P(Appear)</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', background: '#00509e' }}>P(Win R16)</th>
              </tr>
            </thead>
            <tbody>
              {results.r16Results.map((r: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '14px' }}>{r.name}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>{r.appearances.toFixed(1)}%</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#003366', fontWeight: 'bold', fontSize: '15px', background: i % 2 === 0 ? '#f0f8ff' : '#e6f2ff' }}>
                    {r.winPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '15px', fontSize: '13px', color: '#666' }}>{results.note}</div>
          {ratingSource && <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Ratings: {ratingSource}</div>}
        </div>
      )}

      {/* Semifinal Results */}
      {results && results.sf && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#003366', marginBottom: '15px' }}>Semifinal Projections</h3>
          <table style={{ width: '100%', maxWidth: '600px', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#003366', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Team</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', background: '#00509e' }}>P(Reach SF)</th>
              </tr>
            </thead>
            <tbody>
              {results.sfResults.slice(0, 10).map((r: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '14px' }}>{r.name}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#003366', fontWeight: 'bold', fontSize: '15px', background: i % 2 === 0 ? '#f0f8ff' : '#e6f2ff' }}>
                    {r.winPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '15px', fontSize: '13px', color: '#666' }}>{results.note}</div>
          {ratingSource && <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Ratings: {ratingSource}</div>}
        </div>
      )}

      {/* Methodology footer */}
      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e0e0e0', fontSize: '12px', color: '#888' }}>
        Poisson regression model (Maher 1982, Dixon &amp; Coles 1997) with FIFA Elo-based rankings.
        {ratingSource && <> | Source: {ratingSource}</>}
      </div>
    </div>
  )
}
