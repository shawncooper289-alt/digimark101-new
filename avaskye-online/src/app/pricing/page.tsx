import Link from "next/link";
import { Header } from "@/components/header";
import { PLANS } from "@/lib/catalog";

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <Header />
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Choose your Ava seat</h1>
        <p className="mt-4 max-w-xl text-muted">USD per person per month. All tiers include full Ava knowledge and creative skills. Agency automation and API access are separate upgrades. Billing and usage enforcement are not yet live.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article key={plan.id} className="rounded-3xl border border-border bg-surface p-6">
              <p className="text-xs text-subtle">{plan.who}</p>
              <p className="mt-2 text-4xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>${plan.price}<span className="text-base text-muted">/seat/mo</span></p>
              <h2 className="mt-2 text-2xl">{plan.name}</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">{plan.gets.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link href={`/account?plan=${plan.id}`} className="mt-6 inline-flex rounded-full bg-accent px-5 py-2 text-sm text-accent-fg">View {plan.name}</Link>
            </article>
          ))}
        </div>
        <p className="mt-8 text-muted">Included credits reset monthly. Extra usage: $10 / 300 credits, $25 / 900, $50 / 2,000. No automatic overages. Usage is weighted by task complexity, not one credit per prompt. Allowances are provisional pending cost testing. Purchased credits remain while subscribed. Checkout unavailable.</p>
      </section>
    </div>
  );
}
