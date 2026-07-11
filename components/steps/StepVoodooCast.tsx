'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import type { CowrieCast } from '@/lib/types'

interface Props {
  onNext: (cast: CowrieCast[]) => void
  audio: { play: (name: any) => void; stop: (name: any) => void }
}

const COWRIES_COUNT = 4

export default function StepVoodooCast({ onNext, audio }: Props) {
  const [hasCast, setHasCast] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [castResult, setCastResult] = useState<CowrieCast[]>([])
  const [positions, setPositions] = useState<{ x: number, y: number, rot: number }[]>([])

  const handleCast = () => {
    if (hasCast || isShaking) return
    setIsShaking(true)
    audio.play('cowries_shake')

    // Simulate shaking time before throwing
    setTimeout(() => {
      setIsShaking(false)
      setHasCast(true)
      audio.play('cowries_throw')

      // Generate random casts
      const result: CowrieCast[] = Array.from({ length: COWRIES_COUNT }).map(() => 
        Math.random() > 0.5 ? 'open' : 'closed'
      )
      setCastResult(result)

      // Generate random drop positions
      const pos = Array.from({ length: COWRIES_COUNT }).map(() => ({
        x: (Math.random() - 0.5) * 150, // random spread around center X
        y: (Math.random() - 0.5) * 150, // random spread around center Y
        rot: Math.random() * 360, // random rotation
      }))
      setPositions(pos)

      // Auto advance after animation
      setTimeout(() => {
        onNext(result)
      }, 3500)
    }, 1200) // Duration of shake
  }

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-dvh w-full overflow-hidden z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Altar */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src="/images/voodoo/voodoo_altar_bg.png"
          alt="Voodoo Altar"
          fill
          className="object-cover opacity-60"
        />
        {/* Dark vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_80%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full flex-1">
        
        <AnimatePresence>
          {!hasCast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center flex flex-col items-center"
            >
              <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] mb-4 opacity-80 drop-shadow-md">
                ✦ &nbsp; THE CASTING &nbsp; ✦
              </div>
              <p className="text-white italic font-body text-xl max-w-md drop-shadow-lg mb-8 text-center px-4">
                Hold your question in your mind...<br/>Click to cast the shells.
              </p>
              
              <motion.button
                onClick={handleCast}
                className="relative group w-32 h-32 rounded-full border border-[rgba(212,175,55,0.3)] bg-[rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden cursor-pointer touch-manipulation"
                whileHover={{ scale: 1.05, borderColor: 'rgba(212,175,55,0.8)' }}
                whileTap={{ scale: 0.95 }}
                animate={isShaking ? {
                  x: [0, -5, 5, -5, 5, 0],
                  y: [0, -2, 2, -2, 2, 0],
                  transition: { repeat: Infinity, duration: 0.1 }
                } : {}}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.2)_0%,transparent_70%)] animate-pulse" />
                <Image 
                  src="/images/voodoo/cowrie_open.png"
                  alt="Throw Shells"
                  width={60}
                  height={60}
                  className="opacity-80 drop-shadow-2xl"
                />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dropped Shells */}
        {hasCast && (
          <div className="relative w-full max-w-sm h-64 flex items-center justify-center">
            {castResult.map((res, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  opacity: 0, 
                  scale: 3, 
                  y: -300,
                  rotate: Math.random() * 360
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  x: positions[i].x, 
                  y: positions[i].y, 
                  rotate: positions[i].rot 
                }}
                transition={{ 
                  type: 'spring',
                  damping: 12,
                  stiffness: 100,
                  delay: i * 0.1, // Stagger fall slightly
                  duration: 0.8
                }}
              >
                <div className="relative w-16 h-16 md:w-20 md:h-20" style={{ filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.8))' }}>
                  <Image
                    src={`/images/voodoo/cowrie_${res}.png`}
                    alt={`Cowrie ${res}`}
                    fill
                    className="object-contain"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </motion.div>
  )
}
