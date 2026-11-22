"use client"

import Link from "next/link"
import { useRef } from "react"
import { ChevronDown } from "lucide-react"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { TrackedLink } from "@/components/site/tracked-link"
import { nav } from "@/lib/site"

const primaryNav = nav.filter((item) => ["/services", "/work", "/pricing", "/about"].includes(item.href))

export function Header() {
  const menu = useRef<HTMLDetailsElement>(null)

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-lg">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-5">
        <Link href="/" prefetch={false} aria-label="DigiMark101 home" className="shrink-0">
          <DigiMarkLogo variant="paper" compact className="[&_img]:h-8 sm:[&_img]:h-10" />
        </Link>
        <nav className="hidden items-center gap-7 xl:flex" aria-label="Primary">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} prefetch={false} className="inline-flex min-h-11 items-center text-sm text-ink-soft hover:text-signal">
              {item.label}
            </Link>
          ))}
          <Link href="/studio" prefetch={false} className="inline-flex min-h-11 items-center text-sm text-ink-soft hover:text-signal">Studio</Link>
        </nav>
        <div className="hidden items-center gap-5 xl:flex">
          <Link href="/login" prefetch={false} className="inline-flex min-h-11 items-center text-sm text-ink-soft hover:text-signal">Log in</Link>
          <TrackedLink href="/beta" event="header_beta" className="btn btn-signal">Explore free beta</TrackedLink>
        </div>
        <details
          ref={menu}
          className="nav-disclosure relative xl:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape" && menu.current?.open) {
              menu.current.open = false
              menu.current.querySelector("summary")?.focus()
            }
          }}
        >
          <summary className="btn btn-ghost cursor-pointer px-4">Menu <ChevronDown size={15} aria-hidden="true" /></summary>
          <nav
            className="absolute right-0 top-14 z-50 max-h-[calc(100dvh-7rem)] w-[min(20rem,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl border border-ink/15 bg-paper p-3 shadow-2xl"
            aria-label="Pages"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a") && menu.current) menu.current.open = false
            }}
          >
            <ul className="grid gap-1">
              {nav.map((item) => (
                <li key={item.href}><Link href={item.href} prefetch={false} className="block rounded-xl px-3 py-2.5 text-base hover:bg-paper-deep hover:text-signal">{item.label}</Link></li>
              ))}
              <li><Link href="/studio" prefetch={false} className="block rounded-xl px-3 py-2.5 text-base hover:bg-paper-deep hover:text-signal">Preview Studio</Link></li>
              <li><Link href="/contact" prefetch={false} className="block rounded-xl px-3 py-2.5 text-base hover:bg-paper-deep hover:text-signal">Contact</Link></li>
              <li className="mt-2 border-t border-ink/10 pt-3"><Link href="/login" prefetch={false} className="btn btn-ghost w-full">Log in</Link></li>
              <li><TrackedLink href="/beta" event="header_beta" className="btn btn-signal mt-2 w-full">Explore free beta</TrackedLink></li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  )
}
