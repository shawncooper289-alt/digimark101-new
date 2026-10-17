import { AVA_IDENTITY } from "@/lib/ava/identity"

const NAME = /\bAva\b/g

/** Display text stays "Ava". Speech engines receive the long-A spelling. */
export function spokenText(text: string) {
  return text.replace(NAME, AVA_IDENTITY.pronunciation.phoneticSpelling)
}

/** For a TTS provider that honors SSML. OpenAI tts-1 does not, so this stays opt-in. */
export function spokenSsml(text: string) {
  const phoneme = AVA_IDENTITY.pronunciation.ssmlPhoneme
  return text.replace(NAME, `<phoneme alphabet="ipa" ph="${phoneme}">Ava</phoneme>`)
}

export function speakInBrowser(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(spokenText(text))
  utterance.lang = AVA_IDENTITY.speech.browserLang
  utterance.rate = AVA_IDENTITY.speech.browserRate
  window.speechSynthesis.speak(utterance)
  return true
}
