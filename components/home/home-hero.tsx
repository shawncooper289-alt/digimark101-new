"use client"

import Image from "next/image"
import { useRef } from "react"
import { AvaIntroButton } from "@/components/home/ava-intro-button"
import { StartActions } from "@/components/home/start-actions"
import { hero } from "@/lib/home-content"

const assurances = [
  "You say yes before it is saved",
  "One login for the work",
  "No invented results",
]

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
      const tiltX = (0.5 - y) * 2.5
      const tiltY = (x - 0.5) * 3
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
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-[90rem] lg:min-h-[calc(100svh-4rem)] lg:grid-cols-12">
        <div className="hero-perspective relative order-1 min-h-[13.75rem] sm:min-h-[22rem] lg:order-2 lg:col-span-7 lg:min-h-full">
          <div ref={frameRef} className="hero-portrait absolute inset-0 lg:inset-y-8 lg:right-8 lg:left-4 lg:rounded-[1.8rem] lg:border lg:border-signal/40 lg:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <Image
              src="/media/ava-city.jpg"
              alt="Ava Skye, in a blazer, in a dark studio with the city behind her"
              fill
              preload
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="hero-still object-cover object-[center_16%]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper via-paper/15 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-paper/80" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
              <div>
                <p className="font-serif text-4xl leading-none text-ink sm:text-5xl">Ava Skye</p>
                <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-signal">Pronounced AY-vuh · Your setup guide</p>
              </div>
            </div>
          </div>
        </div>
        <div className="order-2 flex flex-col justify-center px-5 py-6 sm:px-8 sm:py-10 lg:order-1 lg:col-span-5 lg:px-10 lg:py-16">
          <p className="home-kicker">{hero.eyebrow}</p>
          <h1 className="display mt-3 max-w-[12ch] text-[2.35rem] text-ink sm:text-6xl lg:text-[4.6rem]">
            {hero.lead}
          </h1>
          <p className="mt-4 max-w-[16ch] font-serif text-[1.7rem] leading-[1.05] text-signal sm:text-4xl">{hero.accent}</p>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft max-sm:pr-24 sm:mt-6 sm:text-lg">{hero.lede}</p>
          <div className="mt-8">
            <StartActions />
          </div>
          <ul className="mt-8 grid gap-3 border-t border-signal/30 pt-5 sm:grid-cols-3">
            {assurances.map((item) => (
              <li key={item} className="text-sm leading-snug text-ink">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <AvaIntroButton />
            <a href="#meet" className="text-sm font-semibold text-signal underline decoration-signal/40 underline-offset-4">
              Meet Ava
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
