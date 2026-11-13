/**
 * Ava's spoken voice. Server TTS is preferred. The device voice is only the fallback.
 * Display text stays "Ava". Speech receives the long-A spelling.
 * Dispatches ava:speaking / ava:idle so the whole character can animate.
 */
import { omitBannedLine } from "@/lib/ava/banned-line"

const NAME = /\bAva\b/g

let keepAlive = 0
let turn = 0
let context: AudioContext | null = null
let source: AudioBufferSourceNode | null = null
let htmlAudio: HTMLAudioElement | null = null
let objectUrl: string | null = null
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="

function emit(speaking: boolean) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(speaking ? "ava:speaking" : "ava:idle"))
}

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

export const DEVICE_VOICE_NOTE =
  "This reply used this device's built-in voice, because Ava's studio voice was unavailable."

export type OfficeSpeechResult = { status: "played" | "stopped" | "failed"; voice: "elevenlabs" | "openai" | "device" | "none" }

export function speakAva(text: string, onDone?: () => void): Promise<OfficeSpeechResult> {
  const safe = omitBannedLine(text)
  const token = ++turn
  stopPlayback()
  if (typeof window === "undefined" || !safe.trim()) {
    emit(false)
    return Promise.resolve({ status: "failed", voice: "none" })
  }
  return speakFromServer(safe, token, onDone)
}

function stopPlayback() {
  try {
    source?.stop()
  } catch {
    // The previous clip already ended.
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
  if (typeof window !== "undefined") window.speechSynthesis?.cancel()
  if (keepAlive) window.clearInterval(keepAlive)
}

export function prepareAvaSpeech() {
  if (typeof window === "undefined") return
  const audio = htmlAudio ?? new Audio()
  htmlAudio = audio
  audio.preload = "auto"
  audio.setAttribute("playsinline", "true")
  if (!audio.getAttribute("src")) audio.src = SILENCE
  void audio.play()?.then(() => audio.pause()).catch(() => undefined)
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  context = context ?? new Ctor()
  if (context.state === "suspended") void context.resume()
}

export function stopAvaSpeech() {
  turn += 1
  stopPlayback()
  emit(false)
}

async function playMp3(bytes: ArrayBuffer, token: number, onDone?: () => void) {
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (Ctor) {
    try {
      context = context ?? new Ctor()
      if (context.state === "suspended") await context.resume()
      if (token !== turn) return true
      if (context.state === "running") {
        const buffer = await context.decodeAudioData(bytes.slice(0))
        if (token !== turn) return true
        const node = context.createBufferSource()
        node.buffer = buffer
        node.connect(context.destination)
        node.onended = () => {
          if (token !== turn) return
          source = null
          emit(false)
          onDone?.()
        }
        source = node
        emit(true)
        node.start()
        return true
      }
    } catch {
      // Try the media element next.
    }
  }
  if (token !== turn) return true
  const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }))
  objectUrl = url
  const audio = htmlAudio ?? new Audio()
  htmlAudio = audio
  audio.preload = "auto"
  audio.setAttribute("playsinline", "true")
  audio.src = url
  audio.onended = () => {
    if (token !== turn) return
    emit(false)
    onDone?.()
  }
  try {
    emit(true)
    await audio.play()
    return true
  } catch {
    emit(false)
    return false
  }
}

async function speakFromServer(text: string, token: number, onDone?: () => void): Promise<OfficeSpeechResult> {
  try {
    const response = await fetch("/api/ava/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(20000),
    })
    if (token !== turn) return { status: "stopped", voice: "none" }
    const type = response.headers.get("content-type") || ""
    const header = (response.headers.get("x-ava-speech") || "").toLowerCase()
    if (response.ok && type.includes("audio")) {
      const bytes = await response.arrayBuffer()
      if (token !== turn) return { status: "stopped", voice: "none" }
      const voice = header === "elevenlabs" ? "elevenlabs" : "openai"
      if (bytes.byteLength > 64 && (await playMp3(bytes, token, onDone))) return { status: "played", voice }
    }
  } catch {
    // The device voice speaks this turn instead.
  }
  if (token !== turn) return { status: "stopped", voice: "none" }
  return speakInBrowser(text, token, onDone)
    ? { status: "played", voice: "device" }
    : { status: "failed", voice: "none" }
}

function speakInBrowser(text: string, token: number, onDone?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return false
  window.speechSynthesis.cancel()
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
        emit(false)
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
      utterance.onstart = () => emit(true)
      utterance.onend = () => window.setTimeout(pump, gap)
      utterance.onerror = () => window.setTimeout(pump, 60)
      held.push(utterance)
      window.speechSynthesis.speak(utterance)
    }

    emit(true)
    pump()
    keepAlive = window.setInterval(() => {
      if (token !== turn || !window.speechSynthesis.speaking) {
        window.clearInterval(keepAlive)
        if (!window.speechSynthesis.speaking) emit(false)
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
  return true
}
