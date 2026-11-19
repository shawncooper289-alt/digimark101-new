"use client"

import { useEffect, useId, useRef, useState } from "react"

type PlatformVideoProps = {
  src: string
  webm?: string
  poster: string
  captions: string
  title: string
  emptyLabel?: string
}

export function PlatformVideo({ src, webm = "", poster, captions, title, emptyLabel }: PlatformVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const captionId = useId()
  const [started, setStarted] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const ready = src.length > 0

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setReduceMotion(media.matches)
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [])

  function play() {
    if (!ready) return
    const video = videoRef.current
    if (!video) return
    video.muted = false
    setStarted(true)
    void video.play()
  }

  return (
    <div className="relative aspect-video w-full bg-paper">
      {ready ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full bg-black object-contain"
          controls={started}
          playsInline
          preload="metadata"
          poster={poster}
          aria-labelledby={captionId}
        >
          {webm ? <source src={webm} type="video/webm" /> : null}
          <source src={src} type={src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
          <track kind="captions" srcLang="en" label="English" src={captions} default />
        </video>
      ) : (
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {started ? null : (
        <button
          type="button"
          className="absolute inset-0 block w-full text-left"
          onClick={play}
          disabled={!ready}
          aria-disabled={!ready}
          aria-label={ready ? `Play ${title}` : `${title} is not connected yet`}
        >
          <span className="absolute inset-0 bg-gradient-to-t from-paper via-paper/25 to-paper/10" aria-hidden="true" />
          <span className="absolute left-5 top-5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-signal">
            {ready ? "Screen recording" : "Not connected"}
          </span>
          <span
            className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-signal/50 bg-paper/80 text-signal"
            data-reduced-motion={reduceMotion ? "true" : "false"}
            aria-hidden="true"
          >
            <span className="ml-1 block h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-current" />
          </span>
          <span className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <span id={captionId} className="block font-serif text-3xl text-ink">
              {title}
            </span>
            <span className="mt-1 block max-w-md text-sm text-ink-soft">
              {ready
                ? "No narration. Captions describe the pages. It does not autoplay."
                : emptyLabel || "This frame is a still. A walkthrough plays here when a real recording is connected."}
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
