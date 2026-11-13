"use client"

import { useEffect, useRef, useState } from "react"
import { transcriptText } from "@/lib/ava/transcript"

type RecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<{ 0?: { transcript?: string }; isFinal: boolean }> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

export type DictatePhase = "idle" | "listening" | "transcribing"

type Session = {
  stream: MediaStream
  ctx: AudioContext
  source: MediaStreamAudioSourceNode | null
  timer: number
  recorder: MediaRecorder | null
  chunks: Blob[]
  mime: string
  recognition: RecognitionLike | null
  heard: boolean
  lastVoice: number
  started: number
  noise: number
  samples: number
  browserText: string
  finishing: boolean
  closed: boolean
}

function getRecognition(): RecognitionLike | null {
  if (typeof window === "undefined") return null
  const browser = window as Window & {
    SpeechRecognition?: new () => RecognitionLike
    webkitSpeechRecognition?: new () => RecognitionLike
  }
  const Ctor = browser.SpeechRecognition || browser.webkitSpeechRecognition
  if (!Ctor) return null
  const recognition = new Ctor()
  recognition.lang = "en-US"
  recognition.interimResults = true
  recognition.continuous = true
  return recognition
}

function pickMime() {
  if (typeof MediaRecorder === "undefined") return ""
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || ""
}

function fileFor(mime: string) {
  if (mime.includes("mp4") || mime.includes("aac")) return { name: "speech.m4a", type: "audio/mp4" }
  if (mime.includes("wav")) return { name: "speech.wav", type: "audio/wav" }
  return { name: "speech.webm", type: mime || "audio/webm" }
}

function levelOf(analyser: AnalyserNode, buffer: Uint8Array<ArrayBuffer>) {
  analyser.getByteTimeDomainData(buffer)
  let sum = 0
  for (let index = 0; index < buffer.length; index += 1) {
    const value = (buffer[index] - 128) / 128
    sum += value * value
  }
  return Math.sqrt(sum / buffer.length)
}

export function useDictate(onUtterance: (text: string) => Promise<void> | void) {
  const [phase, setPhase] = useState<DictatePhase>("idle")
  const [live, setLive] = useState("")
  const [note, setNote] = useState<string | null>(null)
  const [handsFree, setHandsFreeState] = useState(false)
  const handsFreeRef = useRef(false)
  const onUtteranceRef = useRef(onUtterance)
  const sessionRef = useRef<Session | null>(null)
  const phaseRef = useRef<DictatePhase>("idle")
  const browserRecognitionRef = useRef<RecognitionLike | null>(null)
  const browserToken = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    onUtteranceRef.current = onUtterance
  })

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      release(sessionRef.current)
    }
  }, [])

  function setPhaseBoth(next: DictatePhase) {
    phaseRef.current = next
    if (mounted.current) setPhase(next)
  }

  function release(session: Session | null) {
    if (!session || session.closed) return
    session.closed = true
    window.clearInterval(session.timer)
    try {
      session.recognition?.stop()
    } catch {
      // The recognizer was already stopped.
    }
    try {
      if (session.recorder && session.recorder.state !== "inactive") session.recorder.stop()
    } catch {
      // The recorder was already stopped.
    }
    session.source?.disconnect()
    session.stream.getTracks().forEach((track) => track.stop())
    void session.ctx.close().catch(() => undefined)
    if (sessionRef.current === session) sessionRef.current = null
  }

  async function upload(session: Session, blob: Blob) {
    const heard = transcriptText(session.browserText)
    if (blob.size >= 800) {
      const file = fileFor(session.mime)
      const body = new FormData()
      body.append("audio", new File([blob], file.name, { type: file.type }))
      try {
        const response = await fetch("/api/ava/transcribe", { method: "POST", body, signal: AbortSignal.timeout(25000) })
        const data = (await response.json().catch(() => null)) as { text?: string } | null
        const text = transcriptText(data?.text || "")
        if (response.ok && text) return { text, browser: false }
      } catch {
        // The browser transcript is the fallback.
      }
    }
    return heard ? { text: heard, browser: true } : null
  }

  function attachRecognition(session: Session) {
    const recognition = getRecognition()
    if (!recognition) return
    session.recognition = recognition
    recognition.onresult = (event) => {
      let text = ""
      let finalText = ""
      for (let index = 0; index < event.results.length; index += 1) {
        const piece = event.results[index]?.[0]?.transcript ?? ""
        text += piece
        if (event.results[index]?.isFinal) finalText += piece
      }
      session.browserText = finalText || text
      if (mounted.current) setLive(text.trim())
    }
    recognition.onerror = () => {
      session.recognition = null
    }
    try {
      recognition.start()
    } catch {
      session.recognition = null
    }
  }

  function beginRecorder(session: Session) {
    if (session.closed) return
    session.finishing = false
    session.chunks = []
    session.heard = false
    session.browserText = ""
    session.started = Date.now()
    session.lastVoice = Date.now()
    session.source?.disconnect()
    const analyser = session.ctx.createAnalyser()
    analyser.fftSize = 1024
    const source = session.ctx.createMediaStreamSource(session.stream)
    source.connect(analyser)
    session.source = source
    const mime = pickMime()
    session.mime = mime
    let recorder: MediaRecorder
    try {
      recorder = mime ? new MediaRecorder(session.stream, { mimeType: mime }) : new MediaRecorder(session.stream)
    } catch {
      recorder = new MediaRecorder(session.stream)
    }
    session.recorder = recorder
    if (recorder.mimeType) session.mime = recorder.mimeType
    recorder.ondataavailable = (event) => {
      if (event.data.size) session.chunks.push(event.data)
    }
    recorder.start(250)
    attachRecognition(session)
    const buffer = new Uint8Array(new ArrayBuffer(analyser.fftSize))
    window.clearInterval(session.timer)
    session.timer = window.setInterval(() => {
      if (session.closed || session.finishing || recorder.state !== "recording") return
      const level = levelOf(analyser, buffer)
      session.samples += 1
      if (session.samples <= 4) session.noise += level
      const floor = session.samples >= 4 ? session.noise / 4 : 0.01
      const threshold = Math.min(0.08, Math.max(0.018, floor * 3))
      const now = Date.now()
      if (level > threshold) {
        session.heard = true
        session.lastVoice = now
      }
      const elapsed = now - session.started
      if (session.heard && now - session.lastVoice > 1300 && elapsed > 500) {
        void finish(session, true)
        return
      }
      if (elapsed > 20000) {
        void finish(session, true)
        return
      }
      if (!handsFreeRef.current && !session.heard && elapsed > 8000) void finish(session, false)
    }, 100)
  }

  async function finish(session: Session, send: boolean) {
    if (session.closed || session.finishing) return
    session.finishing = true
    window.clearInterval(session.timer)
    try {
      session.recognition?.stop()
    } catch {
      // The recognizer was already stopped.
    }
    session.recognition = null
    const recorder = session.recorder
    const blob = await new Promise<Blob>((resolve) => {
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob(session.chunks, { type: session.mime || "audio/webm" }))
        return
      }
      recorder.onstop = () => resolve(new Blob(session.chunks, { type: recorder.mimeType || session.mime || "audio/webm" }))
      try {
        recorder.stop()
      } catch {
        resolve(new Blob(session.chunks, { type: session.mime || "audio/webm" }))
      }
    })
    if (session.closed || sessionRef.current !== session) return
    if (!send) {
      if (!handsFreeRef.current) {
        release(session)
        setPhaseBoth("idle")
        if (mounted.current) {
          setLive("")
          setNote("I didn't hear that. Tap Speak and try again.")
        }
        return
      }
      if (mounted.current) setNote("Still listening. Say something, or tap Stop.")
      setPhaseBoth("listening")
      beginRecorder(session)
      return
    }
    setPhaseBoth("transcribing")
    if (mounted.current) setLive((current) => current || "Turning speech into text…")
    const result = await upload(session, blob)
    if (session.closed || sessionRef.current !== session) return
    if (!result?.text) {
      if (mounted.current) setNote("I couldn't turn that into text. Tap Speak and try again, or type it.")
      if (handsFreeRef.current) {
        setPhaseBoth("listening")
        if (mounted.current) setLive("")
        beginRecorder(session)
        return
      }
      release(session)
      setPhaseBoth("idle")
      if (mounted.current) setLive("")
      return
    }
    if (mounted.current) {
      setLive("")
      setNote(result.browser ? "That used this browser's speech tool, because the studio transcription was unavailable." : null)
    }
    setPhaseBoth("idle")
    try {
      await onUtteranceRef.current(result.text)
    } catch {
      // The chat shows that the message did not go through.
    }
    if (session.closed || sessionRef.current !== session || !handsFreeRef.current) {
      if (!handsFreeRef.current) release(session)
      setPhaseBoth("idle")
      return
    }
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    if (session.closed || sessionRef.current !== session || !handsFreeRef.current) return
    setPhaseBoth("listening")
    if (mounted.current) setLive("")
    try {
      beginRecorder(session)
    } catch {
      release(session)
      setPhaseBoth("idle")
      if (mounted.current) setNote("Tap Speak to keep talking. This browser needs another tap before it can listen again.")
    }
  }

  async function startBrowserOnly() {
    const recognition = getRecognition()
    if (!recognition) {
      if (mounted.current) setNote("This browser cannot use the microphone. You can still type.")
      return
    }
    const token = browserToken.current
    browserRecognitionRef.current = recognition
    let heard = ""
    recognition.onresult = (event) => {
      let text = ""
      for (let index = 0; index < event.results.length; index += 1) {
        text += event.results[index]?.[0]?.transcript ?? ""
      }
      heard = text
      if (mounted.current) setLive(text.trim())
    }
    recognition.onerror = () => {
      if (token !== browserToken.current) return
      if (mounted.current) setNote("The microphone is blocked. Allow it for this site, then tap Speak again. You can still type.")
      setPhaseBoth("idle")
    }
    recognition.onend = () => {
      if (token !== browserToken.current) return
      browserRecognitionRef.current = null
      const text = transcriptText(heard)
      setPhaseBoth("idle")
      if (!text) {
        if (mounted.current) setNote("I didn't hear that. Tap Speak and try again.")
        return
      }
      if (mounted.current) {
        setLive("")
        setNote("That used this browser's speech tool, because the studio transcription was unavailable.")
      }
      void Promise.resolve(onUtteranceRef.current(text))
    }
    try {
      recognition.start()
      setPhaseBoth("listening")
      if (mounted.current) setLive("")
    } catch {
      browserRecognitionRef.current = null
      if (mounted.current) setNote("The microphone did not start. Tap Speak again, or type your message.")
    }
  }

  async function start() {
    if (mounted.current) setNote(null)
    if (phaseRef.current === "listening" || phaseRef.current === "transcribing") return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      await startBrowserOnly()
      return
    }
    try {
      const liveStream = sessionRef.current?.stream.getTracks().some((track) => track.readyState === "live")
        ? sessionRef.current.stream
        : null
      const stream =
        liveStream ||
        (await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
        }))
      const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) throw new Error("no-audio")
      const previous = sessionRef.current
      const ctx = previous && previous.stream === stream && !previous.closed ? previous.ctx : new Ctor()
      if (ctx.state === "suspended") await ctx.resume()
      if (previous && previous.stream !== stream) release(previous)
      const session: Session =
        previous && previous.stream === stream && !previous.closed
          ? previous
          : {
              stream,
              ctx,
              source: null,
              timer: 0,
              recorder: null,
              chunks: [],
              mime: "",
              recognition: null,
              heard: false,
              lastVoice: Date.now(),
              started: Date.now(),
              noise: 0,
              samples: 0,
              browserText: "",
              finishing: false,
              closed: false,
            }
      session.closed = false
      sessionRef.current = session
      setPhaseBoth("listening")
      if (mounted.current) setLive("")
      beginRecorder(session)
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ""
      if (mounted.current) {
        if (name === "NotAllowedError" || name === "SecurityError") {
          setNote("The microphone is blocked. On an iPhone, open Settings, then Safari, then Microphone, and allow this site. On Android, tap the lock by the address bar and allow the microphone. Then tap Speak again.")
        } else if (name === "NotFoundError") {
          setNote("This phone or computer has no microphone the site can use. You can still type.")
        } else {
          setNote("The microphone did not start. Tap Speak again, or type your message.")
        }
      }
      setPhaseBoth("idle")
    }
  }

  function finishCurrent() {
    const session = sessionRef.current
    if (session && phaseRef.current === "listening") {
      void finish(session, session.heard || Boolean(session.browserText.trim()))
      return
    }
    try {
      browserRecognitionRef.current?.stop()
    } catch {
      // The recognizer was already stopped.
    }
  }

  function stop() {
    browserToken.current += 1
    try {
      browserRecognitionRef.current?.stop()
    } catch {
      // The recognizer was already stopped.
    }
    browserRecognitionRef.current = null
    handsFreeRef.current = false
    if (mounted.current) {
      setHandsFreeState(false)
      setLive("")
      setNote(null)
    }
    release(sessionRef.current)
    setPhaseBoth("idle")
  }

  function pause() {
    const session = sessionRef.current
    if (!session || session.closed) return
    session.finishing = true
    window.clearInterval(session.timer)
    try {
      session.recognition?.stop()
    } catch {
      // The recognizer was already stopped.
    }
    session.recognition = null
    const recorder = session.recorder
    if (recorder && recorder.state === "recording") {
      recorder.ondataavailable = null
      recorder.onstop = () => {
        session.finishing = false
      }
      try {
        recorder.stop()
      } catch {
        session.finishing = false
      }
    } else {
      session.finishing = false
    }
    setPhaseBoth("idle")
    if (mounted.current) setLive("")
    if (!handsFreeRef.current) release(session)
  }

  function resume() {
    if (!handsFreeRef.current) return
    if (phaseRef.current !== "idle") return
    const session = sessionRef.current
    if (!session || session.closed || !session.stream.getTracks().some((track) => track.readyState === "live")) {
      void start()
      return
    }
    setPhaseBoth("listening")
    beginRecorder(session)
  }

  function setHandsFree(next: boolean) {
    handsFreeRef.current = next
    if (mounted.current) setHandsFreeState(next)
    if (!next && phaseRef.current === "idle") release(sessionRef.current)
  }

  return { phase, live, note, handsFree, start, finish: finishCurrent, stop, pause, resume, setHandsFree }
}
