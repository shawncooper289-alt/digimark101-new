"use client"

import { useEffect, useId, useRef, useState } from "react"

export function PlatformVideo({ src, poster }: { src: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const captionId = useId()
  const [started, setStarted] = useState(false)
  const ready = src.length > 0

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (!media.matches) return
    const video = videoRef.current
    if (video) video.autoplay = false
  }, [])

  function play() {
    if (!ready) return
    setStarted(true)
    void videoRef.current?.play()
  }

  return (
    <div className="relative mt-8 aspect-video overflow-hidden rounded-3xl border border-border bg-surface">
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
          <source src={src.replace(/\.mp4$/, ".webm")} type="video/webm" />
          <source src={src} type="video/mp4" />
          <track kind="captions" srcLang="en" label="English" src="/captions/platform-walkthrough.vtt" default />
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
          aria-label={ready ? "Play the DigiMark101 platform walkthrough" : "Platform walkthrough is not connected yet"}
        >
          <span className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" aria-hidden="true" />
          <span className="absolute left-5 top-5 text-xs uppercase tracking-[0.18em] text-accent">{ready ? "Screen recording" : "Not connected"}</span>
          <span id={captionId} className="absolute inset-x-0 bottom-0 p-5 text-sm">
            {ready
              ? "Play the public-site walkthrough. It does not autoplay, and captions are on."
              : "This is a still. The walkthrough plays here when a real recording is connected."}
          </span>
        </button>
      )}
    </div>
  )
}
