import { useState, useEffect } from 'react'
import Head from 'next/head'

const GROUPS = {
  E: ['Germany', 'Ecuador', 'Côte d\'Ivoire', 'Curaçao'],
  I: ['France', 'Senegal', 'Norway', 'Play-off 2']
}

interface TeamProbs {
  winner: number
  runnerUp: number
  third: number
}

interface GroupProbs {
  [team: string]: TeamProbs
}

export default function Home() {
  const [groupProbs, setGroupProbs] = useState<{ [group: string]: GroupProbs }>({})
  const [results, setResults] = useState<{ team: string; probability: number; group: string }[]>([])
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    const initProbs: { [group: string]: GroupProbs } = {}
    Object.entries(GROUPS).forEach(([groupKey, teams]) => {
      initProbs[groupKey] = {}
      teams.forEach(team => {
        initProbs[groupKey][team] = { winner: 25, runnerUp: 25, third: 25 }
      })
    })
    setGroupProbs(initProbs)
  }, [])

  const runSimulation = () => {
    setCalculating(true)
    setTimeout(() => {
      const teamCounts: { [team: string]: { count: number; group: string } } = {}
      
      for (let i = 0; i < 10000; i++) {
        const teamE = selectFromGroup(groupProbs['E'], 'runnerUp')
        const teamI = selectFromGroup(groupProbs['I'], 'runnerUp')
        
        if (!teamCounts[teamE]) teamCounts[teamE] = { count: 0, group: 'E' }
        if (!teamCounts[teamI]) teamCounts[teamI] = { count: 0, group: 'I' }
        teamCounts[teamE].count++
        teamCounts[teamI].count++
      }
      
      const resultsArray = Object.entries(teamCounts).map(([team, data]) => ({
        team,
        group: data.group,
        probability: (data.count / 10000) * 100
      })).sort((a, b) => b.probability - a.probability)
      
      setResults(resultsArray)
      setCalculating(false)
    }, 100)
  }

  const selectFromGroup = (groupProb: GroupProbs, position: keyof TeamProbs): string => {
    const teams = Object.keys(groupProb)
    const probs = teams.map(team => groupProb[team][position])
    const total = probs.reduce((a, b) => a + b, 0)
    if (total === 0) return teams[0]
    const normalized = probs.map(p => p / total)
    const rand = Math.random()
    let cumulative = 0
    for (let i = 0; i < teams.length; i++) {
      cumulative += normalized[i]
      if (rand <= cumulative) return teams[i]
    }
    return teams[0]
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <Head>
        <title>WC 2026 Dallas Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <h1 style={{ color: '#003366', fontSize: '28px' }}>🏆 2026 World Cup Dallas Tracker</h1>
      
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Match 78 - Round of 32</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>June 30, 2026 • 3:00 PM CT</div>
        <div style={{ fontSize: '14px', color: '#666' }}>Group E Runner-up vs Group I Runner-up</div>
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
          marginTop: '25px',
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
            Based on 10,000 Monte Carlo simulations • Built from MacBook Air 💻
          </div>
        </div>
      )}
    </div>
  )
}
