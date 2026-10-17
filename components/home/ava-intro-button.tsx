"use client"

import { useEffect, useRef, useState } from "react"
import { avaIntroScript } from "@/lib/ava/intro"

export function AvaIntroButton() {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  function finish() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    audioRef.current = null
    setPlaying(false)
  }

  function stop() {
    audioRef.current?.pause()
    window.speechSynthesis?.cancel()
    finish()
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      window.speechSynthesis?.cancel()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  async function play() {
    if (playing) {
      stop()
      return
    }
    setError(null)
    setPlaying(true)
    try {
      const response = await fetch("/api/ava/intro")
      const type = response.headers.get("content-type") || ""
      if (response.ok && type.includes("audio")) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = finish
        audio.onerror = () => {
          finish()
          speak()
        }
        await audio.play()
        return
      }
    } catch {
      // The browser voice is the fallback.
    }
    speak()
  }

  function speak() {
    if (!("speechSynthesis" in window)) {
      setPlaying(false)
      setError("This browser cannot play the introduction. The words are written below.")
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(avaIntroScript)
    utterance.rate = 1
    utterance.onend = finish
    utterance.onerror = finish
    window.speechSynthesis.speak(utterance)
    setPlaying(true)
  }

  return (
    <div className="max-w-xs">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-signal px-3 py-2 text-sm font-semibold text-[#14110c] shadow-[0_0_24px_rgba(203,176,130,0.35)]"
        aria-pressed={playing}
        aria-label={playing ? "Stop Ava Skye's introduction" : "Play Ava Skye's introduction"}
        onClick={() => void play()}
      >
        <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-[#14110c] text-signal">
          {playing ? (
            <span className="block h-2.5 w-2.5 rounded-[2px] bg-current" />
          ) : (
            <span className="ml-0.5 block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-current" />
          )}
        </span>
        {playing ? "Stop Ava" : "Hear Ava"}
      </button>
      {error ? <p className="mt-2 text-xs text-signal">{error}</p> : null}
      <details className="mt-2 text-left text-xs leading-relaxed text-ink">
        <summary className="cursor-pointer text-ink-soft">Read the introduction</summary>
        <p className="mt-2 rounded-2xl bg-paper/75 p-3 text-ink">{avaIntroScript}</p>
      </details>
    </div>
  )
}
