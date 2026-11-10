"use client"

import Image from "next/image"
import { useRef } from "react"
import { AvaIntroButton } from "@/components/home/ava-intro-button"
import { StartActions } from "@/components/home/start-actions"
import { hero } from "@/lib/home-content"

export function HomeHero() {
  const frameRef = useRef<HTMLDivElement>(null)

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width
    const y = (event.clientY - bounds.top) / bounds.height
    event.currentTarget.style.setProperty("--mx", `${x * 100}%`)
    event.currentTarget.style.setProperty("--my", `${y * 100}%`)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const fine = window.matchMedia("(pointer: fine)").matches
    if (!reduce && fine && frameRef.current) {
      const tiltX = (0.5 - y) * 6
      const tiltY = (x - 0.5) * 8
      frameRef.current.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
    }
  }

  function onPointerLeave(event: React.PointerEvent<HTMLElement>) {
    event.currentTarget.style.removeProperty("--mx")
    event.currentTarget.style.removeProperty("--my")
    if (frameRef.current) frameRef.current.style.transform = ""
  }

  return (
    <section
      className="hero-stage relative isolate overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-signal/5 to-transparent" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-6 px-5 pb-28 pt-5 sm:gap-8 sm:pb-20 sm:pt-6 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-14">
        <div className="lg:col-span-6 lg:col-start-7">
          <div className="hero-perspective mx-auto w-full max-w-lg">
            <div ref={frameRef} className="hero-frame w-full">
              <Image
                src="/media/ava-city.jpg"
                alt="Ava Skye, the DigiMark101 assistant, in a dark studio with the city behind her"
                fill
                preload
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover object-[center_18%]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper via-paper/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="font-serif text-3xl leading-none text-ink">Ava Skye</p>
                <p className="mt-1 text-sm uppercase tracking-[0.18em] text-signal">Your setup guide</p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6 lg:col-start-1 lg:row-start-1">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-signal">{hero.eyebrow}</p>
          <h1 className="display mt-4 text-[2rem] leading-[0.96] text-ink sm:text-5xl lg:text-[4.4rem]">
            {hero.lead}
            <span className="mt-2 block text-signal italic">{hero.accent}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">{hero.lede}</p>
          <div className="mt-8">
            <StartActions />
          </div>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <AvaIntroButton />
            <a href="#what" className="text-sm font-semibold text-signal underline decoration-signal/40 underline-offset-4">
              See what the platform includes
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
