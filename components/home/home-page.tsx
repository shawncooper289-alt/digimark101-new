import Link from "next/link"
import { OpenAvaButton } from "@/components/ava/open-ava-button"
import { AvaAvatar } from "@/components/branding/ava-avatar"
import { JsonLd } from "@/components/site/json-ld"
import { PlaceholderNote } from "@/components/site/placeholder-note"
import { faqJsonLd } from "@/lib/seo"
import { caseStudies, formatDate, homeFaqs, method, packages, posts, services } from "@/lib/site"

export function HomePage() {
  return (
    <>
      <JsonLd data={faqJsonLd(homeFaqs)} />
      <section className="field-grid border-b border-ink/10">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-signal">Studio 01 — DigiMark101</p>
            <h1 className="display mt-5 text-[3.4rem] text-ink sm:text-7xl lg:text-[5.6rem]">
              Marketing that holds up in the <span className="italic text-signal">numbers.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              DigiMark101 plans, makes, and measures growth across search, paid media, social, content, web, email, analytics, and AI automation. Ava Skye is here when you want a clear recommendation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-signal">
                Start a project
              </Link>
              <Link href="/studio" className="btn btn-ink">
                Open the studio
              </Link>
              <OpenAvaButton className="btn btn-ghost">Talk with Ava</OpenAvaButton>
            </div>
          </div>
          <aside className="flex flex-col justify-between rounded-[2rem] bg-ink p-6 text-paper md:col-span-5 md:p-8">
            <div>
              <div className="flex items-center gap-3">
                <AvaAvatar size="lg" showOnlineIndicator />
                <div>
                  <p className="font-serif text-2xl leading-none">Ava Skye</p>
                  <p className="mt-1 text-sm text-[#eadff5]">Studio assistant</p>
                </div>
              </div>
              <p className="mt-6 text-lg leading-relaxed text-[#f6f1fb]">
                Ask which channel to turn on first. She knows the eight disciplines and the three packages, and she will not invent a case study to impress you.
              </p>
            </div>
            <OpenAvaButton className="btn btn-paper mt-8 w-full">Open Ava</OpenAvaButton>
          </aside>
        </div>
      </section>

      <section className="border-b border-ink/10" aria-labelledby="disciplines-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Eight disciplines</p>
              <h2 id="disciplines-heading" className="display mt-3 text-4xl md:text-6xl">
                The whole system, available on purpose.
              </h2>
            </div>
            <Link href="/services" className="btn btn-ghost">
              All services
            </Link>
          </div>
          <ol className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
            {services.map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`} className="group grid gap-3 py-5 md:grid-cols-12 md:items-baseline">
                  <span className="font-serif text-2xl text-signal md:col-span-1">{service.index}</span>
                  <span className="font-serif text-3xl tracking-tight group-hover:text-signal md:col-span-3">{service.name}</span>
                  <span className="text-ink-soft md:col-span-8">{service.summary}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-pine text-paper" aria-labelledby="method-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d879ed]">How an engagement runs</p>
          <h2 id="method-heading" className="display mt-3 max-w-3xl text-4xl md:text-6xl">
            Small enough to finish. Serious enough to measure.
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {method.map((step) => (
              <li key={step.index} className="border-t border-white/20 pt-5">
                <p className="font-serif text-3xl text-[#e7c0f4]">{step.index}</p>
                <h3 className="mt-3 font-serif text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#f3e9fb]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-ink/10" aria-labelledby="work-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Field notes</p>
            <h2 id="work-heading" className="display mt-3 text-4xl md:text-6xl">
              The shape of the work, before the proof.
            </h2>
          </div>
          <div className="mt-6">
            <PlaceholderNote>
              These are structural examples. No client is named, and no performance number on this site is real.
            </PlaceholderNote>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {caseStudies.map((study) => (
              <Link key={study.slug} href={`/work/${study.slug}`} className="flex flex-col rounded-[1.5rem] border border-ink/10 bg-card p-5 hover:border-ink/30">
                <span className="stamp w-fit">Sample only</span>
                <h3 className="mt-6 font-serif text-3xl">{study.title}</h3>
                <p className="mt-2 text-sm text-signal">{study.discipline}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{study.summary}</p>
                <span className="mt-6 text-sm font-semibold">Read the structure</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-paper-deep" aria-labelledby="pricing-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Packages</p>
          <h2 id="pricing-heading" className="display mt-3 max-w-3xl text-4xl md:text-6xl">
            Three ways to hire the studio.
          </h2>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Field, Studio, and Partner are quoted in a proposal. Membership, the public auto-renewing plan, is priced on the pricing page. This block describes the shape of the work, not a client result.
          </p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {packages.map((pkg, index) => (
              <article
                key={pkg.name}
                className={`rounded-[1.5rem] p-6 ${index === 1 ? "bg-ink text-paper" : "border border-ink/10 bg-card"}`}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${index === 1 ? "text-[#e7c0f4]" : "text-signal"}`}>
                  {pkg.eyebrow}
                </p>
                <h3 className="mt-3 font-serif text-4xl">{pkg.name}</h3>
                <p className="mt-3 text-sm leading-relaxed">{pkg.summary}</p>
                <p className={`mt-4 text-sm font-semibold ${index === 1 ? "text-[#f6f1fb]" : "text-ink"}`}>{pkg.priceLabel}</p>
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

      <section className="border-b border-ink/10" aria-labelledby="journal-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
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
              <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-[1.5rem] border border-ink/10 p-5 hover:border-ink/30">
                <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">{formatDate(post.date)}</p>
                <h3 className="mt-3 font-serif text-2xl leading-tight">{post.title}</h3>
                <p className="mt-3 text-sm text-ink-soft">{post.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-heading">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-12 md:py-20">
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
