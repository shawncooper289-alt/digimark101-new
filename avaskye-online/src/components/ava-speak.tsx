"use client"

import { useDictate } from "@/components/use-dictate"

export function AvaSpeak({ onText, disabled = false }: { onText: (text: string) => Promise<void> | void; disabled?: boolean }) {
  const dictate = useDictate(onText)
  const listening = dictate.phase === "listening"
  const liveLine =
    dictate.phase === "listening"
      ? dictate.live
        ? `Heard: ${dictate.live}`
        : "Listening…"
      : dictate.phase === "transcribing"
        ? "Turning speech into text…"
        : ""

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="rounded-full bg-accent px-4 py-2.5 text-sm text-accent-fg"
        aria-pressed={listening}
        aria-label={listening ? "Done talking" : "Speak to Ava"}
        disabled={disabled || dictate.phase === "transcribing"}
        onClick={() => {
          if (listening) {
            dictate.finish()
            return
          }
          void dictate.start()
        }}
      >
        {listening ? "Done" : dictate.phase === "transcribing" ? "Hearing…" : "Speak"}
      </button>
      <button
        type="button"
        className="rounded-full border border-border px-4 py-2.5 text-sm"
        aria-pressed={dictate.handsFree}
        aria-label={dictate.handsFree ? "Turn hands-free off" : "Start hands-free conversation"}
        onClick={() => {
          const next = !dictate.handsFree
          dictate.setHandsFree(next)
          if (next) void dictate.start()
          else if (listening) dictate.finish()
          else dictate.stop()
        }}
      >
        {dictate.handsFree ? "Hands-free on" : "Hands-free"}
      </button>
      {listening || dictate.handsFree || dictate.phase === "transcribing" ? (
        <button type="button" className="rounded-full border border-border px-4 py-2.5 text-sm" aria-label="Stop Ava and stop the microphone" onClick={() => dictate.stop()}>
          Stop
        </button>
      ) : null}
      <p className="basis-full text-xs" role="status" aria-live="polite">
        {liveLine}
      </p>
      {dictate.note ? <p className="basis-full text-xs">{dictate.note}</p> : null}
    </div>
  )
}
