'use client'
// hooks/useAudio.ts
// Howler.js audio manager
// CRITICAL: Audio context must be unlocked on the first user gesture (Step 1 button click)
// All audio is initialized here and unlocked at that moment

import { useRef, useCallback } from 'react'

type SoundName = 'ambient' | 'shuffle' | 'flip' | 'reveal' | 'chime' | 'voodoo_drums' | 'match_strike' | 'glass_clink' | 'cowries_shake' | 'cowries_throw' | 'voodoo_whisper'

interface SoundConfig {
  src: string
  volume: number
  loop: boolean
}

const SOUNDS: Record<SoundName, SoundConfig> = {
  ambient: { src: '/sounds/ambient.mp3', volume: 0.08, loop: true },
  shuffle: { src: '/sounds/shuffle.mp3', volume: 0.5, loop: false },
  flip: { src: '/sounds/flip.mp3', volume: 0.55, loop: false },
  reveal: { src: '/sounds/reveal.mp3', volume: 0.45, loop: false },
  chime: { src: '/sounds/chime.mp3', volume: 0.4, loop: false },
  voodoo_drums: { src: '/sounds/voodoo_drums.mp3', volume: 0.4, loop: true },
  match_strike: { src: '/sounds/match_strike.mp3', volume: 0.6, loop: false },
  glass_clink: { src: '/sounds/glass_clink.mp3', volume: 0.6, loop: false },
  cowries_shake: { src: '/sounds/cowries_shake.mp3', volume: 0.7, loop: false },
  cowries_throw: { src: '/sounds/cowries_throw.mp3', volume: 0.7, loop: false },
  voodoo_whisper: { src: '/sounds/voodoo_whisper.mp3', volume: 0.5, loop: false },
}

export function useAudio() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const howlsRef = useRef<Record<string, any>>({})
  const unlockedRef = useRef(false)

  // Called exactly once on first user click (Step 1 CTA)
  const unlockAndInit = useCallback(async () => {
    if (unlockedRef.current) return
    unlockedRef.current = true

    // Dynamically import Howler to avoid SSR issues
    const { Howl, Howler } = await import('howler')

    // Resume audio context (some browsers suspend it)
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      await Howler.ctx.resume()
    }

    // Pre-load all sounds
    Object.entries(SOUNDS).forEach(([name, config]) => {
      howlsRef.current[name] = new Howl({
        src: [config.src],
        volume: config.volume,
        loop: config.loop,
        preload: true,
        // Graceful fallback — if sound file missing, don't crash
        onloaderror: () => {
          console.warn(`Audio not found: ${config.src} — continuing silently`)
        },
      })
    })

    // Start ambient immediately after unlock
    setTimeout(() => {
      howlsRef.current['ambient']?.play()
    }, 200)
  }, [])

  const play = useCallback((name: SoundName) => {
    if (!unlockedRef.current) return
    const howl = howlsRef.current[name]
    if (!howl) return
    // Don't double-play ambient
    if (name === 'ambient' && howl.playing()) return
    howl.play()
  }, [])

  const stop = useCallback((name: SoundName) => {
    howlsRef.current[name]?.stop()
  }, [])

  const fade = useCallback((name: SoundName, to: number, duration: number) => {
    const howl = howlsRef.current[name]
    if (!howl) return
    howl.fade(howl.volume(), to, duration)
  }, [])

  return { unlockAndInit, play, stop, fade }
}
