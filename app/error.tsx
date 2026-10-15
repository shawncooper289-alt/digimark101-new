"use client"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Something broke</p>
      <h1 className="display mt-4 text-5xl">The page did not finish loading.</h1>
      <p className="mt-4 text-lg text-ink-soft">Try it again. If it keeps failing, email hello@digimark101.com.</p>
      <button type="button" className="btn btn-signal mt-8" onClick={() => reset()}>
        Try again
      </button>
    </div>
  )
}
