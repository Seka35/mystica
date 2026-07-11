'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Loa } from '@/lib/types'

interface Props {
  selected: Loa | null
  onSelect: (l: Loa) => void
  onBack: () => void
}

const LOAS: Array<{ id: Loa; name: string; title: string; image: string; color: string }> = [
  {
    id: 'legba',
    name: 'Papa Legba',
    title: 'The Gatekeeper',
    image: '/images/voodoo/loa_legba.png',
    color: '#D4AF37',
  },
  {
    id: 'erzulie',
    name: 'Erzulie Dantor',
    title: 'Fierce Love & Protection',
    image: '/images/voodoo/loa_erzulie.png',
    color: '#FF3366',
  },
  {
    id: 'samedi',
    name: 'Baron Samedi',
    title: 'Death & Transitions',
    image: '/images/voodoo/loa_samedi.png',
    color: '#8C8C8C',
  },
]

export default function StepVoodooLoa({ selected, onSelect, onBack }: Props) {
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
          ✦ &nbsp; INVOCATION &nbsp; ✦
        </div>
        <h2 className="font-oracle text-3xl md:text-4xl gold-text mb-2">
          Call the Loa
        </h2>
        <p className="text-[var(--text-muted)] italic font-body text-lg max-w-md">
          Who do you petition for guidance?
        </p>
      </motion.div>

      {/* Loa Selection */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
        {LOAS.map((loa, i) => {
          const isSelected = selected === loa.id
          return (
            <motion.button
              key={loa.id}
              onClick={() => onSelect(loa.id)}
              className="relative flex flex-col items-center gap-4 group touch-manipulation cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div 
                className={`relative w-48 h-48 md:w-56 md:h-56 rounded-lg overflow-hidden transition-all duration-500`}
                style={{
                  boxShadow: isSelected ? `0 0 40px ${loa.color}60` : `0 0 20px rgba(0,0,0,0.8)`,
                  border: isSelected ? `2px solid ${loa.color}` : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Image
                  src={loa.image}
                  alt={loa.name}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 192px, 224px"
                />
                {/* Glow effect on hover/select */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at center, ${loa.color} 0%, transparent 70%)` }}
                />
              </div>
              <div className="text-center">
                <div className="font-oracle text-xl tracking-wider mb-1" style={{ color: isSelected ? loa.color : '#e5e7eb' }}>
                  {loa.name}
                </div>
                <div className="text-[var(--text-muted)] text-xs italic font-body opacity-80">
                  {loa.title}
                </div>
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
