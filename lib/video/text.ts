export type TextTools = {
  omitBannedLine: (text: string) => string
  spokenText: (text: string) => string
}

export function cleanLine(text: string, omitBannedLine: (text: string) => string) {
  return omitBannedLine(text)
    .replace(/[\u2014\u2013]/g, ", ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim()
}

export function sentences(text: string) {
  return text
    .split(/\n+|(?<=[.!?]["']?)\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

export function safeHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" ? url.toString() : ""
  } catch {
    return ""
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
