/**
 * Free device voice only. No paid TTS.
 * Display text stays "Ava". Compact phone voices get the long-A spelling;
 * enhanced, premium, and Google voices already say Ava correctly.
 */
const NAME = /\bAva\b/g

let keepAlive = 0
let turn = 0

function naturalVoice(voice: SpeechSynthesisVoice | null) {
  const name = voice?.name.toLowerCase() ?? ""
  return /premium|enhanced|natural|neural|wavenet|google/.test(name)
}

export function spokenText(text: string, voice?: SpeechSynthesisVoice | null) {
  const cleaned = text
    .replace(/https?:\/\/\S+/gi, "the site")
    .replace(/[#*_`>]/g, "")
    .replace(/[\u2014\u2013]/g, ",")
    .replace(/\s+/g, " ")
    .trim()
  if (naturalVoice(voice ?? null)) return cleaned
  return cleaned.replace(NAME, "Ay-vuh")
}

function speechLines(text: string) {
  const bits = text.split(/(?<=[.!?])\s+/).flatMap((part) => {
    if (part.length <= 170) return [part]
    return part.split(/,\s+/)
  })
  return bits.map((line) => line.trim()).filter(Boolean).slice(0, 4)
}

/** Prefer a warmer free en-US voice. Enhanced, premium, and Google beat compact robot voices. */
export function pickAvaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  const score = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase()
    const lang = (v.lang || "").toLowerCase()
    if (lang && !lang.startsWith("en")) return -100
    let s = 0
    if (lang.startsWith("en-us")) s += 40
    else if (lang.startsWith("en")) s += 12
    if (/premium|enhanced|natural|neural|wavenet/.test(name)) s += 140
    if (/google/.test(name)) s += 100
    if (/\bava\b|samantha|allison|nicky|serena/.test(name)) s += 24
    if (/female|woman/.test(name)) s += 12
    if (/compact|espeak/.test(name)) s -= 80
    if (/male|\bdavid\b|\balex\b|\bdaniel\b|\bfred\b|\baaron\b/.test(name)) s -= 90
    if (!v.localService && /google|premium|enhanced|neural/.test(name)) s += 15
    return s
  }

  const ranked = [...voices].sort((a, b) => score(b) - score(a))
  const best = ranked[0]
  return best && score(best) > 10 ? best : null
}

export function speakAva(text: string, onDone?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return
  window.speechSynthesis.cancel()
  if (keepAlive) window.clearInterval(keepAlive)
  const token = ++turn
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const start = () => {
    if (token !== turn) return
    const voice = pickAvaVoice()
    const lines = speechLines(spokenText(text, voice))
    if (!lines.length) return
    let index = 0
    const held: SpeechSynthesisUtterance[] = []

    const pump = () => {
      if (token !== turn) return
      if (index >= lines.length) {
        if (keepAlive) window.clearInterval(keepAlive)
        onDone?.()
        return
      }
      const utterance = new SpeechSynthesisUtterance(lines[index])
      index += 1
      utterance.lang = "en-US"
      utterance.rate = mobile ? 0.9 : 0.96
      utterance.pitch = 1
      utterance.volume = 1
      if (voice) utterance.voice = voice
      const gap = mobile ? 240 : 140
      utterance.onend = () => window.setTimeout(pump, gap)
      utterance.onerror = () => window.setTimeout(pump, 60)
      held.push(utterance)
      window.speechSynthesis.speak(utterance)
    }

    pump()
    keepAlive = window.setInterval(() => {
      if (token !== turn || !window.speechSynthesis.speaking) {
        window.clearInterval(keepAlive)
        return
      }
      window.speechSynthesis.resume()
    }, 4000)
  }

  if (window.speechSynthesis.getVoices().length) {
    window.setTimeout(start, 50)
  } else {
    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices)
      if (token === turn) start()
    }
    window.speechSynthesis.addEventListener("voiceschanged", onVoices)
    window.speechSynthesis.getVoices()
    window.setTimeout(() => {
      if (token === turn) start()
    }, 350)
  }
}
