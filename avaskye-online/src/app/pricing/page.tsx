import Link from "next/link";
import { Header } from "@/components/header";
import { PLANS } from "@/lib/catalog";

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <Header />
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Starter Ava and Pro Ava</h1>
        <p className="mt-4 max-w-xl text-muted">Content first. Automation when the follow-up is the bottleneck. Checkout records the choice. Live card charge still needs Shawn’s Stripe keys.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {PLANS.map((plan) => (
            <article key={plan.id} className="rounded-3xl border border-border bg-surface p-6">
              <p className="text-xs text-subtle">{plan.who}</p>
              <p className="mt-2 text-4xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>${plan.price}<span className="text-base text-muted">/mo</span></p>
              <h2 className="mt-2 text-2xl">{plan.name}</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">{plan.gets.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link href={`/account?plan=${plan.id}`} className="mt-6 inline-flex rounded-full bg-accent px-5 py-2 text-sm text-accent-fg">Start {plan.name}</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
