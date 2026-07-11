'use client'
// components/steps/StepInterpretation.tsx — Step 8: Streaming AI interpretation
// Splits the streamed text into paragraphs and pairs each one with the
// relevant card. The layout adapts to the chosen spread (1, 3 or 5 cards).

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useMemo } from 'react'
import type { DrawnCard, Theme } from '@/lib/types'
import { THEME_CONFIG } from '@/lib/types'
import { cardImagePath } from '@/lib/tarotData'
import { localizedCardName } from '@/lib/textUtils'
import type { Spread } from '@/lib/spreads'

interface Props {
  spread: Spread
  drawnCards: DrawnCard[]
  interpretation: string
  isStreaming: boolean
  theme: Theme
  question: string
  onNewReading: () => void
}

const PALETTE = ['#8B6914', '#C8963C', '#F0C040', '#D4A857', '#E8C97A']

// Decide what each paragraph "represents":
//   0               → opening connection (no card)
//   1..cardCount    → corresponding spread position card
//   last            → synthesis + guidance (fan of all cards)
type ParagraphLayout =
  | { kind: 'intro' }
  | { kind: 'single'; cardIdx: number }
  | { kind: 'fan' }

function layoutFor(idx: number, total: number, cardCount: number): ParagraphLayout {
  if (idx === 0) return { kind: 'intro' }
  if (idx === total - 1) return { kind: 'fan' }
  if (idx >= 1 && idx <= cardCount) return { kind: 'single', cardIdx: idx - 1 }
  return { kind: 'fan' }
}

export default function StepInterpretation({
  spread,
  drawnCards,
  interpretation,
  isStreaming,
  theme,
  question,
  onNewReading,
}: Props) {
  const themeConfig = THEME_CONFIG[theme]
  const cardCount = spread.cardCount

  const paragraphs = useMemo(() => {
    if (!interpretation) return [] as string[]
    return interpretation
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
  }, [interpretation])

  return (
    <motion.div
      className="relative min-h-dvh z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 interpretation-panel px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-oracle text-xs tracking-[0.3em] opacity-50 text-[var(--text-muted)] mb-1">
              YOUR READING · {spread.name.toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: themeConfig.accent }} />
              <span className="font-oracle text-xs" style={{ color: themeConfig.accent }}>
                {themeConfig.label}
              </span>
            </div>
          </div>
          <button className="btn-ghost text-xs" onClick={onNewReading} id="new-reading-btn">
            ✦ New Reading
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Question recap */}
        <motion.div
          className="mb-8 p-5 border border-[rgba(240,192,64,0.1)] bg-[rgba(26,10,46,0.4)] italic font-body text-[var(--text-muted)] text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          &ldquo;{question}&rdquo;
        </motion.div>

        {/* Mini cards header — layout adapts to spread */}
        <MiniCardHeader drawnCards={drawnCards} positions={spread.positions} />

        {/* Gold divider */}
        <div className="gold-divider mb-8 font-oracle text-xs">✦ The Oracle Speaks ✦</div>

        {/* Streaming interpretation */}
        {!interpretation ? (
          <motion.div
            className="oracle-text flex items-center gap-3 text-[var(--text-muted)] italic animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span>✦</span>
            <span>The oracle is consulting the cards…</span>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {paragraphs.map((para, idx) => {
              const layout = layoutFor(idx, paragraphs.length, cardCount)
              const isLast = idx === paragraphs.length - 1

              if (layout.kind === 'intro') {
                return (
                  <motion.p
                    key={idx}
                    className="oracle-text italic text-[var(--text-muted)]"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                  >
                    {para}
                  </motion.p>
                )
              }

              if (layout.kind === 'single') {
                const drawn = drawnCards[layout.cardIdx]
                if (!drawn) return null
                const color = PALETTE[layout.cardIdx] || PALETTE[0]
                return (
                  <SingleCardParagraph
                    key={idx}
                    drawn={drawn}
                    color={color}
                    text={para}
                    showCursor={isLast && isStreaming}
                    question={question}
                  />
                )
              }

              // layout.kind === 'fan'
              return (
                <FanParagraph
                  key={idx}
                  drawnCards={drawnCards}
                  text={para}
                  showCursor={isLast && isStreaming}
                  question={question}
                />
              )
            })}
          </div>
        )}

        {/* Done state */}
        {!isStreaming && interpretation && (
          <motion.div
            className="mt-12 pt-8 border-t border-[rgba(240,192,64,0.1)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] opacity-50">
                ☽ &nbsp; ✦ &nbsp; ☾
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                className="btn-oracle"
                onClick={onNewReading}
                id="new-reading-end-btn"
              >
                ✦ &nbsp; New Reading
              </button>
            </div>

            {/* Share Buttons */}
            <div className="mt-10 flex flex-col items-center">
              <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.2em] mb-4 opacity-60">
                SHARE YOUR DESTINY
              </div>
              <div className="flex flex-wrap gap-3 justify-center max-w-sm">
                <button 
                  onClick={() => window.open('https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank')}
                  className="btn-ghost !px-4 !py-2 !rounded-full text-xs" 
                  aria-label="Share on Facebook"
                >
                  Facebook
                </button>
                <button 
                  onClick={() => window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent('I just consulted the Oracle... Discover your destiny too! ✦') + '&url=' + encodeURIComponent(window.location.href), '_blank')}
                  className="btn-ghost !px-4 !py-2 !rounded-full text-xs" 
                  aria-label="Share on Twitter"
                >
                  Twitter
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied! You can now share it on Instagram.');
                  }}
                  className="btn-ghost !px-4 !py-2 !rounded-full text-xs" 
                  aria-label="Share on Instagram"
                >
                  Instagram
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied! You can now share it on TikTok.');
                  }}
                  className="btn-ghost !px-4 !py-2 !rounded-full text-xs" 
                  aria-label="Share on TikTok"
                >
                  TikTok
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ── Mini-card row in the header — adaptive ──────────────────────────
function MiniCardHeader({ drawnCards, positions }: {
  drawnCards: DrawnCard[]
  positions: Spread['positions']
}) {
  const n = drawnCards.length
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  // Sizes adapt to count so the row stays compact for 5
  const cardW = n >= 5 ? (isMobile ? 48 : 60) : isMobile ? 60 : 75
  const cardH = n >= 5 ? (isMobile ? 82 : 102) : isMobile ? 102 : 128

  return (
    <motion.div
      className="flex justify-center flex-wrap gap-3 mb-10"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      {drawnCards.map((d, i) => {
        const color = PALETTE[i] || PALETTE[0]
        return (
          <div key={d.position} className="flex flex-col items-center gap-1.5">
            <div className="relative rounded overflow-hidden"
              style={{
                width: cardW,
                height: cardH,
                boxShadow: `0 0 15px ${color}40`,
              }}
            >
              <Image
                src={cardImagePath(d.card.image)}
                alt={localizedCardName(d.card, '')}
                fill
                className="object-cover"
                sizes={`${cardW}px`}
              />
            </div>
            <div className="font-oracle text-[9px] tracking-widest"
                 style={{ color }}>
              {(positions[i]?.name ?? d.position).toUpperCase()}
            </div>
            <div className="text-[var(--text-muted)] text-xs font-body opacity-60 text-center leading-tight"
                 style={{ maxWidth: cardW + 12 }}>
              {localizedCardName(d.card, '')}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

// ── Paragraph with single card on the side ──────────────────────────
function SingleCardParagraph({ drawn, color, text, showCursor, question }: {
  drawn: DrawnCard; color: string; text: string; showCursor: boolean;
  question: string;
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const cardW = isMobile ? 65 : 95
  const cardH = isMobile ? 110 : 160
  return (
    <motion.div
      className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex md:flex-col items-center gap-2 md:gap-1.5 md:w-[115px] md:shrink-0">
        <div className="relative rounded-md overflow-hidden"
          style={{
            width: cardW, height: cardH,
            boxShadow: `0 0 18px ${color}50, 0 6px 20px rgba(0,0,0,0.6)`,
            border: `1px solid ${color}50`,
          }}
        >
          <Image
            src={cardImagePath(drawn.card.image)}
            alt={localizedCardName(drawn.card, question)}
            fill
            className="object-cover"
            sizes={`${cardW}px`}
          />
        </div>
        <div className="md:text-center">
          <div className="font-oracle text-[10px] tracking-widest font-bold" style={{ color }}>
            {drawn.position.toUpperCase()}
          </div>
          <div className="text-[var(--text-muted)] text-xs italic opacity-70 leading-tight"
               style={{ maxWidth: cardW + 20 }}>
            {localizedCardName(drawn.card, question)}
          </div>
        </div>
      </div>

      <p className="oracle-text flex-1">
        {text}
        {showCursor && <span className="cursor-blink" aria-hidden="true" />}
      </p>
    </motion.div>
  )
}

// ── Final paragraph with fan of all cards ───────────────────────────
function FanParagraph({ drawnCards, text, showCursor, question }: {
  drawnCards: DrawnCard[]; text: string; showCursor: boolean; question: string;
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const n = drawnCards.length
  const cardW = n >= 5 ? (isMobile ? 50 : 70) : isMobile ? 58 : 85
  const cardH = n >= 5 ? (isMobile ? 85 : 120) : isMobile ? 100 : 145
  const arcPx = n >= 5 ? 90 : 280
  const arcDeg = n >= 5 ? 8 : 12
  const fanH = cardH + 30

  return (
    <motion.div
      className="flex flex-col items-center gap-6 pt-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* Fan of all cards */}
      <div className="relative flex items-end justify-center"
           style={{ width: arcPx, height: fanH }}>
        {drawnCards.map((d, i) => {
          const offset = (i - (n - 1) / 2)
          const angle = offset * arcDeg
          const color = PALETTE[i] || PALETTE[0]
          return (
            <motion.div
              key={d.position}
              className="absolute"
              style={{
                left: `${50 + (offset * (100 / Math.max(n - 1, 1)))}%`,
                bottom: 0,
                transform: `translateX(-50%) rotate(${angle}deg)`,
                transformOrigin: 'bottom center',
                width: cardW,
                height: cardH,
              }}
              initial={{ opacity: 0, y: 20, rotate: angle - 30 }}
              animate={{ opacity: 1, y: 0, rotate: angle }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }}
            >
              <div className="relative w-full h-full rounded-md overflow-hidden"
                style={{
                  boxShadow: `0 0 14px ${color}60, 0 6px 18px rgba(0,0,0,0.7)`,
                  border: `1px solid ${color}60`,
                }}
              >
                <Image
                  src={cardImagePath(d.card.image)}
                  alt={localizedCardName(d.card, question)}
                  fill
                  className="object-cover"
                  sizes={`${cardW}px`}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Synthesis text */}
      <p className="oracle-text text-center italic"
        style={{
          borderTop: '1px solid rgba(240,192,64,0.18)',
          paddingTop: '1.5rem',
          maxWidth: '60ch',
        }}
      >
        {text}
        {showCursor && <span className="cursor-blink" aria-hidden="true" />}
      </p>
    </motion.div>
  )
}