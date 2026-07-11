'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Mode } from '@/lib/types'

interface Props {
  selected: Mode | null
  onSelect: (mode: Mode) => void
}

const MODES: { id: Mode; label: string; desc: string; img: string }[] = [
  { 
    id: 'tarot', 
    label: 'Tarot Reading', 
    desc: 'Consult the cards for clarity on love, work, money, or the unknown.',
    img: '/images/modes/mode_tarot.webp'
  },
  { 
    id: 'horoscope', 
    label: 'Daily Horoscope', 
    desc: 'Discover the cosmic energies surrounding your zodiac sign today.',
    img: '/images/modes/mode_horoscope.webp'
  },
  { 
    id: 'voodoo', 
    label: 'Voodoo Ritual', 
    desc: 'Petition the spirits for blessings or hexes. Proceed with caution.',
    img: '/images/modes/mode_voodoo.webp'
  }
]

export default function StepMode({ selected, onSelect }: Props) {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-dvh px-4 py-12 z-10 w-full"
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
          Choose Your Path
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg">
          Which discipline of the mystic arts seeks you today?
        </p>
      </motion.div>

      {/* Mode list */}
      <div className="flex flex-col gap-3 md:gap-6 w-full max-w-lg mb-10">
        {MODES.map((mode, i) => {
          const isSelected = selected === mode.id
          return (
            <motion.button
              key={mode.id}
              onClick={() => onSelect(mode.id)}
              className={`relative overflow-hidden rounded-xl border transition-all duration-500 w-full h-28 md:h-36 ${
                isSelected 
                  ? 'border-[rgba(212,175,55,0.8)] shadow-[0_0_30px_rgba(212,175,55,0.2)]' 
                  : 'border-[rgba(212,175,55,0.2)] hover:border-[rgba(212,175,55,0.5)] opacity-80 hover:opacity-100'
              }`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.15, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image 
                src={mode.img}
                alt={mode.label}
                fill
                className="object-cover"
                priority={true}
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-3 md:p-5 text-left">
                <div className="font-oracle text-xl md:text-2xl gold-text mb-1 md:mb-2 tracking-wide drop-shadow-lg">
                  {mode.label}
                </div>
                <div className="text-[var(--text-muted)] italic text-xs md:text-sm font-body max-w-[90%] drop-shadow-md">
                  {mode.desc}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <p className="text-[var(--text-muted)] italic font-body text-sm opacity-60">
        ✦ Tap a path to continue
      </p>
    </motion.div>
  )
}
