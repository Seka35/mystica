// lib/textUtils.ts
// Helpers for cleaning streamed text and adapting UI to the user's language.

// ── Language detection ───────────────────────────────────────────────
// Lightweight French detector — checks for French diacritics and common
// function words. Good enough for picking which card name to display.

const FRENCH_DIACRITICS = /[éèêëàâçôûùîïœæ]/i
const FRENCH_STOPWORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
  'est', 'sont', 'suis', 'es', 'sommes', 'êtes',
  'avec', 'sans', 'pour', 'dans', 'sur', 'sous', 'entre',
  'que', 'qui', 'quoi', 'dont', 'où',
  'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
  'notre', 'votre', 'leur', 'nos', 'vos', 'leurs',
  'ce', 'cette', 'ces', 'cet',
  'aime', 'aimer', 'aimes', 'aimé',
  'moi', 'toi', 'lui', 'elle', 'soi',
  'comment', 'pourquoi', 'quand',
  'pas', 'plus', 'moins', 'très', 'trop',
  'être', 'avoir', 'faire', 'aller',
  'oui', 'non',
])

export function isFrench(text: string): boolean {
  if (!text) return false
  if (FRENCH_DIACRITICS.test(text)) return true

  // Tokenize and check stopwords — at least 2 matches is a strong French signal
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\sÀ-ſ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
  let matches = 0
  for (const t of tokens) {
    if (FRENCH_STOPWORDS.has(t)) matches++
    if (matches >= 2) return true
  }
  return false
}

// ── Card name picker ─────────────────────────────────────────────────
// Returns the localized name of a card given the question's language.

interface NamedCard {
  name: string
  nameFr: string
}

export function localizedCardName(card: NamedCard, question: string): string {
  return isFrench(question) ? card.nameFr : card.name
}

// ── Markdown stripper ────────────────────────────────────────────────
// Safety net: the system prompt forbids markdown, but if the model leaks
// any (**bold**, *italic*, # headers, backticks) we strip it cleanly.
// Preserves newlines and normal whitespace so paragraph splitting still works.

export function stripMarkdown(text: string): string {
  if (!text) return text
  return text
    // Bold **text** → text
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    // Italic *text* → text (single asterisks, after bold is gone)
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1')
    // Underline __text__ → text
    .replace(/__([^_]+?)__/g, '$1')
    // Italic _text_ → text
    .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '$1')
    // Inline code `text` → text
    .replace(/`([^`]+?)`/g, '$1')
    // Leading # headers (##, ###) → just the text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    // Stray pairs of asterisks or backticks we missed
    .replace(/(\*{2,}|_{2,}|`)/g, '')
    // Em-dashes (—) and en-dashes (–) → comma + space. They sound robotic.
    .replace(/[—–]/g, ',')
    // Double dashes (--) → comma + space as well
    .replace(/\s*--\s*/g, ', ')
    // Clean up "word , word" → "word, word"
    .replace(/\s+,/g, ',')
    // Clean up "word,  word" (double space after our substitutions)
    .replace(/,\s{2,}/g, ', ')
}