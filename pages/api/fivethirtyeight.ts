import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(
      'https://projects.fivethirtyeight.com/soccer-api/international/spi_global_rankings.csv'
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch FiveThirtyEight data')
    }
    
    const csvText = await response.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    
    const teams: Record<string, number> = {}
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',')
      if (parts.length >= 3) {
        const teamName = parts[1].replace(/"/g, '').trim()
        const spiValue = parseFloat(parts[2])
        
        if (teamName && !isNaN(spiValue)) {
          teams[teamName] = Math.round(spiValue * 10) / 10
        }
      }
    }
    
    res.status(200).json({ 
      success: true, 
      teams,
      count: Object.keys(teams).length
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
