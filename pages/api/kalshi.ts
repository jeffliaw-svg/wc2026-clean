import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.KALSHI_API_KEY
  
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Kalshi API key not configured' })
  }

  try {
    // Fetch all markets from Kalshi
    const response = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Filter for World Cup group markets
    const wcMarkets = data.markets?.filter((m: any) => 
      m.ticker?.includes('FIFAWC') || 
      m.title?.toLowerCase().includes('world cup') ||
      m.title?.toLowerCase().includes('fifa')
    ) || []

    res.status(200).json({ 
      success: true,
      totalMarkets: data.markets?.length || 0,
      wcMarkets: wcMarkets.length,
      markets: wcMarkets.slice(0, 20) // First 20 WC markets for inspection
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
