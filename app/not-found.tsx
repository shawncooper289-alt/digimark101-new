import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">404</p>
      <h1 className="display mt-4 text-5xl md:text-7xl">This page is not in the index.</h1>
      <p className="mt-4 text-lg text-ink-soft">The link may be old, or the page was never published. The studio is still here.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-signal">
          Back home
        </Link>
        <Link href="/contact" className="btn btn-ghost">
          Contact
        </Link>
      </div>
    </div>
  )
}
