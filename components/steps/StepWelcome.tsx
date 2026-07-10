'use client'
// components/steps/StepWelcome.tsx — Step 1: Welcome screen

import { motion } from 'framer-motion'
import Image from 'next/image'
import { backImagePath } from '@/lib/tarotData'

interface Props {
  onBegin: () => void
}

export default function StepWelcome({ onBegin }: Props) {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-dvh px-4 text-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
    >
      {/* Ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(ellipse, #C8963C, transparent)' }}
        aria-hidden="true"
      />

      {/* Oracle symbol */}
      <motion.div
        className="mb-3 text-gold-mid font-oracle text-xs tracking-[0.4em] opacity-60"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 0.3, duration: 1 }}
      >
        ✦ &nbsp; ARCANA MYSTICA &nbsp; ✦
      </motion.div>

      {/* Title */}
      <motion.h1
        className="font-oracle text-5xl md:text-7xl gold-text-shimmer mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        The Oracle
      </motion.h1>

      <motion.p
        className="text-[var(--text-muted)] font-body italic text-xl mb-10 tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 1 }}
      >
        Ask the universe. Draw your destiny.
      </motion.p>

      {/* Breathing deck of cards */}
      <motion.div
        className="relative mb-12 cursor-default"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Stacked cards effect */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              zIndex: i,
              filter: `brightness(${0.5 + i * 0.1})`,
            }}
            animate={{
              x: `calc(-50% + ${(i - 2) * 3}px)`,
              y: `calc(-50% + ${(i - 2) * -3}px)`,
              rotate: (i - 2) * 2,
            }}
          >
            <div className="w-[170px] h-[298px] rounded-lg overflow-hidden shadow-2xl border border-[rgba(240,192,64,0.15)]">
              <Image
                src={backImagePath()}
                alt="Tarot card back"
                width={140}
                height={245}
                className="object-cover w-full h-full"
                priority={i === 4}
              />
            </div>
          </motion.div>
        ))}

        {/* Front card — breathing animation */}
        <motion.div
          className="relative z-10"
          animate={{
            scale: [1, 1.025, 1],
            y: [0, -6, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-[170px] h-[298px] rounded-lg overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(240,192,64,0.15)] border border-[rgba(240,192,64,0.25)]">
            <Image
              src={backImagePath()}
              alt="Tarot card"
              width={170}
              height={298}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          {/* Gold aura */}
          <div className="absolute inset-0 rounded-lg animate-pulse"
            style={{ boxShadow: '0 0 40px rgba(240,192,64,0.12)', pointerEvents: 'none' }}
          />
        </motion.div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="flex flex-col items-center gap-4"
      >
        <button
          id="begin-reading-btn"
          className="btn-oracle text-sm"
          onClick={onBegin}
          aria-label="Begin your tarot reading"
        >
          ✦ &nbsp; Begin the Reading &nbsp; ✦
        </button>
        <p className="text-[var(--text-muted)] text-sm italic font-body opacity-50">
          A personal journey through the cards awaits
        </p>
      </motion.div>

      {/* Bottom ornament */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--gold-dim)] opacity-30 text-xs tracking-[0.5em] font-oracle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 2, duration: 1 }}
      >
        ☽ &nbsp; ✦ &nbsp; ☾
      </motion.div>
    </motion.div>
  )
}
