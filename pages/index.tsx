import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

type TeamResult = {
  name: string
  rating: number
  first: number
  second: number
  third: number
  fourth: number
}

type MatchProb = {
  teamA: string
  teamB: string
  pA: number
  pDraw: number
  pB: number
}

type GroupMatch = {
  matchNum: number
  group: string
  date: string
  teamA: string
  teamB: string
  venue: string
}

// ─── All 12 Groups ───────────────────────────────────────────────
// Fallback FIFA points (Jan 19, 2026). Overridden at runtime by live API.
const groupTeams: Record<string, { name: string; rating: number }[]> = {
  A: [
    { name: 'Mexico', rating: 1658.82 },
    { name: 'South Africa', rating: 1485.33 },
    { name: 'South Korea', rating: 1611.84 },
    { name: 'Czechia', rating: 1550.00 },
  ],
  B: [
    { name: 'Canada', rating: 1601.29 },
    { name: 'Bosnia and Herzegovina', rating: 1550.00 },
    { name: 'Qatar', rating: 1461.79 },
    { name: 'Switzerland', rating: 1672.69 },
  ],
  C: [
    { name: 'Brazil', rating: 1775.85 },
    { name: 'Morocco', rating: 1682.63 },
    { name: 'Scotland', rating: 1530.46 },
    { name: 'Haiti', rating: 1371.58 },
  ],
  D: [
    { name: 'United States', rating: 1680.00 },
    { name: 'Paraguay', rating: 1492.72 },
    { name: 'Australia', rating: 1583.86 },
    { name: 'Türkiye', rating: 1530.00 },
  ],
  E: [
    { name: 'Germany', rating: 1724.15 },
    { name: 'Ecuador', rating: 1591.73 },
    { name: "C\u00f4te d'Ivoire", rating: 1496.84 },
    { name: 'Cura\u00e7ao', rating: 1341.53 },
  ],
  F: [
    { name: 'Netherlands', rating: 1761.71 },
    { name: 'Japan', rating: 1665.50 },
    { name: 'Tunisia', rating: 1503.38 },
    { name: 'Sweden', rating: 1550.00 },
  ],
  G: [
    { name: 'Belgium', rating: 1730.71 },
    { name: 'Egypt', rating: 1583.49 },
    { name: 'Iran', rating: 1617.02 },
    { name: 'New Zealand', rating: 1362.48 },
  ],
  H: [
    { name: 'Spain', rating: 1853.08 },
    { name: 'Uruguay', rating: 1695.91 },
    { name: 'Saudi Arabia', rating: 1536.13 },
    { name: 'Cape Verde', rating: 1399.43 },
  ],
  I: [
    { name: 'France', rating: 1870.00 },
    { name: 'Senegal', rating: 1706.83 },
    { name: 'Norway', rating: 1553.14 },
    { name: 'Iraq', rating: 1400.00 },
  ],
  J: [
    { name: 'Argentina', rating: 1867.25 },
    { name: 'Austria', rating: 1630.81 },
    { name: 'Algeria', rating: 1484.71 },
    { name: 'Jordan', rating: 1441.36 },
  ],
  K: [
    { name: 'Portugal', rating: 1756.12 },
    { name: 'Colombia', rating: 1727.33 },
    { name: 'Uzbekistan', rating: 1456.93 },
    { name: 'DR Congo', rating: 1400.00 },
  ],
  L: [
    { name: 'England', rating: 1823.39 },
    { name: 'Croatia', rating: 1712.38 },
    { name: 'Ghana', rating: 1430.51 },
    { name: 'Panama', rating: 1466.18 },
  ],
}

// ─── Actual Results (update as tournament progresses) ────────────
// Group stage: record actual match scores. Key = group letter.
// When all 6 matches are recorded, group standings become deterministic.
let actualGroupResults: Record<string, { teamA: string; teamB: string; scoreA: number; scoreB: number }[]> = {
  A: [
    { teamA: 'Mexico', teamB: 'South Africa', scoreA: 2, scoreB: 0 },
    { teamA: 'South Korea', teamB: 'Czechia', scoreA: 2, scoreB: 1 },
    { teamA: 'Mexico', teamB: 'South Korea', scoreA: 1, scoreB: 0 },
    { teamA: 'Czechia', teamB: 'South Africa', scoreA: 1, scoreB: 1 },
  ],
  B: [
    { teamA: 'Canada', teamB: 'Bosnia and Herzegovina', scoreA: 1, scoreB: 1 },
    { teamA: 'Qatar', teamB: 'Switzerland', scoreA: 1, scoreB: 1 },
    { teamA: 'Switzerland', teamB: 'Bosnia and Herzegovina', scoreA: 4, scoreB: 1 },
    { teamA: 'Canada', teamB: 'Qatar', scoreA: 6, scoreB: 0 },
  ],
  C: [
    { teamA: 'Brazil', teamB: 'Morocco', scoreA: 1, scoreB: 1 },
    { teamA: 'Haiti', teamB: 'Scotland', scoreA: 0, scoreB: 1 },
    { teamA: 'Scotland', teamB: 'Morocco', scoreA: 0, scoreB: 1 },
    { teamA: 'Brazil', teamB: 'Haiti', scoreA: 3, scoreB: 0 },
  ],
  D: [
    { teamA: 'United States', teamB: 'Paraguay', scoreA: 4, scoreB: 1 },
    { teamA: 'Australia', teamB: 'Türkiye', scoreA: 2, scoreB: 0 },
    { teamA: 'United States', teamB: 'Australia', scoreA: 2, scoreB: 0 },
    { teamA: 'Türkiye', teamB: 'Paraguay', scoreA: 0, scoreB: 1 },
  ],
  E: [
    { teamA: 'Germany', teamB: 'Curaçao', scoreA: 7, scoreB: 1 },
    { teamA: "Côte d'Ivoire", teamB: 'Ecuador', scoreA: 1, scoreB: 0 },
  ],
  F: [
    { teamA: 'Netherlands', teamB: 'Japan', scoreA: 2, scoreB: 2 },
    { teamA: 'Sweden', teamB: 'Tunisia', scoreA: 5, scoreB: 1 },
  ],
  G: [
    { teamA: 'Belgium', teamB: 'Egypt', scoreA: 1, scoreB: 1 },
    { teamA: 'Iran', teamB: 'New Zealand', scoreA: 2, scoreB: 2 },
  ],
  H: [
    { teamA: 'Spain', teamB: 'Cape Verde', scoreA: 0, scoreB: 0 },
    { teamA: 'Saudi Arabia', teamB: 'Uruguay', scoreA: 1, scoreB: 1 },
  ],
  I: [
    { teamA: 'France', teamB: 'Senegal', scoreA: 3, scoreB: 1 },
    { teamA: 'Norway', teamB: 'Iraq', scoreA: 4, scoreB: 1 },
  ],
  J: [
    { teamA: 'Argentina', teamB: 'Algeria', scoreA: 3, scoreB: 0 },
    { teamA: 'Austria', teamB: 'Jordan', scoreA: 3, scoreB: 1 },
  ],
  K: [
    { teamA: 'Portugal', teamB: 'DR Congo', scoreA: 1, scoreB: 1 },
    { teamA: 'Colombia', teamB: 'Uzbekistan', scoreA: 3, scoreB: 1 },
  ],
  L: [
    { teamA: 'England', teamB: 'Croatia', scoreA: 4, scoreB: 2 },
    { teamA: 'Ghana', teamB: 'Panama', scoreA: 1, scoreB: 0 },
  ],
}

// Knockout stage: record actual match winners. Key = match number.
const actualKnockoutResults: Record<number, { winner: string; score: string }> = {
  // Example — uncomment when matches are played:
  // 78: { winner: 'Ecuador', score: '1-0' },
}

// Helper to look up a team's fallback rating from group data
const findFallbackRating = (name: string): number => {
  for (const group of Object.values(groupTeams)) {
    const team = group.find(t => t.name === name)
    if (team) return team.rating
  }
  return 1500
}

// ─── Match type shared across all knockout rounds ────────────────
type KnockoutMatch = {
  matchNum: number
  title: string
  date: string
  matchup: string
  venue: string
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'Final' | '3rd'
  // R32-specific fields
  groups?: [string, string]
  posA?: '1st' | '2nd'
  posB?: '1st' | '2nd' | '3rd'
  type?: 'runner' | 'winner_vs_runner' | 'winner_vs_3rd'
  thirdPlacePools?: string[]
  // Later rounds: which prior matches feed this one
  feedsFrom?: [number, number]
}

// ─── Venue → city mapping for grouping ───────────────────────────
const venueCity = (venue: string): string => {
  if (venue.includes('AT&T Stadium')) return 'Dallas/Arlington, TX'
  if (venue.includes('NRG Stadium')) return 'Houston, TX'
  if (venue.includes('SoFi Stadium')) return 'Los Angeles, CA'
  if (venue.includes('MetLife Stadium')) return 'New York/New Jersey'
  if (venue.includes('Gillette Stadium')) return 'Boston/Foxborough, MA'
  if (venue.includes('Hard Rock Stadium')) return 'Miami, FL'
  if (venue.includes('Mercedes-Benz Stadium')) return 'Atlanta, GA'
  if (venue.includes("Levi's Stadium")) return 'San Francisco/Santa Clara, CA'
  if (venue.includes('Lumen Field')) return 'Seattle, WA'
  if (venue.includes('Arrowhead Stadium')) return 'Kansas City, MO'
  if (venue.includes('Lincoln Financial')) return 'Philadelphia, PA'
  if (venue.includes('Estadio BBVA')) return 'Monterrey, Mexico'
  if (venue.includes('Estadio Azteca') || venue.includes('Estadio Banorte')) return 'Mexico City, Mexico'
  if (venue.includes('Estadio Akron')) return 'Guadalajara, Mexico'
  if (venue.includes('BMO Field')) return 'Toronto, Canada'
  if (venue.includes('BC Place')) return 'Vancouver, Canada'
  return venue
}

const isDallas = (venue: string): boolean => venue.includes('AT&T Stadium')

// ─── Group stage schedule (72 matches) ──────────────────────────
const groupMatches: GroupMatch[] = [
  // ── Group A: Mexico, South Africa, South Korea, Czechia ──
  { matchNum: 1, group: 'A', date: 'Wed, Jun 11 • 3:00 PM ET', teamA: 'Mexico', teamB: 'South Africa', venue: 'Estadio Azteca, Mexico City, Mexico' },
  { matchNum: 2, group: 'A', date: 'Wed, Jun 11 • 10:00 PM ET', teamA: 'South Korea', teamB: 'Czechia', venue: 'Estadio Akron, Guadalajara, Mexico' },
  { matchNum: 25, group: 'A', date: 'Thu, Jun 18 • 12:00 PM ET', teamA: 'Czechia', teamB: 'South Africa', venue: 'Mercedes-Benz Stadium, Atlanta, GA' },
  { matchNum: 26, group: 'A', date: 'Thu, Jun 18 • 11:00 PM ET', teamA: 'Mexico', teamB: 'South Korea', venue: 'Estadio Akron, Guadalajara, Mexico' },
  { matchNum: 49, group: 'A', date: 'Tue, Jun 24 • 9:00 PM ET', teamA: 'Czechia', teamB: 'Mexico', venue: 'Estadio Azteca, Mexico City, Mexico' },
  { matchNum: 50, group: 'A', date: 'Tue, Jun 24 • 9:00 PM ET', teamA: 'South Africa', teamB: 'South Korea', venue: 'Estadio BBVA, Monterrey, Mexico' },
  // ── Group B: Canada, Bosnia and Herzegovina, Qatar, Switzerland ──
  { matchNum: 3, group: 'B', date: 'Thu, Jun 12 • 3:00 PM ET', teamA: 'Canada', teamB: 'Bosnia and Herzegovina', venue: 'BMO Field, Toronto, Canada' },
  { matchNum: 5, group: 'B', date: 'Fri, Jun 13 • 3:00 PM ET', teamA: 'Qatar', teamB: 'Switzerland', venue: "Levi's Stadium, Santa Clara, CA" },
  { matchNum: 27, group: 'B', date: 'Thu, Jun 18 • 3:00 PM ET', teamA: 'Switzerland', teamB: 'Bosnia and Herzegovina', venue: 'SoFi Stadium, Los Angeles, CA' },
  { matchNum: 28, group: 'B', date: 'Thu, Jun 18 • 6:00 PM ET', teamA: 'Canada', teamB: 'Qatar', venue: 'BC Place, Vancouver, Canada' },
  { matchNum: 51, group: 'B', date: 'Tue, Jun 24 • 3:00 PM ET', teamA: 'Switzerland', teamB: 'Canada', venue: 'BC Place, Vancouver, Canada' },
  { matchNum: 52, group: 'B', date: 'Tue, Jun 24 • 3:00 PM ET', teamA: 'Bosnia and Herzegovina', teamB: 'Qatar', venue: 'Lumen Field, Seattle, WA' },
  // ── Group C: Brazil, Morocco, Scotland, Haiti ──
  { matchNum: 6, group: 'C', date: 'Fri, Jun 13 • 6:00 PM ET', teamA: 'Brazil', teamB: 'Morocco', venue: 'MetLife Stadium, East Rutherford, NJ' },
  { matchNum: 7, group: 'C', date: 'Fri, Jun 13 • 9:00 PM ET', teamA: 'Haiti', teamB: 'Scotland', venue: 'Gillette Stadium, Foxborough, MA' },
  { matchNum: 29, group: 'C', date: 'Thu, Jun 19 • 6:00 PM ET', teamA: 'Scotland', teamB: 'Morocco', venue: 'Gillette Stadium, Foxborough, MA' },
  { matchNum: 30, group: 'C', date: 'Thu, Jun 19 • 9:00 PM ET', teamA: 'Brazil', teamB: 'Haiti', venue: 'Lincoln Financial Field, Philadelphia, PA' },
  { matchNum: 53, group: 'C', date: 'Tue, Jun 24 • 6:00 PM ET', teamA: 'Morocco', teamB: 'Haiti', venue: 'Mercedes-Benz Stadium, Atlanta, GA' },
  { matchNum: 54, group: 'C', date: 'Tue, Jun 24 • 6:00 PM ET', teamA: 'Scotland', teamB: 'Brazil', venue: 'Hard Rock Stadium, Miami, FL' },
  // ── Group D: United States, Paraguay, Australia, Türkiye ──
  { matchNum: 4, group: 'D', date: 'Thu, Jun 12 • 9:00 PM ET', teamA: 'United States', teamB: 'Paraguay', venue: 'SoFi Stadium, Los Angeles, CA' },
  { matchNum: 8, group: 'D', date: 'Sat, Jun 14 • 12:00 AM ET', teamA: 'Australia', teamB: 'Türkiye', venue: 'BC Place, Vancouver, Canada' },
  { matchNum: 31, group: 'D', date: 'Thu, Jun 19 • 3:00 PM ET', teamA: 'United States', teamB: 'Australia', venue: 'Lumen Field, Seattle, WA' },
  { matchNum: 32, group: 'D', date: 'Sat, Jun 20 • 12:00 AM ET', teamA: 'Türkiye', teamB: 'Paraguay', venue: "Levi's Stadium, Santa Clara, CA" },
  { matchNum: 55, group: 'D', date: 'Wed, Jun 25 • 10:00 PM ET', teamA: 'Türkiye', teamB: 'United States', venue: 'SoFi Stadium, Los Angeles, CA' },
  { matchNum: 56, group: 'D', date: 'Wed, Jun 25 • 10:00 PM ET', teamA: 'Paraguay', teamB: 'Australia', venue: "Levi's Stadium, Santa Clara, CA" },
  // ── Group E: Germany, Curaçao, Côte d'Ivoire, Ecuador ──
  { matchNum: 9, group: 'E', date: 'Sun, Jun 14 • 1:00 PM ET', teamA: 'Germany', teamB: 'Curaçao', venue: 'NRG Stadium, Houston, TX' },
  { matchNum: 10, group: 'E', date: 'Sun, Jun 14 • 7:00 PM ET', teamA: "Côte d'Ivoire", teamB: 'Ecuador', venue: 'Lincoln Financial Field, Philadelphia, PA' },
  { matchNum: 33, group: 'E', date: 'Sat, Jun 20 • 4:00 PM ET', teamA: 'Germany', teamB: "Côte d'Ivoire", venue: 'BMO Field, Toronto, Canada' },
  { matchNum: 34, group: 'E', date: 'Sat, Jun 20 • 8:00 PM ET', teamA: 'Ecuador', teamB: 'Curaçao', venue: 'Arrowhead Stadium, Kansas City, MO' },
  { matchNum: 57, group: 'E', date: 'Wed, Jun 25 • 4:00 PM ET', teamA: 'Ecuador', teamB: 'Germany', venue: 'MetLife Stadium, East Rutherford, NJ' },
  { matchNum: 58, group: 'E', date: 'Wed, Jun 25 • 4:00 PM ET', teamA: 'Curaçao', teamB: "Côte d'Ivoire", venue: 'Lincoln Financial Field, Philadelphia, PA' },
  // ── Group F: Netherlands, Japan, Tunisia, Sweden ──
  { matchNum: 11, group: 'F', date: 'Sun, Jun 14 • 4:00 PM ET', teamA: 'Netherlands', teamB: 'Japan', venue: 'AT&T Stadium, Arlington, TX' },
  { matchNum: 12, group: 'F', date: 'Sun, Jun 14 • 10:00 PM ET', teamA: 'Sweden', teamB: 'Tunisia', venue: 'Estadio BBVA, Monterrey, Mexico' },
  { matchNum: 35, group: 'F', date: 'Sat, Jun 20 • 1:00 PM ET', teamA: 'Netherlands', teamB: 'Sweden', venue: 'NRG Stadium, Houston, TX' },
  { matchNum: 36, group: 'F', date: 'Sun, Jun 21 • 12:00 AM ET', teamA: 'Tunisia', teamB: 'Japan', venue: 'Estadio Akron, Guadalajara, Mexico' },
  { matchNum: 59, group: 'F', date: 'Wed, Jun 25 • 7:00 PM ET', teamA: 'Japan', teamB: 'Sweden', venue: 'AT&T Stadium, Arlington, TX' },
  { matchNum: 60, group: 'F', date: 'Wed, Jun 25 • 7:00 PM ET', teamA: 'Tunisia', teamB: 'Netherlands', venue: 'Arrowhead Stadium, Kansas City, MO' },
  // ── Group G: Belgium, Egypt, Iran, New Zealand ──
  { matchNum: 13, group: 'G', date: 'Mon, Jun 15 • 6:00 PM ET', teamA: 'Belgium', teamB: 'Egypt', venue: 'Lumen Field, Seattle, WA' },
  { matchNum: 14, group: 'G', date: 'Tue, Jun 16 • 12:00 AM ET', teamA: 'Iran', teamB: 'New Zealand', venue: 'SoFi Stadium, Los Angeles, CA' },
  { matchNum: 37, group: 'G', date: 'Sun, Jun 21 • 3:00 PM ET', teamA: 'Belgium', teamB: 'Iran', venue: 'SoFi Stadium, Los Angeles, CA' },
  { matchNum: 38, group: 'G', date: 'Sun, Jun 21 • 9:00 PM ET', teamA: 'New Zealand', teamB: 'Egypt', venue: 'BC Place, Vancouver, Canada' },
  { matchNum: 61, group: 'G', date: 'Thu, Jun 26 • 11:00 PM ET', teamA: 'Egypt', teamB: 'Iran', venue: 'Lumen Field, Seattle, WA' },
  { matchNum: 62, group: 'G', date: 'Thu, Jun 26 • 11:00 PM ET', teamA: 'New Zealand', teamB: 'Belgium', venue: 'BC Place, Vancouver, Canada' },
  // ── Group H: Spain, Cape Verde, Saudi Arabia, Uruguay ──
  { matchNum: 15, group: 'H', date: 'Mon, Jun 15 • 12:00 PM ET', teamA: 'Spain', teamB: 'Cape Verde', venue: 'Mercedes-Benz Stadium, Atlanta, GA' },
  { matchNum: 16, group: 'H', date: 'Mon, Jun 15 • 6:00 PM ET', teamA: 'Saudi Arabia', teamB: 'Uruguay', venue: 'Hard Rock Stadium, Miami, FL' },
  { matchNum: 39, group: 'H', date: 'Sun, Jun 21 • 12:00 PM ET', teamA: 'Spain', teamB: 'Saudi Arabia', venue: 'Mercedes-Benz Stadium, Atlanta, GA' },
  { matchNum: 40, group: 'H', date: 'Sun, Jun 21 • 6:00 PM ET', teamA: 'Uruguay', teamB: 'Cape Verde', venue: 'Hard Rock Stadium, Miami, FL' },
  { matchNum: 63, group: 'H', date: 'Fri, Jun 26 • 8:00 PM ET', teamA: 'Uruguay', teamB: 'Spain', venue: 'Estadio Akron, Guadalajara, Mexico' },
  { matchNum: 64, group: 'H', date: 'Fri, Jun 26 • 8:00 PM ET', teamA: 'Cape Verde', teamB: 'Saudi Arabia', venue: 'NRG Stadium, Houston, TX' },
  // ── Group I: France, Senegal, Iraq, Norway ──
  { matchNum: 17, group: 'I', date: 'Tue, Jun 16 • 3:00 PM ET', teamA: 'France', teamB: 'Senegal', venue: 'MetLife Stadium, East Rutherford, NJ' },
  { matchNum: 18, group: 'I', date: 'Tue, Jun 16 • 6:00 PM ET', teamA: 'Iraq', teamB: 'Norway', venue: 'Gillette Stadium, Foxborough, MA' },
  { matchNum: 41, group: 'I', date: 'Mon, Jun 22 • 5:00 PM ET', teamA: 'France', teamB: 'Iraq', venue: 'Lincoln Financial Field, Philadelphia, PA' },
  { matchNum: 42, group: 'I', date: 'Mon, Jun 22 • 8:00 PM ET', teamA: 'Norway', teamB: 'Senegal', venue: 'MetLife Stadium, East Rutherford, NJ' },
  { matchNum: 65, group: 'I', date: 'Fri, Jun 26 • 3:00 PM ET', teamA: 'Norway', teamB: 'France', venue: 'Gillette Stadium, Foxborough, MA' },
  { matchNum: 66, group: 'I', date: 'Fri, Jun 26 • 3:00 PM ET', teamA: 'Senegal', teamB: 'Iraq', venue: 'BMO Field, Toronto, Canada' },
  // ── Group J: Argentina, Algeria, Austria, Jordan ──
  { matchNum: 19, group: 'J', date: 'Tue, Jun 16 • 9:00 PM ET', teamA: 'Argentina', teamB: 'Algeria', venue: 'Arrowhead Stadium, Kansas City, MO' },
  { matchNum: 20, group: 'J', date: 'Wed, Jun 17 • 12:00 AM ET', teamA: 'Austria', teamB: 'Jordan', venue: "Levi's Stadium, Santa Clara, CA" },
  { matchNum: 43, group: 'J', date: 'Mon, Jun 22 • 1:00 PM ET', teamA: 'Argentina', teamB: 'Austria', venue: 'AT&T Stadium, Arlington, TX' },
  { matchNum: 44, group: 'J', date: 'Mon, Jun 22 • 11:00 PM ET', teamA: 'Jordan', teamB: 'Algeria', venue: "Levi's Stadium, Santa Clara, CA" },
  { matchNum: 67, group: 'J', date: 'Sat, Jun 27 • 10:00 PM ET', teamA: 'Jordan', teamB: 'Argentina', venue: 'AT&T Stadium, Arlington, TX' },
  { matchNum: 68, group: 'J', date: 'Sat, Jun 27 • 10:00 PM ET', teamA: 'Algeria', teamB: 'Austria', venue: 'Arrowhead Stadium, Kansas City, MO' },
  // ── Group K: Portugal, DR Congo, Uzbekistan, Colombia ──
  { matchNum: 21, group: 'K', date: 'Wed, Jun 17 • 1:00 PM ET', teamA: 'Portugal', teamB: 'DR Congo', venue: 'NRG Stadium, Houston, TX' },
  { matchNum: 22, group: 'K', date: 'Wed, Jun 17 • 10:00 PM ET', teamA: 'Uzbekistan', teamB: 'Colombia', venue: 'Estadio Azteca, Mexico City, Mexico' },
  { matchNum: 45, group: 'K', date: 'Tue, Jun 23 • 1:00 PM ET', teamA: 'Portugal', teamB: 'Uzbekistan', venue: 'NRG Stadium, Houston, TX' },
  { matchNum: 46, group: 'K', date: 'Tue, Jun 23 • 10:00 PM ET', teamA: 'Colombia', teamB: 'DR Congo', venue: 'Estadio Akron, Guadalajara, Mexico' },
  { matchNum: 69, group: 'K', date: 'Sat, Jun 27 • 7:30 PM ET', teamA: 'Colombia', teamB: 'Portugal', venue: 'Hard Rock Stadium, Miami, FL' },
  { matchNum: 70, group: 'K', date: 'Sat, Jun 27 • 7:30 PM ET', teamA: 'DR Congo', teamB: 'Uzbekistan', venue: 'Mercedes-Benz Stadium, Atlanta, GA' },
  // ── Group L: England, Croatia, Ghana, Panama ──
  { matchNum: 23, group: 'L', date: 'Wed, Jun 17 • 4:00 PM ET', teamA: 'England', teamB: 'Croatia', venue: 'AT&T Stadium, Arlington, TX' },
  { matchNum: 24, group: 'L', date: 'Wed, Jun 17 • 7:00 PM ET', teamA: 'Ghana', teamB: 'Panama', venue: 'BMO Field, Toronto, Canada' },
  { matchNum: 47, group: 'L', date: 'Tue, Jun 23 • 4:00 PM ET', teamA: 'England', teamB: 'Ghana', venue: 'Gillette Stadium, Foxborough, MA' },
  { matchNum: 48, group: 'L', date: 'Tue, Jun 23 • 7:00 PM ET', teamA: 'Panama', teamB: 'Croatia', venue: 'BMO Field, Toronto, Canada' },
  { matchNum: 71, group: 'L', date: 'Sat, Jun 27 • 5:00 PM ET', teamA: 'Panama', teamB: 'England', venue: 'MetLife Stadium, East Rutherford, NJ' },
  { matchNum: 72, group: 'L', date: 'Sat, Jun 27 • 5:00 PM ET', teamA: 'Croatia', teamB: 'Ghana', venue: 'Lincoln Financial Field, Philadelphia, PA' },
]

const getTeamGroupMatches = (teamName: string): GroupMatch[] =>
  groupMatches.filter(m => m.teamA === teamName || m.teamB === teamName)

const getVenueGroupMatches = (venueCityName: string): GroupMatch[] =>
  groupMatches.filter(m => venueCity(m.venue) === venueCityName)

const getTeamGroup = (teamName: string): string =>
  Object.entries(groupTeams).find(([, teams]) => teams.some(t => t.name === teamName))?.[0] || '?'

const allVenueCities = (): string[] => {
  const cities = new Set<string>()
  for (const m of groupMatches) cities.add(venueCity(m.venue))
  for (const m of allMatches) cities.add(venueCity(m.venue))
  const arr = Array.from(cities)
  arr.sort((a, b) => {
    if (a.includes('Dallas')) return -1
    if (b.includes('Dallas')) return 1
    return a.localeCompare(b)
  })
  return arr
}

const groupMatchResult = (gm: GroupMatch): { scoreA: number; scoreB: number } | null => {
  const groupResults = actualGroupResults[gm.group]
  if (!groupResults) return null
  const found = groupResults.find(r =>
    (r.teamA === gm.teamA && r.teamB === gm.teamB) ||
    (r.teamA === gm.teamB && r.teamB === gm.teamA)
  )
  if (!found) return null
  if (found.teamA === gm.teamA) return { scoreA: found.scoreA, scoreB: found.scoreB }
  return { scoreA: found.scoreB, scoreB: found.scoreA }
}

const getTeamRecord = (teamName: string): { w: number; d: number; l: number; gf: number; ga: number } => {
  const matches = getTeamGroupMatches(teamName)
  let w = 0, d = 0, l = 0, gf = 0, ga = 0
  for (const gm of matches) {
    const result = groupMatchResult(gm)
    if (!result) continue
    const isA = gm.teamA === teamName
    const scored = isA ? result.scoreA : result.scoreB
    const conceded = isA ? result.scoreB : result.scoreA
    gf += scored; ga += conceded
    if (scored > conceded) w++
    else if (scored === conceded) d++
    else l++
  }
  return { w, d, l, gf, ga }
}

const formatRecord = (teamName: string): string => {
  const r = getTeamRecord(teamName)
  const played = r.w + r.d + r.l
  if (played === 0) return ''
  return `${r.w}-${r.d}-${r.l}`
}

// ─── All knockout matches ────────────────────────────────────────
const allMatches: KnockoutMatch[] = [
  // ── Round of 32 ──
  {
    matchNum: 73, title: 'Match 73 \u2013 Round of 32', round: 'R32',
    date: 'Sat, Jun 28 \u2022 3:00 PM ET',
    matchup: '2nd Group A vs 2nd Group B', venue: 'SoFi Stadium, Los Angeles, CA',
    groups: ['A', 'B'], posA: '2nd', posB: '2nd', type: 'runner',
  },
  {
    matchNum: 74, title: 'Match 74 \u2013 Round of 32', round: 'R32',
    date: 'Sun, Jun 29 \u2022 4:30 PM ET',
    matchup: '1st Group E vs 3rd Place', venue: 'Gillette Stadium, Foxborough, MA',
    groups: ['E', 'E'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['A', 'B', 'C', 'D', 'F'],
  },
  {
    matchNum: 75, title: 'Match 75 \u2013 Round of 32', round: 'R32',
    date: 'Sun, Jun 29 \u2022 9:00 PM ET',
    matchup: '1st Group F vs 2nd Group C', venue: 'Estadio BBVA, Monterrey, Mexico',
    groups: ['F', 'C'], posA: '1st', posB: '2nd', type: 'winner_vs_runner',
  },
  {
    matchNum: 76, title: 'Match 76 \u2013 Round of 32', round: 'R32',
    date: 'Sun, Jun 29 \u2022 1:00 PM ET',
    matchup: '1st Group C vs 2nd Group F', venue: 'NRG Stadium, Houston, TX',
    groups: ['C', 'F'], posA: '1st', posB: '2nd', type: 'winner_vs_runner',
  },
  {
    matchNum: 77, title: 'Match 77 \u2013 Round of 32', round: 'R32',
    date: 'Mon, Jun 30 \u2022 5:00 PM ET',
    matchup: '1st Group I vs 3rd Place', venue: 'MetLife Stadium, East Rutherford, NJ',
    groups: ['I', 'I'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['C', 'D', 'F', 'G', 'H'],
  },
  {
    matchNum: 78, title: 'Match 78 \u2013 Round of 32', round: 'R32',
    date: 'Mon, Jun 30 \u2022 1:00 PM ET',
    matchup: '2nd Group E vs 2nd Group I', venue: 'AT&T Stadium, Arlington, TX',
    groups: ['E', 'I'], posA: '2nd', posB: '2nd', type: 'runner',
  },
  {
    matchNum: 79, title: 'Match 79 \u2013 Round of 32', round: 'R32',
    date: 'Mon, Jun 30 \u2022 9:00 PM ET',
    matchup: '1st Group A vs 3rd Place', venue: 'Estadio Azteca, Mexico City, Mexico',
    groups: ['A', 'A'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['C', 'E', 'F', 'H', 'I'],
  },
  {
    matchNum: 80, title: 'Match 80 \u2013 Round of 32', round: 'R32',
    date: 'Tue, Jul 1 \u2022 12:00 PM ET',
    matchup: '1st Group L vs 3rd Place', venue: 'Mercedes-Benz Stadium, Atlanta, GA',
    groups: ['L', 'L'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['E', 'H', 'I', 'J', 'K'],
  },
  {
    matchNum: 81, title: 'Match 81 \u2013 Round of 32', round: 'R32',
    date: 'Tue, Jul 1 \u2022 8:00 PM ET',
    matchup: '1st Group D vs 3rd Place', venue: "Levi's Stadium, Santa Clara, CA",
    groups: ['D', 'D'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['B', 'E', 'F', 'I', 'J'],
  },
  {
    matchNum: 82, title: 'Match 82 \u2013 Round of 32', round: 'R32',
    date: 'Tue, Jul 1 \u2022 4:00 PM ET',
    matchup: '1st Group G vs 3rd Place', venue: 'Lumen Field, Seattle, WA',
    groups: ['G', 'G'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['A', 'E', 'H', 'I', 'J'],
  },
  {
    matchNum: 83, title: 'Match 83 \u2013 Round of 32', round: 'R32',
    date: 'Wed, Jul 2 \u2022 7:00 PM ET',
    matchup: '2nd Group K vs 2nd Group L', venue: 'BMO Field, Toronto, Canada',
    groups: ['K', 'L'], posA: '2nd', posB: '2nd', type: 'runner',
  },
  {
    matchNum: 84, title: 'Match 84 \u2013 Round of 32', round: 'R32',
    date: 'Wed, Jul 2 \u2022 3:00 PM ET',
    matchup: '1st Group H vs 2nd Group J', venue: 'SoFi Stadium, Los Angeles, CA',
    groups: ['H', 'J'], posA: '1st', posB: '2nd', type: 'winner_vs_runner',
  },
  {
    matchNum: 85, title: 'Match 85 \u2013 Round of 32', round: 'R32',
    date: 'Wed, Jul 2 \u2022 11:00 PM ET',
    matchup: '1st Group B vs 3rd Place', venue: 'BC Place, Vancouver, Canada',
    groups: ['B', 'B'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['E', 'F', 'G', 'I', 'J'],
  },
  {
    matchNum: 86, title: 'Match 86 \u2013 Round of 32', round: 'R32',
    date: 'Thu, Jul 3 \u2022 6:00 PM ET',
    matchup: '1st Group J vs 2nd Group H', venue: 'Hard Rock Stadium, Miami, FL',
    groups: ['J', 'H'], posA: '1st', posB: '2nd', type: 'winner_vs_runner',
  },
  {
    matchNum: 87, title: 'Match 87 \u2013 Round of 32', round: 'R32',
    date: 'Thu, Jul 3 \u2022 9:30 PM ET',
    matchup: '1st Group K vs 3rd Place', venue: 'Arrowhead Stadium, Kansas City, MO',
    groups: ['K', 'K'], posA: '1st', posB: '3rd', type: 'winner_vs_3rd',
    thirdPlacePools: ['D', 'E', 'I', 'J', 'L'],
  },
  {
    matchNum: 88, title: 'Match 88 \u2013 Round of 32', round: 'R32',
    date: 'Thu, Jul 3 \u2022 2:00 PM ET',
    matchup: '2nd Group D vs 2nd Group G', venue: 'AT&T Stadium, Arlington, TX',
    groups: ['D', 'G'], posA: '2nd', posB: '2nd', type: 'runner',
  },

  // ── Round of 16 ──
  {
    matchNum: 89, title: 'Match 89 \u2013 Round of 16', round: 'R16',
    date: 'Sat, Jul 4 \u2022 5:00 PM ET',
    matchup: 'Winner M74 vs Winner M77', venue: 'Lincoln Financial Field, Philadelphia, PA',
    feedsFrom: [74, 77],
  },
  {
    matchNum: 90, title: 'Match 90 \u2013 Round of 16', round: 'R16',
    date: 'Sat, Jul 4 \u2022 1:00 PM ET',
    matchup: 'Winner M73 vs Winner M75', venue: 'NRG Stadium, Houston, TX',
    feedsFrom: [73, 75],
  },
  {
    matchNum: 91, title: 'Match 91 \u2013 Round of 16', round: 'R16',
    date: 'Sun, Jul 5 \u2022 4:00 PM ET',
    matchup: 'Winner M76 vs Winner M78', venue: 'MetLife Stadium, East Rutherford, NJ',
    feedsFrom: [76, 78],
  },
  {
    matchNum: 92, title: 'Match 92 \u2013 Round of 16', round: 'R16',
    date: 'Sun, Jul 5 \u2022 8:00 PM ET',
    matchup: 'Winner M79 vs Winner M80', venue: 'Estadio Azteca, Mexico City, Mexico',
    feedsFrom: [79, 80],
  },
  {
    matchNum: 93, title: 'Match 93 \u2013 Round of 16', round: 'R16',
    date: 'Mon, Jul 6 \u2022 3:00 PM ET',
    matchup: 'Winner M83 vs Winner M84', venue: 'AT&T Stadium, Arlington, TX',
    feedsFrom: [83, 84],
  },
  {
    matchNum: 94, title: 'Match 94 \u2013 Round of 16', round: 'R16',
    date: 'Mon, Jul 6 \u2022 8:00 PM ET',
    matchup: 'Winner M81 vs Winner M82', venue: 'Lumen Field, Seattle, WA',
    feedsFrom: [81, 82],
  },
  {
    matchNum: 95, title: 'Match 95 \u2013 Round of 16', round: 'R16',
    date: 'Tue, Jul 7 \u2022 12:00 PM ET',
    matchup: 'Winner M86 vs Winner M88', venue: 'Mercedes-Benz Stadium, Atlanta, GA',
    feedsFrom: [86, 88],
  },
  {
    matchNum: 96, title: 'Match 96 \u2013 Round of 16', round: 'R16',
    date: 'Tue, Jul 7 \u2022 4:00 PM ET',
    matchup: 'Winner M85 vs Winner M87', venue: 'BC Place, Vancouver, Canada',
    feedsFrom: [85, 87],
  },

  // ── Quarterfinals ──
  {
    matchNum: 97, title: 'Match 97 \u2013 Quarterfinal', round: 'QF',
    date: 'Wed, Jul 9 \u2022 4:00 PM ET',
    matchup: 'Winner M89 vs Winner M90', venue: 'Gillette Stadium, Foxborough, MA',
    feedsFrom: [89, 90],
  },
  {
    matchNum: 98, title: 'Match 98 \u2013 Quarterfinal', round: 'QF',
    date: 'Thu, Jul 10 \u2022 3:00 PM ET',
    matchup: 'Winner M93 vs Winner M94', venue: 'SoFi Stadium, Los Angeles, CA',
    feedsFrom: [93, 94],
  },
  {
    matchNum: 99, title: 'Match 99 \u2013 Quarterfinal', round: 'QF',
    date: 'Fri, Jul 11 \u2022 5:00 PM ET',
    matchup: 'Winner M91 vs Winner M92', venue: 'Hard Rock Stadium, Miami, FL',
    feedsFrom: [91, 92],
  },
  {
    matchNum: 100, title: 'Match 100 \u2013 Quarterfinal', round: 'QF',
    date: 'Fri, Jul 11 \u2022 9:00 PM ET',
    matchup: 'Winner M95 vs Winner M96', venue: 'Arrowhead Stadium, Kansas City, MO',
    feedsFrom: [95, 96],
  },

  // ── Semifinals ──
  {
    matchNum: 101, title: 'Match 101 \u2013 Semifinal', round: 'SF',
    date: 'Tue, Jul 14 \u2022 3:00 PM ET',
    matchup: 'Winner QF97 vs Winner QF98', venue: 'AT&T Stadium, Arlington, TX',
    feedsFrom: [97, 98],
  },
  {
    matchNum: 102, title: 'Match 102 \u2013 Semifinal', round: 'SF',
    date: 'Wed, Jul 15 \u2022 3:00 PM ET',
    matchup: 'Winner QF99 vs Winner QF100', venue: 'Mercedes-Benz Stadium, Atlanta, GA',
    feedsFrom: [99, 100],
  },

  // ── 3rd Place & Final ──
  {
    matchNum: 103, title: 'Match 103 \u2013 3rd Place', round: '3rd',
    date: 'Sat, Jul 18 \u2022 5:00 PM ET',
    matchup: 'Loser SF101 vs Loser SF102', venue: 'Hard Rock Stadium, Miami, FL',
    feedsFrom: [101, 102],
  },
  {
    matchNum: 104, title: 'Match 104 \u2013 FINAL', round: 'Final',
    date: 'Sun, Jul 19 \u2022 3:00 PM ET',
    matchup: 'Winner SF101 vs Winner SF102', venue: 'MetLife Stadium, East Rutherford, NJ',
    feedsFrom: [101, 102],
  },
]

// Separate R32 matches for simulation (they have group data)
const r32Matches = allMatches.filter(m => m.round === 'R32')

// Build superscript footnote mapping for 3rd-place matches
const thirdPlaceFootnotes: Record<number, { sup: string; pools: string[] }> = {}
const _superscripts = ['\u00b9', '\u00b2', '\u00b3', '\u2074', '\u2075', '\u2076', '\u2077', '\u2078']
let _fnIdx = 0
for (const m of allMatches) {
  if (m.type === 'winner_vs_3rd' && m.thirdPlacePools) {
    thirdPlaceFootnotes[m.matchNum] = { sup: _superscripts[_fnIdx], pools: m.thirdPlacePools }
    _fnIdx++
  }
}

// Group matches by city for the selector
const groupMatchesByCity = (matches: KnockoutMatch[]) => {
  const grouped: Record<string, KnockoutMatch[]> = {}
  for (const m of matches) {
    const city = venueCity(m.venue)
    if (!grouped[city]) grouped[city] = []
    grouped[city].push(m)
  }
  // Sort: Dallas first, then alphabetically
  const entries = Object.entries(grouped)
  entries.sort(([a], [b]) => {
    if (a.includes('Dallas')) return -1
    if (b.includes('Dallas')) return 1
    return a.localeCompare(b)
  })
  return entries
}

// Round labels and colors
const roundLabel: Record<string, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarterfinals',
  SF: 'Semifinals',
  '3rd': '3rd Place',
  Final: 'Final',
}

const roundColor: Record<string, string> = {
  R32: '#003366',
  R16: '#1a5276',
  QF: '#6c3483',
  SF: '#b7950b',
  '3rd': '#666',
  Final: '#c0392b',
}

export default function Home() {
  const [selectedMatch, setSelectedMatch] = useState<number>(78) // Default to Dallas match
  const [selectedRound, setSelectedRound] = useState<string>('R32')
  const [showOtherLocations, setShowOtherLocations] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [ratingSource, setRatingSource] = useState<string>('')
  const [viewMode, setViewMode] = useState<'match' | 'team' | 'standings' | 'bracket' | 'venue'>('team')
  const [teamViewResults, setTeamViewResults] = useState<any[] | null>(null)
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null)
  const [venueViewResults, setVenueViewResults] = useState<any>(null)
  const [selectedVenue, setSelectedVenue] = useState<string>('Dallas/Arlington, TX')
  const [venueGroupExpanded, setVenueGroupExpanded] = useState(true)
  const [venueKnockoutExpanded, setVenueKnockoutExpanded] = useState(true)
  const [expandedBracketMatch, setExpandedBracketMatch] = useState<number | null>(null)
  const hasAutoRunTeam = useRef(false)
  const hasAutoRunVenue = useRef(false)
  const [resultsSource, setResultsSource] = useState<string>('')
  const [liveResultsLoaded, setLiveResultsLoaded] = useState(false)

  const roundMatches = allMatches.filter(m => m.round === selectedRound)
  const currentMatch = allMatches.find(m => m.matchNum === selectedMatch)!
  const isR32 = selectedRound === 'R32'
  const isR16 = selectedRound === 'R16'
  const canSimulate = isR32 || !!currentMatch?.feedsFrom

  // ============================================================
  // Poisson Goal Model — Maher 1982 / Dixon & Coles 1997
  // ============================================================
  const MU = Math.log(1.26)
  const BETA = 0.00149
  const RHO = -0.05

  const factorial = (n: number): number => {
    let f = 1
    for (let i = 2; i <= n; i++) f *= i
    return f
  }

  const poissonPmf = (lambda: number, k: number): number =>
    Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k)

  const ratingsToLambda = (ratingA: number, ratingB: number) => {
    const dr = ratingA - ratingB
    return {
      lambdaA: Math.exp(MU + BETA * dr),
      lambdaB: Math.exp(MU - BETA * dr),
    }
  }

  const dixonColesTau = (x: number, y: number, lamA: number, lamB: number): number => {
    if (x === 0 && y === 0) return 1 - lamA * lamB * RHO
    if (x === 0 && y === 1) return 1 + lamA * RHO
    if (x === 1 && y === 0) return 1 + lamB * RHO
    if (x === 1 && y === 1) return 1 - RHO
    return 1
  }

  const calcMatchProbs = (ratingA: number, ratingB: number) => {
    const { lambdaA, lambdaB } = ratingsToLambda(ratingA, ratingB)
    let pA = 0, pDraw = 0, pB = 0
    for (let a = 0; a <= 10; a++) {
      for (let b = 0; b <= 10; b++) {
        const p = poissonPmf(lambdaA, a) * poissonPmf(lambdaB, b) *
          dixonColesTau(a, b, lambdaA, lambdaB)
        if (a > b) pA += p
        else if (a === b) pDraw += p
        else pB += p
      }
    }
    const total = pA + pDraw + pB
    return { pA: pA / total, pDraw: pDraw / total, pB: pB / total }
  }

  const calcGroupMatchProbs = (teams: { name: string; rating: number }[]): MatchProb[] => {
    const probs: MatchProb[] = []
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const { pA, pDraw, pB } = calcMatchProbs(teams[i].rating, teams[j].rating)
        probs.push({ teamA: teams[i].name, teamB: teams[j].name, pA: pA * 100, pDraw: pDraw * 100, pB: pB * 100 })
      }
    }
    return probs
  }

  const poissonSample = (lambda: number): number => {
    const L = Math.exp(-lambda)
    let k = 0, p = 1
    do { k++; p *= Math.random() } while (p > L)
    return Math.max(0, k - 1)
  }

  const simulateMatch = (ratingA: number, ratingB: number) => {
    const { lambdaA, lambdaB } = ratingsToLambda(ratingA, ratingB)
    return { homeGoals: poissonSample(lambdaA), awayGoals: poissonSample(lambdaB) }
  }

  const simulateGroup = (
    teams: { name: string; rating: number }[],
    groupId?: string,
  ): { name: string; rating: number }[] => {
    const actuals = groupId ? (actualGroupResults[groupId] || []) : []
    const standings = teams.map(t => ({
      name: t.name, rating: t.rating, points: 0, gd: 0, gf: 0,
    }))

    // Apply actual results first
    const played = new Set<string>()
    for (const actual of actuals) {
      const iA = standings.findIndex(s => s.name === actual.teamA)
      const iB = standings.findIndex(s => s.name === actual.teamB)
      if (iA === -1 || iB === -1) continue
      const key = iA < iB ? `${iA}-${iB}` : `${iB}-${iA}`
      played.add(key)
      standings[iA].gf += actual.scoreA
      standings[iB].gf += actual.scoreB
      standings[iA].gd += actual.scoreA - actual.scoreB
      standings[iB].gd += actual.scoreB - actual.scoreA
      if (actual.scoreA > actual.scoreB) {
        standings[iA].points += 3
      } else if (actual.scoreB > actual.scoreA) {
        standings[iB].points += 3
      } else {
        standings[iA].points += 1
        standings[iB].points += 1
      }
    }

    // Simulate remaining matches
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        if (played.has(`${i}-${j}`)) continue
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
    return standings.map(s => ({ name: s.name, rating: s.rating }))
  }

  const simulateGroupFull = (
    teams: { name: string; rating: number }[],
    groupId?: string,
  ): { name: string; rating: number; points: number; gd: number; gf: number }[] => {
    const actuals = groupId ? (actualGroupResults[groupId] || []) : []
    const standings = teams.map(t => ({
      name: t.name, rating: t.rating, points: 0, gd: 0, gf: 0,
    }))
    const played = new Set<string>()
    for (const actual of actuals) {
      const iA = standings.findIndex(s => s.name === actual.teamA)
      const iB = standings.findIndex(s => s.name === actual.teamB)
      if (iA === -1 || iB === -1) continue
      const key = iA < iB ? `${iA}-${iB}` : `${iB}-${iA}`
      played.add(key)
      standings[iA].gf += actual.scoreA; standings[iB].gf += actual.scoreB
      standings[iA].gd += actual.scoreA - actual.scoreB
      standings[iB].gd += actual.scoreB - actual.scoreA
      if (actual.scoreA > actual.scoreB) standings[iA].points += 3
      else if (actual.scoreB > actual.scoreA) standings[iB].points += 3
      else { standings[iA].points += 1; standings[iB].points += 1 }
    }
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        if (played.has(`${i}-${j}`)) continue
        const result = simulateMatch(standings[i].rating, standings[j].rating)
        standings[i].gf += result.homeGoals; standings[j].gf += result.awayGoals
        standings[i].gd += result.homeGoals - result.awayGoals
        standings[j].gd += result.awayGoals - result.homeGoals
        if (result.homeGoals > result.awayGoals) standings[i].points += 3
        else if (result.awayGoals > result.homeGoals) standings[j].points += 3
        else { standings[i].points += 1; standings[j].points += 1 }
      }
    }
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.gd !== a.gd) return b.gd - a.gd
      return b.gf - a.gf
    })
    return standings
  }

  const simulateKnockoutMatch = (ratingA: number, ratingB: number): 'A' | 'B' => {
    const result = simulateMatch(ratingA, ratingB)
    if (result.homeGoals !== result.awayGoals)
      return result.homeGoals > result.awayGoals ? 'A' : 'B'
    const { lambdaA, lambdaB } = ratingsToLambda(ratingA, ratingB)
    const etA = poissonSample(lambdaA * 0.33)
    const etB = poissonSample(lambdaB * 0.33)
    if (etA !== etB) return etA > etB ? 'A' : 'B'
    const pA = 0.5 + (ratingA - ratingB) * 0.0002
    return Math.random() < pA ? 'A' : 'B'
  }

  // ─── Main Simulation ──────────────────────────────────────────

  const runSimulation = async () => {
    if (!canSimulate) return
    setCalculating(true)

    try {
      const ratingResponse = await fetch('/api/fivethirtyeight')
      const ratingData = await ratingResponse.json()
      if (!ratingData.success || !ratingData.teams) throw new Error('Failed to fetch ratings')
      const ratings: Record<string, number> = ratingData.teams
      setRatingSource(ratingData.source === 'fifa-api' ? 'Live FIFA Rankings' : `FIFA Rankings (${ratingData.lastUpdated})`)

      const iterations = 10000
      const match = currentMatch

      const resolveGroup = (groupId: string) =>
        groupTeams[groupId].map(t => ({ ...t, rating: ratings[t.name] || t.rating }))

      if (match.type === 'runner') {
        const [gA, gB] = match.groups!
        const teamsA = resolveGroup(gA)
        const teamsB = resolveGroup(gB)

        const positionsA: Record<string, number[]> = {}
        const positionsB: Record<string, number[]> = {}
        teamsA.forEach(t => (positionsA[t.name] = [0, 0, 0, 0]))
        teamsB.forEach(t => (positionsB[t.name] = [0, 0, 0, 0]))
        const matchWins: Record<string, number> = {}
        teamsA.forEach(t => (matchWins[t.name] = 0))
        teamsB.forEach(t => (matchWins[t.name] = 0))

        for (let i = 0; i < iterations; i++) {
          const standingsA = simulateGroup(teamsA, gA)
          const standingsB = simulateGroup(teamsB, gB)
          standingsA.forEach((team, pos) => positionsA[team.name][pos]++)
          standingsB.forEach((team, pos) => positionsB[team.name][pos]++)
          const runnerA = standingsA[1]
          const runnerB = standingsB[1]
          const winner = simulateKnockoutMatch(runnerA.rating, runnerB.rating)
          matchWins[winner === 'A' ? runnerA.name : runnerB.name]++
        }

        const toResults = (teams: typeof teamsA, positions: typeof positionsA) =>
          teams.map(team => ({
            name: team.name, rating: team.rating,
            first: (positions[team.name][0] / iterations) * 100,
            second: (positions[team.name][1] / iterations) * 100,
            third: (positions[team.name][2] / iterations) * 100,
            fourth: (positions[team.name][3] / iterations) * 100,
          })).sort((a, b) => b.first - a.first)

        const totalWins = Object.values(matchWins).reduce((a, b) => a + b, 0)
        const teamWinPcts = [...teamsA, ...teamsB]
          .map(t => ({ name: t.name, pct: (matchWins[t.name] / totalWins) * 100 }))
          .filter(t => t.pct > 0)
          .sort((a, b) => b.pct - a.pct)

        const sideANames = new Set(teamsA.map(t => t.name))
        setResults({
          groupA: toResults(teamsA, positionsA),
          groupB: toResults(teamsB, positionsB),
          groupALabel: `Group ${gA} (Runner-Up)`,
          groupBLabel: `Group ${gB} (Runner-Up)`,
          highlightA: '2nd' as const,
          highlightB: '2nd' as const,
          matchWinPcts: teamWinPcts,
          matchSideA: teamWinPcts.filter(t => sideANames.has(t.name)),
          matchSideB: teamWinPcts.filter(t => !sideANames.has(t.name)),
          matchSideALabel: `2nd Group ${gA}`,
          matchSideBLabel: `2nd Group ${gB}`,
          matchProbsA: calcGroupMatchProbs(teamsA),
          matchProbsB: calcGroupMatchProbs(teamsB),
        })

      } else if (match.type === 'winner_vs_runner') {
        const [gA, gB] = match.groups!
        const teamsA = resolveGroup(gA)
        const teamsB = resolveGroup(gB)

        const positionsA: Record<string, number[]> = {}
        const positionsB: Record<string, number[]> = {}
        teamsA.forEach(t => (positionsA[t.name] = [0, 0, 0, 0]))
        teamsB.forEach(t => (positionsB[t.name] = [0, 0, 0, 0]))
        const matchWins: Record<string, number> = {}
        teamsA.forEach(t => (matchWins[t.name] = 0))
        teamsB.forEach(t => (matchWins[t.name] = 0))

        for (let i = 0; i < iterations; i++) {
          const standingsA = simulateGroup(teamsA, gA)
          const standingsB = simulateGroup(teamsB, gB)
          standingsA.forEach((team, pos) => positionsA[team.name][pos]++)
          standingsB.forEach((team, pos) => positionsB[team.name][pos]++)
          const winnerTeam = standingsA[0]
          const runnerTeam = standingsB[1]
          const winner = simulateKnockoutMatch(winnerTeam.rating, runnerTeam.rating)
          matchWins[winner === 'A' ? winnerTeam.name : runnerTeam.name]++
        }

        const toResults = (teams: typeof teamsA, positions: typeof positionsA) =>
          teams.map(team => ({
            name: team.name, rating: team.rating,
            first: (positions[team.name][0] / iterations) * 100,
            second: (positions[team.name][1] / iterations) * 100,
            third: (positions[team.name][2] / iterations) * 100,
            fourth: (positions[team.name][3] / iterations) * 100,
          })).sort((a, b) => b.first - a.first)

        const totalWins = Object.values(matchWins).reduce((a, b) => a + b, 0)
        const teamWinPcts = [...teamsA, ...teamsB]
          .map(t => ({ name: t.name, pct: (matchWins[t.name] / totalWins) * 100 }))
          .filter(t => t.pct > 0)
          .sort((a, b) => b.pct - a.pct)

        const sideANames2 = new Set(teamsA.map(t => t.name))
        setResults({
          groupA: toResults(teamsA, positionsA),
          groupB: toResults(teamsB, positionsB),
          groupALabel: `Group ${gA} (Winner)`,
          groupBLabel: `Group ${gB} (Runner-Up)`,
          highlightA: '1st' as const,
          highlightB: '2nd' as const,
          matchWinPcts: teamWinPcts,
          matchSideA: teamWinPcts.filter(t => sideANames2.has(t.name)),
          matchSideB: teamWinPcts.filter(t => !sideANames2.has(t.name)),
          matchSideALabel: `1st Group ${gA}`,
          matchSideBLabel: `2nd Group ${gB}`,
          matchProbsA: calcGroupMatchProbs(teamsA),
          matchProbsB: calcGroupMatchProbs(teamsB),
        })

      } else if (match.type === 'winner_vs_3rd') {
        const gA = match.groups![0]
        const teamsA = resolveGroup(gA)
        const pools = match.thirdPlacePools || []
        const poolTeams = pools.map(g => resolveGroup(g))

        const positionsA: Record<string, number[]> = {}
        teamsA.forEach(t => (positionsA[t.name] = [0, 0, 0, 0]))
        const matchWins: Record<string, number> = {}
        teamsA.forEach(t => (matchWins[t.name] = 0))
        const thirdPlaceAppearances: Record<string, number> = {}
        const thirdPlaceWins: Record<string, number> = {}

        for (let i = 0; i < iterations; i++) {
          const standingsA = simulateGroup(teamsA, gA)
          standingsA.forEach((team, pos) => positionsA[team.name][pos]++)

          const poolIdx = Math.floor(Math.random() * poolTeams.length)
          const standingsPool = simulateGroup(poolTeams[poolIdx], pools[poolIdx])
          const thirdTeam = standingsPool[2]

          thirdPlaceAppearances[thirdTeam.name] = (thirdPlaceAppearances[thirdTeam.name] || 0) + 1

          const winnerTeam = standingsA[0]
          const winner = simulateKnockoutMatch(winnerTeam.rating, thirdTeam.rating)
          if (winner === 'A') {
            matchWins[winnerTeam.name] = (matchWins[winnerTeam.name] || 0) + 1
          } else {
            thirdPlaceWins[thirdTeam.name] = (thirdPlaceWins[thirdTeam.name] || 0) + 1
          }
        }

        const toResults = (teams: typeof teamsA, positions: typeof positionsA) =>
          teams.map(team => ({
            name: team.name, rating: team.rating,
            first: (positions[team.name][0] / iterations) * 100,
            second: (positions[team.name][1] / iterations) * 100,
            third: (positions[team.name][2] / iterations) * 100,
            fourth: (positions[team.name][3] / iterations) * 100,
          })).sort((a, b) => b.first - a.first)

        const allWinPcts: { name: string; pct: number }[] = []
        teamsA.forEach(t => {
          if (matchWins[t.name]) allWinPcts.push({ name: t.name, pct: (matchWins[t.name] / iterations) * 100 })
        })
        Object.entries(thirdPlaceWins).forEach(([name, wins]) => {
          allWinPcts.push({ name: `${name} (3rd)`, pct: (wins / iterations) * 100 })
        })
        allWinPcts.sort((a, b) => b.pct - a.pct)

        const thirdOppPcts = Object.entries(thirdPlaceAppearances)
          .map(([name, count]) => ({ name, pct: (count / iterations) * 100 }))
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 8)

        const sideANames3 = new Set(teamsA.map(t => t.name))
        setResults({
          groupA: toResults(teamsA, positionsA),
          groupALabel: `Group ${gA} (Winner)`,
          highlightA: '1st' as const,
          matchWinPcts: allWinPcts,
          matchSideA: allWinPcts.filter(t => sideANames3.has(t.name)),
          matchSideB: allWinPcts.filter(t => !sideANames3.has(t.name)),
          matchSideALabel: `1st Group ${gA}`,
          matchSideBLabel: `3rd Place`,
          matchProbsA: calcGroupMatchProbs(teamsA),
          thirdPlaceOpponents: thirdOppPcts,
          thirdPlacePools: pools,
        })
      }
      // ── General knockout simulation (R16, QF, SF, 3rd, Final) ──
      if (currentMatch.feedsFrom) {
        // Helper: simulate one R32 match and return the winner
        const simulateR32Winner = (r32: KnockoutMatch): { name: string; rating: number } => {
          const actual = actualKnockoutResults[r32.matchNum]
          if (actual) {
            return { name: actual.winner, rating: ratings[actual.winner] || findFallbackRating(actual.winner) }
          }
          if (r32.type === 'runner') {
            const [gA, gB] = r32.groups!
            const sA = simulateGroup(resolveGroup(gA), gA)
            const sB = simulateGroup(resolveGroup(gB), gB)
            const w = simulateKnockoutMatch(sA[1].rating, sB[1].rating)
            return w === 'A' ? sA[1] : sB[1]
          } else if (r32.type === 'winner_vs_runner') {
            const [gA, gB] = r32.groups!
            const sA = simulateGroup(resolveGroup(gA), gA)
            const sB = simulateGroup(resolveGroup(gB), gB)
            const w = simulateKnockoutMatch(sA[0].rating, sB[1].rating)
            return w === 'A' ? sA[0] : sB[1]
          } else {
            // winner_vs_3rd
            const gA = r32.groups![0]
            const pools = r32.thirdPlacePools || []
            const sA = simulateGroup(resolveGroup(gA), gA)
            const poolIdx = Math.floor(Math.random() * pools.length)
            const sPool = simulateGroup(resolveGroup(pools[poolIdx]), pools[poolIdx])
            const w = simulateKnockoutMatch(sA[0].rating, sPool[2].rating)
            return w === 'A' ? sA[0] : sPool[2]
          }
        }

        // Recursive: simulate any match winner following the feedsFrom chain
        const simulateMatchWinner = (m: KnockoutMatch): { name: string; rating: number } => {
          const actual = actualKnockoutResults[m.matchNum]
          if (actual) {
            return { name: actual.winner, rating: ratings[actual.winner] || findFallbackRating(actual.winner) }
          }
          if (m.round === 'R32') return simulateR32Winner(m)
          const [fA, fB] = m.feedsFrom!
          const mA = allMatches.find(x => x.matchNum === fA)!
          const mB = allMatches.find(x => x.matchNum === fB)!
          const pA = simulateMatchWinner(mA)
          const pB = simulateMatchWinner(mB)
          const w = simulateKnockoutMatch(pA.rating, pB.rating)
          return w === 'A' ? pA : pB
        }

        // Simulate a match returning both winner and loser (needed for 3rd-place match)
        const simulateMatchResult = (m: KnockoutMatch): { winner: { name: string; rating: number }; loser: { name: string; rating: number } } => {
          const [fA, fB] = m.feedsFrom!
          const mA = allMatches.find(x => x.matchNum === fA)!
          const mB = allMatches.find(x => x.matchNum === fB)!
          const pA = simulateMatchWinner(mA)
          const pB = simulateMatchWinner(mB)
          const actual = actualKnockoutResults[m.matchNum]
          if (actual) {
            const isAWinner = actual.winner === pA.name
            return isAWinner ? { winner: pA, loser: pB } : { winner: pB, loser: pA }
          }
          const w = simulateKnockoutMatch(pA.rating, pB.rating)
          return w === 'A' ? { winner: pA, loser: pB } : { winner: pB, loser: pA }
        }

        const is3rdPlace = currentMatch.round === '3rd'
        const [feedNumA, feedNumB] = currentMatch.feedsFrom
        const feederA = allMatches.find(m => m.matchNum === feedNumA)!
        const feederB = allMatches.find(m => m.matchNum === feedNumB)!

        const advancesA: Record<string, number> = {}
        const advancesB: Record<string, number> = {}
        const koWins: Record<string, number> = {}

        for (let i = 0; i < iterations; i++) {
          let teamA: { name: string; rating: number }
          let teamB: { name: string; rating: number }

          if (is3rdPlace) {
            const resA = simulateMatchResult(feederA)
            const resB = simulateMatchResult(feederB)
            teamA = resA.loser
            teamB = resB.loser
          } else {
            teamA = simulateMatchWinner(feederA)
            teamB = simulateMatchWinner(feederB)
          }

          advancesA[teamA.name] = (advancesA[teamA.name] || 0) + 1
          advancesB[teamB.name] = (advancesB[teamB.name] || 0) + 1
          const w = simulateKnockoutMatch(teamA.rating, teamB.rating)
          const winnerName = w === 'A' ? teamA.name : teamB.name
          koWins[winnerName] = (koWins[winnerName] || 0) + 1
        }

        const toSide = (adv: Record<string, number>) =>
          Object.entries(adv)
            .map(([name, count]) => ({ name, pct: (count / iterations) * 100 }))
            .sort((a, b) => b.pct - a.pct)

        const winPcts = Object.entries(koWins)
          .map(([name, count]) => ({ name, pct: (count / iterations) * 100 }))
          .sort((a, b) => b.pct - a.pct)

        const sideLabel = (feeder: KnockoutMatch, prefix: string): string => {
          if (feeder.round === 'R32') return `${prefix} M${feeder.matchNum}: ${getMatchButtonLabel(feeder)}`
          return `${prefix} M${feeder.matchNum} (${roundLabel[feeder.round] || feeder.round})`
        }

        setResults({
          type: 'knockout',
          round: currentMatch.round,
          sideA: toSide(advancesA),
          sideB: toSide(advancesB),
          sideALabel: sideLabel(feederA, is3rdPlace ? 'Loser' : 'Winner'),
          sideBLabel: sideLabel(feederB, is3rdPlace ? 'Loser' : 'Winner'),
          matchWinPcts: winPcts,
        })
      }
    } catch (error) {
      console.error('Simulation error:', error)
      alert('Error running simulation. Check console for details.')
      setResults(null)
    }

    setCalculating(false)
  }

  // ─── Full Tournament Simulation (Team View) ─────────────────────

  const runTeamSimulation = async () => {
    setCalculating(true)
    try {
      const ratingResponse = await fetch('/api/fivethirtyeight')
      const ratingData = await ratingResponse.json()
      if (!ratingData.success || !ratingData.teams) throw new Error('Failed to fetch ratings')
      const ratings: Record<string, number> = ratingData.teams
      setRatingSource(ratingData.source === 'fifa-api' ? 'Live FIFA Rankings' : `FIFA Rankings (${ratingData.lastUpdated})`)

      const resolveGroup = (groupId: string) =>
        groupTeams[groupId].map(t => ({ ...t, rating: ratings[t.name] || t.rating }))

      const iterations = 10000
      const groups = Object.keys(groupTeams)

      // Per-team tracker: round → venue city → count
      const tracker: Record<string, {
        R32: Record<string, number>; R16: Record<string, number>
        QF: Record<string, number>; SF: Record<string, number>
        Final: Record<string, number>; Champion: number
      }> = {}
      for (const g of groups) {
        for (const t of groupTeams[g]) {
          tracker[t.name] = { R32: {}, R16: {}, QF: {}, SF: {}, Final: {}, Champion: 0 }
        }
      }

      const r32List = allMatches.filter(m => m.round === 'R32')
      const r16List = allMatches.filter(m => m.round === 'R16')
      const qfList = allMatches.filter(m => m.round === 'QF')
      const sfList = allMatches.filter(m => m.round === 'SF')
      const finalMatch = allMatches.find(m => m.round === 'Final')!
      const thirdPlaceR32 = r32List.filter(m => m.type === 'winner_vs_3rd')

      for (let iter = 0; iter < iterations; iter++) {
        // 1. Simulate all 12 group stages (with points for 3rd-place ranking)
        const gs: Record<string, { name: string; rating: number; points: number; gd: number; gf: number }[]> = {}
        for (const g of groups) gs[g] = simulateGroupFull(resolveGroup(g), g)

        // 2. Rank 3rd-place teams, top 8 qualify
        const thirds = groups.map(g => ({ group: g, ...gs[g][2] }))
        thirds.sort((a, b) => b.points !== a.points ? b.points - a.points : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf)
        const qualifying3rds = new Set(thirds.slice(0, 8).map(t => t.group))

        // 3. Assign 3rd-place teams to R32 matches (backtracking for valid matching)
        const thirdAssign: Record<number, { name: string; rating: number }> = {}
        {
          const used = new Set<string>()
          const mList = [...thirdPlaceR32]
          const bt = (idx: number): boolean => {
            if (idx === mList.length) return true
            const m = mList[idx]
            const elig = m.thirdPlacePools!.filter(g => qualifying3rds.has(g) && !used.has(g))
            for (let i = elig.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[elig[i], elig[j]] = [elig[j], elig[i]]
            }
            for (const g of elig) {
              used.add(g)
              thirdAssign[m.matchNum] = { name: gs[g][2].name, rating: gs[g][2].rating }
              if (bt(idx + 1)) return true
              used.delete(g)
              delete thirdAssign[m.matchNum]
            }
            return false
          }
          bt(0)
        }

        // 4. Determine R32 participants and simulate
        const winners: Record<number, { name: string; rating: number }> = {}
        for (const m of r32List) {
          let tA: { name: string; rating: number }, tB: { name: string; rating: number }
          if (m.type === 'runner') {
            tA = gs[m.groups![0]][1]; tB = gs[m.groups![1]][1]
          } else if (m.type === 'winner_vs_runner') {
            tA = gs[m.groups![0]][0]; tB = gs[m.groups![1]][1]
          } else {
            tA = gs[m.groups![0]][0]
            tB = thirdAssign[m.matchNum] || gs[m.groups![0]][2]
          }
          const city = venueCity(m.venue)
          tracker[tA.name].R32[city] = (tracker[tA.name].R32[city] || 0) + 1
          tracker[tB.name].R32[city] = (tracker[tB.name].R32[city] || 0) + 1
          const w = simulateKnockoutMatch(tA.rating, tB.rating)
          winners[m.matchNum] = w === 'A' ? tA : tB
        }

        // 5. R16
        for (const m of r16List) {
          const tA = winners[m.feedsFrom![0]], tB = winners[m.feedsFrom![1]]
          const city = venueCity(m.venue)
          tracker[tA.name].R16[city] = (tracker[tA.name].R16[city] || 0) + 1
          tracker[tB.name].R16[city] = (tracker[tB.name].R16[city] || 0) + 1
          const w = simulateKnockoutMatch(tA.rating, tB.rating)
          winners[m.matchNum] = w === 'A' ? tA : tB
        }

        // 6. QF
        for (const m of qfList) {
          const tA = winners[m.feedsFrom![0]], tB = winners[m.feedsFrom![1]]
          const city = venueCity(m.venue)
          tracker[tA.name].QF[city] = (tracker[tA.name].QF[city] || 0) + 1
          tracker[tB.name].QF[city] = (tracker[tB.name].QF[city] || 0) + 1
          const w = simulateKnockoutMatch(tA.rating, tB.rating)
          winners[m.matchNum] = w === 'A' ? tA : tB
        }

        // 7. SF
        for (const m of sfList) {
          const tA = winners[m.feedsFrom![0]], tB = winners[m.feedsFrom![1]]
          const city = venueCity(m.venue)
          tracker[tA.name].SF[city] = (tracker[tA.name].SF[city] || 0) + 1
          tracker[tB.name].SF[city] = (tracker[tB.name].SF[city] || 0) + 1
          const w = simulateKnockoutMatch(tA.rating, tB.rating)
          winners[m.matchNum] = w === 'A' ? tA : tB
        }

        // 8. Final
        {
          const tA = winners[finalMatch.feedsFrom![0]], tB = winners[finalMatch.feedsFrom![1]]
          const city = venueCity(finalMatch.venue)
          tracker[tA.name].Final[city] = (tracker[tA.name].Final[city] || 0) + 1
          tracker[tB.name].Final[city] = (tracker[tB.name].Final[city] || 0) + 1
          const w = simulateKnockoutMatch(tA.rating, tB.rating)
          const champ = w === 'A' ? tA : tB
          tracker[champ.name].Champion++
        }
      }

      // Convert trackers to result rows
      const roundData = (rd: Record<string, number>) => {
        const total = Object.values(rd).reduce((a, b) => a + b, 0)
        const venues = Object.entries(rd)
          .map(([venue, count]) => ({ venue, pct: (count / iterations) * 100 }))
          .sort((a, b) => b.pct - a.pct)
        return { total: (total / iterations) * 100, venues }
      }

      const rows = Object.entries(tracker).map(([name, stats]) => {
        const teamRating = ratings[name] || findFallbackRating(name)
        const group = Object.entries(groupTeams).find(([, teams]) => teams.some(t => t.name === name))?.[0] || '?'
        return {
          name, rating: teamRating, group,
          R32: roundData(stats.R32), R16: roundData(stats.R16),
          QF: roundData(stats.QF), SF: roundData(stats.SF),
          Final: roundData(stats.Final),
          Champion: (stats.Champion / iterations) * 100,
        }
      }).sort((a, b) => b.rating - a.rating)

      setTeamViewResults(rows)
    } catch (error) {
      console.error('Team simulation error:', error)
      alert('Error running team simulation. Check console for details.')
    }
    setCalculating(false)
  }

  // ─── Full Tournament Simulation (Venue View) ─────────────────────
  const runVenueSimulation = async () => {
    setCalculating(true)
    try {
      const ratingResponse = await fetch('/api/fivethirtyeight')
      const ratingData = await ratingResponse.json()
      if (!ratingData.success || !ratingData.teams) throw new Error('Failed to fetch ratings')
      const ratings: Record<string, number> = ratingData.teams
      setRatingSource(ratingData.source === 'fifa-api' ? 'Live FIFA Rankings' : `FIFA Rankings (${ratingData.lastUpdated})`)

      const resolveGroup = (groupId: string) =>
        groupTeams[groupId].map(t => ({ ...t, rating: ratings[t.name] || t.rating }))

      const iterations = 10000
      const groups = Object.keys(groupTeams)

      // Per-match participant tracker: matchNum → side → teamName → count
      const matchSideA: Record<number, Record<string, number>> = {}
      const matchSideB: Record<number, Record<string, number>> = {}
      for (const m of allMatches) { matchSideA[m.matchNum] = {}; matchSideB[m.matchNum] = {} }

      const r32List = allMatches.filter(m => m.round === 'R32')
      const r16List = allMatches.filter(m => m.round === 'R16')
      const qfList = allMatches.filter(m => m.round === 'QF')
      const sfList = allMatches.filter(m => m.round === 'SF')
      const finalMatch = allMatches.find(m => m.round === 'Final')!
      const thirdPlaceMatch = allMatches.find(m => m.round === '3rd')!
      const thirdPlaceR32 = r32List.filter(m => m.type === 'winner_vs_3rd')

      for (let iter = 0; iter < iterations; iter++) {
        // 1. Simulate all 12 group stages
        const gs: Record<string, { name: string; rating: number; points: number; gd: number; gf: number }[]> = {}
        for (const g of groups) gs[g] = simulateGroupFull(resolveGroup(g), g)

        // 2. Rank 3rd-place teams, top 8 qualify
        const thirds = groups.map(g => ({ group: g, ...gs[g][2] }))
        thirds.sort((a, b) => b.points !== a.points ? b.points - a.points : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf)
        const qualifying3rds = new Set(thirds.slice(0, 8).map(t => t.group))

        // 3. Assign 3rd-place teams to R32 matches (backtracking)
        const thirdAssign: Record<number, { name: string; rating: number }> = {}
        {
          const used = new Set<string>()
          const mList = [...thirdPlaceR32]
          const bt = (idx: number): boolean => {
            if (idx === mList.length) return true
            const m = mList[idx]
            const elig = m.thirdPlacePools!.filter(g => qualifying3rds.has(g) && !used.has(g))
            for (let i = elig.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[elig[i], elig[j]] = [elig[j], elig[i]]
            }
            for (const g of elig) {
              used.add(g)
              thirdAssign[m.matchNum] = { name: gs[g][2].name, rating: gs[g][2].rating }
              if (bt(idx + 1)) return true
              used.delete(g)
              delete thirdAssign[m.matchNum]
            }
            return false
          }
          bt(0)
        }

        // 4. R32
        const winners: Record<number, { name: string; rating: number }> = {}
        for (const m of r32List) {
          let tA: { name: string; rating: number }, tB: { name: string; rating: number }
          if (m.type === 'runner') {
            tA = gs[m.groups![0]][1]; tB = gs[m.groups![1]][1]
          } else if (m.type === 'winner_vs_runner') {
            tA = gs[m.groups![0]][0]; tB = gs[m.groups![1]][1]
          } else {
            tA = gs[m.groups![0]][0]
            tB = thirdAssign[m.matchNum] || gs[m.groups![0]][2]
          }
          matchSideA[m.matchNum][tA.name] = (matchSideA[m.matchNum][tA.name] || 0) + 1
          matchSideB[m.matchNum][tB.name] = (matchSideB[m.matchNum][tB.name] || 0) + 1
          const w = simulateKnockoutMatch(tA.rating, tB.rating)
          winners[m.matchNum] = w === 'A' ? tA : tB
        }

        // 5. R16
        for (const m of r16List) {
          const tA = winners[m.feedsFrom![0]], tB = winners[m.feedsFrom![1]]
          matchSideA[m.matchNum][tA.name] = (matchSideA[m.matchNum][tA.name] || 0) + 1
          matchSideB[m.matchNum][tB.name] = (matchSideB[m.matchNum][tB.name] || 0) + 1
          const w = simulateKnockoutMatch(tA.rating, tB.rating)
          winners[m.matchNum] = w === 'A' ? tA : tB
        }

        // 6. QF
        for (const m of qfList) {
          const tA = winners[m.feedsFrom![0]], tB = winners[m.feedsFrom![1]]
          matchSideA[m.matchNum][tA.name] = (matchSideA[m.matchNum][tA.name] || 0) + 1
          matchSideB[m.matchNum][tB.name] = (matchSideB[m.matchNum][tB.name] || 0) + 1
          const w = simulateKnockoutMatch(tA.rating, tB.rating)
          winners[m.matchNum] = w === 'A' ? tA : tB
        }

        // 7. SF (also track losers for 3rd place match)
        const losers: Record<number, { name: string; rating: number }> = {}
        for (const m of sfList) {
          const tA = winners[m.feedsFrom![0]], tB = winners[m.feedsFrom![1]]
          matchSideA[m.matchNum][tA.name] = (matchSideA[m.matchNum][tA.name] || 0) + 1
          matchSideB[m.matchNum][tB.name] = (matchSideB[m.matchNum][tB.name] || 0) + 1
          const w = simulateKnockoutMatch(tA.rating, tB.rating)
          winners[m.matchNum] = w === 'A' ? tA : tB
          losers[m.matchNum] = w === 'A' ? tB : tA
        }

        // 8. 3rd Place
        {
          const tA = losers[thirdPlaceMatch.feedsFrom![0]], tB = losers[thirdPlaceMatch.feedsFrom![1]]
          matchSideA[thirdPlaceMatch.matchNum][tA.name] = (matchSideA[thirdPlaceMatch.matchNum][tA.name] || 0) + 1
          matchSideB[thirdPlaceMatch.matchNum][tB.name] = (matchSideB[thirdPlaceMatch.matchNum][tB.name] || 0) + 1
        }

        // 9. Final
        {
          const tA = winners[finalMatch.feedsFrom![0]], tB = winners[finalMatch.feedsFrom![1]]
          matchSideA[finalMatch.matchNum][tA.name] = (matchSideA[finalMatch.matchNum][tA.name] || 0) + 1
          matchSideB[finalMatch.matchNum][tB.name] = (matchSideB[finalMatch.matchNum][tB.name] || 0) + 1
        }
      }

      // Convert to venue-grouped results
      const venueData: Record<string, { matches: any[] }> = {}
      for (const m of allMatches) {
        const city = venueCity(m.venue)
        if (!venueData[city]) venueData[city] = { matches: [] }
        const sideA = Object.entries(matchSideA[m.matchNum])
          .map(([name, count]) => ({ name, pct: (count / iterations) * 100 }))
          .sort((a, b) => b.pct - a.pct)
        const sideB = Object.entries(matchSideB[m.matchNum])
          .map(([name, count]) => ({ name, pct: (count / iterations) * 100 }))
          .sort((a, b) => b.pct - a.pct)
        const sideALabel = m.round === 'R32'
          ? (m.type === 'runner' ? `2nd Grp ${m.groups?.[0]}` : `1st Grp ${m.groups?.[0]}`)
          : m.round === '3rd' ? `Loser M${m.feedsFrom?.[0]}` : `Winner M${m.feedsFrom?.[0] || '?'}`
        const sideBLabel = m.round === 'R32'
          ? (m.type === 'winner_vs_3rd' ? `3rd Place` : `2nd Grp ${m.groups?.[1]}`)
          : m.round === '3rd' ? `Loser M${m.feedsFrom?.[1]}` : `Winner M${m.feedsFrom?.[1] || '?'}`
        venueData[city].matches.push({
          matchNum: m.matchNum,
          round: m.round,
          date: m.date,
          matchup: m.matchup,
          title: m.title,
          sideA, sideB, sideALabel, sideBLabel,
        })
      }

      setVenueViewResults(venueData)
    } catch (error) {
      console.error('Venue simulation error:', error)
      alert('Error running venue simulation. Check console for details.')
    }
    setCalculating(false)
  }

  // ─── Bracket path helper ───────────────────────────────────────
  const getBracketPath = (match: KnockoutMatch): string[] => {
    if (!match.feedsFrom) return []
    const path: string[] = []
    for (const feedNum of match.feedsFrom) {
      const feeder = allMatches.find(m => m.matchNum === feedNum)
      if (feeder) {
        if (feeder.round === 'R32') {
          path.push(`M${feedNum}: ${feeder.matchup} (${venueCity(feeder.venue)})`)
        } else {
          path.push(`M${feedNum}: ${feeder.matchup} @ ${venueCity(feeder.venue)}`)
        }
      }
    }
    return path
  }

  // ─── Button label helper ─────────────────────────────────────
  const getMatchButtonLabel = (m: KnockoutMatch): string => {
    if (m.round === 'R32' && m.groups) {
      if (m.type === 'runner') return `Group ${m.groups[0]} 2nd v Group ${m.groups[1]} 2nd`
      if (m.type === 'winner_vs_runner') return `Group ${m.groups[0]} Winner v Group ${m.groups[1]} 2nd`
      if (m.type === 'winner_vs_3rd') {
        const fn = thirdPlaceFootnotes[m.matchNum]
        return `Group ${m.groups[0]} Winner v 3rd${fn?.sup || ''}`
      }
    }
    if (m.feedsFrom) {
      if (m.round === '3rd') return `L M${m.feedsFrom[0]} v L M${m.feedsFrom[1]}`
      return `W M${m.feedsFrom[0]} v W M${m.feedsFrom[1]}`
    }
    return m.matchup.replace(/vs /g, 'v ').replace(/Winner /g, 'W').replace(/Loser /g, 'L')
  }

  // ─── Render Helpers ────────────────────────────────────────────

  const pctBg = (pct: number, max: number) => {
    const intensity = Math.min(pct / Math.max(max, 1), 1)
    const alpha = 0.08 + intensity * 0.25
    return `rgba(0, 51, 102, ${alpha.toFixed(2)})`
  }

  const renderGroupTable = (label: string, teamResults: TeamResult[], highlightCol: '1st' | '2nd' = '2nd') => {
    const maxVal = Math.max(...teamResults.map(r => highlightCol === '1st' ? r.first : r.second))
    return (
    <div>
      <h4 style={{ color: '#003366', marginBottom: '10px', fontSize: '18px' }}>{label}</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#003366', color: 'white' }}>
            <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Team</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>FIFA Pts</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', ...(highlightCol === '1st' ? { background: '#00509e' } : {}) }}>P(1st)</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', ...(highlightCol === '2nd' ? { background: '#00509e' } : {}) }}>P(2nd)</th>
          </tr>
        </thead>
        <tbody>
          {teamResults.map((r, i) => {
            const val = highlightCol === '1st' ? r.first : r.second
            return (
            <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
              <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '14px' }}>
                {r.name}
                {formatRecord(r.name) && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: '#888', fontWeight: 'normal' }}>({formatRecord(r.name)})</span>
                )}
              </td>
              <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#888' }}>{r.rating.toFixed(0)}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontSize: highlightCol === '1st' ? '15px' : '14px', ...(highlightCol === '1st' ? { color: '#003366', fontWeight: 'bold', background: pctBg(r.first, maxVal) } : {}) }}>
                {r.first.toFixed(1)}%
              </td>
              <td style={{ padding: '10px', textAlign: 'right', fontSize: highlightCol === '2nd' ? '15px' : '14px', ...(highlightCol === '2nd' ? { color: '#003366', fontWeight: 'bold', background: pctBg(val, maxVal) } : {}) }}>
                {r.second.toFixed(1)}%
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  )}

  const renderAdvanceTable = (label: string, teams: { name: string; pct: number }[], color: string = '#1a5276') => (
    <div>
      <h4 style={{ color, marginBottom: '10px', fontSize: '16px' }}>{label}</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: color, color: 'white' }}>
            <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Team</th>
            <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', background: 'rgba(255,255,255,0.15)' }}>P(Advance)</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
              <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '14px' }}>
                {t.name}
                {formatRecord(t.name) && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: '#888', fontWeight: 'normal' }}>({formatRecord(t.name)})</span>
                )}
              </td>
              <td style={{ padding: '10px', textAlign: 'right', color, fontWeight: 'bold', fontSize: '15px', background: i % 2 === 0 ? '#f0f8ff' : '#e6f2ff' }}>
                {t.pct.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderMatchDetail = (label: string, matchProbs: MatchProb[]) => (
    <div>
      <h4 style={{ color: '#003366', marginBottom: '10px', fontSize: '16px' }}>{label} &mdash; Individual Matches</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#555', color: 'white' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Match</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Win</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Draw</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Loss</th>
          </tr>
        </thead>
        <tbody>
          {matchProbs.map((m, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
              <td style={{ padding: '8px' }}><strong>{m.teamA}</strong> vs {m.teamB}</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#1a6b3c', fontWeight: 'bold' }}>{m.pA.toFixed(1)}%</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#666' }}>{m.pDraw.toFixed(1)}%</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#cc3333' }}>{m.pB.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // ─── Fetch live results on mount ─────────────────────────────
  useEffect(() => {
    let cancelled = false
    fetch('/api/results')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data?.success || !data?.results) return
        const incoming = data.results as Record<string, { teamA: string; teamB: string; scoreA: number; scoreB: number }[]>
        for (const [group, matches] of Object.entries(incoming)) {
          if (!actualGroupResults[group]) actualGroupResults[group] = []
          for (const m of matches) {
            const idx = actualGroupResults[group].findIndex(r =>
              (r.teamA === m.teamA && r.teamB === m.teamB) || (r.teamA === m.teamB && r.teamB === m.teamA)
            )
            if (idx >= 0) actualGroupResults[group][idx] = m
            else actualGroupResults[group].push(m)
          }
        }
        setResultsSource(data.source || 'live')
        setLiveResultsLoaded(true)
        setResults(null)
        setTeamViewResults(null)
        setVenueViewResults(null)
        hasAutoRunTeam.current = false
        hasAutoRunVenue.current = false
      })
      .catch(() => {
        if (!cancelled) {
          setResultsSource('hardcoded')
          setLiveResultsLoaded(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  // ─── Auto-run simulations ────────────────────────────────────
  useEffect(() => {
    if (viewMode === 'match' && !results && !calculating && canSimulate) {
      runSimulation()
    }
  }, [viewMode, selectedMatch, results, liveResultsLoaded])

  useEffect(() => {
    if ((viewMode === 'team' || viewMode === 'bracket') && !hasAutoRunTeam.current && !calculating) {
      hasAutoRunTeam.current = true
      runTeamSimulation()
    }
  }, [viewMode])

  useEffect(() => {
    if (viewMode === 'venue' && !hasAutoRunVenue.current && !calculating) {
      hasAutoRunVenue.current = true
      runVenueSimulation()
    }
  }, [viewMode])

  // ─── Render ────────────────────────────────────────────────────

  const grouped = groupMatchesByCity(roundMatches)
  const dallasMatches = grouped.filter(([city]) => city.includes('Dallas'))
  const otherMatches = grouped.filter(([city]) => !city.includes('Dallas'))

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <Head>
        <title>WC 2026 Match Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <h1 style={{ color: '#003366', fontSize: '28px', marginBottom: '5px' }}>
        2026 World Cup &mdash; Match Tracker
      </h1>
      <p style={{ color: '#666', fontSize: '14px', marginTop: 0, marginBottom: '20px' }}>
        Group stage &amp; knockout rounds &bull; Poisson simulation &bull; 10,000 iterations
      </p>

      {/* ── View mode tabs ── */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', flexWrap: 'wrap' }}>
        {([
          { key: 'team' as const, label: 'Teams' },
          { key: 'standings' as const, label: 'Standings' },
          { key: 'bracket' as const, label: 'Bracket' },
          { key: 'match' as const, label: 'Rounds' },
          { key: 'venue' as const, label: 'Venues' },
        ]).map((tab, i, arr) => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            style={{
              padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
              background: viewMode === tab.key ? '#003366' : 'white',
              color: viewMode === tab.key ? 'white' : '#003366',
              border: '2px solid #003366',
              borderLeft: i > 0 ? 'none' : '2px solid #003366',
              borderRadius: i === 0 ? '6px 0 0 6px' : i === arr.length - 1 ? '0 6px 6px 0' : '0',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ ROUND VIEW ═══════════════════ */}
      {viewMode === 'match' && <>

      {/* ── Round selector tabs ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(['R32', 'R16', 'QF', 'SF', '3rd', 'Final'] as const).map(round => (
          <button
            key={round}
            onClick={() => {
              setSelectedRound(round)
              const firstInRound = allMatches.find(m => m.round === round)
              if (firstInRound) { setSelectedMatch(firstInRound.matchNum); setResults(null); setShowDetail(false) }
            }}
            style={{
              padding: '8px 16px',
              background: selectedRound === round ? roundColor[round] : 'white',
              color: selectedRound === round ? 'white' : roundColor[round],
              border: `2px solid ${roundColor[round]}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            {roundLabel[round]}
          </button>
        ))}
      </div>

      {/* ── Match selector grouped by city ── */}
      <div style={{ marginBottom: '25px' }}>
        {/* Dallas section */}
        {dallasMatches.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0d6efd', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
              AT&T Stadium &mdash; Dallas/Arlington, TX
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
              {dallasMatches.flatMap(([, matches]) => matches).map(m => (
                <button
                  key={m.matchNum}
                  onClick={() => { setSelectedMatch(m.matchNum); setResults(null); setShowDetail(false) }}
                  style={{
                    padding: '8px 10px',
                    background: selectedMatch === m.matchNum ? '#0d6efd' : '#e8f0fe',
                    color: selectedMatch === m.matchNum ? 'white' : '#0d6efd',
                    border: `2px solid ${selectedMatch === m.matchNum ? '#0d6efd' : '#90b8f8'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'left',
                  }}
                >
                  <div>M{m.matchNum} <span style={{ fontSize: '9px', fontWeight: 'normal', opacity: 0.7 }}>{m.round !== 'R32' ? m.round : ''}</span></div>
                  <div style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.8, marginTop: '2px' }}>
                    {getMatchButtonLabel(m)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toggle for other locations */}
        {otherMatches.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#666' }}>
              <div
                onClick={() => setShowOtherLocations(!showOtherLocations)}
                style={{
                  width: '40px', height: '22px', borderRadius: '11px',
                  background: showOtherLocations ? '#003366' : '#ccc',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                  position: 'absolute', top: '2px',
                  left: showOtherLocations ? '20px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
              <span onClick={() => setShowOtherLocations(!showOtherLocations)}>
                {showOtherLocations ? 'Other locations:' : 'Show other locations'}
              </span>
            </label>
          </div>
        )}

        {/* Other locations (hidden by default) */}
        {showOtherLocations && otherMatches.map(([city, matches]) => (
          <div key={city} style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
              {city}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
              {matches.map(m => (
                <button
                  key={m.matchNum}
                  onClick={() => { setSelectedMatch(m.matchNum); setResults(null); setShowDetail(false) }}
                  style={{
                    padding: '8px 10px',
                    background: selectedMatch === m.matchNum ? '#003366' : '#f5f5f5',
                    color: selectedMatch === m.matchNum ? 'white' : '#003366',
                    border: `2px solid ${selectedMatch === m.matchNum ? '#003366' : '#ccc'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'left',
                  }}
                >
                  <div>M{m.matchNum} <span style={{ fontSize: '9px', fontWeight: 'normal', opacity: 0.7 }}>{m.round !== selectedRound ? m.round : ''}</span></div>
                  <div style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.8, marginTop: '2px' }}>
                    {getMatchButtonLabel(m)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 3rd-place footnotes for R32 — only show relevant ones */}
        {isR32 && (() => {
          // Collect match numbers currently visible on screen
          const visibleMatchNums = new Set<number>()
          dallasMatches.flatMap(([, ms]) => ms).forEach(m => visibleMatchNums.add(m.matchNum))
          if (showOtherLocations) otherMatches.flatMap(([, ms]) => ms).forEach(m => visibleMatchNums.add(m.matchNum))
          const relevantFootnotes = Object.entries(thirdPlaceFootnotes)
            .filter(([matchNum]) => visibleMatchNums.has(Number(matchNum)))
          if (relevantFootnotes.length === 0) return null
          return (
            <div style={{ marginTop: '8px' }}>
              <span
                onClick={() => setShowNotes(!showNotes)}
                style={{ fontSize: '11px', color: '#999', cursor: 'pointer', userSelect: 'none' }}
              >
                {showNotes ? '\u25BC' : '\u25B6'} 3rd-place notes ({relevantFootnotes.length})
              </span>
              {showNotes && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#888', lineHeight: '1.8', paddingLeft: '4px' }}>
                  {relevantFootnotes.map(([matchNum, fn]) => (
                    <div key={matchNum}>
                      <sup style={{ fontWeight: 'bold' }}>{fn.sup}</sup> M{matchNum}: vs 3rd place from Group {fn.pools.join(', ')}
                    </div>
                  ))}
                  <div style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '10px', color: '#aaa' }}>
                    8 of 12 third-place finishers advance. Exact assignment depends on which combination of 8 groups
                    produce qualifying 3rd-place teams (FIFA Regulations Annex C, 495 combinations).
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* ── Match info card ── */}
      <div style={{
        background: isDallas(currentMatch.venue) ? '#e8f0fe' : '#f5f5f5',
        padding: '20px', borderRadius: '8px', marginBottom: '25px',
        borderLeft: isDallas(currentMatch.venue) ? '4px solid #0d6efd' : '4px solid #ccc',
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: isDallas(currentMatch.venue) ? '#0d6efd' : '#003366' }}>
          {currentMatch.title}
        </div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>{currentMatch.date}</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{currentMatch.matchup}</div>
        <div style={{ fontSize: '14px', color: isDallas(currentMatch.venue) ? '#0d6efd' : '#666', marginTop: '4px', fontWeight: isDallas(currentMatch.venue) ? 'bold' : 'normal' }}>
          {currentMatch.venue}
        </div>
        {currentMatch.type === 'winner_vs_3rd' && currentMatch.thirdPlacePools && (
          <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
            <sup style={{ fontWeight: 'bold' }}>{thirdPlaceFootnotes[currentMatch.matchNum]?.sup}</sup>{' '}
            Opponent will be the 3rd-place team from Group {currentMatch.thirdPlacePools.join(', ')}{' '}
            &mdash; exact assignment depends on which 8 of 12 third-place teams qualify (FIFA Annex C)
          </div>
        )}
        {/* Bracket path for later rounds */}
        {currentMatch.feedsFrom && (
          <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(0,0,0,0.04)', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>
              Bracket Path
            </div>
            {getBracketPath(currentMatch).map((line, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{line}</div>
            ))}
          </div>
        )}
      </div>

      {/* ── Loading indicator (auto-runs on mount) ── */}
      {calculating && !results && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
          Running simulation (10,000 iterations)…
        </div>
      )}

      {/* ── Results (R32) ── */}
      {results && isR32 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#003366', marginBottom: '20px' }}>Group Stage Probabilities</h3>

          {results.groupB ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              {renderGroupTable(results.groupALabel, results.groupA, results.highlightA || '2nd')}
              {renderGroupTable(results.groupBLabel, results.groupB, results.highlightB || '2nd')}
            </div>
          ) : (
            <div style={{ maxWidth: '550px' }}>
              {renderGroupTable(results.groupALabel, results.groupA, results.highlightA || '1st')}
            </div>
          )}

          {results.thirdPlaceOpponents && (
            <div style={{ marginTop: '20px', maxWidth: '550px' }}>
              <h4 style={{ color: '#003366', marginBottom: '10px', fontSize: '16px' }}>
                Likely 3rd-Place Opponents (from Groups {results.thirdPlacePools.join(', ')})
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#555', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Team</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>P(Opponent)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.thirdPlaceOpponents.map((t: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ padding: '8px' }}>
                        {t.name}
                        {formatRecord(t.name) && (
                          <span style={{ marginLeft: '6px', fontSize: '11px', color: '#888' }}>({formatRecord(t.name)})</span>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{t.pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={() => setShowDetail(!showDetail)}
            style={{
              marginTop: '15px', padding: '8px 16px', background: 'white',
              color: '#003366', border: '1px solid #003366', borderRadius: '6px',
              cursor: 'pointer', fontSize: '13px',
            }}
          >
            {showDetail ? 'Hide' : 'Show'} Individual Match Results
          </button>

          {showDetail && results.matchProbsA && (
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: results.matchProbsB ? '1fr 1fr' : '1fr', gap: '30px' }}>
              {renderMatchDetail(results.groupALabel, results.matchProbsA)}
              {results.matchProbsB && renderMatchDetail(results.groupBLabel, results.matchProbsB)}
            </div>
          )}

          {results.matchSideA && results.matchSideB && (
            <div style={{ marginTop: '25px', background: '#003366', padding: '20px', borderRadius: '8px', color: 'white' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
                Match {selectedMatch} Win Probability
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.7, fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {results.matchSideALabel}
                  </div>
                  {results.matchSideA.map((t: any, i: number) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.1)', padding: '8px 12px',
                      borderRadius: '6px', marginBottom: '6px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.name}</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{t.pct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.7, fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {results.matchSideBLabel}
                  </div>
                  {results.matchSideB.map((t: any, i: number) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.1)', padding: '8px 12px',
                      borderRadius: '6px', marginBottom: '6px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.name}</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{t.pct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
            <strong>Model:</strong> Poisson regression (Maher 1982 / Dixon-Coles 1997).{' '}
            &lambda;<sub>A</sub> = exp(&mu; + &beta; &times; (R<sub>A</sub> &minus; R<sub>B</sub>)),{' '}
            where &mu; = ln(1.26) and &beta; = 0.00149 (calibrated to FIFA Elo formula).{' '}
            Dixon-Coles &tau; correction (&rho; = &minus;0.05). 10,000 MC iterations.
            {ratingSource && <> | Ratings: {ratingSource}</>}
            {resultsSource && <> | Results: {resultsSource === 'espn-live' ? 'Live (ESPN)' : resultsSource}</>}
          </div>
        </div>
      )}

      {/* ── Results (Knockout: R16, QF, SF, 3rd, Final) ── */}
      {results && results.type === 'knockout' && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: roundColor[results.round] || '#1a5276', marginBottom: '20px' }}>
            {results.round === '3rd' ? 'Teams Reaching 3rd Place Match' :
             results.round === 'Final' ? 'Teams Reaching the Final' :
             'Teams Reaching This Match'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {renderAdvanceTable(results.sideALabel, results.sideA, roundColor[results.round] || '#1a5276')}
            {renderAdvanceTable(results.sideBLabel, results.sideB, roundColor[results.round] || '#1a5276')}
          </div>

          {results.matchWinPcts && results.matchWinPcts.length > 0 && (
            <div style={{ marginTop: '25px', background: roundColor[results.round] || '#1a5276', padding: '20px', borderRadius: '8px', color: 'white' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
                Match {selectedMatch} &mdash; {results.round === 'Final' ? 'Win the World Cup' : results.round === '3rd' ? 'Win 3rd Place' : 'Win Probability'}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {results.matchWinPcts.slice(0, 12).map((t: any, i: number) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.1)', padding: '10px 15px',
                    borderRadius: '6px', minWidth: '120px',
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.name}</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '4px' }}>{t.pct.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
            <strong>Model:</strong> Full bracket simulation &mdash; group stages simulated for all feeder matches,
            then knockout results chained through R32 &rarr; {results.round}. Poisson regression (Dixon-Coles 1997). 10,000 MC iterations.
            {ratingSource && <> | Ratings: {ratingSource}</>}
            {resultsSource && <> | Results: {resultsSource === 'espn-live' ? 'Live (ESPN)' : resultsSource}</>}
          </div>
        </div>
      )}

      {results && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <span
            onClick={() => { if (!calculating) runSimulation() }}
            style={{
              color: '#bbb', cursor: calculating ? 'default' : 'pointer',
              fontSize: '11px', textDecoration: 'underline',
            }}
          >
            {calculating ? 're-running…' : 're-run simulation'}
          </span>
        </div>
      )}

      </>}

      {/* ═══════════════════ TEAM VIEW ═══════════════════ */}
      {viewMode === 'team' && (
        <div>
          {/* Loading indicator (auto-runs on tab switch) */}
          {calculating && !teamViewResults && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
              Running full tournament simulation (10,000 iterations)…
            </div>
          )}

          {teamViewResults && (
            <div style={{ marginTop: '25px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#003366', color: 'white' }}>
                    <th style={{ padding: '10px', textAlign: 'left', position: 'sticky', left: 0, background: '#003366', zIndex: 1 }}>Team</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px' }}>Grp</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px' }}>Rating</th>
                    <th style={{ padding: '10px', textAlign: 'right', background: '#00509e' }}>R32</th>
                    <th style={{ padding: '10px', textAlign: 'right', background: '#1a5276' }}>R16</th>
                    <th style={{ padding: '10px', textAlign: 'right', background: '#6c3483' }}>QF</th>
                    <th style={{ padding: '10px', textAlign: 'right', background: '#b7950b' }}>SF</th>
                    <th style={{ padding: '10px', textAlign: 'right', background: '#c0392b' }}>Final</th>
                    <th style={{ padding: '10px', textAlign: 'right', background: '#1a1a2e' }}>Champ</th>
                  </tr>
                </thead>
                <tbody>
                  {teamViewResults.map((t: any, i: number) => (
                    <>
                      <tr
                        key={t.name}
                        onClick={() => setExpandedTeam(expandedTeam === t.name ? null : t.name)}
                        style={{
                          borderBottom: expandedTeam === t.name ? 'none' : '1px solid #e0e0e0',
                          background: i % 2 === 0 ? 'white' : '#f9f9f9',
                          cursor: 'pointer',
                        }}
                      >
                        <td style={{ padding: '10px', fontWeight: 'bold', position: 'sticky', left: 0, background: i % 2 === 0 ? 'white' : '#f9f9f9', zIndex: 1 }}>
                          {t.name}
                          {formatRecord(t.name) && (
                            <span style={{ marginLeft: '6px', fontSize: '11px', color: '#888', fontWeight: 'normal' }}>
                              ({formatRecord(t.name)})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#888', fontSize: '12px' }}>{t.group}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#888', fontSize: '12px' }}>{t.rating.toFixed(0)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#003366' }}>{t.R32.total.toFixed(1)}%</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#1a5276' }}>{t.R16.total.toFixed(1)}%</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#6c3483' }}>{t.QF.total.toFixed(1)}%</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#b7950b' }}>{t.SF.total.toFixed(1)}%</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#c0392b' }}>{t.Final.total.toFixed(1)}%</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#1a1a2e', fontSize: '15px' }}>{t.Champion.toFixed(1)}%</td>
                      </tr>
                      {expandedTeam === t.name && (
                        <tr key={`${t.name}-detail`} style={{ background: '#f0f4ff', borderBottom: '2px solid #003366' }}>
                          <td colSpan={9} style={{ padding: '15px 20px' }}>
                            {/* Group stage matches in expanded row */}
                            {(() => {
                              const matches = getTeamGroupMatches(t.name)
                              if (matches.length === 0) return null
                              return (
                                <div style={{ marginBottom: '15px' }}>
                                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0d7c66', marginBottom: '8px' }}>
                                    Group {t.group} Schedule
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                                    {matches.map(gm => {
                                      const result = groupMatchResult(gm)
                                      const opp = gm.teamA === t.name ? gm.teamB : gm.teamA
                                      return (
                                        <div key={gm.matchNum} style={{ background: result ? 'white' : '#f0faf7', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${result ? '#ddd' : '#c8e6d8'}`, fontSize: '12px' }}>
                                          <div style={{ fontWeight: 'bold' }}>vs {opp}</div>
                                          <div style={{ color: '#888', marginTop: '2px' }}>{venueCity(gm.venue)}</div>
                                          {result ? (() => {
                                            const my = gm.teamA === t.name ? result.scoreA : result.scoreB
                                            const their = gm.teamA === t.name ? result.scoreB : result.scoreA
                                            const o = my > their ? 'W' : my === their ? 'D' : 'L'
                                            const c = o === 'W' ? '#28a745' : o === 'D' ? '#b7950b' : '#dc3545'
                                            return (
                                              <div style={{ color: c, marginTop: '2px', fontWeight: 'bold' }}>
                                                {o} {my}–{their}
                                              </div>
                                            )
                                          })() : (
                                            <div style={{ color: '#0d7c66', marginTop: '2px' }}>
                                              {gm.date.split('•')[0]?.trim()}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })()}
                            {/* Knockout venue breakdown */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                              {(['R32', 'R16', 'QF', 'SF', 'Final'] as const).map(rd => {
                                const data = t[rd]
                                if (!data || data.total === 0) return null
                                return (
                                  <div key={rd} style={{ background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: roundColor[rd] || '#003366', marginBottom: '6px' }}>
                                      {roundLabel[rd] || rd} &mdash; {data.total.toFixed(1)}%
                                    </div>
                                    {data.venues.map((v: any, vi: number) => {
                                      const matchesHere = allMatches.filter(m => m.round === rd && venueCity(m.venue) === v.venue)
                                      return (
                                      <div key={vi} style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span>{v.venue}</span>
                                          <span style={{ fontWeight: 'bold', color: v.venue.includes('Dallas') ? '#0d6efd' : '#333' }}>
                                            {v.pct.toFixed(1)}%
                                          </span>
                                        </div>
                                        {matchesHere.length > 0 && (
                                          <div style={{ fontSize: '10px', color: '#999', marginTop: '1px' }}>
                                            {matchesHere.map(m => `M${m.matchNum}: ${m.date}`).join(' · ')}
                                          </div>
                                        )}
                                      </div>
                                    )})}
                                  </div>
                                )
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
                <strong>Model:</strong> Full tournament bracket simulation &mdash; all 12 groups + R32 through Final
                with proper 3rd-place assignment (backtracking). Poisson regression (Dixon-Coles 1997). 10,000 MC iterations.
                {ratingSource && <> | Ratings: {ratingSource}</>}
            {resultsSource && <> | Results: {resultsSource === 'espn-live' ? 'Live (ESPN)' : resultsSource}</>}
              </div>

              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <span
                  onClick={() => { if (!calculating) runTeamSimulation() }}
                  style={{
                    color: '#bbb', cursor: calculating ? 'default' : 'pointer',
                    fontSize: '11px', textDecoration: 'underline',
                  }}
                >
                  {calculating ? 're-running…' : 're-run simulation'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ STANDINGS VIEW ═══════════════════ */}
      {viewMode === 'standings' && (() => {
        const computeStandings = (group: string) => {
          const teams = groupTeams[group]
          return teams.map(t => {
            const r = getTeamRecord(t.name)
            const pts = r.w * 3 + r.d
            const played = r.w + r.d + r.l
            return { ...t, ...r, pts, played }
          }).sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : (b.gf - b.ga) !== (a.gf - a.ga) ? (b.gf - b.ga) - (a.gf - a.ga) : b.gf - a.gf)
        }
        const groups = Object.keys(groupTeams).sort()
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {groups.map(g => {
              const standings = computeStandings(g)
              const groupGames = groupMatches.filter(m => m.group === g)
              return (
                <div key={g} style={{ background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                  <div style={{ background: '#003366', color: 'white', padding: '8px 12px', fontWeight: 'bold', fontSize: '14px' }}>
                    Group {g}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                        <th style={{ padding: '5px 8px', textAlign: 'left' }}>Team</th>
                        <th style={{ padding: '5px 4px', textAlign: 'center', width: '28px' }}>P</th>
                        <th style={{ padding: '5px 4px', textAlign: 'center', width: '28px' }}>W</th>
                        <th style={{ padding: '5px 4px', textAlign: 'center', width: '28px' }}>D</th>
                        <th style={{ padding: '5px 4px', textAlign: 'center', width: '28px' }}>L</th>
                        <th style={{ padding: '5px 4px', textAlign: 'center', width: '32px' }}>GF</th>
                        <th style={{ padding: '5px 4px', textAlign: 'center', width: '32px' }}>GA</th>
                        <th style={{ padding: '5px 4px', textAlign: 'center', width: '32px' }}>GD</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', width: '32px', fontWeight: 'bold' }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((t, i) => (
                        <tr key={t.name} style={{
                          borderBottom: '1px solid #eee',
                          background: i < 2 ? '#e8f5e9' : i === 2 ? '#fff8e1' : 'white',
                        }}>
                          <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{t.name}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center' }}>{t.played}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center' }}>{t.w}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center' }}>{t.d}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center' }}>{t.l}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center' }}>{t.gf}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center' }}>{t.ga}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center' }}>{t.gf - t.ga > 0 ? '+' : ''}{t.gf - t.ga}</td>
                          <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{t.pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '6px 8px', background: '#fafafa', borderTop: '1px solid #eee' }}>
                    {groupGames.map(gm => {
                      const result = groupMatchResult(gm)
                      return (
                        <div key={gm.matchNum} style={{ fontSize: '11px', color: result ? '#333' : '#aaa', padding: '1px 0' }}>
                          {result ? (
                            <span>{gm.teamA} <strong>{result.scoreA}–{result.scoreB}</strong> {gm.teamB}</span>
                          ) : (
                            <span style={{ color: '#999' }}>{gm.teamA} vs {gm.teamB} &bull; {gm.date.split('•')[0]?.trim()}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: '#888', padding: '4px 0' }}>
              Green = auto-qualifies (top 2). Yellow = 3rd place (8 of 12 advance).
              {resultsSource && <> | Results: {resultsSource === 'espn-live' ? 'Live (ESPN)' : resultsSource}</>}
            </div>
          </div>
        )
      })()}

      {/* ═══════════════════ BRACKET VIEW ═══════════════════ */}
      {viewMode === 'bracket' && (() => {
        const getMatch = (n: number) => allMatches.find(m => m.matchNum === n)!
        const teamSim = teamViewResults as any[] | null

        const getSlotLabel = (m: KnockoutMatch, side: 'A' | 'B'): string => {
          if (m.round === 'R32') {
            if (m.type === 'runner') return side === 'A' ? `2nd ${m.groups![0]}` : `2nd ${m.groups![1]}`
            if (m.type === 'winner_vs_runner') return side === 'A' ? `1st ${m.groups![0]}` : `2nd ${m.groups![1]}`
            if (side === 'A') return `1st ${m.groups![0]}`
            return `3rd`
          }
          return `W M${m.feedsFrom![side === 'A' ? 0 : 1]}`
        }

        const getTopTeamForSlot = (matchNum: number, side: 'A' | 'B'): { name: string; pct: number } | null => {
          if (!teamSim) return null
          const match = getMatch(matchNum)
          if (match.round !== 'R32') return null
          const label = getSlotLabel(match, side)
          const gm = label.match(/^(1st|2nd) ([A-L])$/)
          if (!gm) return null
          const pos = gm[1] === '1st' ? 0 : 1
          const grpTeams = teamSim.filter(t => t.group === gm[2])
            .sort((a: any, b: any) => (b.R32?.total || 0) - (a.R32?.total || 0))
          const team = grpTeams[pos]
          if (!team) return null
          const rec = formatRecord(team.name)
          return { name: rec ? `${team.name} (${rec})` : team.name, pct: team.R32?.total || 0 }
        }

        const slotStyle = (isKnown: boolean): React.CSSProperties => ({
          padding: '3px 6px', fontSize: '11px', whiteSpace: 'nowrap',
          minWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis',
          background: isKnown ? '#e8f5e9' : 'white',
          fontWeight: isKnown ? 'bold' : 'normal',
          color: isKnown ? '#1b5e20' : '#333',
        })

        const renderR32 = (matchNum: number) => {
          const match = getMatch(matchNum)
          const topTeam = getTopTeamForSlot(matchNum, 'A')
          const botTeam = getTopTeamForSlot(matchNum, 'B')
          const topKnown = topTeam != null && topTeam.pct >= 90
          const botKnown = botTeam != null && botTeam.pct >= 90
          return (
            <div
              onClick={() => { setSelectedMatch(matchNum); setResults(null); setViewMode('match'); setSelectedRound('R32') }}
              style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}
            >
              <div style={{ ...slotStyle(topKnown), borderBottom: '1px solid #ddd' }}>
                {topKnown ? topTeam!.name : (topTeam ? topTeam.name : getSlotLabel(match, 'A'))}
              </div>
              <div style={slotStyle(botKnown)}>
                {botKnown ? botTeam!.name : (botTeam ? botTeam.name : getSlotLabel(match, 'B'))}
              </div>
            </div>
          )
        }

        const renderBracket = (matchNum: number): JSX.Element => {
          const match = getMatch(matchNum)
          if (match.round === 'R32') return renderR32(matchNum)

          const [topChild, botChild] = match.feedsFrom!
          const rc = roundColor[match.round] || '#003366'
          return (
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingBottom: '3px' }}>
                  {renderBracket(topChild)}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '3px' }}>
                  {renderBracket(botChild)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', width: '14px' }}>
                <div style={{ flex: 1, borderRight: '2px solid #bbb', borderBottom: '2px solid #bbb' }} />
                <div style={{ flex: 1, borderRight: '2px solid #bbb' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '6px', height: '2px', background: '#bbb' }} />
                <div style={{
                  fontSize: '9px', padding: '2px 5px', background: rc, color: 'white',
                  borderRadius: '3px', whiteSpace: 'nowrap', fontWeight: 'bold',
                }}>
                  M{matchNum}
                </div>
              </div>
            </div>
          )
        }

        return (
          <div>
            {calculating && !teamSim && (
              <div style={{ padding: '15px', textAlign: 'center', color: '#888' }}>Running simulation…</div>
            )}

            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#003366', marginBottom: '6px' }}>Upper Bracket &rarr; Semifinal M101</div>
            <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', minWidth: 'min-content' }}>
                {renderBracket(101)}
              </div>
            </div>

            <div style={{
              margin: '12px 0', padding: '12px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: 'white', textAlign: 'center',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.1em' }}>FINAL &mdash; M104</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{getMatch(104).date} &bull; {venueCity(getMatch(104).venue)}</div>
              <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>3rd Place: M103 &bull; {getMatch(103).date} &bull; {venueCity(getMatch(103).venue)}</div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#003366', marginBottom: '6px' }}>Lower Bracket &rarr; Semifinal M102</div>
            <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', minWidth: 'min-content' }}>
                {renderBracket(102)}
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
              Tap any R32 matchup for detailed probabilities. Green = clinched ({'≥'}90%).
              {ratingSource && <> | Ratings: {ratingSource}</>}
              {resultsSource && <> | Results: {resultsSource === 'espn-live' ? 'Live (ESPN)' : resultsSource}</>}
            </div>
          </div>
        )
      })()}

      {/* ═══════════════════ VENUE VIEW ═══════════════════ */}
      {viewMode === 'venue' && (
        <div>
          {/* Venue selector — always visible */}
          <div style={{ marginBottom: '20px' }}>
            <select
              value={selectedVenue}
              onChange={e => setSelectedVenue(e.target.value)}
              style={{
                padding: '10px 16px', fontSize: '15px', borderRadius: '6px',
                border: '2px solid #003366', background: 'white', color: '#003366',
                fontWeight: 'bold', cursor: 'pointer', width: '100%', maxWidth: '450px',
              }}
            >
              {allVenueCities().map(city => {
                const gCount = getVenueGroupMatches(city).length
                const kCount = allMatches.filter(m => venueCity(m.venue) === city).length
                return (
                  <option key={city} value={city}>
                    {city} — {gCount + kCount} matches ({gCount} group, {kCount} knockout)
                  </option>
                )
              })}
            </select>
          </div>

          {/* ── Group Stage Section ── */}
          {(() => {
            const venueGroupGames = getVenueGroupMatches(selectedVenue)
            if (venueGroupGames.length === 0) return null
            return (
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => setVenueGroupExpanded(!venueGroupExpanded)}
                  style={{
                    width: '100%', padding: '12px 16px', background: '#14967f', color: 'white',
                    border: 'none', borderRadius: venueGroupExpanded ? '8px 8px 0 0' : '8px',
                    cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>Group Stage — {venueGroupGames.length} {venueGroupGames.length === 1 ? 'match' : 'matches'}</span>
                  <span style={{ fontSize: '14px' }}>{venueGroupExpanded ? '▼' : '▶'}</span>
                </button>
                {venueGroupExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px', background: '#f0faf7', borderRadius: '0 0 8px 8px', padding: '12px' }}>
                    {venueGroupGames.map(gm => {
                      const result = groupMatchResult(gm)
                      return (
                        <div key={gm.matchNum} style={{
                          background: 'white', borderRadius: '8px', border: '1px solid #c8e6d8', overflow: 'hidden',
                        }}>
                          <div style={{
                            background: '#0d7c66', color: 'white', padding: '10px 16px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}>
                            <div>
                              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Match {gm.matchNum} — Group {gm.group}</span>
                            </div>
                            {result && (
                              <span style={{
                                background: '#ffd700', color: '#333', padding: '2px 8px', borderRadius: '4px',
                                fontSize: '11px', fontWeight: 'bold',
                              }}>FINAL</span>
                            )}
                          </div>
                          <div style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                              <span>{gm.teamA}{formatRecord(gm.teamA) ? <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#888' }}> ({formatRecord(gm.teamA)})</span> : ''}</span>
                              {result ? (
                                <span style={{ color: '#0d7c66', fontSize: '20px' }}>{result.scoreA} – {result.scoreB}</span>
                              ) : (
                                <span style={{ color: '#999', fontSize: '14px' }}>vs</span>
                              )}
                              <span>{gm.teamB}{formatRecord(gm.teamB) ? <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#888' }}> ({formatRecord(gm.teamB)})</span> : ''}</span>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '6px' }}>
                              {gm.date}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Knockout Section ── */}
          {(() => {
            const venueKnockoutGames = allMatches.filter(m => venueCity(m.venue) === selectedVenue)
            if (venueKnockoutGames.length === 0) return null
            return (
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => setVenueKnockoutExpanded(!venueKnockoutExpanded)}
                  style={{
                    width: '100%', padding: '12px 16px', background: '#003366', color: 'white',
                    border: 'none', borderRadius: venueKnockoutExpanded ? '8px 8px 0 0' : '8px',
                    cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>Knockout Stage — {venueKnockoutGames.length} {venueKnockoutGames.length === 1 ? 'match' : 'matches'}</span>
                  <span style={{ fontSize: '14px' }}>{venueKnockoutExpanded ? '▼' : '▶'}</span>
                </button>
                {venueKnockoutExpanded && (
                  <div style={{ paddingTop: '12px' }}>
                    {!venueViewResults ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                        {calculating ? 'Running simulation (10,000 iterations)…' : 'Loading…'}
                      </div>
                    ) : venueViewResults[selectedVenue] ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {venueViewResults[selectedVenue].matches.map((match: any) => {
                          const visibleA = match.sideA.filter((t: any) => t.pct >= 1)
                          const hiddenA = match.sideA.filter((t: any) => t.pct < 1).length
                          const visibleB = match.sideB.filter((t: any) => t.pct >= 1)
                          const hiddenB = match.sideB.filter((t: any) => t.pct < 1).length
                          const rc = roundColor[match.round] || '#003366'
                          return (
                            <div key={match.matchNum} style={{
                              background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                background: rc, color: 'white', padding: '12px 16px',
                              }}>
                                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                                  {match.title}
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                                  {match.date} &bull; {match.matchup}
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                                {/* Side A */}
                                <div style={{ borderRight: '2px solid #e0e0e0' }}>
                                  <div style={{ padding: '8px 12px', background: '#f5f5f5', fontSize: '11px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>
                                    {match.sideALabel}
                                  </div>
                                  {visibleA.map((t: any) => (
                                    <div key={t.name} style={{ padding: '5px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                      <span style={{ fontWeight: t.pct >= 10 ? 'bold' : 'normal' }}>{t.name}</span>
                                      <span style={{ fontWeight: 'bold', color: rc }}>{t.pct.toFixed(1)}%</span>
                                    </div>
                                  ))}
                                  {hiddenA > 0 && (
                                    <div style={{ padding: '4px 12px', fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                                      +{hiddenA} other
                                    </div>
                                  )}
                                </div>
                                {/* Side B */}
                                <div>
                                  <div style={{ padding: '8px 12px', background: '#f5f5f5', fontSize: '11px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>
                                    {match.sideBLabel}
                                  </div>
                                  {visibleB.map((t: any) => (
                                    <div key={t.name} style={{ padding: '5px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                      <span style={{ fontWeight: t.pct >= 10 ? 'bold' : 'normal' }}>{t.name}</span>
                                      <span style={{ fontWeight: 'bold', color: rc }}>{t.pct.toFixed(1)}%</span>
                                    </div>
                                  ))}
                                  {hiddenB > 0 && (
                                    <div style={{ padding: '4px 12px', fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                                      +{hiddenB} other
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '12px', color: '#888', fontStyle: 'italic' }}>
                        No knockout matches at this venue.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {venueViewResults && (
            <>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                <strong>Model:</strong> Full tournament bracket simulation &mdash; all 12 groups + R32 through Final
                with proper 3rd-place assignment (backtracking). Poisson regression (Dixon-Coles 1997). 10,000 MC iterations.
                {ratingSource && <> | Ratings: {ratingSource}</>}
            {resultsSource && <> | Results: {resultsSource === 'espn-live' ? 'Live (ESPN)' : resultsSource}</>}
              </div>
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <span
                  onClick={() => { if (!calculating) runVenueSimulation() }}
                  style={{
                    color: '#bbb', cursor: calculating ? 'default' : 'pointer',
                    fontSize: '11px', textDecoration: 'underline',
                  }}
                >
                  {calculating ? 're-running…' : 're-run simulation'}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e0e0e0', fontSize: '12px', color: '#888' }}>
        Poisson regression model (Maher 1982, Dixon &amp; Coles 1997) with FIFA Elo-based rankings.
        {ratingSource && <> | Source: {ratingSource}</>}
      </div>
    </div>
  )
}
