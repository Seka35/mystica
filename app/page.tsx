'use client'
// app/page.tsx — orchestrator: wires all steps together, drives audio + streaming API
// Steps: 1=Welcome 2=Theme 3=Spread 4=Question 5=Shuffle 6=Fan 7=Draw 8=Interpretation

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import ParticleField from '@/components/ParticleField'
import { useAudio } from '@/hooks/useAudio'
import { processStreamedText } from '@/lib/textUtils'
import { DEFAULT_SPREAD_ID, SPREADS_BY_ID, type Spread, type SpreadId } from '@/lib/spreads'
import type { DrawnCard, Step, TarotCard, Theme } from '@/lib/types'

import StepWelcome from '@/components/steps/StepWelcome'
import StepTheme from '@/components/steps/StepTheme'
import StepSpread from '@/components/steps/StepSpread'
import StepQuestion from '@/components/steps/StepQuestion'
import StepShuffle from '@/components/steps/StepShuffle'
import StepFan from '@/components/steps/StepFan'
import StepDraw from '@/components/steps/StepDraw'
import StepInterpretation from '@/components/steps/StepInterpretation'

// Map DrawnCard.position (which is the spread's position name) to a stable
// identifier that the API and components can use. We keep the original
// `position` string in DrawnCard so the spread's name flows through.

export default function Page() {
  // ── State machine ───────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1)
  const [theme, setTheme] = useState<Theme | null>(null)
  const [spreadId, setSpreadId] = useState<SpreadId>(DEFAULT_SPREAD_ID)
  const [question, setQuestion] = useState('')
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const [interpretation, setInterpretation] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const streamAbortRef = useRef<AbortController | null>(null)

  // Derived: current spread object (always defined since spreadId has a default)
  const spread: Spread = SPREADS_BY_ID[spreadId]

  // ── Audio ────────────────────────────────────────────────────────
  const audio = useAudio()

  // Lock scroll per-step; allow scroll only inside interpretation step
  useEffect(() => {
    document.body.style.overflow = step === 8 ? 'auto' : 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [step])

  // ── Reset everything for a fresh reading ─────────────────────────
  const resetReading = useCallback(() => {
    streamAbortRef.current?.abort()
    streamAbortRef.current = null
    audio.stop('ambient')
    setInterpretation('')
    setIsStreaming(false)
    setDrawnCards([])
    setQuestion('')
    setTheme(null)
    setSpreadId(DEFAULT_SPREAD_ID)
    setStep(1)
  }, [audio])

  // ── Start the AI streaming interpretation ────────────────────────
  const startStreamingInterpretation = useCallback(async (
    payload: {
      question: string
      theme: Theme
      cards: DrawnCard[]
      spreadId: SpreadId
    }
  ) => {
    if (!payload.theme) return
    const body = {
      question: payload.question,
      theme: payload.theme,
      spreadId: payload.spreadId,
      cards: payload.cards.map((d, i) => ({
        card: d.card,
        position: d.position,
      })),
    }

    const controller = new AbortController()
    streamAbortRef.current = controller

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        setInterpretation('⚠ The oracle could not be reached. Please try again.')
        setIsStreaming(false)
        return
      }

      setIsStreaming(true)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let acc = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // SSE frames are separated by blank lines
        const frames = buffer.split('\n\n')
        buffer = frames.pop() ?? ''

        for (const frame of frames) {
          const line = frame.trim()
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()

          if (data === '[DONE]') {
            setIsStreaming(false)
            return
          }
          if (data === '[ERROR]') {
            acc += '\n\n⚠ The oracle\'s voice was lost mid-reading.'
            setInterpretation(acc)
            setIsStreaming(false)
            return
          }
          try {
            const parsed = JSON.parse(data) as { text?: string }
            if (parsed.text) {
              acc += parsed.text
              // Strip any markdown that the model may have leaked
              setInterpretation(processStreamedText(acc))
            }
          } catch {
            // Ignore malformed frame, keep going
          }
        }
      }
      setIsStreaming(false)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Stream error:', err)
        setInterpretation((prev) =>
          prev + '\n\n⚠ A disturbance interrupted the reading. Please try again.'
        )
        setIsStreaming(false)
      }
    }
  }, [])

  // ── Step transitions ─────────────────────────────────────────────
  const handleBegin = async () => {
    await audio.unlockAndInit()     // unlock audio on first user gesture
    audio.play('chime')
    setStep(2)
  }

  const handleThemeSelect = (t: Theme) => setTheme(t)

  const handleThemeNext = () => {
    audio.play('chime')
    setStep(3)            // → Spread
  }

  const handleSpreadSelect = (id: SpreadId) => setSpreadId(id)

  const handleSpreadNext = () => {
    audio.play('chime')
    setStep(4)            // → Question
  }

  const handleQuestionNext = () => {
    audio.play('chime')
    setStep(5)            // → Shuffle
  }

  const handleQuestionBack = () => {
    audio.play('chime')
    setStep(3)            // → Spread
  }

  const handlePlayShuffle = () => audio.play('shuffle')

  const handleShuffleNext = () => {
    audio.stop('shuffle')
    audio.play('chime')
    setStep(6)            // → Fan
  }

  // User drew N cards → build DrawnCard array using the spread's positions → advance to Step 7
  const handleDraw = (cards: TarotCard[]) => {
    audio.play('chime')

    const drawn: DrawnCard[] = cards.map((card, i) => ({
      card,
      position: spread.positions[i]?.name ?? `position-${i}`,
      isRevealed: false,
    }))
    setDrawnCards(drawn)
    setStep(7)            // → Draw (flip)

    // Kick off the AI stream as soon as cards exist (before user flips)
    if (theme) {
      void startStreamingInterpretation({
        question,
        theme,
        cards: drawn,
        spreadId,
      })
    }
  }

  const handleReveal = (i: number) => {
    audio.play('flip')
    setDrawnCards((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, isRevealed: true } : c))
    )
  }

  const handleFlipSound = () => audio.play('flip')

  const allRevealed = drawnCards.length > 0 && drawnCards.every((c) => c.isRevealed)

  const handleSeeInterpretation = () => {
    audio.play('chime')
    setStep(8)            // → Interpretation
  }

  const handleNewReading = () => {
    audio.play('chime')
    resetReading()
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Star field + drifting golden particles — always behind steps */}
      <div className="star-field" aria-hidden="true" />
      <ParticleField />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepWelcome key="s1" onBegin={handleBegin} />
        )}

        {step === 2 && (
          <StepTheme
            key="s2"
            selected={theme}
            onSelect={handleThemeSelect}
            onNext={handleThemeNext}
          />
        )}

        {step === 3 && theme && (
          <StepSpread
            key="s3"
            theme={theme}
            selected={spreadId}
            onSelect={handleSpreadSelect}
            onNext={handleSpreadNext}
          />
        )}

        {step === 4 && theme && (
          <StepQuestion
            key="s4"
            theme={theme}
            question={question}
            onChange={setQuestion}
            onNext={handleQuestionNext}
            onBack={handleQuestionBack}
          />
        )}

        {step === 5 && (
          <StepShuffle
            key="s5"
            onNext={handleShuffleNext}
            onPlayShuffle={handlePlayShuffle}
          />
        )}

        {step === 6 && (
          <StepFan key="s6" spread={spread} onDraw={handleDraw} />
        )}

        {step === 7 && theme && (
          <StepDraw
            key="s7"
            spread={spread}
            drawnCards={drawnCards}
            onReveal={handleReveal}
            onFlipSound={handleFlipSound}
            allRevealed={allRevealed}
            onNext={handleSeeInterpretation}
            question={question}
          />
        )}

        {step === 8 && theme && (
          <StepInterpretation
            key="s8"
            spread={spread}
            drawnCards={drawnCards}
            interpretation={interpretation}
            isStreaming={isStreaming}
            theme={theme}
            question={question}
            onNewReading={handleNewReading}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
