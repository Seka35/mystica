'use client'
// components/steps/StepTheme.tsx — Step 2: Theme selection

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Theme } from '@/lib/types'
import { THEME_CONFIG } from '@/lib/types'

interface Props {
  selected: Theme | null
  onSelect: (theme: Theme) => void
}

const THEME_ICONS: Record<Theme, string> = {
  love: '/images/themes/theme_love.webp',
  work: '/images/themes/theme_work.webp',
  money: '/images/themes/theme_money.webp',
  spiritual: '/images/themes/theme_spiritual.webp', 
  death: '/images/themes/theme_death.webp',
  sex: '/images/themes/theme_sex.webp',
  free: '/images/themes/theme_free.webp',
  horoscope: '', // unused here
  voodoo: '', // unused here
}

const THEME_ORDER: Theme[] = ['love', 'sex', 'work', 'money', 'spiritual', 'death', 'free']

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
          ✦ &nbsp; STEP TWO &nbsp; ✦
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
              className={`group text-left relative overflow-hidden rounded-lg aspect-square border ${
                isSelected 
                  ? 'border-[rgba(212,175,55,0.8)] shadow-[0_0_20px_rgba(212,175,55,0.15)]' 
                  : 'border-[rgba(212,175,55,0.1)] hover:border-[rgba(212,175,55,0.4)]'
              }`}
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
              <div
                className="absolute top-0 left-0 w-full h-1 opacity-80 z-20"
                style={{ background: config.accent }}
              />

              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <Image 
                  src={icon}
                  alt={config.label}
                  fill
                  className="object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-300"
                />
                {/* Gradient overlay to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              </div>

              {/* Glow on selected */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 pointer-events-none z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: `radial-gradient(circle at center, ${config.accent}40, transparent 70%)`,
                  }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-3">
                <div className="font-oracle text-sm md:text-base tracking-wider drop-shadow-md mb-2" style={{ color: config.accent }}>
                  {config.label}
                </div>
                
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-[var(--text-muted)] italic text-xs mt-1 font-body leading-tight bg-black/60 p-1.5 rounded"
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
