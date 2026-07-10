'use client'
// components/steps/StepShuffle.tsx — Step 5: Deck shuffling animation
//
// Realistic riffle-style shuffle:
//   • Half the cards emerge from the upper-left, arc through the centre deck,
//     and settle back down.
//   • The other half emerges from the upper-right, in alternation.
//   • All cards are the same size (deck = flying = 110×190).
//   • Animation length still synced to shuffle.mp3 (~5.69s).
//
// Mobile: bigger touch targets, `touch-action: manipulation` to kill the
// double-tap-zoom delay, whileTap visual feedback.

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { backImagePath } from '@/lib/tarotData'

interface Props {
  onNext: () => void
  onPlayShuffle: () => void
}

// shuffle.mp3 measured duration (see public/sounds/shuffle.mp3)
const SHUFFLE_DURATION_S = 5.69

// Mobile vs desktop sizing — kept identical to flying-card size so the
// whole animation has a single coherent scale.
const CARD_W = 110
const CARD_H = 190

// Number of cards in the riffle (per half)
const getCardCount = () =>
  typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : 12

// Two riffle waves: first the LEFT half falls, then the RIGHT half.
// Each card is assigned to one of the two halves at build time, which
// decides its starting offset and arc direction.
function buildTimeline(cardCount: number) {
  const half = Math.ceil(cardCount / 2)
  const slots: Array<{
    id: number
    startAt: number          // seconds into shuffle
    startX: number           // horizontal start (left = -, right = +)
    midX: number             // arc apex X
    midY: number             // arc apex Y (negative = up)
    endX: number             // landing X
    endY: number             // landing Y
    rotStart: number         // initial rotation
    rotMid: number           // mid-flight rotation
    rotEnd: number           // landing rotation
    dur: number              // trajectory duration (s)
  }> = []

  let id = 0

  // ── LEFT half ──────────────────────────────────────────────────
  // Emerges from upper-left, swings through the centre deck.
  for (let i = 0; i < half; i++) {
    const r1 = ((id * 9301 + 49297) % 233280) / 233280
    const r2 = ((id * 1664525 + 1013904223) >>> 0) / 4294967295
    const r3 = ((id * 22695477 + 1) >>> 0) / 4294967295

    const startX = -110 - r2 * 50            // starts off-screen left
    const midX   = -90 - r1 * 40             // swings through the deck
    const endX   = -20 - r3 * 15             // lands just left of centre
    const midY   = -160 - r1 * 60            // arc apex above the deck
    const endY   = -2 + r2 * 4

    slots.push({
      id: id++,
      startAt: 0.6 + i * 0.18,               // left half starts ~0.6s in
      startX, midX, midY, endX, endY,
      rotStart: -8 + r1 * 6,
      rotMid:   -25 + r2 * 15,
      rotEnd:   -4 + r3 * 6,
      dur: 1.3 + r1 * 0.35,
    })
  }

  // ── RIGHT half ─────────────────────────────────────────────────
  // Emerges from upper-right, slightly delayed so the two halves riffle.
  for (let i = 0; i < cardCount - half; i++) {
    const r1 = ((id * 9301 + 49297) % 233280) / 233280
    const r2 = ((id * 1664525 + 1013904223) >>> 0) / 4294967295
    const r3 = ((id * 22695477 + 1) >>> 0) / 4294967295

    const startX = 110 + r2 * 50              // starts off-screen right
    const midX   = 90 + r1 * 40
    const endX   = 20 + r3 * 15
    const midY   = -160 - r1 * 60
    const endY   = -2 + r2 * 4

    slots.push({
      id: id++,
      startAt: 1.6 + i * 0.18,               // right half starts later → riffle effect
      startX, midX, midY, endX, endY,
      rotStart: 8 - r1 * 6,
      rotMid:   25 - r2 * 15,
      rotEnd:   4 - r3 * 6,
      dur: 1.3 + r1 * 0.35,
    })
  }

  return slots
}

export default function StepShuffle({ onNext, onPlayShuffle }: Props) {
  const [slots, setSlots] = useState<ReturnType<typeof buildTimeline>>([])
  const [active, setActive] = useState<Set<number>>(new Set())
  const [isShuffling, setIsShuffling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    setSlots(buildTimeline(getCardCount()))
  }, [])

  const runShuffle = useCallback(() => {
    if (isShuffling) return
    setIsShuffling(true)
    setDone(false)
    setProgress(0)
    setActive(new Set())
    onPlayShuffle()

    startTimeRef.current = performance.now()
    const totalMs = SHUFFLE_DURATION_S * 1000

    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current
      const p = Math.min(elapsed / totalMs, 1)
      setProgress(p)

      setSlots((prevSlots) => {
        const nextActive = new Set<number>()
        for (const s of prevSlots) {
          const slotEnd = (s.startAt + s.dur) * 1000
          if (elapsed >= (s.startAt - 0.1) * 1000 && elapsed < slotEnd + 250) {
            nextActive.add(s.id)
          }
        }
        setActive(nextActive)
        return prevSlots
      })

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setIsShuffling(false)
        setDone(true)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [isShuffling, onPlayShuffle])

  const reshuffle = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setActive(new Set())
    setDone(false)
    setTimeout(() => runShuffle(), 120)
  }, [runShuffle])

  useEffect(() => {
    if (slots.length === 0) return
    const t = setTimeout(() => runShuffle(), 350)
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots])

  // Auto-advance when the riffle completes — brief pause so the user
  // sees "The deck is ready" before transitioning.
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => onNext(), 1800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-dvh px-4 py-10 z-10"
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
        className="text-center mb-4"
      >
        <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] mb-4 opacity-60">
          ✦ &nbsp; STEP FIVE &nbsp; ✦
        </div>
        <h2 className="font-oracle text-3xl md:text-4xl gold-text mb-2">
          The Shuffle
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg">
          Let your energy flow through the deck
        </p>
      </motion.div>

      {/* Animation area */}
      <div className="relative w-full max-w-md h-[360px] flex items-center justify-center my-2">
        {/* Central deck — same size as the flying cards (coherent scale) */}
        <motion.div
          className="relative"
          style={{ width: CARD_W, height: CARD_H }}
          animate={
            isShuffling
              ? { rotate: [-1.2, 1.2, -1.2] }
              : { rotate: 0 }
          }
          transition={
            isShuffling
              ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.6 }
          }
        >
          {/* The deck is a tight stack of identical-sized cards */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-lg overflow-hidden border border-[rgba(240,192,64,0.22)]"
              style={{
                transform: `translateY(${-i * 1.2}px)`,
                boxShadow: '0 4px 14px rgba(0,0,0,0.55)',
                filter: i === 0 ? 'none' : `brightness(${0.7 - i * 0.06})`,
                zIndex: 8 - i,
              }}
            >
              <Image
                src={backImagePath()}
                alt=""
                width={CARD_W}
                height={CARD_H}
                className="object-cover w-full h-full"
                priority={i < 2}
              />
            </div>
          ))}

          {isShuffling && (
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none"
              animate={{ opacity: [0.25, 0.55, 0.25] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{
                boxShadow:
                  '0 0 60px rgba(240,192,64,0.35), 0 0 120px rgba(240,192,64,0.15)',
              }}
            />
          )}
        </motion.div>

        {/* Flying cards — same size as the deck (110×190) */}
        <AnimatePresence>
          {slots
            .filter((s) => active.has(s.id))
            .map((s) => (
              <motion.div
                key={s.id}
                className="absolute rounded-lg overflow-hidden border border-[rgba(240,192,64,0.35)]"
                style={{
                  pointerEvents: 'none',
                  zIndex: 30,
                  width: CARD_W,
                  height: CARD_H,
                  transformOrigin: 'center center',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.55))',
                }}
                initial={{
                  x: s.startX,
                  y: -120,
                  rotate: s.rotStart,
                  scale: 0.85,
                  opacity: 0,
                }}
                animate={{
                  x: [s.startX, s.midX, s.endX],
                  y: [-120, s.midY, s.endY],
                  rotate: [s.rotStart, s.rotMid, s.rotEnd],
                  scale: [0.85, 1.0, 1.0],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: s.dur,
                  ease: [0.45, 0, 0.55, 1],
                  times: [0, 0.45, 0.85, 1],
                  opacity: { duration: s.dur, times: [0, 0.18, 0.82, 1] },
                }}
              >
                <Image
                  src={backImagePath()}
                  alt=""
                  width={CARD_W}
                  height={CARD_H}
                  className="object-cover w-full h-full"
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-64 max-w-[80vw] mt-2 mb-3">
        <div className="h-px bg-[rgba(240,192,64,0.15)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#8B6914] via-[#F0C040] to-[#FFF5CC]"
            style={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] font-oracle tracking-[0.25em] text-[var(--text-muted)] opacity-50">
          <span>{isShuffling ? 'RIFFLING' : done ? 'COMPLETE' : 'READY'}</span>
          <span>
            {Math.max(0, Math.ceil((SHUFFLE_DURATION_S - progress * SHUFFLE_DURATION_S) * 10) / 10)}s
          </span>
        </div>
      </div>

      {/* Status text */}
      <motion.div
        className="text-center mb-5 h-6"
        key={isShuffling ? 's' : done ? 'd' : 'i'}
      >
        {isShuffling ? (
          <motion.p
            className="text-[var(--text-muted)] italic font-body text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            ✦ Channeling the energies…
          </motion.p>
        ) : done ? (
          <motion.p
            className="gold-text font-oracle text-sm tracking-widest"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            The deck is ready
          </motion.p>
        ) : null}
      </motion.div>

      {/* Only "Shuffle Again" left — auto-advance handles the rest */}
      <motion.div
        className="flex items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: done || isShuffling ? 1 : 0.4 }}
        transition={{ duration: 0.4 }}
      >
        <motion.button
          whileTap={{ scale: 0.94 }}
          className="btn-ghost text-xs touch-manipulation"
          onClick={reshuffle}
          disabled={isShuffling}
          id="reshuffle-btn"
        >
          ↺ &nbsp; Shuffle Again
        </motion.button>
      </motion.div>
    </motion.div>
  )
}