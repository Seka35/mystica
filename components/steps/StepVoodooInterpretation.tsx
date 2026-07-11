'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useMemo } from 'react'
import type { Theme, Loa, Offering, CowrieCast } from '@/lib/types'

interface Props {
  loa: Loa | null | undefined
  offering: Offering | null | undefined
  cowries: CowrieCast[]
  interpretation: string
  isStreaming: boolean
  theme: Theme
  question: string
  onNewReading: () => void
}

export default function StepVoodooInterpretation({
  loa,
  offering,
  cowries,
  interpretation,
  isStreaming,
  theme,
  question,
  onNewReading,
}: Props) {
  const paragraphs = useMemo(() => {
    if (!interpretation) return [] as string[]
    return interpretation
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
  }, [interpretation])

  // Map loa and offering to images
  const loaImage = loa ? `/images/voodoo/loa_${loa}.png` : null
  const offeringImage = offering ? `/images/voodoo/offering_${offering}.png` : null

  return (
    <motion.div
      className="relative min-h-dvh w-full z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 interpretation-panel px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-oracle text-xs tracking-[0.3em] opacity-50 text-[var(--text-muted)] mb-1">
              RITUAL RESULT
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
              <span className="font-oracle text-xs text-[#d4af37]">
                Voodoo Reading
              </span>
            </div>
          </div>
          <button className="btn-ghost text-xs" onClick={onNewReading} id="new-voodoo-btn">
            ✦ New Ritual
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 relative">
        {/* Question recap */}
        <motion.div
          className="mb-8 p-5 border border-[rgba(212,175,55,0.1)] bg-[rgba(26,16,5,0.6)] italic font-body text-[var(--text-muted)] text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          &ldquo;{question}&rdquo;
        </motion.div>

        {/* Altar Snapshot */}
        <motion.div 
          className="relative w-full h-48 md:h-64 mb-10 rounded-lg overflow-hidden border border-[rgba(212,175,55,0.3)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Background */}
          <Image 
            src="/images/voodoo/voodoo_altar_bg.png" 
            alt="Altar" 
            fill 
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

          {/* Loa Sigil background */}
          {loaImage && (
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <Image src={loaImage} alt="Loa" width={180} height={180} className="object-contain" />
            </div>
          )}

          {/* Offering */}
          {offeringImage && (
            <div className="absolute bottom-2 right-4 md:right-8 opacity-80" style={{ filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.9))' }}>
              <Image src={offeringImage} alt="Offering" width={80} height={80} className="object-contain" />
            </div>
          )}

          {/* Cast Cowries */}
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            {cowries.map((cast, i) => (
              <div key={i} className="relative w-10 h-10 md:w-14 md:h-14" style={{ transform: `rotate(${(i * 45) - 30}deg)` }}>
                <Image src={`/images/voodoo/cowrie_${cast}.png`} alt={cast} fill className="object-contain drop-shadow-xl" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Gold divider */}
        <div className="gold-divider mb-8 font-oracle text-xs">✦ The Spirits Speak ✦</div>

        {/* Streaming interpretation */}
        {!interpretation ? (
          <motion.div
            className="oracle-text flex items-center gap-3 text-[var(--text-muted)] italic animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span>✦</span>
            <span>The houngan listens to the spirits…</span>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {paragraphs.map((para, idx) => {
              const isLast = idx === paragraphs.length - 1
              return (
                <motion.p
                  key={idx}
                  className="oracle-text italic text-[var(--text-muted)]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {para}
                  {isLast && isStreaming && <span className="cursor-blink" aria-hidden="true" />}
                </motion.p>
              )
            })}
          </div>
        )}

        {/* Done state */}
        {!isStreaming && interpretation && (
          <motion.div
            className="mt-12 pt-8 border-t border-[rgba(212,175,55,0.1)] flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.4em] opacity-50">
                ☽ &nbsp; ✦ &nbsp; ☾
              </div>
            </div>
            
            <button className="btn-oracle" onClick={onNewReading}>
              ✦ &nbsp; End Ritual
            </button>

            {/* Share Buttons */}
            <div className="mt-10 flex flex-col items-center">
              <div className="text-[var(--text-muted)] font-oracle text-xs tracking-[0.2em] mb-4 opacity-60">
                SHARE YOUR DESTINY
              </div>
              <div className="flex flex-wrap gap-3 justify-center max-w-sm">
                <button 
                  onClick={() => window.open('https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank')}
                  className="btn-ghost !px-4 !py-2 !rounded-full text-xs" 
                >
                  Facebook
                </button>
                <button 
                  onClick={() => window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent('I just consulted the Oracle... Discover your destiny too! ✦') + '&url=' + encodeURIComponent(window.location.href), '_blank')}
                  className="btn-ghost !px-4 !py-2 !rounded-full text-xs" 
                >
                  Twitter
                </button>
                <button 
                  onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}
                  className="btn-ghost !px-4 !py-2 !rounded-full text-xs" 
                >
                  Instagram / TikTok
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
