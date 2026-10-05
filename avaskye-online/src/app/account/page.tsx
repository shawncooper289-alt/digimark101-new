import Link from "next/link";
import { Header } from "@/components/header";
import { PACK, PLANS, SITE } from "@/lib/catalog";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ plan?: string; pack?: string }> }) {
  const query = await searchParams;
  const plan = PLANS.find((item) => item.id === query.plan) || PLANS[0];
  const added = query.pack === "50" ? PACK.prompts : 0;
  return (
    <div className="min-h-dvh bg-bg">
      <Header />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Your Ava</h1>
        <p className="mt-4 text-muted">Choice recorded in this session. Card charge is not live until Stripe is connected. DigiMark101 remains the agency checkout.</p>
        <article className="mt-8 rounded-3xl border border-border bg-surface p-6">
          <p className="text-xs text-subtle">Selected</p>
          <h2 className="mt-2 text-3xl">{plan.name}</h2>
          <p className="mt-2 text-muted">${plan.price}/mo · {plan.prompts + added} prompts this period</p>
          {added ? <p className="mt-2 text-sm text-muted">{PACK.name} added at ${PACK.price}.</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/studio" className="rounded-full bg-accent px-5 py-2 text-sm text-accent-fg">Open studio</Link>
            <a href={SITE.agencyPricing} className="rounded-full border border-border px-5 py-2 text-sm">Upgrade to a seat</a>
          </div>
        </article>
      </section>
    </div>
  );
}
