'use client'
// app/page.tsx — orchestrator: wires all steps together, drives audio + streaming API
// Steps: 1=Welcome 2=Theme 3=Spread 4=Question 5=Profile 6=Shuffle 7=Fan 8=Draw 9=Interpretation

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import ParticleField from '@/components/ParticleField'
import { useAudio } from '@/hooks/useAudio'
import { processStreamedText } from '@/lib/textUtils'
import { DEFAULT_SPREAD_ID, SPREADS_BY_ID, type Spread, type SpreadId } from '@/lib/spreads'
import type { DrawnCard, Step, TarotCard, Theme } from '@/lib/types'
import type { Gender } from '@/components/steps/StepProfile'

import StepWelcome from '@/components/steps/StepWelcome'
import StepTheme from '@/components/steps/StepTheme'
import StepSpread from '@/components/steps/StepSpread'
import StepQuestion from '@/components/steps/StepQuestion'
import StepProfile from '@/components/steps/StepProfile'
import StepShuffle from '@/components/steps/StepShuffle'
import StepFan from '@/components/steps/StepFan'
import StepDraw from '@/components/steps/StepDraw'
import StepInterpretation from '@/components/steps/StepInterpretation'

export default function Page() {
  // ── State machine ───────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1)
  const [theme, setTheme] = useState<Theme | null>(null)
  const [spreadId, setSpreadId] = useState<SpreadId>(DEFAULT_SPREAD_ID)
  const [question, setQuestion] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [zodiacSign, setZodiacSign] = useState<string | null>(null)
  const [age, setAge] = useState<number | null>(null)
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const [interpretation, setInterpretation] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const streamAbortRef = useRef<AbortController | null>(null)

  const spread: Spread = SPREADS_BY_ID[spreadId]

  // ── Audio ────────────────────────────────────────────────────────
  const audio = useAudio()

  // Lock scroll per-step; allow scroll inside fan (7), draw (8) and interpretation (9)
  useEffect(() => {
    document.body.style.overflow = (step >= 7) ? 'auto' : 'hidden'
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
    setGender(null)
    setZodiacSign(null)
    setAge(null)
    setTheme(null)
    setSpreadId(DEFAULT_SPREAD_ID)
    setStep(1)
  }, [audio])

  // ── Start the AI streaming interpretation ────────────────────────
  const startStreamingInterpretation = useCallback(async (payload: {
    question: string
    theme: Theme
    cards: DrawnCard[]
    spreadId: SpreadId
    gender: Gender | null
    age: number | null
    zodiacSign: string | null
  }) => {
    if (!payload.theme) return
    const finalQuestion = payload.theme === 'horoscope' 
      ? `Daily Horoscope for ${payload.zodiacSign || 'Unknown sign'}`
      : payload.question

    const body = {
      question: finalQuestion,
      theme: payload.theme,
      spreadId: payload.spreadId,
      gender: payload.gender,
      age: payload.age,
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
  // Auto-advance timer — used for single-click choices (theme, spread, ...)
  // Cancels itself if the user clicks another option before firing.
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleBegin = async () => {
    await audio.unlockAndInit()
    audio.play('chime')
    setStep(2)
  }

  // ── Single-click choices auto-advance ──────────────────────────
  const scheduleAdvance = (nextStep: Step, playAudio: () => void) => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = setTimeout(() => {
      playAudio()
      setStep(nextStep)
    }, 450)
  }

  const handleThemeSelect = (t: Theme) => {
    setTheme(t)
    if (t === 'horoscope') {
      setSpreadId('daily')
      scheduleAdvance(5, () => audio.play('chime'))
    } else {
      scheduleAdvance(3, () => audio.play('chime'))
    }
  }

  const handleSpreadSelect = (id: SpreadId) => {
    setSpreadId(id)
    scheduleAdvance(4, () => audio.play('chime'))
  }

  const handleQuestionNext = () => { audio.play('chime'); setStep(5) }
  const handleQuestionBack = () => { audio.play('chime'); setStep(3) }

  const handleProfileNext = () => { audio.play('chime'); setStep(6) }
  const handleProfileBack = () => { audio.play('chime'); setStep(4) }

  const handlePlayShuffle = () => audio.play('shuffle')
  const handleShuffleNext = () => {
    audio.stop('shuffle')
    audio.play('chime')
    setStep(7)
  }

  // User drew N cards → advance to Draw step + start streaming
  const handleDraw = (cards: TarotCard[]) => {
    audio.play('chime')
    const drawn: DrawnCard[] = cards.map((card, i) => ({
      card,
      position: spread.positions[i]?.name ?? `position-${i}`,
      isRevealed: false,
    }))
    setDrawnCards(drawn)
    setStep(8)

    if (theme) {
      void startStreamingInterpretation({
        question,
        theme,
        cards: drawn,
        spreadId,
        gender,
        age,
        zodiacSign,
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
    setStep(9)
  }
  const handleNewReading = () => { audio.play('chime'); resetReading() }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <main className="relative min-h-dvh overflow-hidden">
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
          />
        )}

        {step === 3 && theme && (
          <StepSpread
            key="s3"
            theme={theme}
            selected={spreadId}
            onSelect={handleSpreadSelect}
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

        {step === 5 && theme && (
          <StepProfile
            key="s5"
            theme={theme}
            gender={gender}
            zodiacSign={zodiacSign}
            onChangeGender={setGender}
            onChangeZodiac={setZodiacSign}
            onNext={handleProfileNext}
            onBack={theme === 'horoscope' ? () => { audio.play('chime'); setStep(2) } : handleProfileBack}
          />
        )}

        {step === 6 && (
          <StepShuffle
            key="s6"
            onNext={handleShuffleNext}
            onPlayShuffle={handlePlayShuffle}
          />
        )}

        {step === 7 && (
          <StepFan key="s7" spread={spread} onDraw={handleDraw} />
        )}

        {step === 8 && theme && (
          <StepDraw
            key="s8"
            spread={spread}
            drawnCards={drawnCards}
            onReveal={handleReveal}
            onFlipSound={handleFlipSound}
            allRevealed={allRevealed}
            onNext={handleSeeInterpretation}
            question={question}
          />
        )}

        {step === 9 && theme && (
          <StepInterpretation
            key="s9"
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