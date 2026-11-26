import { omitBannedLine } from "@/lib/ava/banned-line"

const INTERNAL_PHRASES = [
  "traffic growth",
  "content & social",
  "content and social",
  "lead capture & nurture",
  "lead capture and nurture",
  "authority & outreach",
  "authority and outreach",
  "sentinel",
  "specialist team",
  "specialist bot",
  "copywriter",
  "social scheduler",
  "ads analyst",
  "website helper",
  "follow-up helper",
  "follow up helper",
  "research helper",
]

const METRIC = /\b\d[\d,]*(?:\.\d+)?\s*(?:%|percent|clicks?|impressions?|sessions?|visitors?|users?|pageviews?|revenue|sales|leads?|rank(?:ing|ed|s)?|positions?|ctr)\b/gi
const DOLLAR = /\$\s*\d[\d,]*(?:\.\d+)?/g

export function inventedMetrics(text: string, sources: string[]) {
  const haystack = sources.join("\n")
  const found = new Set<string>()
  for (const match of text.match(METRIC) ?? []) {
    if (!haystack.includes(match)) found.add(match)
  }
  for (const match of text.match(DOLLAR) ?? []) {
    if (!haystack.includes(match)) found.add(match)
  }
  return [...found]
}

export function namesSpecialist(text: string) {
  const folded = text.toLowerCase()
  return INTERNAL_PHRASES.some((phrase) => folded.includes(phrase))
}

function sentencesOf(text: string) {
  return text
    .split(/\n+|(?<=[.!?]["']?)\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function claimsDelivery(text: string) {
  return sentencesOf(text).filter((sentence) => {
    if (!/\b(published|sent|emailed|texted|charged|spent)\b/i.test(sentence)) return false
    if (/\b(no|not|nothing|wasn't|was not|don't|do not|never|without)\b/i.test(sentence)) return false
    return true
  })
}

/** Client-facing text. Specialist names and the banned line stay out. */
export function clientSafeText(text: string) {
  let cleaned = text
  for (const phrase of INTERNAL_PHRASES) {
    const pattern = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
    cleaned = cleaned.replace(pattern, "")
  }
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim()
  return omitBannedLine(cleaned)
}

export function reviewArtifact(body: string, sources: string[]) {
  const issues: string[] = []
  const metrics = inventedMetrics(body, sources)
  if (metrics.length) issues.push("invented metric")
  if (omitBannedLine(body) !== body) issues.push("banned line")
  if (namesSpecialist(body)) issues.push("names a helper")
  const delivered = claimsDelivery(body)
  if (delivered.length) issues.push("claims a send, post, charge, or contact")
  return { pass: issues.length === 0, issues, metrics, delivered }
}

export function safeDraft(text: string, sources: string[]) {
  const review = reviewArtifact(text, sources)
  if (review.pass) return { text: clientSafeText(text), review }
  return {
    text: "I kept a draft without numbers I do not have. Nothing was sent, posted, or charged.",
    review,
  }
}
