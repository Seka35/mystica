'use client'
// components/steps/StepQuestion.tsx — Step 3: Question input

import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Theme } from '@/lib/types'
import { THEME_CONFIG } from '@/lib/types'

interface Props {
  theme: Theme
  question: string
  onChange: (q: string) => void
  onNext: () => void
  onBack: () => void
}

const MAX_CHARS = 280

export default function StepQuestion({ theme, question, onChange, onNext, onBack }: Props) {
  const [focused, setFocused] = useState(false)
  const config = THEME_CONFIG[theme]
  const charCount = question.trim().length
  const isValid = charCount >= 10

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-dvh px-4 py-12 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Theme accent glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full opacity-10 blur-[80px] pointer-events-none"
        style={{ background: config.accent }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8"
      >
        <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] mb-4 opacity-60">
          ✦ &nbsp; STEP THREE &nbsp; ✦
        </div>
        <h2 className="font-oracle text-3xl md:text-4xl gold-text mb-3">
          Ask Your Question
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg max-w-md">
          The more precise your question, the deeper the oracle&apos;s sight.
        </p>
      </motion.div>

      {/* Domain badge */}
      <motion.div
        className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border"
        style={{ borderColor: config.accent + '40', background: config.color + '20' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: config.accent }} />
        <span className="font-oracle text-xs tracking-widest" style={{ color: config.accent }}>
          {config.label.toUpperCase()}
        </span>
      </motion.div>

      {/* Text area */}
      <motion.div
        className="w-full max-w-lg relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
      >
        {/* Animated border */}
        {focused && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              boxShadow: `0 0 0 1px ${config.accent}40, 0 0 20px ${config.accent}10`,
            }}
          />
        )}

        <textarea
          id="question-input"
          className="oracle-input rounded-sm min-h-[140px]"
          placeholder={config.placeholder}
          value={question}
          onChange={e => onChange(e.target.value.slice(0, MAX_CHARS))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Your question for the oracle"
        />

        {/* Character count */}
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-[var(--text-muted)] text-xs italic font-body opacity-60">
            {focused && charCount < 10 ? 'Be specific, the cards need your true question' : ''}
          </span>
          <span
            className="text-xs font-body transition-colors"
            style={{ color: charCount > MAX_CHARS * 0.9 ? config.accent : 'var(--text-muted)', opacity: 0.5 }}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>

        {/* Language hint — small banner so users know they can write in any language */}
        <motion.div
          className="w-full max-w-lg mt-5 flex items-center justify-center gap-2 text-xs font-body italic text-[var(--text-muted)] opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <span className="text-sm" aria-hidden>🌍</span>
          <span>
            Ask in <em>any language</em> — French, English, Spanish, Português...
            The Oracle answers in yours.
          </span>
        </motion.div>
      </motion.div>

      {/* Listening indicator */}
      {charCount > 0 && (
        <motion.p
          className="text-[var(--text-muted)] italic font-body text-sm mt-4 opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
        >
          ✦ The cards are listening…
        </motion.p>
      )}

      {/* Buttons */}
      <motion.div
        className="flex gap-4 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <button className="btn-ghost" onClick={onBack} id="question-back-btn">
          ← Back
        </button>
        <button
          className="btn-oracle"
          onClick={onNext}
          disabled={!isValid}
          style={{ opacity: isValid ? 1 : 0.3, cursor: isValid ? 'pointer' : 'not-allowed' }}
          id="question-continue-btn"
        >
          Consult the Deck →
        </button>
      </motion.div>
    </motion.div>
  )
}
