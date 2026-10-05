import Link from "next/link";
import { Header } from "@/components/header";
import { PACK } from "@/lib/catalog";

export default function PromptsPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <Header />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Buy more prompts</h1>
        <p className="mt-4 text-muted">Prompts are the meter on this site. A seat on DigiMark101 is the upgrade when you want the tools, not just more drafts.</p>
        <article className="mt-8 rounded-3xl border border-border bg-surface p-6">
          <p className="text-4xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>${PACK.price}</p>
          <h2 className="mt-2 text-2xl">{PACK.name}</h2>
          <p className="mt-3 text-sm text-muted">Stacks on Starter Ava or Pro Ava. Unused prompts roll for 30 days. They do not unlock phone, funnels, or client workspaces.</p>
          <Link href="/account?pack=50" className="mt-6 inline-flex rounded-full bg-accent px-5 py-2 text-sm text-accent-fg">Add 50 prompts</Link>
        </article>
      </section>
    </div>
  );
}
