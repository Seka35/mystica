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

export function stripMarkdown(text: string): string {
  if (!text) return text
  return text
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1')
    .replace(/__([^_]+?)__/g, '$1')
    .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '$1')
    .replace(/`([^`]+?)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/(\*{2,}|_{2,}|`)/g, '')
    .replace(/[—–]/g, ',')
    .replace(/\s*--\s*/g, ', ')
    .replace(/\s+,/g, ',')
    .replace(/,\s{2,}/g, ', ')
}

// ── Foreign script filter ───────────────────────────────────────────
// The model occasionally leaks random Cyrillic / CJK / Arabic characters
// mid-stream. They look broken and unprofessional. Strip every non-Latin
// script the app does NOT explicitly support. Latin (basic + extended-A/B)
// is kept, so French diacritics (é, è, ê, à, ç) and other Latin characters
// (Spanish, German, Portuguese accents) all pass through untouched.
//
// Ranges are explicit \uXXXX so the regex is copy-paste safe.

const FOREIGN_SCRIPT_RANGES: Array<[number, number]> = [
  [0x0400, 0x04FF], // Cyrillic (Russian, Ukrainian, Bulgarian, Serbian...)
  [0x0500, 0x052F], // Cyrillic Supplement
  [0x2DE0, 0x2DFF], // Cyrillic Extended-A
  [0xA640, 0xA69F], // Cyrillic Extended-B
  [0x4E00, 0x9FFF], // CJK Unified Ideographs (Chinese, Japanese kanji)
  [0x3400, 0x4DBF], // CJK Extension A
  [0xF900, 0xFAFF], // CJK Compatibility Ideographs
  [0x3040, 0x309F], // Hiragana
  [0x30A0, 0x30FF], // Katakana
  [0x31F0, 0x31FF], // Katakana Phonetic Extensions
  [0xAC00, 0xD7AF], // Hangul Syllables
  [0x1100, 0x11FF], // Hangul Jamo
  [0x3130, 0x318F], // Hangul Compatibility
  [0x0590, 0x05FF], // Hebrew
  [0x0600, 0x06FF], // Arabic
  [0x0750, 0x077F], // Arabic Supplement
  [0x08A0, 0x08FF], // Arabic Extended-A
  [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
  [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
  [0x0E00, 0x0E7F], // Thai
  [0x0E80, 0x0EFF], // Lao
  [0x0900, 0x097F], // Devanagari
  [0x0980, 0x09FF], // Bengali
  [0x0A00, 0x0A7F], // Gurmukhi
  [0x0A80, 0x0AFF], // Gujarati
  [0x0B00, 0x0B7F], // Oriya
  [0x0B80, 0x0BFF], // Tamil
  [0x0C00, 0x0C7F], // Telugu
  [0x0C80, 0x0CFF], // Kannada
  [0x0D00, 0x0D7F], // Malayalam
  [0x0370, 0x03FF], // Greek (sometimes leaks as decoration)
  [0x13A0, 0x13FF], // Cherokee
  [0x1200, 0x137F], // Ethiopic
  [0x0780, 0x07BF], // Thaana
]

function buildForeignScriptRegex(): RegExp {
  const parts = FOREIGN_SCRIPT_RANGES.map(([a, b]) => {
    const lo = a.toString(16).padStart(4, '0')
    const hi = b.toString(16).padStart(4, '0')
    return `\\u${lo}-\\u${hi}`
  })
  return new RegExp('[' + parts.join('') + ']', 'gu')
}

const FOREIGN_SCRIPT_REGEX = buildForeignScriptRegex()

export function cleanForeignChars(text: string): string {
  if (!text) return text
  return text
    .replace(FOREIGN_SCRIPT_REGEX, '')
    .replace(/  +/g, ' ')
}

// ── Combined processor for streamed AI text ──────────────────────────
// Run all cleanups in one go.
export function processStreamedText(text: string): string {
  return cleanForeignChars(stripMarkdown(text))
}
