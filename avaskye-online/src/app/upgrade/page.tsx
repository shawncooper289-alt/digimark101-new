import { Header } from "@/components/header";
import { SEATS, SITE } from "@/lib/catalog";

export default function UpgradePage() {
  return (
    <div className="min-h-dvh bg-bg">
      <Header />
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Leave the prompt meter. Enter the agency.</p>
        <h1 className="mt-3 max-w-3xl text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Upgrade picks a DigiMark101 seat.</h1>
        <p className="mt-4 max-w-2xl text-muted">Ava Skye Online sells the operator for content and automation drafts. The full belt is priced on DigiMark101.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {SEATS.map((seat) => (
            <article key={seat.id} className="rounded-3xl border border-border bg-surface p-6">
              <p className="text-xs text-subtle">{seat.who}</p>
              <p className="mt-2 text-4xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>${seat.price}<span className="text-base text-muted">/mo</span></p>
              <h2 className="mt-2 text-xl">{seat.name}</h2>
              <p className="mt-3 text-sm text-muted">{seat.gets}</p>
              <a href={`${SITE.agencyPricing}?seat=${seat.id}`} className="mt-6 inline-flex rounded-full bg-accent px-5 py-2 text-sm text-accent-fg">Choose on DigiMark101</a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
