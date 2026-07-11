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

      {/* Theme list */}
      <div className="flex flex-col gap-3 md:gap-6 w-full max-w-lg mb-10">
        {THEME_ORDER.map((theme, i) => {
          const config = THEME_CONFIG[theme]
          const isSelected = selected === theme
          const icon = THEME_ICONS[theme]
          const desc = config.placeholder.split('?')[0] + '?'

          return (
            <motion.button
              key={theme}
              id={`theme-${theme}`}
              onClick={() => onSelect(theme)}
              className={`relative overflow-hidden rounded-xl border transition-all duration-500 w-full h-28 md:h-36 ${
                isSelected 
                  ? 'border-[rgba(212,175,55,0.8)] shadow-[0_0_30px_rgba(212,175,55,0.2)]' 
                  : 'border-[rgba(212,175,55,0.2)] hover:border-[rgba(212,175,55,0.5)] opacity-80 hover:opacity-100'
              }`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Image */}
              <Image 
                src={icon}
                alt={config.label}
                fill
                className="object-cover"
                priority={i < 3}
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              {/* Top Accent bar just for a hint of the theme's color */}
              <div
                className="absolute top-0 left-0 w-full h-1 opacity-80"
                style={{ background: config.accent }}
              />

              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-3 md:p-5 text-left">
                <div className="font-oracle text-xl md:text-2xl gold-text mb-1 md:mb-2 tracking-wide drop-shadow-lg" style={{ color: isSelected ? config.accent : undefined }}>
                  {config.label}
                </div>
                <div className="text-[var(--text-muted)] italic text-xs md:text-sm font-body max-w-[90%] drop-shadow-md">
                  {desc}
                </div>
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
