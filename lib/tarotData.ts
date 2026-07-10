// lib/tarotData.ts
// Loads prediction.json and exposes a flat array of all 78 cards
// plus a seeded draw function based on cut position

import type { TarotCard, Theme } from './types'
import data from '../prediction.json'

// Flatten all cards into a single array
const allCards: TarotCard[] = [
  ...data.majorArcana,
  ...data.minorArcana.wands,
  ...data.minorArcana.cups,
  ...data.minorArcana.swords,
  ...data.minorArcana.pentacles,
] as TarotCard[]

export function getAllCards(): TarotCard[] {
  return allCards
}

// Seeded shuffle using the cut index as the seed
// This ensures the same cut always produces the same draw (deterministic)
function seededRandom(seed: number): () => number {
  let s = seed + 1
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function drawThreeCards(cutIndex: number): TarotCard[] {
  const rng = seededRandom(cutIndex * 137 + 42) // multiply for better spread
  const shuffled = [...allCards]

  // Fisher-Yates with seeded RNG
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, 3)
}

export function getCardMeaning(card: TarotCard, theme: Theme): string {
  switch (theme) {
    case 'love': return card.love
    case 'work': return card.work
    case 'money': return card.money
    case 'spiritual': return card.spiritual
    default: return card.general
  }
}

// Convert image filename to WebP path for public/cards/
export function cardImagePath(imageFile: string): string {
  return `/cards/${imageFile.replace('.png', '.webp')}`
}

export function backImagePath(): string {
  return '/cards/00_back.webp'
}
