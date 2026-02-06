import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(
      'https://projects.fivethirtyeight.com/soccer-api/international/spi_global_rankings.csv'
    )
    
    const csvText = await response.text()
    const lines = csvText.split('\n')
    
    return res.status(200).json({
      success: true,
      headers: lines[0],
      row1: lines[1],
      row2: lines[2],
      totalLines: lines.length
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
