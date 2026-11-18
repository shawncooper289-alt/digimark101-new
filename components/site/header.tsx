import Link from "next/link"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { TrackedLink } from "@/components/site/tracked-link"
import { nav } from "@/lib/site"

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5">
        <Link href="/" prefetch={false} aria-label="DigiMark101 home">
          <DigiMarkLogo variant="paper" compact />
        </Link>
        <nav className="hidden items-center gap-4 xl:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} prefetch={false} className="whitespace-nowrap text-sm text-ink-soft hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <TrackedLink href="/contact" event="header_contact" className="btn btn-ghost">
            Contact
          </TrackedLink>
          <Link href="/login" prefetch={false} className="btn btn-ghost">
            Log in
          </Link>
          <TrackedLink href="/signup" event="header_signup" className="btn btn-ghost">
            Create account
          </TrackedLink>
          <TrackedLink href="/beta" event="header_beta" className="btn btn-signal">
            Free beta seat
          </TrackedLink>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <TrackedLink href="/beta" event="header_beta" className="btn btn-signal px-3">
            Free beta
          </TrackedLink>
          <details className="nav-disclosure relative">
            <summary className="btn btn-ghost cursor-pointer px-3">Menu</summary>
            <nav
              id="mobile-nav"
              className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-ink/10 bg-paper p-3 shadow-xl"
              aria-label="Mobile"
            >
              <ul className="grid gap-1">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} prefetch={false} className="block rounded-xl px-3 py-3 text-lg hover:bg-paper-deep">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <TrackedLink href="/contact" event="header_contact" className="btn btn-ghost mt-2 w-full">
                    Talk to a person
                  </TrackedLink>
                </li>
                <li>
                  <Link href="/login" prefetch={false} className="btn btn-ghost mt-2 w-full">
                    Log in
                  </Link>
                </li>
                <li>
                  <TrackedLink href="/signup" event="header_signup" className="btn btn-ghost mt-2 w-full">
                    Create an account
                  </TrackedLink>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
