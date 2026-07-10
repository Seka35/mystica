'use client'
// components/steps/StepProfile.tsx — Step 5: About You (optional profile)
// Helps personalize the reading by telling the Oracle your gender and age.
// Both fields are OPTIONAL — the user can skip the step entirely.

import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Theme } from '@/lib/types'
import { THEME_CONFIG } from '@/lib/types'

export type Gender = 'woman' | 'man' | 'non-binary' | 'not-specified'

interface Props {
  theme: Theme
  gender: Gender | null
  age: number | null
  onChangeGender: (g: Gender | null) => void
  onChangeAge: (a: number | null) => void
  onNext: () => void
  onBack: () => void
}

const GENDERS: Array<{ value: Gender; label: string; symbol: string }> = [
  { value: 'woman',        label: 'Woman',         symbol: '♀' },
  { value: 'man',          label: 'Man',           symbol: '♂' },
  { value: 'non-binary',   label: 'Non-binary',    symbol: '⚥' },
  { value: 'not-specified', label: 'Rather not say', symbol: '·' },
]

const MIN_AGE = 13
const MAX_AGE = 120

export default function StepProfile({
  theme,
  gender,
  age,
  onChangeGender,
  onChangeAge,
  onNext,
  onBack,
}: Props) {
  const accent = THEME_CONFIG[theme].accent
  const [ageText, setAgeText] = useState(age == null ? '' : String(age))

  const nothingFilled = gender == null && age == null

  function commitAge(raw: string) {
    setAgeText(raw)
    if (raw.trim() === '') {
      onChangeAge(null)
      return
    }
    const n = parseInt(raw, 10)
    if (Number.isFinite(n) && n >= MIN_AGE && n <= MAX_AGE) {
      onChangeAge(n)
    } else {
      onChangeAge(null)
    }
  }

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
          ✦ &nbsp; STEP FOUR &nbsp; ✦
        </div>
        <h2 className="font-oracle text-3xl md:text-4xl gold-text mb-2">
          About You
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg max-w-md">
          A small detail helps the Oracle address you in your own voice.
          {' '}
          <span className="opacity-70 text-sm">(entirely optional)</span>
        </p>
      </motion.div>

      {/* Gender */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="w-full max-w-lg mb-8"
      >
        <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.3em] mb-3 text-center opacity-80">
          HOW DO YOU IDENTIFY
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GENDERS.map((g) => {
            const selected = gender === g.value
            return (
              <motion.button
                key={g.value}
                type="button"
                id={`gender-${g.value}`}
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
                onClick={() => onChangeGender(selected ? null : g.value)}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                aria-pressed={selected}
              >
                <div className="text-2xl mb-1" style={{ color: selected ? accent : 'var(--text-muted)' }}>
                  {g.symbol}
                </div>
                <div>{g.label}</div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Age */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="w-full max-w-lg mb-8"
      >
        <label
          htmlFor="age-input"
          className="block text-[var(--text-muted)] font-oracle text-xs tracking-[0.3em] mb-3 text-center opacity-80"
        >
          YOUR AGE
        </label>
        <div className="flex justify-center">
          <div className="relative w-40">
            <input
              id="age-input"
              type="number"
              inputMode="numeric"
              min={MIN_AGE}
              max={MAX_AGE}
              value={ageText}
              onChange={(e) => commitAge(e.target.value)}
              placeholder="—"
              className="oracle-input text-center text-2xl !min-h-0 py-3 px-2 touch-manipulation"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: age != null ? accent : 'var(--text-muted)',
                MozAppearance: 'textfield',
              }}
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[var(--text-muted)] opacity-50 text-xs italic font-body pr-1">
              years
            </div>
          </div>
        </div>
        <p className="text-center text-xs italic font-body text-[var(--text-muted)] opacity-60 mt-2">
          {MIN_AGE}–{MAX_AGE} — used only for tone, never stored
        </p>
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
          onClick={onBack}
          id="profile-back-btn"
        >
          ← Back
        </button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-oracle touch-manipulation"
          onClick={onNext}
          id="profile-continue-btn"
        >
          Continue the Journey →
        </motion.button>
        {nothingFilled && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="btn-ghost text-xs touch-manipulation"
            onClick={onNext}
            id="profile-skip-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Skip for now →
          </motion.button>
        )}
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