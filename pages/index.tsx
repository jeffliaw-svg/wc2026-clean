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
        
        const groupECounts: { [key: string]: number } = {}
        const groupICounts: { [key: string]: number } = {}
        
        groupETeams.forEach(t => groupECounts[t.name] = 0)
        groupITeams.forEach(t => groupICounts[t.name] = 0)
        
        for (let i = 0; i < iterations; i++) {
          const eRunnerUp = simulateGroup(groupETeams)
          const iRunnerUp = simulateGroup(groupITeams)
          
          groupECounts[eRunnerUp]++
          groupICounts[iRunnerUp]++
        }
        
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
    
    return standings[1].name
  }

  const simulateMatch = (ratingA: number, ratingB: number): { homeGoal
