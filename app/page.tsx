import Link from 'next/link'
import { platform } from '@/lib/platform-config'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100"><Link className="block px-6 py-3 text-violet-300" href="/workspace">Open Ava workspace (preview)</Link>
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <span className="text-xl font-bold">DigiMark101<span className="text-violet-400"> / Ava Skye</span></span>
        <div className="flex gap-5 text-sm"><a href="#platform">Platform</a><a href="#studio">Ava Studio</a><a href="#beta">Launch status</a></div>
      </nav>
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-violet-300">{platform.stage}</p>
        <h1 className="max-w-4xl text-5xl font-bold leading-tight sm:text-7xl">Your vision. Your brand.<br /><span className="text-violet-400">Ava by your side.</span></h1>
        <p className="mt-8 max-w-2xl text-xl leading-relaxed text-slate-300">We are building a connected business workspace that brings websites, marketing, sales, and automation together—with Ava guiding your next step.</p>
        <a href="#platform" className="mt-10 inline-block rounded-xl bg-violet-500 px-6 py-4 font-semibold text-white hover:bg-violet-400">Explore the planned platform</a>
      </section>
      <section id="platform" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">One partner. Two ways to grow.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">{platform.offers.map(offer => <article key={offer.name} className="rounded-2xl border border-slate-700 bg-slate-900 p-8"><h3 className="text-2xl font-semibold">{offer.name}</h3><p className="mt-4 text-slate-300">{offer.description}</p><p className="mt-6 text-sm text-violet-300">Pricing and availability to be confirmed</p></article>)}</div>
        <h2 className="mt-16 text-3xl font-bold">Designed for your whole journey</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">{platform.modules.map(module => <article id={module.name === 'Ava Studio' ? 'studio' : undefined} key={module.name} className="rounded-2xl border border-slate-800 p-8"><p className="text-xs uppercase tracking-widest text-violet-300">Planned module</p><h3 className="mt-3 text-xl font-semibold">{module.name}</h3><p className="mt-3 text-slate-300">{module.description}</p></article>)}</div>
      </section>
      <section id="beta" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Built around trust and control</h2>
        <p className="mt-6 max-w-3xl text-slate-300">Our implementation requirements include private client memory, approval before publishing or spending, and separate usage meters for text, voice, images, video, and messaging.</p>
        <div className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-6"><h3 className="font-semibold text-amber-200">Not open for purchases yet</h3><p className="mt-2 text-slate-300">This is a product preview, not a working agency dashboard. Checkout, account creation, live Ava integrations, and beta registration are not enabled. Invite-only testing will follow functional and security checks.</p></div>
      </section>
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-400">DigiMark101 · Powered by a vision for Ava Skye · No sales or monetization outcomes are guaranteed.</footer>
    </main>
  )
}
