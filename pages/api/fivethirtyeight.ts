import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch FiveThirtyEight SPI ratings from their GitHub repo
    const response = await fetch(
      'https://projects.fivethirtyeight.com/soccer-api/international/spi_global_rankings.csv'
    )
    
    const csvText = await response.text()
    const lines = csvText.split('\n')
    const headers = lines[0].split(',')
    
    // Parse CSV into team ratings
    const teams: { [key: string]: number } = {}
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      if (values.length > 2) {
        const name = values[1]?.replace(/"/g, '').trim()
        const spi = parseFloat(values[2])
        if (name && !isNaN(spi)) {
          teams[name] = spi
        }
      }
    }
    
    res.status(200).json({ success: true, teams, count: Object.keys(teams).length })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch FiveThirtyEight data' })
  }
}
