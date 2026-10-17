"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { nav } from "@/lib/site"

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" aria-label="DigiMark101 home" onClick={() => setOpen(false)}>
          <DigiMarkLogo variant="paper" />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm ${isActive(pathname, item.href) ? "text-signal" : "text-ink-soft hover:text-ink"}`}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/contact" className="btn btn-signal hidden sm:inline-flex">
            Start a project
          </Link>
          <button
            type="button"
            className="btn btn-ghost lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-ink/10 px-5 py-4 lg:hidden" aria-label="Mobile">
          <ul className="grid gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-xl px-3 py-3 text-lg hover:bg-paper-deep"
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className="btn btn-signal mt-2 w-full" onClick={() => setOpen(false)}>
                Start a project
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
