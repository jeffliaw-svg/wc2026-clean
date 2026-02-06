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
          { name: 'Germany', rating: ratings['Germany'] || 85 },
          { name: 'Ecuador', rating: ratings['Ecuador'] || 75 },
          { name: 'Côte d\'Ivoire', rating: ratings['Côte d\'Ivoire'] || 72 },
          { name: 'Curaçao', rating: ratings['Curaçao'] || 65 }
        ]
        
        const groupITeams = [
          { name: 'France', rating: ratings['France'] || 89 },
          { name: 'Senegal', rating: ratings['Senegal'] || 78 },
          { name: 'Norway', rating: ratings['Norway'] || 76 },
          { name: 'TBD Playoff', rating: ratings['Play-off 2'] || 70 }
        ]
        
        const iterations = 10000
        const teamCounts: { [key: string]: { count: number, group: string } } = {}
        
        for (let i = 0; i < iterations; i++) {
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

  const selectRunnerUp = (teams: { name: string, rating: number }[]) => {
    // Square the ratings to create bigger spreads between strong and weak teams
    const squaredRatings = teams.map(t => t.rating * t.rating)
    const totalRating = squaredRatings.reduce((sum, r) => sum + r, 0)
    const probs = squaredRatings.map(r
