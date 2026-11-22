import Link from "next/link"
import { ArrowRight, CalendarDays, Check, ChevronDown, FileText, FolderOpen, GitBranch, Users } from "lucide-react"
import { TrackedLink } from "@/components/site/tracked-link"
import { homeFaqs } from "@/lib/home-content"
import { packages, services } from "@/lib/site"

const workspaceTools = [
  { icon: Users, title: "People, in one place", body: "Keep contacts, companies, and notes organized in your workspace." },
  { icon: GitBranch, title: "A clearer pipeline", body: "Track deals from the first conversation to won or lost." },
  { icon: FileText, title: "Room for the next idea", body: "Draft emails, social posts, and page plans with Ava’s help." },
  { icon: CalendarDays, title: "Stay on top of the week", body: "Keep appointments, tasks, and files close to the work." },
]

export function HomeSections() {
  return (
    <>
      <div className="border-b border-ink/10 bg-paper-deep/50">
        <ul className="mx-auto grid max-w-6xl gap-5 px-5 py-7 text-sm text-ink-soft sm:grid-cols-3">
          {["Built for small businesses", "Guided by Ava. Approved by you.", "Remote studio · United States"].map((text) => (
            <li key={text} className="flex items-center gap-3"><span className="h-1 w-1 rounded-full bg-signal" aria-hidden="true" />{text}</li>
          ))}
        </ul>
      </div>

      <section id="what" className="border-b border-ink/10" aria-labelledby="what-heading">
        <div className="home-wrap">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="home-kicker">Two ways to move forward</p>
              <h2 id="what-heading" className="home-title">Your ambition.<br />A more connected plan.</h2>
            </div>
            <p className="self-end text-lg leading-relaxed text-ink-soft">Build your own marketing rhythm in Studio, or bring us in for hands-on help. Start with what your business needs today. Add more when you’re ready.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="home-card flex flex-col items-start !p-7 sm:!p-9">
              <FolderOpen className="text-signal" size={28} strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-8 text-xs uppercase tracking-[0.18em] text-signal">The platform · Free beta</p>
              <h3 className="mt-3 font-serif text-3xl">Run your own Studio.</h3>
              <p className="mb-7 mt-4 text-ink-soft">One workspace for your people, pipeline, and marketing drafts. Ava helps with setup, and you confirm before a change is saved.</p>
              <Link href="/studio" prefetch={false} className="home-text-link mt-auto">Preview the workspace <ArrowRight size={17} aria-hidden="true" /></Link>
            </article>
            <article className="home-card flex flex-col items-start !p-7 sm:!p-9">
              <GitBranch className="text-signal" size={28} strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-8 text-xs uppercase tracking-[0.18em] text-signal">The agency · Custom proposals</p>
              <h3 className="mt-3 font-serif text-3xl">Build with a marketing team.</h3>
              <p className="mb-7 mt-4 text-ink-soft">Search, creative, websites, and follow-up, planned around your offer. A written scope keeps the work and the next step clear.</p>
              <Link href="/services" prefetch={false} className="home-text-link mt-auto">Explore our services <ArrowRight size={17} aria-hidden="true" /></Link>
            </article>
          </div>
        </div>
      </section>

      <section id="disciplines" className="border-b border-ink/10 bg-paper-deep/40" aria-labelledby="services-heading">
        <div className="home-wrap">
          <p className="home-kicker">The marketing studio</p>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <h2 id="services-heading" className="home-title">Good marketing works together.</h2>
            <Link href="/work" prefetch={false} className="home-text-link shrink-0">Explore sample approaches <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <p className="home-lede">Start with one discipline, or connect several around a shared plan. Our work examples illustrate the approach, not client results.</p>
          <ul className="mt-10 grid gap-x-10 md:grid-cols-2">
            {services.map((service) => (
              <li key={service.slug} className="border-t border-ink/15">
                <Link href={`/services/${service.slug}`} prefetch={false} className="group flex h-full gap-5 py-6">
                  <span className="pt-1 text-xs text-signal" aria-hidden="true">{service.index}</span>
                  <div className="flex-1"><h3 className="font-serif text-2xl group-hover:text-signal">{service.name}</h3><p className="mt-2 text-sm leading-relaxed text-ink-soft">{service.summary}</p></div>
                  <ArrowRight size={18} className="mt-2 shrink-0 text-ink-soft transition-transform group-hover:translate-x-1 group-hover:text-signal" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className="border-b border-ink/10" aria-labelledby="features-heading">
        <div className="home-wrap grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="home-kicker">Inside your workspace</p>
            <h2 id="features-heading" className="home-title">Less scattered.<br />More in motion.</h2>
            <p className="home-lede">Keep the details behind your marketing in one place. Let Ava help with the draft while you stay in control of what’s saved.</p>
            <Link href="/studio" prefetch={false} className="home-text-link mt-6">Take a look inside Studio <ArrowRight size={17} aria-hidden="true" /></Link>
            <aside className="mt-8 rounded-2xl border border-signal/20 bg-signal/5 p-5 text-sm leading-relaxed text-ink-soft" aria-label="Beta capabilities">
              <p className="font-semibold text-ink">A working beta, with clear limits.</p>
              <p className="mt-2">Email campaigns and social posts stay drafts. Page plans are not published sites. Sending, social publishing, and the visual page builder are not connected yet.</p>
            </aside>
          </div>
          <ul className="grid content-start gap-7">
            {workspaceTools.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-5 border-b border-ink/10 pb-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-signal/20 bg-signal/5 text-signal"><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></span>
                <div><h3 className="font-serif text-2xl">{title}</h3><p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="border-b border-ink/10 bg-paper-deep/40" aria-labelledby="how-heading">
        <div className="home-wrap">
          <p className="home-kicker">A simple place to start</p>
          <h2 id="how-heading" className="home-title">One next step. Not another long to-do list.</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              ["Choose your starting point", "Preview Studio, join the free beta, or tell the agency what you’re working toward."],
              ["Make the plan concrete", "Let Ava guide your setup, or agree a written scope with the studio. Start with one useful piece."],
              ["Review, then move forward", "Check the draft before you save. Keep your people, plans, and next steps together as you grow."],
            ].map(([title, body], index) => (
              <li key={title} className="border-t border-signal/30 pt-5"><span className="text-xs tracking-widest text-signal">0{index + 1}</span><h3 className="mt-5 font-serif text-2xl">{title}</h3><p className="mt-3 text-sm leading-relaxed text-ink-soft">{body}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section id="plans" className="border-b border-ink/10" aria-labelledby="plans-heading">
        <div className="home-wrap">
          <p className="home-kicker">Hands-on help</p>
          <h2 id="plans-heading" className="home-title">The right scope.<br />Not every service at once.</h2>
          <p className="home-lede">Agency work is separate from the free platform beta. Each engagement starts with a proposal, so you know what’s included before you commit.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {packages.map((plan) => (
              <article key={plan.name} className="home-card flex flex-col !p-7">
                <p className="text-xs uppercase tracking-[0.16em] text-signal">{plan.eyebrow}</p>
                <h3 className="mt-4 font-serif text-3xl">{plan.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{plan.summary}</p>
                <ul className="my-6 grid gap-3 text-sm text-ink-soft">{plan.includes.slice(0, 3).map((item) => <li key={item} className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-signal" aria-hidden="true" />{item}</li>)}</ul>
                <p className="mt-auto border-t border-ink/10 pt-5 text-sm">{plan.priceLabel}</p>
                <Link href="/contact" prefetch={false} className="home-text-link mt-4 text-sm">Discuss {plan.name} <ArrowRight size={16} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
          <Link href="/pricing" prefetch={false} className="home-text-link mt-7 text-sm">View all pricing and membership details <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>

      <section id="faq" className="border-b border-ink/10" aria-labelledby="faq-heading">
        <div className="home-wrap grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div><p className="home-kicker">Before you begin</p><h2 id="faq-heading" className="home-title">A few good questions.</h2><Link href="/contact" prefetch={false} className="home-text-link mt-6">Ask us something else <ArrowRight size={17} aria-hidden="true" /></Link></div>
          <div>{homeFaqs.map((faq) => (
            <details key={faq.question} className="home-faq group border-b border-ink/15 py-5 first:border-t">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-5 text-base font-semibold"><span>{faq.question}</span><ChevronDown size={18} className="shrink-0 text-signal transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
              <p className="pb-2 pt-3 text-sm leading-relaxed text-ink-soft">{faq.answer}</p>
            </details>
          ))}</div>
        </div>
      </section>

      <section className="home-hero" aria-labelledby="start-heading">
        <div className="home-wrap text-center">
          <p className="home-kicker">Your next chapter</p>
          <h2 id="start-heading" className="home-title mx-auto">Make room for what’s next.</h2>
          <p className="home-lede mx-auto">Try the workspace for yourself, or talk to us about the marketing your business needs.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <TrackedLink href="/beta" event="closing_beta" className="btn btn-signal">Explore the free beta <ArrowRight size={17} aria-hidden="true" /></TrackedLink>
            <TrackedLink href="/contact" event="closing_contact" className="btn btn-ghost">Work with the studio</TrackedLink>
          </div>
          <p className="mt-4 text-xs text-ink-soft">Free beta access. Agency services quoted separately.</p>
        </div>
      </section>
    </>
  )
}
