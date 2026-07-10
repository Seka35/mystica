'use client'
// components/steps/StepDraw.tsx — Step 7: Face-down cards + 3D flip
// Layout adapts to spread: 1 card centered, 3 cards row, 5 cards cross.
// KEY OPTIMIZATION: AI stream starts as soon as cards are drawn (before any flip).

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import type { DrawnCard } from '@/lib/types'
import { cardImagePath, backImagePath } from '@/lib/tarotData'
import { localizedCardName } from '@/lib/textUtils'
import type { Spread } from '@/lib/spreads'

interface Props {
  spread: Spread
  drawnCards: DrawnCard[]
  onReveal: (index: number) => void
  onFlipSound: () => void
  allRevealed: boolean
  onNext: () => void
  question: string
}

const PALETTE = ['#8B6914', '#C8963C', '#F0C040', '#D4A857', '#E8C97A']

export default function StepDraw({
  spread, drawnCards, onReveal, onFlipSound, allRevealed, onNext, question,
}: Props) {
  useEffect(() => {}, [])

  // Auto-advance once every card has been flipped — give the user a beat
  // to read the names before transitioning to the interpretation.
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!allRevealed) return
    const t = setTimeout(() => onNext(), 1800)
    advanceTimerRef.current = t
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRevealed])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

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
        className="text-center mb-8"
      >
        <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] mb-4 opacity-60">
          ✦ &nbsp; STEP SEVEN &nbsp; ✦
        </div>
        <h2 className="font-oracle text-3xl md:text-4xl gold-text mb-2">
          Your Reading
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg">
          {allRevealed
            ? 'The cards have spoken'
            : spread.cardCount === 1
              ? 'Click the card to reveal your message'
              : `Click each card to reveal your destiny`}
        </p>
      </motion.div>

      {/* ── CARDS LAYOUT ────────────────────────────────────────── */}
      {spread.cardCount === 1 && (
        <SingleCardLayout drawn={drawnCards[0]} index={0}
          color={PALETTE[0]} question={question}
          onReveal={onReveal} onFlipSound={onFlipSound} />
      )}

      {spread.cardCount === 3 && (
        <div className="flex flex-row gap-4 md:gap-8 mb-8 justify-center">
          {drawnCards.map((d, i) => (
            <CardColumn key={d.position} drawn={d} index={i}
              color={PALETTE[i]} question={question}
              onReveal={onReveal} onFlipSound={onFlipSound} />
          ))}
        </div>
      )}

      {spread.cardCount === 5 && (
        isMobile ? (
          // Mobile: vertical stack in reading order 1→2→3→4→5
          <div className="flex flex-col gap-4 mb-8 items-center">
            {drawnCards.map((d, i) => (
              <CardColumn key={d.position} drawn={d} index={i}
                color={PALETTE[i]} question={question}
                onReveal={onReveal} onFlipSound={onFlipSound}
                compact />
            ))}
          </div>
        ) : (
          // Desktop: clean 2+3 grid, no overlap, reading order 1→2→3→4→5
          //   Row 1 (2 cards):  The Situation, The Obstacle
          //   Row 2 (3 cards):  The Root, The Path, The Synthesis
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="flex justify-center gap-4 md:gap-6">
              {[0, 1].map((i) => (
                <CardColumn key={drawnCards[i].position} drawn={drawnCards[i]} index={i}
                  color={PALETTE[i]} question={question}
                  onReveal={onReveal} onFlipSound={onFlipSound}
                  compact />
              ))}
            </div>
            <div className="flex justify-center gap-4 md:gap-6">
              {[2, 3, 4].map((i) => (
                <CardColumn key={drawnCards[i].position} drawn={drawnCards[i]} index={i}
                  color={PALETTE[i]} question={question}
                  onReveal={onReveal} onFlipSound={onFlipSound}
                  compact />
              ))}
            </div>
          </div>
        )
      )}

      {/* "See reading" button */}
      {allRevealed && (
        <motion.div
          className="mt-12 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="text-[var(--text-muted)] italic font-body text-sm opacity-60">
            ✦ The oracle has been preparing your reading…
          </p>
          <button
            className="btn-oracle"
            onClick={() => {
              if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
              onNext()
            }}
            id="see-interpretation-btn"
          >
            ✦ &nbsp; Read the Interpretation &nbsp; ✦
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

// ── Single card (1-card spread) ─────────────────────────────────────
function SingleCardLayout({ drawn, index, color, question, onReveal, onFlipSound }: {
  drawn: DrawnCard; index: number; color: string; question: string;
  onReveal: (i: number) => void; onFlipSound: () => void;
}) {
  return (
    <motion.div
      key={drawn.position}
      className="flex flex-col items-center gap-3 mb-8"
      style={{ transform: 'scale(1.3)', transformOrigin: 'center' }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <CardFace drawn={drawn} index={index} color={color} question={question}
        onReveal={onReveal} onFlipSound={onFlipSound} />
    </motion.div>
  )
}

// ── Card column (label + 3D card + sub-label) ───────────────────────
function CardColumn({ drawn, index, color, question, onReveal, onFlipSound, compact = false }: {
  drawn: DrawnCard; index: number; color: string; question: string;
  onReveal: (i: number) => void; onFlipSound: () => void;
  compact?: boolean;
}) {
  return (
    <motion.div
      key={drawn.position}
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="font-oracle text-xs tracking-[0.2em] opacity-80"
        style={{ color }}>
        {drawn.position.toUpperCase()}
      </div>
      <CardFace drawn={drawn} index={index} color={color} question={question}
        onReveal={onReveal} onFlipSound={onFlipSound} compact={compact} />
    </motion.div>
  )
}

// ── 3D Card face (flip animation) ───────────────────────────────────
function CardFace({ drawn, index, color, question, onReveal, onFlipSound, compact = false }: {
  drawn: DrawnCard; index: number; color: string; question: string;
  onReveal: (i: number) => void; onFlipSound: () => void;
  compact?: boolean;
}) {
  const { card, position, isRevealed } = drawn
  return (
    <motion.div
      className="card-3d-wrapper cursor-pointer touch-manipulation"
      style={compact ? { transform: 'scale(0.65)', transformOrigin: 'center' } : undefined}
      whileTap={isRevealed ? undefined : { scale: compact ? 0.6 : 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={() => {
        if (!isRevealed) { onFlipSound(); onReveal(index) }
      }}
      role="button"
      aria-label={isRevealed
        ? `${localizedCardName(card, question)} revealed`
        : `Click to reveal ${position} card`}
      id={`card-${position}`}
    >
      <motion.div className="card-3d-inner"
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.75, ease: [0.4, 0.2, 0.2, 1] }}>

        {/* Back */}
        <div className="card-back">
          <Image
            src={backImagePath()}
            alt="Card back"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 120px, 200px"
          />
          {!isRevealed && (
            <motion.div
              className="absolute inset-0 rounded-lg"
              animate={{
                boxShadow: [
                  '0 0 0px rgba(240,192,64,0)',
                  `0 0 20px ${color}60`,
                  '0 0 0px rgba(240,192,64,0)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.4 }}
            />
          )}
        </div>

        {/* Face */}
        <div className={`card-face ${isRevealed ? 'card-glow' : ''}`}>
          <Image
            src={cardImagePath(card.image)}
            alt={localizedCardName(card, question)}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 120px, 200px"
          />
          {/* Subtle gloss — soft "light from upper-left" sheen, only on the revealed face */}
          {isRevealed && <div className="card-gloss" aria-hidden />}
          {isRevealed && (
            <motion.div className="absolute inset-0 rounded-lg"
              initial={{ opacity: 0.6 }} animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ background: 'white' }} />
          )}
        </div>
      </motion.div>

      {!isRevealed && (
        <div className="absolute left-0 right-0 -bottom-7 flex justify-center pointer-events-none">
          <motion.div
            className="text-xs text-[var(--text-muted)] italic font-body whitespace-nowrap opacity-50"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            tap to reveal
          </motion.div>
        </div>
      )}

      {isRevealed && (
        <div className="absolute left-0 right-0 -bottom-9 flex justify-center pointer-events-none">
          <motion.div
            className="text-xs font-oracle whitespace-nowrap tracking-wide text-center"
            style={{ color }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {localizedCardName(card, question)}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}