'use client'
// components/steps/StepTheme.tsx — Step 2: Theme selection

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/types'
import { THEME_CONFIG } from '@/lib/types'

interface Props {
  selected: Theme | null
  onSelect: (theme: Theme) => void
}

const THEME_ICONS: Record<Theme, string> = {
  love: '♥',
  work: '⚡',
  money: '◈',
  spiritual: '✦',
  free: '∞',
}

const THEME_ORDER: Theme[] = ['love', 'work', 'money', 'spiritual', 'free']

export default function StepTheme({ selected, onSelect }: Props) {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-dvh px-4 py-12 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-10"
      >
        <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] mb-4 opacity-60">
          ✦ &nbsp; STEP ONE &nbsp; ✦
        </div>
        <h2 className="font-oracle text-3xl md:text-4xl gold-text mb-3">
          Choose Your Domain
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg">
          Which realm of life calls for illumination?
        </p>
      </motion.div>

      {/* Theme grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl mb-10">
        {THEME_ORDER.map((theme, i) => {
          const config = THEME_CONFIG[theme]
          const isSelected = selected === theme
          const icon = THEME_ICONS[theme]

          return (
            <motion.button
              key={theme}
              id={`theme-${theme}`}
              className={`theme-card text-left relative overflow-hidden ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(theme)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              style={{
                borderColor: isSelected ? config.accent + '80' : undefined,
                gridColumn: theme === 'free' ? 'span 2 / span 2' : undefined,
              }}
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 w-1 h-full opacity-80"
                style={{ background: config.accent }}
              />

              {/* Glow on selected */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: `radial-gradient(ellipse at 20% 50%, ${config.accent}20, transparent 70%)`,
                  }}
                />
              )}

              <div className="pl-4">
                <div className="text-2xl mb-1" style={{ color: config.accent }}>
                  {icon}
                </div>
                <div className="font-oracle text-xs tracking-wider" style={{ color: config.accent }}>
                  {config.label}
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-[var(--text-muted)] italic text-sm mt-1 font-body"
                  >
                    {config.placeholder.split('?')[0] + '?'}
                  </motion.div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Helper text — no Continue button. Click a theme to advance. */}
      <p className="text-[var(--text-muted)] italic font-body text-sm opacity-60">
        ✦ Tap a domain to continue
      </p>
    </motion.div>
  )
}
