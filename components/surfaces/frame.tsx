import Link from "next/link"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"

export function SurfaceFrame({
  eyebrow,
  title,
  lede,
  signInHref,
  agencyHref,
  children,
}: {
  eyebrow: string
  title: string
  lede: string
  signInHref: string
  agencyHref: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-paper text-ink">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href={agencyHref} aria-label="DigiMark101">
            <DigiMarkLogo variant="paper" compact />
          </Link>
          <nav className="flex items-center gap-4 text-sm" aria-label="Surface">
            <Link className="text-ink-soft hover:text-ink" href={agencyHref}>
              Agency
            </Link>
            <Link className="btn btn-ghost" href={signInHref}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main id="main">
        <section className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">{eyebrow}</p>
          <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-soft">{lede}</p>
        </section>
        {children}
      </main>
    </div>
  )
}
