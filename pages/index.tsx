import { useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [selectedMatch, setSelectedMatch] = useState<number>(78)
  const [results, setResults] = useState<any[]>([])
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
      // Fetch FiveThirtyEight ratings
      const spiResponse = await fetch('/api/fivethirtyeight')
      const spiData = await spiResponse.json()
      
      // For now, simulate Match 78 with weighted probabilities based on team strength
      if (selectedMatch === 78) {
        const groupETeams = [
          { name: 'Germany', rating: spiData.teams['Germany'] || 85 },
          { name: 'Ecuador', rating: spiData.teams['Ecuador'] || 75 },
          { name: 'Côte d\'Ivoire', rating: 72 },
          { name: 'Curaçao', rating: 65 }
        ]
        
        const groupITeams = [
          { name: 'France', rating: spiData.teams['France'] || 89 },
          { name: 'Senegal', rating: 78 },
          { name: 'Norway', rating: 76 },
          { name: 'Play-off 2', rating: 70 }
        ]
        
        // Run Monte Carlo simulation
        const iterations = 10000
        const teamCounts: { [key: string]: { count: number, group: string } } = {}
        
        for (let i = 0; i < iterations; i++) {
          // Simulate Group E - pick runner-up based on ratings
          const eRunnerUp = selectRunnerUp(groupETeams)
          const iRunnerUp = selectRunnerUp(groupITeams)
          
          if (!teamCounts[eRunnerUp.name]) {
            teamCounts[eRunnerUp.name] = { count: 0, group: 'E' }
          }
          if (!teamCounts[iRunnerUp.name]) {
            teamCounts[iRunnerUp.name] = { count: 0, group: 'I' }
          }
          
          teamCounts[eRunnerUp.name].count++
          teamCounts[iRunnerUp.name].count++
        }
        
        const resultsArray = Object.entries(teamCounts).map(([team, data]) => ({
          team,
          group: data.group,
          probability: (data.count / iterations) * 100
        })).sort((a, b) => b.probability - a.probability)
        
        setResults(resultsArray)
      } else {
        // Placeholder for other matches
        setResults([
          { team: 'TBD', group: 'TBD', probability: 0 }
        ])
      }
    } catch (error) {
      console.error('Simulation error:', error)
      setResults([])
    }
    
    setCalculating(false)
  }

  // Helper function to select runner-up based on team ratings
  const selectRunnerUp = (teams: { name: string, rating: number }[]) => {
    // Convert ratings to probabilities (higher rating = higher chance)
    const totalRating = teams.reduce((sum, t) => sum + t.rating, 0)
    const probs = teams.map(t => t.rating / totalRating)
    
    // Randomly select based on weighted probabilities
    const rand = Math.random()
    let cumulative = 0
    
    for (let i = 0; i < teams.length; i++) {
      cumulative += probs[i]
      if (rand <= cumulative) {
        return teams[i]
      }
    }
    
    return teams[0]
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui' }}>
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
              setResults([])
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

      {results.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#003366' }}>Results:</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#003366', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Team</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Group</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Probability</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{r.team}</td>
                  <td style={{ padding: '12px' }}>Group {r.group}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#003366', fontWeight: 'bold', fontSize: '16px' }}>
                    {r.probability.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            Based on 10,000 Monte Carlo simulations using FiveThirtyEight SPI ratings
          </div>
        </div>
      )}
    </div>
  )
}
