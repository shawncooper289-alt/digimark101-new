"use client"

import Image from "next/image"
import { useRef, useState } from "react"

export function MeetAvaPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const ready = src.length > 0

  function play() {
    if (!ready) return
    setStarted(true)
    void videoRef.current?.play()
  }

  return (
    <div className="relative aspect-video w-full bg-paper">
      {ready ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full bg-black object-cover"
          controls={started}
          playsInline
          preload="none"
          poster="/media/ava-city.jpg"
          src={src}
          aria-label="Meet Ava, a short film about DigiMark101"
        >
          <track kind="captions" srcLang="en" label="English" src="/captions/ava-intro.vtt" default />
          <track kind="chapters" srcLang="en" label="Chapters" src="/captions/ava-intro-chapters.vtt" />
        </video>
      ) : (
        <Image
          src="/media/ava-city.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 720px, 100vw"
          className="object-cover object-[center_18%]"
        />
      )}
      {started ? null : (
        <button
          type="button"
          className="meet-poster absolute inset-0 block w-full text-left"
          onClick={play}
          disabled={!ready}
          aria-disabled={!ready}
          aria-label={ready ? "Play Meet Ava" : "Meet Ava video coming soon"}
        >
          <span className="absolute inset-0 bg-gradient-to-t from-paper via-paper/25 to-paper/10" aria-hidden="true" />
          <span className="absolute left-5 top-5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-signal">
            {ready ? "About 3 minutes" : "Coming soon"}
          </span>
          <span className="meet-play" aria-hidden="true">
            <span />
          </span>
          <span className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <span className="block font-serif text-3xl text-ink">Ava Skye</span>
            <span className="mt-1 block text-sm text-ink-soft">
              {ready ? "Play with sound. Captions and chapters are on." : "The film will play here when the video file is connected."}
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
