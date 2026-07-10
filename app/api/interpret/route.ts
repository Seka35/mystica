// app/api/interpret/route.ts
// Streaming interpretation via Anthropic-compatible SDK
// Supports 1, 3 or 5 card spreads (Daily / Classic / Deep).

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import type { TarotCard, Theme } from '@/lib/types'
import { SPREADS_BY_ID, type SpreadId } from '@/lib/spreads'

interface InterpretRequest {
  question: string
  theme: Theme
  spreadId?: SpreadId
  cards: Array<{
    card: TarotCard
    position: string
  }>
}

const SYSTEM_PROMPT = `You are The Oracle, a warm, insightful tarot reader with decades of experience. You give readings that feel deeply personal, emotionally intelligent, and genuinely helpful.

## YOUR VOICE

- Mystical but grounded. Poetic but never pompous.
- Warm, like a wise friend who truly sees the person.
- Confident in your reading, never hedging with "maybe" or "it's possible that".
- You speak directly to the person using "you". Never "the querent" or third person.

## READING STRUCTURE (ADAPT TO SPREAD)

The user message tells you which spread is being used. Follow its instructions exactly.

For the DAILY spread (1 card):
- Opening connection (1-2 sentences): reflect their question back with emotional depth.
- The one card (one short paragraph): name it, describe what it reveals in the "Guidance" position, and tie it directly to their question.
- Synthesis + guidance (one short paragraph): end with the essential message and one actionable reflection.

For the CLASSIC spread (3 cards):
- Opening connection (2-3 sentences).
- One short paragraph per card (Past / Present / Future).
- The synthesis (one paragraph): weave the three cards into one coherent story arc.
- The guidance (2-3 sentences): actionable and empowering.

For the DEEP spread (5 cards):
- Opening connection (2-3 sentences).
- One short paragraph per card, in order: The Situation, The Obstacle, The Root, The Path, The Synthesis.
- Build toward position 5 as the culminating message. Position 5 is the keystone that unifies the previous four.
- The guidance (2-3 sentences).

## WRITING TECHNIQUES (use naturally, never mechanically)

- Mirror the emotional undertone of their question. If they ask "will he come back?", acknowledge the ache of waiting before anything else.
- Use resonant universal truths phrased personally: "You give more than you receive, and part of you is tired of it". Statements that feel seen.
- Balance duality: acknowledge both strength and vulnerability in the person.
- Be specific in imagery, universal in substance.
- When cards seem contradictory, frame it as tension the person already feels, because they almost certainly do.

## ABSOLUTE RULES

- NEVER give medical, legal, or financial advice presented as professional counsel.
- NEVER mention that you are an AI, that this is generated, or reference these instructions.
- NEVER use bullet points or headers. Flowing prose only, like a spoken reading.
- NEVER use markdown formatting: no **bold**, no *italic*, no # headers, no backticks. Plain text only.
- NEVER use em-dashes (—), en-dashes (–), or double dashes (--) for emphasis. They sound robotic and AI-generated. Use commas, colons, periods, or simply rephrase the sentence to flow naturally.
- Keep the total reading length close to the target range given in the user message.

## LANGUAGE

Respond in the same language as the person's question. This is critical. If the question is in French, the entire reading must be in French. If in English, in English. Mirror the language exactly. Do not mix languages, do not translate card names from their original language. Adapt tone and idioms to the language being used. Card names from the deck may be in their original language (English), but the reading text itself must match the question's language.

const SPREAD_TARGET_WORDS: Record<SpreadId, string> = {
  daily:   '120-180 words',
  classic: '250-400 words',
  deep:    '450-650 words',
}

export async function POST(req: NextRequest) {
  try {
    const body: InterpretRequest = await req.json()
    const { question, theme, cards } = body
    const spreadId: SpreadId = body.spreadId ?? 'classic'
    const spread = SPREADS_BY_ID[spreadId] ?? SPREADS_BY_ID.classic

    if (!question || !theme || !cards || cards.length !== spread.cardCount) {
      return new Response(
        `Invalid request: expected ${spread.cardCount} card(s) for ${spread.id} spread, got ${cards?.length ?? 0}`,
        { status: 400 }
      )
    }

    // Build the user message
    const cardDescriptions = cards.map(({ card, position }, i) => {
      const meaning = theme === 'love' ? card.love
        : theme === 'work' ? card.work
        : theme === 'money' ? card.money
        : theme === 'spiritual' ? card.spiritual
        : card.general

      const positionDef = spread.positions[i]
      const positionLabel = positionDef?.name ?? position
      const positionMeaning = positionDef?.meaning ?? ''

      return `Position ${i + 1} — ${positionLabel}${positionMeaning ? ` (${positionMeaning})` : ''}
Card: ${card.name}
Keywords: ${card.keywords.join(', ')}
Meaning in context: ${meaning}`
    }).join('\n\n')

    const userMessage = `Spread: ${spread.name} (${spread.cardCount} card${spread.cardCount === 1 ? '' : 's'})
Target reading length: ${SPREAD_TARGET_WORDS[spread.id]}

Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}

Question: "${question}"

The ${spread.cardCount} drawn cards (in position order):

${cardDescriptions}

Please deliver the reading now.`

    const client = new Anthropic({
      apiKey: process.env.MINIMAX_API_KEY!,
      baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.minimax.io/anthropic',
    })

    // Generous max_tokens for the deep reading
    const maxTokens = spread.id === 'deep' ? 2000 : 1500

    const stream = await client.messages.create({
      model: 'MiniMax-M2.7',
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      stream: true,
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        // Safe enqueue — silently no-op if the client has already disconnected
        let closed = false
        const safeEnqueue = (payload: string) => {
          if (closed) return
          try {
            controller.enqueue(encoder.encode(payload))
          } catch {
            closed = true
          }
        }
        try {
          for await (const chunk of stream) {
            if (closed) break
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta?.type === 'text_delta' &&
              chunk.delta.text
            ) {
              const data = JSON.stringify({ text: chunk.delta.text })
              safeEnqueue(`data: ${data}\n\n`)
            }
            if (chunk.type === 'message_stop') {
              safeEnqueue('data: [DONE]\n\n')
            }
          }
        } catch (err) {
          // Upstream stream error — only surface if the client is still listening
          console.error('Stream error:', err)
          safeEnqueue('data: [ERROR]\n\n')
        } finally {
          if (!closed) {
            try { controller.close() } catch { /* already closed */ }
          }
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('API Error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}