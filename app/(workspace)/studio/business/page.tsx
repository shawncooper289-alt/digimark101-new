import { BusinessSetup } from "@/components/studio/business-setup"

export default function Page() {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">Business setup</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">Legal and business details Ava and your campaigns can rely on. Only you can read them.</p>
      <div className="mt-8">
        <BusinessSetup />
      </div>
    </section>
  )
}
