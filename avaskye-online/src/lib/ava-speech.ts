/**
 * Mirror of lib/ava/speech.ts for the founder office bundle.
 * Ava is always the long A: Ay-vuh, IPA /ˈeɪvə/. Display text stays "Ava".
 * Voice is locked: female, professional American English, no accent.
 */
const NAME = /\bAva\b/g

export function spokenText(text: string) {
  return text.replace(NAME, "Ay-vuh")
}

/** Prefer a female en-US voice. Falls back to any en-US, then any English female. */
export function pickAvaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  const score = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase()
    const lang = (v.lang || "").toLowerCase()
    let s = 0
    if (lang.startsWith("en-us") || lang === "en") s += 50
    if (lang.startsWith("en")) s += 20
    if (/female|woman|girl|zira|samantha|susan|karen|victoria|aria|nova|ara|google us english|microsoft zira|salli|joanna|kendra|ivy|kimberly/.test(name)) s += 40
    if (/male|man|david|mark|alex|daniel|fred|george|tom|guy/.test(name)) s -= 50
    if (v.localService) s += 5
    return s
  }

  const ranked = [...voices].sort((a, b) => score(b) - score(a))
  const best = ranked[0]
  return best && score(best) > 20 ? best : null
}

export function speakAva(text: string, onDone?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return
  window.speechSynthesis.cancel()

  const utter = () => {
    const utterance = new SpeechSynthesisUtterance(spokenText(text))
    utterance.lang = "en-US"
    utterance.rate = 1
    utterance.pitch = 1.05
    const voice = pickAvaVoice()
    if (voice) utterance.voice = voice
    if (onDone) utterance.onend = onDone
    window.speechSynthesis.speak(utterance)
  }

  if (window.speechSynthesis.getVoices().length) {
    utter()
  } else {
    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices)
      utter()
    }
    window.speechSynthesis.addEventListener("voiceschanged", onVoices)
    // Some browsers need a kick
    window.speechSynthesis.getVoices()
  }
}
