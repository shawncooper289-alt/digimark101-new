"use client"

import { useEffect, useState } from "react"
import { avaIntroScript } from "@/lib/ava/intro"
import { DEVICE_VOICE_NOTE, prepareAvaSpeech, speakAva, stopAvaSpeech } from "@/lib/ava/speech"

export function AvaIntroButton() {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => stopAvaSpeech()
  }, [])

  function play() {
    if (playing) {
      stopAvaSpeech()
      setPlaying(false)
      return
    }
    prepareAvaSpeech()
    setError(null)
    setPlaying(true)
    void speakAva(avaIntroScript, () => setPlaying(false)).then((result) => {
      if (result.status === "failed") {
        setPlaying(false)
        setError("This browser cannot play the introduction. The words are written below.")
      } else if (result.voice === "device") {
        setError(DEVICE_VOICE_NOTE)
      }
    })
  }

  return (
    <div className="max-w-xs">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-signal px-3 py-2 text-sm font-semibold text-[#14110c] shadow-[0_0_24px_rgba(203,176,130,0.35)]"
        aria-pressed={playing}
        aria-label={playing ? "Stop Ava Skye's introduction" : "Play Ava Skye's introduction"}
        onClick={play}
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
