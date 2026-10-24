"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { OpenAvaButton } from "@/components/ava/open-ava-button"
import { AvaIntroButton } from "@/components/home/ava-intro-button"

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
      const tiltX = (0.5 - y) * 8
      const tiltY = (x - 0.5) * 10
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
      className="hero-stage relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-signal/5 to-transparent pointer-events-none" aria-hidden="true" />
      <div className="relative mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_minmax(12rem,1fr)] items-center gap-6 px-5 pb-20 pt-6 lg:grid-cols-12 lg:grid-rows-1 lg:gap-12 lg:px-8 lg:py-12">
        <div className="lg:col-span-6 lg:self-center z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-signal">DigiMark101</p>
          <h1 className="display mt-4 text-[2.6rem] text-ink sm:text-6xl lg:text-[5rem] leading-[0.95]">
            Own the system.
            <span className="mt-2 block italic text-signal">Shape what comes next.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            One growth system for search, paid media, social, content, web, email, analytics, and automation—planned together, measured openly, and built so you keep it. Ava Skye is here for the next clear step. No invented results. Just a path you can follow and own.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/start" className="btn btn-signal text-base px-6 py-3">
              Start the first campaign
            </Link>
            <Link href="/studio" className="btn btn-ink text-base px-6 py-3">
              Open the studio
            </Link>
            <OpenAvaButton className="btn btn-ghost text-base px-6 py-3">Talk with Ava</OpenAvaButton>
          </div>
          <div className="mt-6">
            <AvaIntroButton />
          </div>
        </div>
        <div className="min-h-0 lg:col-span-6 flex items-center justify-center">
          <div className="hero-perspective relative mx-auto h-full w-full max-w-lg">
            <div ref={frameRef} className="hero-frame relative h-[28rem] sm:h-[36rem] lg:h-[42rem] w-full overflow-hidden rounded-[1.8rem]">
              <Image
                src="/media/ava-skye-hero.jpg"
                alt="Ava Skye, studio assistant for DigiMark101"
                fill
                priority
                sizes="(min-width: 1024px) 520px, 90vw"
                className="object-cover object-center"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper/80 via-paper/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-serif text-3xl leading-none text-ink">Ava Skye</p>
                <p className="mt-1 text-sm uppercase tracking-[0.18em] text-signal">Studio assistant</p>
              </div>
              <div className="pointer-events-none absolute -inset-1 rounded-[1.9rem] border border-signal/30 shadow-[0_0_60px_rgba(203,176,130,0.25)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
