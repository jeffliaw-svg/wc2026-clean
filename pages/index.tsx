import { useState, useEffect } from 'react'
import Head from 'next/head'

type TeamResult = {
  name: string
  rating: number
  first: number
  second: number
  third: number
  fourth: number
}

type KalshiTeam = { team: string; pWin: number; pQualify: number }
type KalshiData = {
  success: boolean
  groups: Record<string, KalshiTeam[]>
  lastFetched: string
} | null

type MatchResult = {
  teamA: string
  teamB: string
  pA: number
  pB: number
}

export default function Home() {
  const [selectedMatch, setSelectedMatch] = useState<number>(78)
  const [results, setResults] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)
  const [kalshiData, setKalshiData] = useState<KalshiData>(null)
  const [kalshiError, setKalshiError] = useState<string | null>(null)

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

  // Fetch Kalshi market data on mount
  useEffect(() => {
    fetch('/api/kalshi')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setKalshiData(data)
        } else {
          setKalshiError(data.error || 'Failed to load market data')
        }
      })
      .catch(() => setKalshiError('Could not connect to Kalshi API'))
  }, [])

  const currentMatch = matches[selectedMatch]

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
    const lambdaA = 1.4 * Math.exp((ratingA - 70) / 20)
    const lambdaB = 1.4 * Math.exp((ratingB - 70) / 20)
    return {
      homeGoals: poissonSample(lambdaA),
      awayGoals: poissonSample(lambdaB),
    }
  }

  const simulateGroup = (teams: { name: string; rating: number }[]): string[] => {
    const standings = teams.map(t => ({
      name: t.name,
      rating: t.rating,
      points: 0,
      gd: 0,
      gf: 0,
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
    // Extra time: slight boost, simulate again
    const et = simulateMatch(ratingA * 0.98, ratingB * 0.98)
    if (et.homeGoals !== et.awayGoals) {
      return et.homeGoals > et.awayGoals ? 'A' : 'B'
    }
    // Penalties: roughly 50/50 with slight edge to higher-rated team
    const penaltyEdge = 0.5 + (ratingA - ratingB) * 0.002
    return Math.random() < penaltyEdge ? 'A' : 'B'
  }

  const runSimulation = async () => {
    setCalculating(true)

    try {
      const spiResponse = await fetch('/api/fivethirtyeight')
      const spiData = await spiResponse.json()

      if (!spiData.success || !spiData.teams) {
        throw new Error('Failed to fetch team ratings')
      }

      const ratings = spiData.teams
      const iterations = 10000

      if (currentMatch.round === 'R32') {
        const [groupA, groupB] = currentMatch.groups
        const teamsA = groupTeams[groupA].map(t => ({
          ...t,
          rating: ratings[t.name] || t.rating,
        }))
        const teamsB = groupTeams[groupB].map(t => ({
          ...t,
          rating: ratings[t.name] || t.rating,
        }))

        const positionsA: Record<string, number[]> = {}
        const positionsB: Record<string, number[]> = {}
        teamsA.forEach(t => (positionsA[t.name] = [0, 0, 0, 0]))
        teamsB.forEach(t => (positionsB[t.name] = [0, 0, 0, 0]))

        // Track head-to-head match outcomes
        const matchWins: Record<string, number> = {}
        teamsA.forEach(t => (matchWins[t.name] = 0))
        teamsB.forEach(t => (matchWins[t.name] = 0))

        for (let i = 0; i < iterations; i++) {
          const standingsA = simulateGroup(teamsA)
          const standingsB = simulateGroup(teamsB)

          standingsA.forEach((team, pos) => positionsA[team][pos]++)
          standingsB.forEach((team, pos) => positionsB[team][pos]++)

          // Simulate the R32 match between 2nd-place teams
          const runnerA = standingsA[1]
          const runnerB = standingsB[1]
          const rA = teamsA.find(t => t.name === runnerA)!.rating
          const rB = teamsB.find(t => t.name === runnerB)!.rating
          const winner = simulateKnockoutMatch(rA, rB)
          matchWins[winner === 'A' ? runnerA : runnerB]++
        }

        const groupAResults: TeamResult[] = teamsA.map(team => ({
          name: team.name,
          rating: team.rating,
          first: (positionsA[team.name][0] / iterations) * 100,
          second: (positionsA[team.name][1] / iterations) * 100,
          third: (positionsA[team.name][2] / iterations) * 100,
          fourth: (positionsA[team.name][3] / iterations) * 100,
        })).sort((a, b) => b.first - a.first)

        const groupBResults: TeamResult[] = teamsB.map(team => ({
          name: team.name,
          rating: team.rating,
          first: (positionsB[team.name][0] / iterations) * 100,
          second: (positionsB[team.name][1] / iterations) * 100,
          third: (positionsB[team.name][2] / iterations) * 100,
          fourth: (positionsB[team.name][3] / iterations) * 100,
        })).sort((a, b) => b.first - a.first)

        // Compute match win probabilities
        const totalMatchWins = Object.values(matchWins).reduce((a, b) => a + b, 0)
        const matchPredictions: MatchResult[] = []
        const allTeams = [...teamsA, ...teamsB]
        const teamWinPcts = allTeams
          .map(t => ({ name: t.name, pct: (matchWins[t.name] / totalMatchWins) * 100 }))
          .filter(t => t.pct > 0)
          .sort((a, b) => b.pct - a.pct)

        // Get top runner-up from each group for the headline matchup
        const topRunnerA = groupAResults.sort((a, b) => b.second - a.second)[0]
        const topRunnerB = groupBResults.sort((a, b) => b.second - a.second)[0]
        if (topRunnerA && topRunnerB) {
          const pA = teamWinPcts.find(t => t.name === topRunnerA.name)?.pct || 0
          const pB = teamWinPcts.find(t => t.name === topRunnerB.name)?.pct || 0
          matchPredictions.push({
            teamA: topRunnerA.name,
            teamB: topRunnerB.name,
            pA,
            pB,
          })
        }

        setResults({
          groupA: groupAResults.sort((a, b) => b.second - a.second),
          groupB: groupBResults.sort((a, b) => b.second - a.second),
          groupALabel: `Group ${groupA}`,
          groupBLabel: `Group ${groupB}`,
          matchWinPcts: teamWinPcts,
          matchPredictions,
        })
      } else if (selectedMatch === 93) {
        // Round of 16: simulate all 4 feeder groups, R32 matches, then R16
        const groups = ['D', 'E', 'G', 'I']
        const allGroupTeams: Record<string, { name: string; rating: number }[]> = {}
        groups.forEach(g => {
          allGroupTeams[g] = groupTeams[g].map(t => ({
            ...t,
            rating: ratings[t.name] || t.rating,
          }))
        })

        // Track who advances to R16 (wins at AT&T Stadium)
        const r16Appearances: Record<string, number> = {}
        const r16Wins: Record<string, number> = {}

        for (let i = 0; i < iterations; i++) {
          // Simulate all 4 groups
          const standings: Record<string, string[]> = {}
          groups.forEach(g => {
            standings[g] = simulateGroup(allGroupTeams[g])
          })

          // R32: Match 78 (2E vs 2I), Match 88 (2D vs 2G)
          const runner2E = standings['E'][1]
          const runner2I = standings['I'][1]
          const runner2D = standings['D'][1]
          const runner2G = standings['G'][1]

          const r2E = allGroupTeams['E'].find(t => t.name === runner2E)!.rating
          const r2I = allGroupTeams['I'].find(t => t.name === runner2I)!.rating
          const r2D = allGroupTeams['D'].find(t => t.name === runner2D)!.rating
          const r2G = allGroupTeams['G'].find(t => t.name === runner2G)!.rating

          const w78 = simulateKnockoutMatch(r2E, r2I) === 'A' ? runner2E : runner2I
          const w88 = simulateKnockoutMatch(r2D, r2G) === 'A' ? runner2D : runner2G

          // These winners could meet in R16 (Match 93 pathway)
          // Match 93 = Winner M83 vs Winner M84
          // M83 and M84 are feeder R32 matches from other groups in the bracket
          // For simplicity, we simulate M78 winner vs M88 winner as the R16 at AT&T
          r16Appearances[w78] = (r16Appearances[w78] || 0) + 1
          r16Appearances[w88] = (r16Appearances[w88] || 0) + 1

          const rW78 = [...allGroupTeams['E'], ...allGroupTeams['I']].find(t => t.name === w78)!.rating
          const rW88 = [...allGroupTeams['D'], ...allGroupTeams['G']].find(t => t.name === w88)!.rating
          const r16Winner = simulateKnockoutMatch(rW78, rW88) === 'A' ? w78 : w88
          r16Wins[r16Winner] = (r16Wins[r16Winner] || 0) + 1
        }

        const r16Results = Object.entries(r16Wins)
          .map(([name, wins]) => ({
            name,
            appearances: ((r16Appearances[name] || 0) / iterations) * 100,
            winPct: (wins / iterations) * 100,
          }))
          .sort((a, b) => b.winPct - a.winPct)

        setResults({
          r16: true,
          r16Results,
          note: 'Simulates feeder groups (D, E, G, I) through R32 to project R16 matchup at AT&T Stadium.',
        })
      } else if (selectedMatch === 101) {
        // Semifinal: full bracket path simulation
        const groups = ['D', 'E', 'G', 'I']
        const allGroupTeams: Record<string, { name: string; rating: number }[]> = {}
        groups.forEach(g => {
          allGroupTeams[g] = groupTeams[g].map(t => ({
            ...t,
            rating: ratings[t.name] || t.rating,
          }))
        })

        const sfWins: Record<string, number> = {}

        for (let i = 0; i < iterations; i++) {
          const standings: Record<string, string[]> = {}
          groups.forEach(g => {
            standings[g] = simulateGroup(allGroupTeams[g])
          })

          const getRating = (name: string) => {
            for (const g of groups) {
              const t = allGroupTeams[g].find(t => t.name === name)
              if (t) return t.rating
            }
            return 65
          }

          // R32
          const runner2E = standings['E'][1]
          const runner2I = standings['I'][1]
          const runner2D = standings['D'][1]
          const runner2G = standings['G'][1]

          const w78 = simulateKnockoutMatch(getRating(runner2E), getRating(runner2I)) === 'A' ? runner2E : runner2I
          const w88 = simulateKnockoutMatch(getRating(runner2D), getRating(runner2G)) === 'A' ? runner2D : runner2G

          // R16
          const r16Winner = simulateKnockoutMatch(getRating(w78), getRating(w88)) === 'A' ? w78 : w88

          // QF: R16 winner vs a projected opponent (use group winner from a feeder group)
          const winner1E = standings['E'][0]
          const qfOpponentRating = getRating(winner1E)
          const qfWinner = simulateKnockoutMatch(getRating(r16Winner), qfOpponentRating) === 'A'
            ? r16Winner
            : winner1E

          sfWins[qfWinner] = (sfWins[qfWinner] || 0) + 1
        }

        const sfResults = Object.entries(sfWins)
          .map(([name, wins]) => ({
            name,
            winPct: (wins / iterations) * 100,
          }))
          .sort((a, b) => b.winPct - a.winPct)

        setResults({
          sf: true,
          sfResults,
          note: 'Projects semifinal participants from Dallas-bracket feeder groups (D, E, G, I) through R32, R16, and QF rounds.',
        })
      }
    } catch (error) {
      console.error('Simulation error:', error)
      alert('Error running simulation. Check console for details.')
      setResults(null)
    }

    setCalculating(false)
  }

  // Helper: find Kalshi data for a team in a group
  const getKalshiOdds = (group: string, teamName: string): KalshiTeam | null => {
    if (!kalshiData?.groups?.[group]) return null
    return kalshiData.groups[group].find(
      t => t.team.toLowerCase().includes(teamName.toLowerCase().split(' ')[0])
        || teamName.toLowerCase().includes(t.team.toLowerCase().split(' ')[0])
    ) || null
  }

  const renderGroupTable = (label: string, groupLetter: string, teamResults: TeamResult[]) => (
    <div>
      <h4 style={{ color: '#003366', marginBottom: '10px', fontSize: '18px' }}>{label}</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#003366', color: 'white' }}>
            <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Team</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>P(1st)</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', background: '#00509e' }}>P(2nd)</th>
            {kalshiData && (
              <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', background: '#1a6b3c', color: 'white' }}>
                Kalshi
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {teamResults.map((r, i) => {
            const kalshi = getKalshiOdds(groupLetter, r.name)
            const pSecondKalshi = kalshi ? Math.max(0, kalshi.pQualify - kalshi.pWin) : null
            return (
              <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '14px' }}>{r.name}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>{r.first.toFixed(1)}%</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#003366', fontWeight: 'bold', fontSize: '15px', background: i % 2 === 0 ? '#f0f8ff' : '#e6f2ff' }}>
                  {r.second.toFixed(1)}%
                </td>
                {kalshiData && (
                  <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', color: '#1a6b3c', fontWeight: 'bold', background: i % 2 === 0 ? '#f0fff4' : '#e6ffe6' }}>
                    {pSecondKalshi !== null ? `${pSecondKalshi.toFixed(0)}%` : '\u2014'}
                  </td>
                )}
              </tr>
            )
          })}
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

      {/* Kalshi status indicator */}
      <div style={{ marginBottom: '15px', fontSize: '12px' }}>
        {kalshiData ? (
          <span style={{ color: '#1a6b3c' }}>
            Kalshi market data loaded ({kalshiData.lastFetched ? new Date(kalshiData.lastFetched).toLocaleTimeString() : 'live'})
          </span>
        ) : kalshiError ? (
          <span style={{ color: '#cc6600' }}>
            Kalshi: {kalshiError} (using simulation only)
          </span>
        ) : (
          <span style={{ color: '#999' }}>Loading Kalshi market data...</span>
        )}
      </div>

      {/* Match selector */}
      <div style={{ marginBottom: '25px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {Object.entries(matches).map(([matchId, match]) => (
          <button
            key={matchId}
            onClick={() => {
              setSelectedMatch(Number(matchId))
              setResults(null)
            }}
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
            {renderGroupTable(results.groupALabel, currentMatch.groups[0], results.groupA)}
            {renderGroupTable(results.groupBLabel, currentMatch.groups[1], results.groupB)}
          </div>

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

          <div style={{ marginTop: '20px', fontSize: '13px', color: '#666' }}>
            Based on 10,000 Monte Carlo simulations using FiveThirtyEight&apos;s Poisson model
            (&lambda; = 1.4 &times; e<sup>(SPI-70)/20</sup>).
            {kalshiData && ' Kalshi column shows market-implied P(2nd) = P(qualify) - P(win group).'}
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
        </div>
      )}
    </div>
  )
}
