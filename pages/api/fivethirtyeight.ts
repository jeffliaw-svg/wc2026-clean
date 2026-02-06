import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const teams = {
    "Brazil": 93.4,
    "France": 89.2,
    "Argentina": 88.1,
    "Germany": 85.7,
    "Spain": 84.3
  }
  
  res.status(200).json({ success: true, teams, count: 5 })
}
