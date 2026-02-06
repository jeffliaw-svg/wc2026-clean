import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(
      'https://projects.fivethirtyeight.com/soccer-api/international/spi_global_rankings.csv'
    )
    
    const csvText = await response.text()
    const lines = csvText.trim().split('\n')
    
    const teams: Record<string, number> = {}
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue
      
      const cols = line.split(',')
      const teamName = cols[1]?.replace(/"/g, '').trim()
      const spiRating = parseFloat(cols[2])
      
      if (teamName && !isNaN(spiRating)) {
        teams[teamName] = spiRating
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      teams, 
      count: Object.keys(
