// lib/types.ts

export type Theme = 'love' | 'work' | 'money' | 'spiritual' | 'free'
export type Position = string  // spread-defined (e.g. "Past", "The Obstacle")
export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface TarotCard {
  id: string
  image: string          // e.g. "01_le_bateleur.png" → served as WebP
  name: string           // English
  nameFr: string
  number: number
  arcana: 'major' | 'minor'
  keywords: string[]
  general: string
  love: string
  work: string
  money: string
  spiritual: string
  reversed?: string
  // minor arcana
  suit?: string
}

export interface DrawnCard {
  card: TarotCard
  position: Position
  isRevealed: boolean
}

export interface ReadingState {
  step: Step
  theme: Theme | null
  question: string
  cutIndex: number        // 0–77, seed for draw
  drawnCards: DrawnCard[]
  interpretation: string  // accumulated stream
  isStreaming: boolean
}

export const THEME_CONFIG: Record<Theme, { label: string; color: string; accent: string; placeholder: string }> = {
  love: {
    label: 'Love',
    color: '#8B1A3A',
    accent: '#FF4D7A',
    placeholder: 'What weighs on your heart in love right now?',
  },
  work: {
    label: 'Work',
    color: '#1A2E6B',
    accent: '#4D79FF',
    placeholder: 'What challenge or opportunity calls to you in your career?',
  },
  money: {
    label: 'Money',
    color: '#6B5A1A',
    accent: '#F0C040',
    placeholder: 'What financial question seeks clarity in your life?',
  },
  spiritual: {
    label: 'Spiritual',
    color: '#4A1A6B',
    accent: '#B04DFF',
    placeholder: 'What does your soul seek to understand right now?',
  },
  free: {
    label: 'Free Question',
    color: '#1A5A5A',
    accent: '#4DFFE0',
    placeholder: 'Ask the universe anything. Be specific, precision opens the oracle.',
  },
}
