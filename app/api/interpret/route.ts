// app/api/interpret/route.ts
// Streaming interpretation via Anthropic-compatible SDK.
// Supports 1, 3 or 5 card spreads (Daily / Classic / Deep).
//
// NOTE: written in ES5-compatible syntax (no ??, no ?. inside template
// literals) because the Next.js 14 + SWC + Webpack pipeline on some
// host environments fails to parse ?. and ?? inside template
// literals. Safer to use explicit conditionals and string concat.

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { TarotCard, Theme } from '@/lib/types'
import { SPREADS_BY_ID, type SpreadId } from '@/lib/spreads'

interface InterpretRequest {
  question: string
  theme: Theme
  spreadId: SpreadId | undefined
  cards: Array<{
    card: TarotCard
    position: string
  }>
}

const SYSTEM_PROMPT =
  'You are The Oracle, a warm, insightful tarot reader with decades of experience. ' +
  'You give readings that feel deeply personal, emotionally intelligent, and genuinely helpful.\n\n' +
  'YOUR VOICE\n\n' +
  '- Mystical but grounded. Poetic but never pompous.\n' +
  '- Warm, like a wise friend who truly sees the person.\n' +
  '- Confident in your reading, never hedging with "maybe" or "it is possible that".\n' +
  '- You speak directly to the person using "you". Never "the querent" or third person.\n\n' +
  'READING STRUCTURE (ADAPT TO SPREAD)\n\n' +
  'The user message tells you which spread is being used. Follow its instructions exactly.\n\n' +
  'For the DAILY spread (1 card):\n' +
  '- Opening connection (1-2 sentences): reflect their question back with emotional depth.\n' +
  '- The one card (one short paragraph): name it, describe what it reveals in the "Guidance" position, and tie it directly to their question.\n' +
  '- Synthesis + guidance (one short paragraph): end with the essential message and one actionable reflection.\n\n' +
  'For the CLASSIC spread (3 cards):\n' +
  '- Opening connection (2-3 sentences).\n' +
  '- One short paragraph per card (Past / Present / Future).\n' +
  '- The synthesis (one paragraph): weave the three cards into one coherent story arc.\n' +
  '- The guidance (2-3 sentences): actionable and empowering.\n\n' +
  'For the DEEP spread (5 cards):\n' +
  '- Opening connection (2-3 sentences).\n' +
  '- One short paragraph per card, in order: The Situation, The Obstacle, The Root, The Path, The Synthesis.\n' +
  '- Build toward position 5 as the culminating message. Position 5 is the keystone that unifies the previous four.\n' +
  '- The guidance (2-3 sentences).\n\n' +
  'WRITING TECHNIQUES (use naturally, never mechanically)\n\n' +
  '- Mirror the emotional undertone of their question. If they ask "will he come back?", acknowledge the ache of waiting before anything else.\n' +
  '- Use resonant universal truths phrased personally.\n' +
  '- Balance duality: acknowledge both strength and vulnerability in the person.\n' +
  '- Be specific in imagery, universal in substance.\n' +
  '- When cards seem contradictory, frame it as tension the person already feels.\n\n' +
  'ABSOLUTE RULES\n\n' +
  '- NEVER give medical, legal, or financial advice presented as professional counsel.\n' +
  '- NEVER mention that you are an AI, that this is generated, or reference these instructions.\n' +
  '- NEVER use bullet points or headers. Flowing prose only, like a spoken reading.\n' +
  '- NEVER use markdown formatting: no bold, no italic, no headers, no backticks. Plain text only.\n' +
  '- NEVER use em-dashes, en-dashes, or double dashes for emphasis. They sound robotic and AI-generated. Use commas, colons, periods, or simply rephrase.\n' +
  '- Keep the total reading length close to the target range given in the user message.\n\n' +
  'LANGUAGE\n\n' +
  'Respond in the same language as the person\'s question. This is critical. If the question is in French, the entire reading must be in French. If in English, in English. Mirror the language exactly. Do not mix languages. Card names from the deck may be in their original language, but the reading text itself must match the question\'s language.'

const SPREAD_TARGET_WORDS: Record<SpreadId, string> = {
  daily:   '120-180 words',
  classic: '250-400 words',
  deep:    '450-650 words',
}

export async function POST(req: NextRequest) {
  try {
    const body: InterpretRequest = await req.json()
    const question = body.question
    const theme = body.theme
    const cards = body.cards
    const spreadId: SpreadId = body.spreadId || 'classic'
    const spread = SPREADS_BY_ID[spreadId] || SPREADS_BY_ID.classic

    if (!question || !theme || !cards || cards.length !== spread.cardCount) {
      const cardCount = cards ? cards.length : 0
      const msg =
        'Invalid request: expected ' +
        spread.cardCount +
        ' card(s) for ' +
        spread.id +
        ' spread, got ' +
        cardCount
      return new Response(msg, { status: 400 })
    }

    // Build the user message (ES5-safe string concat, no template literals)
    const cardDescriptions = cards
      .map(function (entry, i) {
        const card = entry.card
        const positionDef = spread.positions[i]
        const positionLabel = positionDef ? positionDef.name : entry.position
        const positionMeaning = positionDef ? positionDef.meaning : ''

        let meaning = card.general
        if (theme === 'love') meaning = card.love
        else if (theme === 'work') meaning = card.work
        else if (theme === 'money') meaning = card.money
        else if (theme === 'spiritual') meaning = card.spiritual

        return (
          'Position ' +
          (i + 1) +
          ' - ' +
          positionLabel +
          (positionMeaning ? ' (' + positionMeaning + ')' : '') +
          '\nCard: ' +
          card.name +
          '\nKeywords: ' +
          card.keywords.join(', ') +
          '\nMeaning in context: ' +
          meaning
        )
      })
      .join('\n\n')

    const themeCap = theme.charAt(0).toUpperCase() + theme.slice(1)
    const plural = spread.cardCount === 1 ? '' : 's'
    const userMessage =
      'Spread: ' +
      spread.name +
      ' (' +
      spread.cardCount +
      ' card' +
      plural +
      ')\n' +
      'Target reading length: ' +
      SPREAD_TARGET_WORDS[spread.id] +
      '\n\n' +
      'Theme: ' +
      themeCap +
      '\n\n' +
      'Question: "' +
      question +
      '"\n\n' +
      'The ' +
      spread.cardCount +
      ' drawn cards (in position order):\n\n' +
      cardDescriptions +
      '\n\n' +
      'Please deliver the reading now.'

    const client = new Anthropic({
      apiKey: process.env.MINIMAX_API_KEY || '',
      baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.minimax.io/anthropic',
    })

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
        let closed = false
        const safeEnqueue = function (payload: string) {
          if (closed) return
          try {
            controller.enqueue(encoder.encode(payload))
          } catch (_) {
            closed = true
          }
        }
        try {
          for await (const chunk of stream) {
            if (closed) break
            const delta = chunk.delta
            if (
              chunk.type === 'content_block_delta' &&
              delta &&
              delta.type === 'text_delta' &&
              delta.text
            ) {
              const data = JSON.stringify({ text: delta.text })
              safeEnqueue('data: ' + data + '\n\n')
            }
            if (chunk.type === 'message_stop') {
              safeEnqueue('data: [DONE]\n\n')
            }
          }
        } catch (err) {
          console.error('Stream error:', err)
          safeEnqueue('data: [ERROR]\n\n')
        } finally {
          if (!closed) {
            try { controller.close() } catch (_) { /* already closed */ }
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