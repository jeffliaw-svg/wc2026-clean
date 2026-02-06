import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Try the GitHub repo version instead
    const response = await fetch(
      'https://raw.githubusercontent.com/fivethirtyeight/data/master/soccer-spi/spi_global_rankings.csv'
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
