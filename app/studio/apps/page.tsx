import type { Metadata } from "next"
import { CatalogBoard } from "@/components/studio/catalog-board"
import { paypalClientId } from "@/lib/paypal/config"

export const metadata: Metadata = {
  title: "Apps",
  robots: { index: false, follow: false },
}

export default function AppsPage() {
  const paypalReady = Boolean(paypalClientId())
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">Apps and automatic notes</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        These are the tools a marketing workspace can use, and the small rules Studio can run. Works now means you can use it here. Connect means the link is ready, and the next page tells you if a key is still missing. Coming soon is on the list so you can see it. It does not run, send, or charge anything.
      </p>
      <div className="mt-8">
        <CatalogBoard paypalReady={paypalReady} />
      </div>
    </section>
  )
}
