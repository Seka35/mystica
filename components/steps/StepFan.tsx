'use client'
// components/steps/StepFan.tsx — Step 6: Draw Your Cards
// User picks N cards (1, 3 or 5) one at a time. Each picked card FLIES
// along an arc from its fan position to its slot position, with rotation.
// Slot count and label come from the spread config.

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState, useMemo, useRef, useLayoutEffect } from 'react'
import { backImagePath } from '@/lib/tarotData'
import type { TarotCard } from '@/lib/types'
import { getAllCards } from '@/lib/tarotData'
import type { Spread } from '@/lib/spreads'

interface Props {
  spread: Spread
  onDraw: (cards: TarotCard[]) => void
}

const PALETTE = ['#8B6914', '#C8963C', '#F0C040', '#D4A857', '#E8C97A']

// Fisher-Yates with a freshly seeded RNG
function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = seed + 1
  const rng = () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

interface FlightData {
  card: TarotCard
  fromX: number
  fromY: number
  fromW: number
  fromH: number
  fromRot: number
  toX: number
  toY: number
  toW: number
  toH: number
  slotIdx: number
}

// Slot positions for the 5-card cross layout
const CROSS_5 = [
  { top: '0%',     left: '50%', transform: 'translate(-50%, 0)' },        // 5 top
  { top: '50%',    left: '0%',  transform: 'translate(0, -50%)' },        // 2 left
  { top: '50%',    left: '50%', transform: 'translate(-50%, -50%)' },     // 1 center
  { top: '50%',    left: '100%',transform: 'translate(-100%, -50%)' },   // 4 right
  { top: '100%',   left: '50%', transform: 'translate(-50%, -100%)' },    // 3 bottom
]

export default function StepFan({ spread, onDraw }: Props) {
  const [picked, setPicked] = useState<TarotCard[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flight, setFlight] = useState<FlightData | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fanRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  // Mobile: fewer, larger cards so each one is easy to tap and read.
  // Desktop: full spread for that "many cards" feel.
  const VISIBLE = spread.cardCount === 1 ? 18 : isMobile ? 16 : 32
  const CARD_W  = isMobile ? 84 : 96
  const CARD_H  = isMobile ? 144 : 162
  const ARC     = spread.cardCount === 1 ? 100 : 130
  const FAN_W   = isMobile ? 360 : 720
  const FAN_H   = isMobile ? 240 : 290

  const cards: TarotCard[] = useMemo(() => {
    const seed = Math.floor(Date.now() % 1000000)
    return seededShuffle(getAllCards(), seed).slice(0, VISIBLE)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const layout = useMemo(() => {
    return cards.map((card, i) => {
      const t = i / (VISIBLE - 1)
      const angle = -ARC / 2 + t * ARC
      return { card, displayIdx: i, angle, baseX: t * 100, z: i }
    })
  }, [cards, VISIBLE, ARC])

  const pickedIds = new Set(picked.map((c) => c.id))
  const isComplete = picked.length === spread.cardCount
  const remaining = spread.cardCount - picked.length

  function launchFlight(card: TarotCard, fanEl: HTMLButtonElement, slotIdx: number) {
    const slotEl = slotRefs.current[slotIdx]
    if (!slotEl) return
    const fanRect  = fanEl.getBoundingClientRect()
    const slotRect = slotEl.getBoundingClientRect()
    const fanIdx   = layout.findIndex((l) => l.card.id === card.id)

    setFlight({
      card,
      fromX: fanRect.left,
      fromY: fanRect.top,
      fromW: fanRect.width,
      fromH: fanRect.height,
      fromRot: fanIdx >= 0 ? layout[fanIdx].angle : 0,
      toX: slotRect.left,
      toY: slotRect.top,
      toW: slotRect.width,
      toH: slotRect.height,
      slotIdx,
    })
  }

  function handlePick(card: TarotCard) {
    if (isComplete) return
    if (pickedIds.has(card.id)) return
    if (flight) return
    const fanEl = fanRefs.current[card.id]
    const slotIdx = picked.length
    if (!fanEl) return
    launchFlight(card, fanEl, slotIdx)
  }

  function onFlightComplete() {
    if (!flight) return
    const arrived = flight.card
    const arrivedSlot = flight.slotIdx
    setFlight(null)
    setPicked((prev) => {
      if (prev.length >= arrivedSlot + 1) return prev
      const next = [...prev]
      next[arrivedSlot] = arrived
      return next
    })

    if (arrivedSlot === spread.cardCount - 1) {
      // Final card placed — start 3-2-1 countdown
      let r = 3
      setCountdown(r)
      const tick = () => {
        r -= 1
        if (r > 0) {
          setCountdown(r)
          advanceTimerRef.current = setTimeout(tick, 700)
        } else {
          setCountdown(null)
        }
      }
      advanceTimerRef.current = setTimeout(tick, 700)
    }
  }

  useLayoutEffect(() => {
    if (countdown === null && picked.length === spread.cardCount) {
      const t = setTimeout(() => onDraw(picked), 60)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, picked])

  const helperText = (() => {
    if (isComplete) return '✦ Your fate is sealed'
    if (spread.cardCount === 1) return '← Hover over the spread and choose the one that calls to you →'
    if (remaining === spread.cardCount) return `← Choose ${spread.cardCount} cards from the spread →`
    if (remaining === 1) return `← One more card, the final truth →`
    return `← Choose ${remaining} more cards from the spread →`
  })()

  // Show title like "Choose X cards" hint
  const headerHint = (() => {
    if (isComplete) return 'The cards have accepted your offering'
    if (spread.cardCount === 1) return 'Choose your card'
    return `Choose ${remaining} more card${remaining === 1 ? '' : 's'}`
  })()

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-dvh px-4 py-4 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-3"
      >
        <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] mb-2 opacity-60">
          ✦ &nbsp; STEP FIVE &nbsp; ✦
        </div>
        <h2 className="font-oracle text-2xl md:text-4xl gold-text mb-1">
          Draw Your Cards
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-sm md:text-base">
          {headerHint}
        </p>
      </motion.div>

      {/* ── SLOTS (top) ─────────────────────────────────────────── */}
      <SlotsArea
        cardCount={spread.cardCount}
        positions={spread.positions}
        picked={picked}
        countdown={countdown}
        slotRefs={slotRefs}
        isMobile={isMobile}
      />

      {/* ── FAN (bottom) ────────────────────────────────────────── */}
      <div
        className="relative mx-auto"
        style={{ width: FAN_W, height: FAN_H }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
          style={{
            bottom: -16,
            width: FAN_W * 0.7,
            height: 50,
            background:
              'radial-gradient(ellipse, rgba(240,192,64,0.22), transparent 70%)',
            filter: 'blur(22px)',
          }}
          aria-hidden
        />

        {layout.map(({ card, displayIdx, angle, baseX, z }) => {
          const isHovered = hoveredId === card.id && !isComplete && !flight
          const isPicked  = pickedIds.has(card.id)
          const isFlying  = flight?.card.id === card.id
          if (isPicked || isFlying) return null

          const wave =
            Math.sin((displayIdx / VISIBLE) * Math.PI * 2 + performance.now() / 1100) * 3
          const lift  = isHovered ? -CARD_H * 0.45 : wave
          const scale = isHovered ? 1.08 : 1

          return (
            <motion.button
              key={card.id}
              ref={(el) => { fanRefs.current[card.id] = el }}
              type="button"
              className="absolute touch-manipulation"
              style={{
                left: `${baseX}%`,
                bottom: 0,
                transform: 'translateX(-50%)',
                width: CARD_W,
                height: CARD_H,
                transformOrigin: 'bottom center',
                zIndex: isHovered ? 100 : z,
                padding: 0,
                background: 'transparent',
                border: 'none',
                cursor: isComplete || flight ? 'default' : 'pointer',
              }}
              animate={{ y: lift, scale, opacity: flight && !isFlying ? 0.85 : 1 }}
              whileTap={{ scale: 0.92, y: lift - 8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22, mass: 0.7 }}
              onMouseEnter={() => !isComplete && !flight && setHoveredId(card.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => !isComplete && !flight && setHoveredId(card.id)}
              onBlur={() => setHoveredId(null)}
              onTouchStart={() => !isComplete && !flight && setHoveredId(card.id)}
              onClick={() => handlePick(card)}
              aria-label={`Pick card ${displayIdx + 1} for ${spread.positions[picked.length]?.name ?? ''}`}
              id={`fan-card-${displayIdx}`}
            >
              <motion.div
                className="w-full h-full rounded-md overflow-hidden"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: 'bottom center',
                  boxShadow: isHovered
                    ? '0 0 20px rgba(240,192,64,0.7), 0 6px 20px rgba(0,0,0,0.6)'
                    : '0 3px 10px rgba(0,0,0,0.55)',
                  border: '1px solid rgba(240,192,64,0.22)',
                }}
                animate={{ filter: isHovered ? 'brightness(1.2)' : 'brightness(0.85)' }}
                transition={{ duration: 0.25 }}
              >
                <Image
                  src={backImagePath()}
                  alt="Tarot card"
                  width={CARD_W}
                  height={CARD_H}
                  className="object-cover w-full h-full"
                  priority={displayIdx === 0 || displayIdx === VISIBLE - 1}
                  draggable={false}
                />
              </motion.div>

              {isHovered && (
                <motion.div
                  className="absolute inset-0 rounded-md pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background:
                      'linear-gradient(135deg, transparent 40%, rgba(255,245,204,0.3) 50%, transparent 60%)',
                  }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Helper text */}
      <motion.p
        className="text-[var(--text-muted)] italic font-body text-xs md:text-sm mt-3 text-center"
        animate={{ opacity: isComplete ? 1 : [0.5, 0.85, 0.5] }}
        transition={{ duration: 2, repeat: isComplete ? 0 : Infinity }}
      >
        {helperText}
      </motion.p>

      {/* FLYING CARD OVERLAY */}
      <AnimatePresence>
        {flight && (
          <motion.div
            key={`fly-${flight.card.id}-${flight.slotIdx}`}
            className="fixed pointer-events-none"
            style={{ zIndex: 1000, willChange: 'transform, width, height, left, top' }}
            initial={{
              left: flight.fromX, top: flight.fromY,
              width: flight.fromW, height: flight.fromH,
              rotate: flight.fromRot, opacity: 0,
            }}
            animate={{
              left: flight.toX, top: flight.toY,
              width: flight.toW, height: flight.toH,
              rotate: 0, opacity: 1,
              y: [0, -90, -30, 0],
            }}
            transition={{
              left:    { duration: 0.95, ease: [0.5, 0, 0.5, 1] },
              top:     { duration: 0.95, ease: [0.5, 0, 0.5, 1] },
              width:   { duration: 0.95, ease: 'easeInOut' },
              height:  { duration: 0.95, ease: 'easeInOut' },
              rotate:  { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.4, times: [0, 0.15, 1] },
              y:       { duration: 0.95, ease: [0.4, 0, 0.6, 1] },
            }}
            onAnimationComplete={onFlightComplete}
          >
            <div
              className="w-full h-full rounded-md overflow-hidden"
              style={{
                boxShadow:
                  '0 0 30px rgba(240,192,64,0.85), 0 0 60px rgba(240,192,64,0.5), 0 10px 30px rgba(0,0,0,0.7)',
                border: '1px solid rgba(240,192,64,0.6)',
              }}
            >
              <Image
                src={backImagePath()}
                alt="Flying card"
                width={flight.toW}
                height={flight.toH}
                className="object-cover w-full h-full"
                draggable={false}
              />
              <motion.div
                className="absolute inset-0 rounded-md pointer-events-none"
                animate={{ opacity: [0.5, 0.2, 0] }}
                transition={{ duration: 0.95, times: [0, 0.5, 1] }}
                style={{ background: 'radial-gradient(circle, rgba(240,192,64,0.35), transparent 70%)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Slot rendering for 1, 3, or 5 cards
// ─────────────────────────────────────────────────────────────────────

interface SlotsAreaProps {
  cardCount: 1 | 3 | 5
  positions: Spread['positions']
  picked: TarotCard[]
  countdown: number | null
  slotRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>
  isMobile: boolean
}

function SlotsArea({ cardCount, positions, picked, countdown, slotRefs, isMobile }: SlotsAreaProps) {
  if (cardCount === 1) {
    return (
      <div className="flex justify-center mb-4 h-[180px]">
        <Slot index={0} slotPos={positions[0]} card={picked[0]}
               color={PALETTE[0]} countdown={countdown}
               registerRef={(el) => { slotRefs.current[0] = el }}
               size={isMobile ? 64 : 96} dim={isMobile ? 110 : 162} />
      </div>
    )
  }

  if (cardCount === 3) {
    return (
      <div className="flex justify-center items-end gap-4 md:gap-8 mb-4 h-[180px]">
        {positions.map((pos, i) => (
          <Slot key={i} index={i} slotPos={pos} card={picked[i]}
                color={PALETTE[i]} countdown={countdown}
                registerRef={(el) => { slotRefs.current[i] = el }}
                size={isMobile ? 64 : 96} dim={isMobile ? 110 : 162} />
        ))}
      </div>
    )
  }

  // 5-card cross — absolute positioning in a fixed square
  const areaSize = isMobile ? 320 : 360
  const slotSize = isMobile ? 50 : 72
  const slotDim  = isMobile ? 86 : 124

  if (isMobile) {
    // Mobile: vertical column in order 3, 1, 2, 4, 5
    const order = [2, 0, 1, 3, 4]
    return (
      <div className="flex justify-center mb-4 overflow-x-auto">
        <div className="flex flex-col gap-3">
          {order.map((idx) => (
            <Slot key={idx} index={idx} slotPos={positions[idx]}
                  card={picked[idx]} color={PALETTE[idx]}
                  countdown={countdown}
                  registerRef={(el) => { slotRefs.current[idx] = el }}
                  size={slotSize} dim={slotDim} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative mx-auto mb-4"
      style={{ width: areaSize, height: areaSize }}
    >
      {CROSS_5.map((cs, idx) => (
        <div
          key={idx}
          className="absolute touch-manipulation"
          style={{ top: cs.top, left: cs.left, transform: cs.transform }}
        >
          <Slot index={idx} slotPos={positions[idx]} card={picked[idx]}
                color={PALETTE[idx]} countdown={countdown}
                registerRef={(el) => { slotRefs.current[idx] = el }}
                size={slotSize} dim={slotDim} />
        </div>
      ))}
    </div>
  )
}

function Slot({
  index,
  slotPos,
  card,
  color,
  countdown,
  registerRef,
  size,
  dim,
}: {
  index: number
  slotPos: Spread['positions'][number]
  card: TarotCard | undefined
  color: string
  countdown: number | null
  registerRef: (el: HTMLDivElement | null) => void
  size: number
  dim: number
}) {
  const filled = !!card

  return (
    <div className="flex flex-col items-center gap-1.5"
         style={{ width: size + 16 }}>
      <div className="font-oracle text-xs md:text-sm tracking-[0.2em] font-bold"
           style={{ color }}>
        {romanFor(index)}
      </div>

      <motion.div
        ref={registerRef}
        className="relative rounded-md overflow-hidden"
        style={{
          width: size,
          height: dim,
          border: filled
            ? `1px solid ${color}60`
            : '1px dashed rgba(240,192,64,0.28)',
          background: 'rgba(8,0,16,0.5)',
        }}
        animate={
          !filled
            ? { boxShadow: ['0 0 0px rgba(240,192,64,0)', '0 0 22px rgba(240,192,64,0.35)', '0 0 0px rgba(240,192,64,0)'] }
            : { boxShadow: '0 0 0px rgba(0,0,0,0)' }
        }
        transition={!filled ? { duration: 1.8, repeat: Infinity } : { duration: 0.4 }}
      >
        <AnimatePresence mode="wait">
          {filled ? (
            <motion.div
              key={`filled-${card.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
            >
              <Image
                src={backImagePath()}
                alt="Drawn card"
                width={size}
                height={dim}
                className="object-cover w-full h-full"
                style={{ filter: `brightness(1.05) drop-shadow(0 0 10px ${color})` }}
              />
              {countdown !== null && index === 4 && (
                <motion.div
                  key={countdown}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/55"
                >
                  <span className="font-oracle text-3xl md:text-4xl gold-text">{countdown}</span>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="ph"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="font-oracle text-2xl md:text-3xl" style={{ color, opacity: 0.3 }}>?</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div
        className="font-oracle text-[9px] md:text-[10px] tracking-widest text-center"
        style={{ color, opacity: filled ? 0.95 : 0.55, maxWidth: size + 24 }}
      >
        {slotPos.name.toUpperCase()}
      </div>
    </div>
  )
}

function romanFor(i: number): string {
  return ['', 'I', 'II', 'III', 'IV', 'V'][i] || String(i)
}