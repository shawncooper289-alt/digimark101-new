/** Short spoken answers for a confirm step. Anything else stays a normal message. */
export function spokenCommand(text: string): "confirm" | "discard" | null {
  const line = text
    .trim()
    .toLowerCase()
    .replace(/[.!?,]+$/g, "")
    .replace(/\s+/g, " ")
  if (/^(yes|yeah|yep|yup|confirm|confirmed|save|save it|go ahead|do it|that is right|that's right|looks good|ok|okay|sure)$/.test(line)) {
    return "confirm"
  }
  if (/^(no|nope|discard|cancel|don't save|do not save|never mind|nevermind)$/.test(line)) return "discard"
  return null
}
