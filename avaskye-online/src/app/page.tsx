import Link from "next/link";
import { Header } from "@/components/header";
import { PACK, PLANS, SEATS } from "@/lib/catalog";

export default function Home() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Header />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">B2B · avaskye.online</p>
          <h1 className="mt-4 text-5xl leading-tight md:text-6xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>
            Buy Ava.<br />She drafts the work.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Starter Ava writes posts, emails, and pages. Pro Ava adds the follow-up and the automation draft.
            When you want the full agency, you pick a DigiMark101 seat. Same operator. Bigger belt.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pricing" className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg">See Starter and Pro</Link>
            <Link href="/studio" className="rounded-full border border-border px-6 py-3 text-sm">Try a draft</Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-border bg-black">
          <img src="/ava-talk.jpg" alt="Ava Skye" className="aspect-[4/5] w-full object-cover" />
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 md:grid-cols-2">
        {PLANS.map((plan) => (
          <article key={plan.id} className="rounded-3xl border border-border bg-surface p-6">
            <p className="text-xs text-subtle">{plan.who}</p>
            <h2 className="mt-2 text-4xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>{plan.name}</h2>
            <p className="mt-2 text-3xl">${plan.price}<span className="text-base text-muted">/mo</span></p>
            <p className="mt-2 text-sm text-muted">{plan.prompts} prompts included</p>
            <ul className="mt-4 space-y-2 text-sm text-muted">{plan.gets.map((item) => <li key={item}>{item}</li>)}</ul>
            <Link href={`/account?plan=${plan.id}`} className="mt-6 inline-flex rounded-full bg-accent px-5 py-2 text-sm text-accent-fg">Choose {plan.name}</Link>
          </article>
        ))}
      </section>
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-4xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Need more prompts?</h2>
            <p className="mt-3 text-muted">{PACK.name} for ${PACK.price}. They stack on Starter or Pro. They do not replace a seat.</p>
            <Link href="/prompts" className="mt-6 inline-flex rounded-full border border-border px-5 py-2 text-sm">Buy prompts</Link>
          </div>
          <div>
            <h2 className="text-4xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Upgrade is a seat, not a bigger chat.</h2>
            <p className="mt-3 text-muted">Full agency lives on DigiMark101. Starter ${SEATS[0].price}, Growth ${SEATS[1].price}, Agency Command ${SEATS[2].price}.</p>
            <Link href="/upgrade" className="mt-6 inline-flex rounded-full border border-border px-5 py-2 text-sm">Choose a seat</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
