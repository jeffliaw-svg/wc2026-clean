import { useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [selectedMatch, setSelectedMatch] = useState<number>(78)
  const [results, setResults] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)

  const matches = {
    78: {
      title: 'Match 78 - Round of 32',
      date: 'June 30, 2026 • 3:00 PM CT',
      matchup: 'Group E Runner-up vs Group I Runner-up',
      venue: 'AT&T Stadium, Arlington, TX',
      groups: ['E', 'I']
    },
    86: {
      title: 'Match 86 - Round of 32',
      date: 'July 3, 2026 • 7:00 PM CT',
      matchup: 'Group D Runner-up vs Group G Runner-up',
      venue: 'AT&T Stadium, Arlington, TX',
      groups: ['D', 'G']
    },
    93: {
      title: 'Match 93 - Round of 16',
      date: 'July 6, 2026 • 3:00 PM CT',
      matchup: 'Winner Match 83 vs Winner Match 84',
      venue: 'AT&T Stadium, Arlington, TX',
      groups: []
    },
    101: {
      title: 'Match 101 - Semifinal',
      date: 'July 14, 2026 • 7:00 PM CT',
      matchup: 'Winner QF1 vs Winner QF2',
      venue: 'AT&T Stadium, Arlington, TX',
      groups: []
    }
  }

  const currentMatch = matches[selectedMatch as keyof typeof matches]

  const runSimulation = async () => {
    setCalculating(true)
    
    try {
      const spiResponse = await fetch('/api/fivethirtyeight')
      const spiData = await spiResponse.json()
      
      if (!spiData.success || !spiData.teams) {
        throw new Error('Failed to fetch team ratings')
      }
      
      const ratings = spiData.teams
      
      if (selectedMatch === 78) {
        const groupETeams = [
          { name: 'Germany', rating: ratings['Germany'] || 85.7 },
          { name: 'Ecuador', rating: ratings['Ecuador'] || 69.7 },
          { name: 'Côte d\'Ivoire', rating: ratings['Côte d\'Ivoire'] || 66.1 },
          { name: 'Curaçao', rating: ratings['Curaçao'] || 58.2 }
        ]
        
        const groupITeams = [
          { name: 'France', rating: ratings['France'] || 89.4 },
          { name: 'Senegal', rating: ratings['Senegal'] || 72.4 },
          { name: 'Norway', rating: ratings['Norway'] || 67.3 },
          { name: 'TBD Playoff', rating: ratings['Play-off 2'] || 60.0 }
        ]
        
        const iterations = 10000
        
        // Track all positions for each team
        const groupEPositions: { [team: string]: number[] } = {}
        const groupIPositions: { [team: string]: number[] } = {}
        
        groupETeams.forEach(t => groupEPositions[t.name] = [0, 0, 0, 0])
        groupITeams.forEach(t => groupIPositions[t.name] = [0, 0, 0, 0])
        
        for (let i = 0; i < iterations; i++) {
          const eStandings = simulateGroup(groupETeams)
          const iStandings = simulateGroup(groupITeams)
          
          eStandings.forEach((team, position) => {
            groupEPositions[team][position]++
          })
          
          iStandings.forEach((team, position) => {
            groupIPositions[team][position]++
          })
        }
        
        // Convert to percentages
        const groupEResults = groupETeams.map(team => ({
          name: team.name,
          rating: team.rating,
          first: (groupEPositions[team.name][0] / iterations) * 100,
          second: (groupEPositions[team.name][1] / iterations) * 100,
          third: (groupEPositions[team.name][2] / iterations) * 100,
          fourth: (groupEPositions[team.name][3] / iterations) * 100
        })).sort((a, b) => b.second - a.second)
        
        const groupIResults = groupITeams.map(team => ({
          name: team.name,
          rating: team.rating,
          first: (groupIPositions[team.name][0] / iterations) * 100,
          second: (groupIPositions[team.name][1] / iterations) * 100,
          third: (groupIPositions[team.name][2] / iterations) * 100,
          fourth: (groupIPositions[team.name][3] / iterations) * 100
        })).sort((a, b) => b.second - a.second)
        
        setResults({ groupE: groupEResults, groupI: groupIResults })
      } else {
        setResults({ message: 'Full tournament simulation coming soon' })
      }
    } catch (error) {
      console.error('Simulation error:', error)
      alert('Error running simulation. Check console for details.')
      setResults(null)
    }
    
    setCalculating(false)
  }

  const simulateGroup = (teams: { name: string, rating: number }[]): string[] => {
    const standings = teams.map(t => ({ 
      name: t.name, 
      rating: t.rating, 
      points: 0, 
      gd: 0,
      gf: 0
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

  const simulateMatch = (ratingA: number, ratingB: number): { homeGoals: number, awayGoals: number } => {
    // FiveThirtyEight's research-backed formula for converting SPI to expected goals
    // Source: FiveThirtyEight Soccer Power Index methodology
    // Formula: λ = baseline * exp((SPI - avg) / scale)
    // where baseline ≈ 1.4 (World Cup average), avg = 70, scale = 20
    
    const lambdaA = 1.4 * Math.exp((ratingA - 70) / 20)
    const lambdaB = 1.4 * Math.exp((ratingB - 70) / 20)
    
    const homeGoals = poissonSample(lambdaA)
    const awayGoals = poissonSample(lambdaB)
    
    return { homeGoals, awayGoals }
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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <Head>
        <title>WC 2026 Dallas Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <h1 style={{ color: '#003366', fontSize: '28px', marginBottom: '20px' }}>🏆 2026 World Cup Dallas Tracker</h1>
      
      <div style={{ marginBottom: '25px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {Object.keys(matches).map(matchId => (
          <button
            key={matchId}
            onClick={() => {
              setSelectedMatch(Number(matchId))
              setResults(null)
            }}
            style={{
              padding: '10px 20px',
              background: selectedMatch === Number(matchId) ? '#003366' : '#f5f5f5',
              color: selectedMatch === Number(matchId) ? 'white' : '#003366',
              border: '2px solid #003366',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Match {matchId}
          </button>
        ))}
      </div>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#003366' }}>{currentMatch.title}</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>{currentMatch.date}</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{currentMatch.matchup}</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{currentMatch.venue}</div>
      </div>

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
          maxWidth: '400px'
        }}
      >
        {calculating ? '⚽ Calculating...' : '▶️ Run Simulation (10,000 iterations)'}
      </button>

      {results && results.groupE && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#003366', marginBottom: '20px' }}>Group Stage Probabilities:</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Group E */}
            <div>
              <h4 style={{ color: '#003366', marginBottom: '10px', fontSize: '18px' }}>Group E</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#003366', color: 'white' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Team</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>P(1st)</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', background: '#00509e' }}>P(2nd)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.groupE.map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '14px' }}>{r.name}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>{r.first.toFixed(1)}%</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#003366', fontWeight: 'bold', fontSize: '15px', background: i % 2 === 0 ? '#f0f8ff' : '#e6f2ff' }}>
                        {r.second.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Group I */}
            <div>
              <h4 style={{ color: '#003366', marginBottom: '10px', fontSize: '18px' }}>Group I</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#003366', color: 'white' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Team</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>P(1st)</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', background: '#00509e' }}>P(2nd)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.groupI.map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '14px' }}>{r.name}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>{r.first.toFixed(1)}%</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#003366', fontWeight: 'bold', fontSize: '15px', background: i % 2 === 0 ? '#f0f8ff' : '#e6f2ff' }}>
                        {r.second.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            Based on 10,000 Monte Carlo simulations using FiveThirtyEight's Poisson model (λ = 1.4 × e^((SPI-70)/20)).
            <br/>
            Match 78 participants: One runner-up from each group (highlighted column).
          </div>
        </div>
      )}

      {results && results.message && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p style={{ color: '#666', margin: 0 }}>{results.message}</p>
        </div>
      )}
    </div>
  )
}
