/**
 * Ava never says this preview sentence, a close paraphrase, or a
 * "theater of life" / "we are all actors" line. That sentence is left out.
 * If it was the whole line, she uses a short ordinary greeting instead.
 * Which voice speaks is chosen by the environment, not by this file.
 */
export const BANNED_PREVIEW_SENTENCE = "In the theater of life, we are all actors sharing the same scene."

export const BANNED_LINE_RULE =
  'Never say, quote, or paraphrase this sentence: "In the theater of life, we are all actors sharing the same scene." Do not use a theater-of-life line or a we-are-all-actors line in chat, speech, greetings, first messages, or video scripts. If that sentence would appear, skip it. If it would have been the whole reply, use a short ordinary greeting instead. Do not replace it with another theatrical line.'

export const FALLBACK_GREETING = "Hey. What can I help you with?"

const EXACT = "in the theater of life we are all actors sharing the same scene"

function fold(text: string) {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, " ")
    .replace(/\btheatre\b/g, "theater")
    .replace(/\bwe're\b/g, "we are")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function sentenceIsBanned(sentence: string) {
  const n = fold(sentence)
  if (!n) return false
  if (n.includes(EXACT)) return true
  if (n.includes("theater of life")) return true
  if (/\blife'?s theater\b/.test(n)) return true
  if (/\bwe are all(?: just)? actors\b/.test(n)) return true
  if (/\bactors sharing\b/.test(n) && /\bscene\b/.test(n)) return true
  if (/\ball actors\b/.test(n) && /\b(?:same scene|same stage|theater)\b/.test(n)) return true
  if (/\b(?:stage|play) of life\b/.test(n) && /\bactors?\b/.test(n)) return true
  return false
}

function sentencesOf(text: string) {
  return text
    .split(/\n+|(?<=[.!?]["']?)\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

/** Drop a banned sentence. Leave every other sentence as it was. */
export function omitBannedLine(text: string) {
  if (!text || !text.trim()) return text
  const parts = sentencesOf(text)
  if (parts.length === 0 || !parts.some(sentenceIsBanned)) return text
  const kept = parts.filter((part) => !sentenceIsBanned(part))
  if (kept.length === 0) return FALLBACK_GREETING
  return kept.join(" ").replace(/[ \t]{2,}/g, " ").trim()
}
