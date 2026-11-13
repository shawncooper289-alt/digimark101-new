import { FALLBACK_GREETING, omitBannedLine } from "@/lib/ava/banned-line"

/** User speech. Drop the banned line. If that was the whole line, send nothing. */
export function transcriptText(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim()
  if (!trimmed) return ""
  const cleaned = omitBannedLine(trimmed).replace(/\s+/g, " ").trim()
  if (cleaned === FALLBACK_GREETING && cleaned !== trimmed) return ""
  return cleaned
}
