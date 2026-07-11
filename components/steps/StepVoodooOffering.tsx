'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Offering } from '@/lib/types'

interface Props {
  selected: Offering | null
  onSelect: (o: Offering) => void
  onBack: () => void
}

const OFFERINGS: Array<{ id: Offering; name: string; image: string }> = [
  { id: 'rum', name: 'Dark Rum', image: '/images/voodoo/offering_rum.png' },
  { id: 'cigar', name: 'Lit Cigar', image: '/images/voodoo/offering_cigar.png' },
  { id: 'candle', name: 'Black Candle', image: '/images/voodoo/offering_candle.png' },
  { id: 'perfume', name: 'Florida Water', image: '/images/voodoo/offering_perfume.png' },
]

export default function StepVoodooOffering({ selected, onSelect, onBack }: Props) {
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
        className="text-center mb-10"
      >
        <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] mb-4 opacity-60">
          ✦ &nbsp; THE OFFERING &nbsp; ✦
        </div>
        <h2 className="font-oracle text-3xl md:text-4xl gold-text mb-2">
          Place your Offering
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg max-w-md">
          What will you give to sweeten the path?
        </p>
      </motion.div>

      {/* Offering Selection */}
      <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {OFFERINGS.map((offering, i) => {
          const isSelected = selected === offering.id
          return (
            <motion.button
              key={offering.id}
              onClick={() => onSelect(offering.id)}
              className="relative flex flex-col items-center gap-4 group touch-manipulation cursor-pointer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div 
                className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-visible flex items-center justify-center transition-all duration-300`}
              >
                {/* Glow ring */}
                <div 
                  className={`absolute inset-0 rounded-full transition-all duration-500`}
                  style={{
                    boxShadow: isSelected ? '0 0 30px rgba(212, 175, 55, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.3)' : '0 0 10px rgba(0,0,0,0.5)',
                    border: isSelected ? '1px solid rgba(212, 175, 55, 0.8)' : '1px solid rgba(255,255,255,0.05)',
                    background: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.4)',
                  }}
                />
                
                <Image
                  src={offering.image}
                  alt={offering.name}
                  width={100}
                  height={100}
                  className="object-contain drop-shadow-2xl z-10"
                />
              </div>
              <div className="font-oracle text-sm md:text-base tracking-wider" style={{ color: isSelected ? '#D4AF37' : 'var(--text-primary)' }}>
                {offering.name}
              </div>
            </motion.button>
          )
        })}
      </div>

      <motion.button
        className="btn-ghost text-xs touch-manipulation"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        ← Back
      </motion.button>
    </motion.div>
  )
}
