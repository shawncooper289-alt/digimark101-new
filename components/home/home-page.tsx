import Link from "next/link"
import { HomeHero } from "@/components/home/home-hero"
import { JsonLd } from "@/components/site/json-ld"
import { faqJsonLd } from "@/lib/seo"
import { caseStudies, formatDate, homeFaqs, method, packages, posts, services } from "@/lib/site"

export function HomePage() {
  return (
    <>
      <JsonLd data={faqJsonLd(homeFaqs)} />
      <HomeHero />

      <section className="dm-rise border-b border-ink/10" aria-labelledby="disciplines-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Eight disciplines</p>
              <h2 id="disciplines-heading" className="display mt-3 text-4xl md:text-6xl">
                One system, switched on with intent.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
              Start with the offer and the page. Then choose the channel that can reach the right people and learn from
              their response. This keeps effort tied to a real next step instead of spreading it across every channel.
            </p>
            <Link href="/services" className="btn btn-ghost">
              All services
            </Link>
          </div>
          <ol className="mt-10 grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex h-full flex-col rounded-[1.4rem] border border-ink/10 bg-card/80 p-5 shadow-[inset_0_1px_0_rgba(234,228,215,0.06)] transition hover:border-signal/50 hover:shadow-[0_0_32px_rgba(203,176,130,0.12)]"
                >
                  <span className="font-serif text-2xl text-signal">{service.index}</span>
                  <span className="mt-3 font-serif text-3xl tracking-tight group-hover:text-signal">{service.name}</span>
                  <span className="mt-2 text-sm leading-relaxed text-ink-soft">{service.summary}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="dm-rise relative overflow-hidden bg-pine text-ink" aria-labelledby="method-heading">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(203,176,130,0.16),transparent_55%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">How an engagement runs</p>
          <h2 id="method-heading" className="display mt-3 max-w-3xl text-4xl md:text-6xl">
            Small enough to finish. Serious enough to keep.
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {method.map((step) => (
              <li key={step.index} className="rounded-[1.4rem] border border-white/10 bg-paper/40 p-5">
                <p className="font-serif text-3xl text-signal">{step.index}</p>
                <h3 className="mt-3 font-serif text-2xl">{step.title}</h3>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-signal">Idea</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.idea}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-signal">How</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.how}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-signal">Why it works</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.why}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="dm-rise border-b border-ink/10" aria-labelledby="work-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Method walkthroughs</p>
            <h2 id="work-heading" className="display mt-3 text-4xl md:text-6xl">
              The sequence, from offer to readout.
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Each walkthrough explains a decision, the work behind it, and what we would measure. No client results
              are published here yet; client names and results appear only with partner approval.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {caseStudies.map((study) => (
              <Link
                key={study.slug}
                href={`/work/${study.slug}`}
                className="flex flex-col rounded-[1.5rem] border border-ink/10 bg-card p-5 hover:border-signal/40"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">The approach</span>
                <h3 className="mt-3 font-serif text-3xl">{study.title}</h3>
                <p className="mt-2 text-sm text-signal">{study.discipline}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{study.summary}</p>
                <span className="mt-6 text-sm font-semibold">Explore the approach</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="dm-rise border-b border-ink/10 bg-paper-deep" aria-labelledby="pricing-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Packages</p>
          <h2 id="pricing-heading" className="display mt-3 max-w-3xl text-4xl md:text-6xl">
            Three ways to hire the studio.
          </h2>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Choose scope by the constraint and the team’s capacity to act. Field isolates one bottleneck, Studio
            connects related disciplines, and Partner builds a sustained working rhythm. We widen the system when
            measurement shows what deserves more attention.
          </p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {packages.map((pkg, index) => (
              <article
                key={pkg.name}
                className={`rounded-[1.5rem] p-6 ${
                  index === 1
                    ? "border border-signal bg-mist shadow-[0_0_40px_rgba(203,176,130,0.16)]"
                    : "border border-ink/10 bg-card"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">{pkg.eyebrow}</p>
                <h3 className="mt-3 font-serif text-4xl">{pkg.name}</h3>
                <p className="mt-3 text-sm leading-relaxed">{pkg.summary}</p>
                <p className="mt-4 border-t border-current/15 pt-3 text-sm leading-relaxed">
                  <span className="font-semibold">Best fit:</span> {pkg.fits}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  <span className="font-semibold text-ink">Why this scope:</span> {pkg.why}
                </p>
                <p className="mt-4 text-sm font-semibold text-ink">{pkg.priceLabel}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {pkg.includes.map((item) => (
                    <li key={item} className="border-t border-current/15 pt-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <Link href="/pricing" className="btn btn-ink mt-8">
            Compare packages
          </Link>
        </div>
      </section>

      <section className="dm-rise border-b border-ink/10" aria-labelledby="journal-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <div className="flex items-end justify-between gap-4">
            <h2 id="journal-heading" className="display text-4xl md:text-5xl">
              Studio notes
            </h2>
            <Link href="/blog" className="text-sm font-semibold text-signal">
              The journal
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-[1.5rem] border border-ink/10 bg-card/60 p-5 hover:border-signal/40">
                <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">{formatDate(post.date)}</p>
                <h3 className="mt-3 font-serif text-2xl leading-tight">{post.title}</h3>
                <p className="mt-3 text-sm text-ink-soft">{post.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="dm-rise" aria-labelledby="faq-heading">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-4">
            <h2 id="faq-heading" className="display text-4xl md:text-5xl">
              Before you write.
            </h2>
          </div>
          <div className="md:col-span-8">
            {homeFaqs.map((faq) => (
              <details key={faq.question} className="faq border-t border-ink/10 py-4">
                <summary className="flex items-center justify-between gap-4 text-lg font-medium">
                  {faq.question}
                  <span aria-hidden="true" className="text-signal">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-ink-soft">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
