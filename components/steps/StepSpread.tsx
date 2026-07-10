'use client'
// components/steps/StepSpread.tsx — Step 3: Choose Your Reading
// User picks how deep the reading should go. This drives the number
// of cards they will draw in the Fan step.

import { motion } from 'framer-motion'
import { SPREADS, type Spread, type SpreadId } from '@/lib/spreads'
import type { Theme } from '@/lib/types'
import { THEME_CONFIG } from '@/lib/types'

interface Props {
  theme: Theme
  selected: SpreadId
  onSelect: (id: SpreadId) => void
  onNext: () => void
}

const SPREAD_ICONS: Record<SpreadId, string> = {
  daily:   '✦',
  classic: '✦✦',
  deep:    '✦✦✦',
}

// A small layout hint drawn in pure CSS/SVG — 1 dot, 3 dots in a row, or
// 5 dots in a cross shape.
function LayoutHint({ spread }: { spread: Spread }) {
  if (spread.cardCount === 1) {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" className="opacity-70">
        <circle cx="22" cy="22" r="5" fill="currentColor" />
      </svg>
    )
  }
  if (spread.cardCount === 3) {
    return (
      <svg width="64" height="44" viewBox="0 0 64 44" className="opacity-70">
        <circle cx="10" cy="22" r="5" fill="currentColor" />
        <circle cx="32" cy="22" r="5" fill="currentColor" />
        <circle cx="54" cy="22" r="5" fill="currentColor" />
      </svg>
    )
  }
  // 5-card cross
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="opacity-70">
      <circle cx="32" cy="10" r="4" fill="currentColor" />
      <circle cx="10" cy="32" r="4" fill="currentColor" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
      <circle cx="54" cy="32" r="4" fill="currentColor" />
      <circle cx="32" cy="54" r="4" fill="currentColor" />
    </svg>
  )
}

export default function StepSpread({ theme, selected, onSelect, onNext }: Props) {
  const accent = THEME_CONFIG[theme].accent
  const muted   = THEME_CONFIG[theme].color
  const isReady = selected !== null

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-dvh px-4 py-12 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-10"
      >
        <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] mb-4 opacity-60">
          ✦ &nbsp; STEP TWO &nbsp; ✦
        </div>
        <h2 className="font-oracle text-3xl md:text-4xl gold-text mb-3">
          Choose Your Reading
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg">
          How deep shall we look?
        </p>
      </motion.div>

      {/* Spreads list */}
      <div className="flex flex-col gap-3 w-full max-w-2xl mb-10">
        {SPREADS.map((spread, i) => {
          const isSelected = selected === spread.id
          return (
            <motion.button
              key={spread.id}
              type="button"
              id={`spread-${spread.id}`}
              className={`spread-card text-left relative overflow-hidden ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(spread.id)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              style={{
                borderColor: isSelected ? accent + '80' : undefined,
                background: isSelected ? `${muted}30` : undefined,
              }}
            >
              {/* Color accent bar on the left */}
              <div
                className="absolute top-0 left-0 w-1 h-full opacity-80"
                style={{ background: accent }}
              />

              {/* Selected glow */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: `radial-gradient(ellipse at 20% 50%, ${accent}18, transparent 70%)`,
                  }}
                />
              )}

              <div className="flex items-center gap-4 pl-5 pr-4 py-4">
                {/* Symbol + count */}
                <div className="flex flex-col items-center min-w-[64px]" style={{ color: accent }}>
                  <div className="text-2xl leading-none mb-1">{SPREAD_ICONS[spread.id]}</div>
                  <div className="text-[10px] font-oracle tracking-widest opacity-80">
                    {spread.cardCount} {spread.cardCount === 1 ? 'CARD' : 'CARDS'}
                  </div>
                </div>

                {/* Name + tagline */}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-oracle text-sm tracking-widest mb-1"
                    style={{ color: accent }}
                  >
                    {spread.name}
                  </div>
                  <div className="text-[var(--text-muted)] italic font-body text-sm leading-snug">
                    {spread.tagline}
                  </div>
                </div>

                {/* Layout hint + duration badge */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <LayoutHint spread={spread} />
                  <div
                    className="text-[10px] font-oracle tracking-widest px-2 py-0.5 rounded-full"
                    style={{
                      color: accent,
                      border: `1px solid ${accent}40`,
                      background: `${muted}20`,
                    }}
                  >
                    {spread.duration}
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Continue */}
      <motion.button
        className="btn-oracle"
        onClick={onNext}
        disabled={!isReady}
        initial={{ opacity: 0 }}
        animate={{ opacity: isReady ? 1 : 0.3 }}
        transition={{ duration: 0.4 }}
        whileHover={isReady ? { y: -2 } : {}}
        style={{ cursor: isReady ? 'pointer' : 'not-allowed' }}
        id="spread-continue-btn"
      >
        Continue the Journey →
      </motion.button>
    </motion.div>
  )
}