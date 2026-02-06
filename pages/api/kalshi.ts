
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.KALSHI_API_KEY
    
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Kalshi API key not configured' })
    }

    // Fetch Kalshi markets for World Cup
    const response = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })
    
    const data = await response.json()
    
    return res.status(200).json({ success: true, markets: data })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
