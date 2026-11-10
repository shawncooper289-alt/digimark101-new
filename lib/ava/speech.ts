import { AVA_IDENTITY } from "@/lib/ava/identity"

const NAME = /\bAva\b/g
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="

/** Display text stays "Ava". Speech engines receive the long-A spelling. */
export function spokenText(text: string) {
  return text.replace(NAME, AVA_IDENTITY.pronunciation.phoneticSpelling)
}

/** For a TTS provider that honors SSML. The live route sends Ay-vuh instead. */
export function spokenSsml(text: string) {
  const phoneme = AVA_IDENTITY.pronunciation.ssmlPhoneme
  return text.replace(NAME, `<phoneme alphabet="ipa" ph="${phoneme}">Ava</phoneme>`)
}

let generation = 0
let context: AudioContext | null = null
let source: AudioBufferSourceNode | null = null
let htmlAudio: HTMLAudioElement | null = null
let objectUrl: string | null = null

function audioContext() {
  if (typeof window === "undefined") return null
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  context = context ?? new Ctor()
  return context
}

function element() {
  if (!htmlAudio) {
    htmlAudio = new Audio()
    htmlAudio.preload = "auto"
    htmlAudio.setAttribute("playsinline", "true")
  }
  return htmlAudio
}

function halt(cancelBrowser: boolean) {
  try {
    source?.stop()
  } catch {
    // The previous buffer was already finished.
  }
  source = null
  if (htmlAudio) {
    htmlAudio.onended = null
    htmlAudio.pause()
  }
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
  if (cancelBrowser && typeof window !== "undefined") window.speechSynthesis?.cancel()
}

/** Call from the tap or submit that will speak, before any await. */
export function prepareAvaSpeech() {
  if (typeof window === "undefined") return
  const audio = element()
  if (!audio.getAttribute("src")) audio.src = SILENCE
  void audio.play()?.then(() => audio.pause()).catch(() => undefined)
  const ctx = audioContext()
  if (ctx?.state === "suspended") void ctx.resume()
}

export function stopAvaSpeech() {
  generation += 1
  halt(true)
}

export function speakInBrowser(text: string, onDone?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return false
  const token = generation
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(spokenText(text))
  utterance.lang = AVA_IDENTITY.speech.browserLang
  utterance.rate = AVA_IDENTITY.speech.browserRate
  const finish = () => {
    if (token !== generation) return
    onDone?.()
  }
  utterance.onend = finish
  utterance.onerror = finish
  window.speechSynthesis.speak(utterance)
  return true
}

async function playMp3(bytes: ArrayBuffer, token: number, onDone?: () => void) {
  const ctx = audioContext()
  if (ctx) {
    try {
      if (ctx.state === "suspended") await ctx.resume()
      if (token !== generation) return true
      if (ctx.state === "running") {
        const buffer = await ctx.decodeAudioData(bytes.slice(0))
        if (token !== generation) return true
        const node = ctx.createBufferSource()
        node.buffer = buffer
        node.connect(ctx.destination)
        node.onended = () => {
          if (token !== generation) return
          source = null
          onDone?.()
        }
        source = node
        node.start()
        return true
      }
    } catch {
      // The media element is the next attempt.
    }
  }
  if (token !== generation) return true
  const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }))
  objectUrl = url
  const audio = element()
  audio.src = url
  audio.onended = () => {
    if (token !== generation) return
    onDone?.()
  }
  try {
    await audio.play()
    return true
  } catch {
    return false
  }
}

export async function speakAva(text: string, onDone?: () => void): Promise<"played" | "stopped" | "failed"> {
  const spoken = spokenText(text).trim()
  if (!spoken || typeof window === "undefined") return "failed"
  const token = ++generation
  halt(true)
  try {
    const response = await fetch("/api/ava/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: spoken }),
      signal: AbortSignal.timeout(20000),
    })
    if (token !== generation) return "stopped"
    const type = response.headers.get("content-type") || ""
    if (response.ok && type.includes("audio")) {
      const bytes = await response.arrayBuffer()
      if (token !== generation) return "stopped"
      if (bytes.byteLength > 64 && (await playMp3(bytes, token, onDone))) return "played"
    }
  } catch {
    // Browser speech is the fallback when the server voice is unavailable.
  }
  if (token !== generation) return "stopped"
  return speakInBrowser(spoken, onDone) ? "played" : "failed"
}
