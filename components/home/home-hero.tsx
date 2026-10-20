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
      const tiltX = (0.5 - y) * 7
      const tiltY = (x - 0.5) * 9
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
      className="hero-stage relative isolate flex h-[calc(100svh-4rem)] flex-col overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid h-full w-full max-w-6xl grid-rows-[auto_minmax(10rem,1fr)] items-stretch gap-4 px-5 pb-24 pt-4 lg:grid-cols-12 lg:grid-rows-1 lg:gap-8 lg:px-5 lg:py-8">
        <div className="lg:col-span-7 lg:self-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-signal">DigiMark101</p>
          <h1 className="display mt-3 text-[2.45rem] text-ink sm:text-6xl lg:text-[4.75rem]">
            Own the system.
            <span className="mt-1 block italic text-signal">Build the dynasty.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Search, paid media, social, content, web, email, analytics, and automation, planned as one growth system you keep. Ava Skye is here for the next decision, and she will not invent a result to impress you.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-signal">
              Start a project
            </Link>
            <Link href="/studio" className="btn btn-ink">
              Open the studio
            </Link>
            <OpenAvaButton className="btn btn-ghost">Talk with Ava</OpenAvaButton>
          </div>
          <div className="mt-4">
            <AvaIntroButton />
          </div>
        </div>
        <div className="min-h-0 lg:col-span-5">
          <div className="hero-perspective mx-auto h-full max-h-full w-full max-w-md">
            <div ref={frameRef} className="hero-frame relative h-full min-h-[12rem]">
              <Image
                src="/media/skye-desk-standing.jpg"
                alt="Ava Skye standing at the desk in Skye Studio"
                fill
                priority
                sizes="(min-width: 1024px) 420px, 80vw"
                className="object-cover object-[28%_30%]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper via-paper/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <p className="font-serif text-2xl leading-none text-ink">Ava Skye</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-soft">Studio assistant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
