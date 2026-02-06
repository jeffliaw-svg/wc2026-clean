import type { NextApiRequest, NextApiResponse } from 'next'
import Papa from 'papaparse'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(
      'https://projects.fivethirtyeight.com/soccer-api/international/spi_global_rankings.csv'
    )
    
    const csvText = await response.text()
    
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    })
    
    const teams: Record<string, number> = {}
    
    parsed.data.forEach((row: any) => {
      const name = row.name
      const spi = parseFloat(row.spi)
      
      if (name && !isNaN(spi)) {
        teams[name] = Math.round(spi * 10) / 10
      }
    })
    
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
