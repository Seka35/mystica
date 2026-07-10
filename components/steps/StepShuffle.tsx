'use client'
// components/steps/StepShuffle.tsx — Step 4: Deck shuffling animation
// Animation duration is hard-synced to shuffle.mp3 (~5.69s).
// FOUR overlapping waves with longer, more organic trajectories —
// cards tumble through arcs instead of jumping point-to-point.

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

// Mobile keeps it lighter
const getCardCount = () =>
  typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 14

// Three languid overlapping waves for an unhurried riffle feel
const WAVES = 3

// Build the timeline for all cards across all waves
function buildTimeline(cardCount: number) {
  const slots: Array<{
    id: number
    startAt: number        // seconds into shuffle when this card launches
    midX: number           // arc apex X
    midY: number           // arc apex Y (negative = up)
    endX: number           // landing X (small drift)
    endY: number           // landing Y
    rotStart: number       // initial rotation
    rotMid: number         // mid-flight rotation
    rotEnd: number         // landing rotation
    dur: number            // trajectory duration (s)
    scale: number          // mid-flight scale (depth illusion)
  }> = []

  let id = 0
  for (let w = 0; w < WAVES; w++) {
    // Each wave's center start time, with heavy overlap
    const waveCenter = (w + 0.5) * (SHUFFLE_DURATION_S / WAVES)
    const spreadStart = SHUFFLE_DURATION_S / WAVES * 0.7  // last 30% overlaps next wave

    for (let i = 0; i < cardCount; i++) {
      // Pseudo-random but deterministic per slot
      const r1 = ((id * 9301 + 49297) % 233280) / 233280
      const r2 = ((id * 1664525 + 1013904223) >>> 0) / 4294967295
      const r3 = ((id * 22695477 + 1) >>> 0) / 4294967295
      const r4 = ((id * 134775813 + 1) >>> 0) / 4294967295

      const sideSign = w % 2 === 0 ? 1 : -1            // alternate sides per wave
      const launchAngle = (r1 - 0.5) * 75              // -37°..+37° — gentler launch
      const arcRadius = 170 + r2 * 120                 // 170..290 — smaller arcs = slower
      const rad = (launchAngle * Math.PI) / 180

      // Cards "riffle" — most go up & out, some swing low
      const arcHeight = 0.55 + r3 * 0.35                // 0.55..0.9 of radius

      slots.push({
        id: id++,
        // Stagger within wave, slightly random
        startAt: waveCenter + (i / cardCount - 0.5) * spreadStart,
        midX: Math.sin(rad) * arcRadius * sideSign,
        midY: -Math.cos(rad) * arcRadius * arcHeight - 20,
        endX: (r4 - 0.5) * 30 * sideSign,
        endY: (r1 - 0.5) * 12,
        rotStart: (r2 - 0.5) * 30,
        rotMid: (r1 - 0.5) * 220 * sideSign,           // calmer rotation (was 360)
        rotEnd: (r2 - 0.5) * 50 * sideSign,
        dur: 1.6 + r1 * 0.6,                          // 1.6..2.2s per card — much slower
        scale: 1.04 + r3 * 0.12,                      // 1.04..1.16 mid-flight depth
      })
    }
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

      // Use functional setState to compute active slots without stale closure
      setSlots((prevSlots) => {
        const nextActive = new Set<number>()
        for (const s of prevSlots) {
          const slotEnd = (s.startAt + s.dur) * 1000
          // Visible from a bit before launch to a bit after landing
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

  // Wave index for progress text — 1..4
  const currentWave = Math.min(WAVES, Math.floor(progress * WAVES) + 1)

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
          ✦ &nbsp; STEP FOUR &nbsp; ✦
        </div>
        <h2 className="font-oracle text-3xl md:text-4xl gold-text mb-2">
          The Shuffle
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg">
          Let your energy flow through the deck
        </p>
      </motion.div>

      {/* Animation area */}
      <div className="relative w-full max-w-md h-[340px] flex items-center justify-center my-2">
        {/* Center deck — slow sway when shuffling, breathing when idle */}
        <motion.div
          className="relative w-[130px] h-[225px]"
          animate={
            isShuffling
              ? { rotate: [-2, 2, -2], x: [-3, 3, -3] }
              : { rotate: 0, x: 0 }
          }
          transition={
            isShuffling
              ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.6 }
          }
        >
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-lg overflow-hidden border border-[rgba(240,192,64,0.18)]"
              style={{
                transform: `rotate(${(i - 3) * 1.2}deg) translateY(${i * 1}px)`,
                boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
                filter: `brightness(${0.45 + i * 0.08})`,
              }}
            >
              <Image
                src={backImagePath()}
                alt=""
                width={130}
                height={225}
                className="object-cover w-full h-full"
                priority={i >= 5}
              />
            </div>
          ))}

          {isShuffling && (
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{
                boxShadow:
                  '0 0 70px rgba(240,192,64,0.35), 0 0 140px rgba(240,192,64,0.15)',
              }}
            />
          )}
        </motion.div>

        {/* Flying cards — driven by our timeline */}
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
                  width: 95,
                  height: 165,
                  transformOrigin: 'center center',
                  // Drop shadow only — image gets full opacity
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.55))',
                }}
                initial={{
                  x: 0,
                  y: 0,
                  rotate: s.rotStart,
                  scale: 0.9,
                  opacity: 0,
                }}
                animate={{
                  x: [0, s.midX, s.endX],
                  y: [0, s.midY, s.endY],
                  rotate: [s.rotStart, s.rotMid, s.rotEnd],
                  scale: [0.9, s.scale, 1.0],
                  opacity: [0, 1, 0.95, 0],
                }}
                transition={{
                  duration: s.dur,
                  ease: [0.45, 0, 0.55, 1],   // smooth in-out, more organic
                  times: [0, 0.45, 0.85, 1],
                  opacity: { duration: s.dur, times: [0, 0.15, 0.85, 1] },
                }}
              >
                <Image
                  src={backImagePath()}
                  alt=""
                  width={95}
                  height={165}
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
          <span>{isShuffling ? `RIFFLE ${currentWave}/${WAVES}` : done ? 'COMPLETE' : 'READY'}</span>
          <span>{Math.max(0, Math.ceil((SHUFFLE_DURATION_S - progress * SHUFFLE_DURATION_S) * 10) / 10)}s</span>
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

      {/* Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: done || isShuffling ? 1 : 0.4 }}
        transition={{ duration: 0.4 }}
      >
        <button
          className="btn-ghost text-xs"
          onClick={reshuffle}
          disabled={isShuffling}
          id="reshuffle-btn"
        >
          ↺ &nbsp; Shuffle Again
        </button>
        <button
          className="btn-oracle"
          onClick={onNext}
          disabled={!done}
          style={{ opacity: done ? 1 : 0.3, cursor: done ? 'pointer' : 'not-allowed' }}
          id="shuffle-continue-btn"
        >
          Sort Your Cards →
        </button>
      </motion.div>
    </motion.div>
  )
}