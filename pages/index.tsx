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

  const groupTeams: Record<string, { name: string; rating: number }[]> = {
    D: [
      { name: 'United States', rating: 73.8 },
      { name: 'Paraguay', rating: 65.0 },
      { name: 'Australia', rating: 64.3 },
      { name: 'UEFA Playoff C', rating: 62.0 },
    ],
    E: [
      { name: 'Germany', rating: 85.7 },
      { name: 'Ecuador', rating: 69.7 },
      { name: "C\u00f4te d'Ivoire", rating: 66.1 },
      { name: 'Cura\u00e7ao', rating: 58.2 },
    ],
    G: [
      { name: 'Belgium', rating: 82.4 },
      { name: 'Egypt', rating: 65.5 },
      { name: 'Iran', rating: 58.7 },
      { name: 'New Zealand', rating: 57.0 },
    ],
    I: [
      { name: 'France', rating: 89.4 },
      { name: 'Senegal', rating: 72.4 },
      { name: 'Norway', rating: 67.3 },
      { name: 'TBD Playoff', rating: 60.0 },
    ],
  }

  const currentMatch = matches[selectedMatch]

  // --- Poisson helpers ---

  const poissonPmf = (lambda: number, k: number): number => {
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k)
  }

  const factorial = (n: number): number => {
    let f = 1
    for (let i = 2; i <= n; i++) f *= i
    return f
  }

  const spiToLambda = (rating: number): number => 1.4 * Math.exp((rating - 70) / 20)

  // Analytical match probabilities from Poisson model
  const calcMatchProbs = (ratingA: number, ratingB: number): { pA: number; pDraw: number; pB: number } => {
    const lambdaA = spiToLambda(ratingA)
    const lambdaB = spiToLambda(ratingB)
    let pA = 0, pDraw = 0, pB = 0
    const maxGoals = 10
    for (let a = 0; a <= maxGoals; a++) {
      for (let b = 0; b <= maxGoals; b++) {
        const p = poissonPmf(lambdaA, a) * poissonPmf(lambdaB, b)
        if (a > b) pA += p
        else if (a === b) pDraw += p
        else pB += p
      }
    }
    return { pA, pDraw, pB }
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

  const simulateMatch = (ratingA: number, ratingB: number) => {
    const lambdaA = spiToLambda(ratingA)
    const lambdaB = spiToLambda(ratingB)
    return { homeGoals: poissonSample(lambdaA), awayGoals: poissonSample(lambdaB) }
  }

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

  const simulateKnockoutMatch = (ratingA: number, ratingB: number): 'A' | 'B' => {
    const result = simulateMatch(ratingA, ratingB)
    if (result.homeGoals !== result.awayGoals) {
      return result.homeGoals > result.awayGoals ? 'A' : 'B'
    }
    const et = simulateMatch(ratingA * 0.98, ratingB * 0.98)
    if (et.homeGoals !== et.awayGoals) {
      return et.homeGoals > et.awayGoals ? 'A' : 'B'
    }
    return Math.random() < 0.5 + (ratingA - ratingB) * 0.002 ? 'A' : 'B'
  }

  // --- Main simulation ---

  const runSimulation = async () => {
    setCalculating(true)

    try {
      const spiResponse = await fetch('/api/fivethirtyeight')
      const spiData = await spiResponse.json()
      if (!spiData.success || !spiData.teams) throw new Error('Failed to fetch team ratings')
      const ratings = spiData.teams
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
            return 65
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

  const Sup = ({ children }: { children: string }) => (
    <sup style={{ fontSize: '9px', opacity: 0.6, marginLeft: '1px' }}>{children}</sup>
  )

  const renderGroupTable = (label: string, teamResults: TeamResult[]) => (
    <div>
      <h4 style={{ color: '#003366', marginBottom: '10px', fontSize: '18px' }}>{label}</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#003366', color: 'white' }}>
            <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Team</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>P(1st)</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', background: '#00509e' }}>P(2nd)</th>
          </tr>
        </thead>
        <tbody>
          {teamResults.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
              <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '14px' }}>{r.name}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>
                {r.first.toFixed(1)}%<Sup>S</Sup>
              </td>
              <td style={{ padding: '10px', textAlign: 'right', color: '#003366', fontWeight: 'bold', fontSize: '15px', background: i % 2 === 0 ? '#f0f8ff' : '#e6f2ff' }}>
                {r.second.toFixed(1)}%<Sup>S</Sup>
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
                Match {selectedMatch} Win Probability<Sup>S</Sup>
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
            <sup>S</sup> = 10,000 Monte Carlo simulations. Each team plays 3 group games (round-robin). Standings by points &gt; goal difference &gt; goals for.
            Match probabilities from Poisson model (&lambda; = 1.4 &times; e<sup>(SPI-70)/20</sup>).
          </div>
        </div>
      )}

      {/* R16 Results */}
      {results && results.r16 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#003366', marginBottom: '15px' }}>Round of 16 Projections<Sup>S</Sup></h3>
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
        </div>
      )}

      {/* Semifinal Results */}
      {results && results.sf && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#003366', marginBottom: '15px' }}>Semifinal Projections<Sup>S</Sup></h3>
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
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e0e0e0', fontSize: '12px', color: '#888' }}>
        <sup>S</sup> = Monte Carlo simulation (10,000 iterations)
      </div>
    </div>
  )
}
