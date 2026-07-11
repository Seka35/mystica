'use client'
// components/steps/StepProfile.tsx — Step 5: About You (optional profile) / Zodiac for Horoscope

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { Theme } from '@/lib/types'
import { THEME_CONFIG } from '@/lib/types'

export type Gender = 'woman' | 'man' | 'non-binary' | 'not-specified'

interface Props {
  theme: Theme
  gender: Gender | null
  zodiacSign: string | null
  onChangeGender: (g: Gender | null) => void
  onChangeZodiac: (z: string | null) => void
  onNext: () => void
  onBack: () => void
}

const GENDERS: Array<{ value: Gender; label: string; symbol: string }> = [
  { value: 'woman',        label: 'Woman',         symbol: '♀' },
  { value: 'man',          label: 'Man',           symbol: '♂' },
  { value: 'non-binary',   label: 'Non-binary',    symbol: '⚥' },
  { value: 'not-specified', label: 'Rather not say', symbol: '·' },
]

const ZODIACS = [
  { value: 'aries', label: 'Aries', symbol: '♈' },
  { value: 'taurus', label: 'Taurus', symbol: '♉' },
  { value: 'gemini', label: 'Gemini', symbol: '♊' },
  { value: 'cancer', label: 'Cancer', symbol: '♋' },
  { value: 'leo', label: 'Leo', symbol: '♌' },
  { value: 'virgo', label: 'Virgo', symbol: '♍' },
  { value: 'libra', label: 'Libra', symbol: '♎' },
  { value: 'scorpio', label: 'Scorpio', symbol: '♏' },
  { value: 'sagittarius', label: 'Sagittarius', symbol: '♐' },
  { value: 'capricorn', label: 'Capricorn', symbol: '♑' },
  { value: 'aquarius', label: 'Aquarius', symbol: '♒' },
  { value: 'pisces', label: 'Pisces', symbol: '♓' },
]

const ADVANCE_DELAY_MS = 900

export default function StepProfile({
  theme,
  gender,
  zodiacSign,
  onChangeGender,
  onChangeZodiac,
  onNext,
  onBack,
}: Props) {
  const accent = THEME_CONFIG[theme].accent
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleAdvance = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = setTimeout(() => {
      onNext()
    }, ADVANCE_DELAY_MS)
  }

  function pickGender(g: Gender) {
    const newVal = gender === g ? null : g
    onChangeGender(newVal)
    if (newVal) scheduleAdvance()
  }

  function pickZodiac(z: string) {
    const newVal = zodiacSign === z ? null : z
    onChangeZodiac(newVal)
    if (newVal) scheduleAdvance()
  }

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    }
  }, [])

  const isHoroscope = theme === 'horoscope'

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
        className="text-center mb-8"
      >
        <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] mb-4 opacity-60">
          ✦ &nbsp; {isHoroscope ? 'YOUR SIGN' : 'STEP FOUR'} &nbsp; ✦
        </div>
        <h2 className="font-oracle text-3xl md:text-4xl gold-text mb-2">
          {isHoroscope ? 'Your Zodiac Sign' : 'About You'}
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg max-w-md">
          {isHoroscope 
            ? 'Select your sign to draw your daily prediction.' 
            : 'A small detail helps the Oracle address you in your own voice.'}
        </p>
      </motion.div>

      {/* Grid Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="w-full max-w-lg mb-8"
      >
        <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.3em] mb-3 text-center opacity-80">
          {isHoroscope ? 'CHOOSE YOUR SIGN' : 'HOW DO YOU IDENTIFY'}
        </div>
        <div className={`grid gap-3 ${isHoroscope ? 'grid-cols-3 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
          {isHoroscope ? (
            ZODIACS.map((z) => {
              const selected = zodiacSign === z.value
              return (
                <motion.button
                  key={z.value}
                  type="button"
                  className="oracle-input flex flex-col items-center justify-center !min-h-0 py-3 px-1 cursor-pointer touch-manipulation"
                  style={{
                    borderColor: selected ? accent : 'rgba(240,192,64,0.18)',
                    background: selected ? `${THEME_CONFIG[theme].color}30` : 'rgba(8,0,16,0.5)',
                    boxShadow: selected ? `0 0 20px ${accent}40` : 'none',
                    color: selected ? accent : 'var(--text-primary)',
                    fontFamily: "'Cinzel Decorative', serif",
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                  }}
                  whileHover={!selected ? { borderColor: `${accent}80` } : undefined}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => pickZodiac(z.value)}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                >
                  <div className="text-2xl mb-1" style={{ color: selected ? accent : 'var(--text-muted)' }}>
                    {z.symbol}
                  </div>
                  <div>{z.label}</div>
                </motion.button>
              )
            })
          ) : (
            GENDERS.map((g) => {
              const selected = gender === g.value
              return (
                <motion.button
                  key={g.value}
                  type="button"
                  className="oracle-input text-center !min-h-0 py-3 px-2 cursor-pointer touch-manipulation"
                  style={{
                    borderColor: selected ? accent : 'rgba(240,192,64,0.18)',
                    background: selected ? `${THEME_CONFIG[theme].color}30` : 'rgba(8,0,16,0.5)',
                    boxShadow: selected ? `0 0 20px ${accent}40` : 'none',
                    color: selected ? accent : 'var(--text-primary)',
                    fontFamily: "'Cinzel Decorative', serif",
                    fontSize: '0.7rem',
                    letterSpacing: '0.18em',
                  }}
                  whileHover={!selected ? { borderColor: `${accent}80` } : undefined}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => pickGender(g.value)}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                >
                  <div className="text-2xl mb-1" style={{ color: selected ? accent : 'var(--text-muted)' }}>
                    {g.symbol}
                  </div>
                  <div>{g.label}</div>
                </motion.button>
              )
            })
          )}
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <button
          className="btn-ghost text-xs touch-manipulation"
          onClick={() => {
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
            onBack()
          }}
          id="profile-back-btn"
        >
          ← Back
        </button>
      </motion.div>

      {/* Privacy note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.6 }}
        className="text-[10px] italic font-body text-[var(--text-muted)] mt-8 text-center max-w-md"
      >
        🔒 Never saved, never logged, never sent anywhere except the Oracle for this one reading.
      </motion.p>
    </motion.div>
  )
}