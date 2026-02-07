// Updated version
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
        
        // Track counts separately for each group
        const groupECounts: { [key: string]: number } = {}
        const groupICounts: { [key: string]: number } = {}
        
        // Initialize all teams
        groupETeams.forEach(t => groupECounts[t.name] = 0)
        groupITeams.forEach(t => groupICounts[t.name] = 0)
        
        // Run simulations
        for (let i = 0; i < iterations; i++) {
          const eRunnerUp = simulateGroup(groupETeams)
          const iRunnerUp = simulateGroup(groupITeams)
          
          groupECounts[eRunnerUp]++
          groupICounts[iRunnerUp]++
        }
        
        // Convert to results array with percentages
        const resultsArray: any[] = []
        
        groupETeams.forEach(team => {
          resultsArray.push({
            team: team.name,
            group: 'E',
            probability: (groupECounts[team.name] / iterations) * 100
          })
        })
        
        groupITeams.forEach(team => {
          resultsArray.push({
            team: team.name,
            group: 'I',
            probability: (groupICounts[team.name] / iterations) * 100
          })
        })
        
        // Sort by probability descending
        resultsArray.sort((a, b) => b.probability - a.probability)
        
        setResults(resultsArray)
      } else {
        setResults([
          { team: 'TBD - Full tournament simulation coming soon', group: 'TBD', probability: 0 }
        ])
      }
    } catch (error) {
      console.error('Simulation error:', error)
      alert('Error running simulation. Check console for details.')
      setResults([])
    }
    
    setCalculating(false)
  }

  const simulateGroup = (teams: { name: string, rating: number }[]): string => {
    const standings = teams.map(t => ({ 
      name: t.name, 
      rating: t.rating, 
      points: 0, 
      gd: 0 
    }))
    
    // Simulate all 6 group matches
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const result = simulateMatch(standings[i].rating, standings[j].rating)
        
        if (result === 'home') {
          standings[i].points += 3
          standings[i].gd += 2
          standings[j].gd -= 2
        } else if (result === 'away') {
          standings[j].points += 3
          standings[j].gd += 2
          standings[i].gd -= 2
        } else {
          standings[i].points += 1
          standings[j].points += 1
        }
      }
    }
    
    // Sort by points then goal difference
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.gd - a.gd
    })
    
    return standings[1].name
  }

  const simulateMatch = (ratingA: number, ratingB: number): 'home' | 'away' | 'draw' => {
    // Use aggressive rating difference - cube the difference for bigger spreads
    const diff = ratingA - ratingB
    const adjustedDiff = Math.sign(diff) * Math.pow(Math.abs(diff), 1.5)
    
    // Convert to win probability using aggressive sigmoid
    const winProbA = 1 / (1 + Math.exp(-adjustedDiff / 15))
    
    const rand = Math.random()
    
    // 15% draw rate
    if (rand < 0.15) return 'draw'
    
    // Remaining 85% distributed by win probability
    const adjRand = (rand - 0.15) / 0.85
    return adjRand < winProbA ? 'home' : 'away'
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
          <h3 style={{ color: '#003366' }}>Probability of Finishing Runner-up:</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', marginTop: '15px' }}>
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
            Based on 10,000 Monte Carlo simulations. Probabilities sum to 200% (one runner-up from each group).
          </div>
        </div>
      )}
    </div>
  )
}
