// lib/spreads.ts — Reading-depth configurations
// Each spread defines how many cards the user picks and what each
// position in the layout represents.

export type SpreadId = 'daily' | 'classic' | 'deep'

export interface SpreadPosition {
  name: string    // short label shown in the slot, e.g. "Past", "The Obstacle"
  meaning: string // one-sentence description for the AI prompt
}

export interface Spread {
  id: SpreadId
  name: string            // "Classic Reading"
  symbol: string          // "✦✦" — visual hint of card count
  cardCount: 1 | 3 | 5
  tagline: string
  duration: string
  default?: boolean
  positions: SpreadPosition[]
}

export const SPREADS: Spread[] = [
  {
    id: 'daily',
    name: 'Daily Guidance',
    symbol: '✦',
    cardCount: 1,
    tagline: 'One card. One message. Clear and direct.',
    duration: '~1 min',
    positions: [
      {
        name: 'Guidance',
        meaning: 'The energy and message you need to hear right now',
      },
    ],
  },
  {
    id: 'classic',
    name: 'Classic Reading',
    symbol: '✦✦',
    cardCount: 3,
    tagline: 'Past, present and future illuminate your question.',
    duration: '~3 min',
    default: true,
    positions: [
      {
        name: 'Past',
        meaning: 'The influences and events that shaped the current situation',
      },
      {
        name: 'Present',
        meaning: 'The current energies and the heart of the matter',
      },
      {
        name: 'Future',
        meaning: 'The direction things are heading if the current path continues',
      },
    ],
  },
  {
    id: 'deep',
    name: 'Deep Reading',
    symbol: '✦✦✦',
    cardCount: 5,
    tagline: 'The Cross, a complete vision of your situation.',
    duration: '~5 min',
    positions: [
      { name: 'The Situation',   meaning: 'The core of what is happening' },
      { name: 'The Obstacle',    meaning: 'What blocks, challenges, or opposes' },
      { name: 'The Root',        meaning: 'The hidden foundation, past influences feeding the situation' },
      { name: 'The Path',        meaning: 'Where things are heading' },
      { name: 'The Synthesis',   meaning: 'The key that unites everything, the essential message' },
    ],
  },
]

export const SPREADS_BY_ID: Record<SpreadId, Spread> = SPREADS.reduce(
  (acc, s) => {
    acc[s.id] = s
    return acc
  },
  {} as Record<SpreadId, Spread>
)

export const DEFAULT_SPREAD_ID: SpreadId = 'classic'

export function getDefaultSpread(): Spread {
  return SPREADS_BY_ID[DEFAULT_SPREAD_ID]
}
