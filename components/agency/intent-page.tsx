import Link from "next/link"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { JsonLd } from "@/components/site/json-ld"
import { TrackedLink } from "@/components/site/tracked-link"
import type { AgencyFaq } from "@/lib/agency-pages"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo"

export function IntentPage({
  crumbs,
  eyebrow,
  title,
  lede,
  sections,
  links,
  faqs,
}: {
  crumbs: { name: string; path: string }[]
  eyebrow: string
  title: string
  lede: string
  sections: { heading: string; paragraphs: string[] }[]
  links: { href: string; label: string; body: string }[]
  faqs: AgencyFaq[]
}) {
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(crumbs), faqJsonLd(faqs)]} />
      <Breadcrumbs items={crumbs} />
      <header className="border-b border-ink/10">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">{eyebrow}</p>
          <h1 className="display mt-4 max-w-4xl text-4xl text-ink sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{lede}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TrackedLink href="/beta" event="intent_beta" className="btn btn-signal">
              Claim a free beta seat
            </TrackedLink>
            <TrackedLink href="/contact" event="intent_contact" className="btn btn-ghost">
              Talk to a person
            </TrackedLink>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-serif text-3xl">{section.heading}</h2>
            <div className="mt-4 grid max-w-3xl gap-4 text-ink-soft">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        <section aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-serif text-3xl">
            Related pages
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block h-full rounded-[1.4rem] border border-ink/10 bg-card p-5 hover:border-signal/50">
                  <span className="font-serif text-2xl text-ink">{link.label}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-ink-soft">{link.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-serif text-3xl">
            Questions
          </h2>
          <div className="mt-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="border-t border-ink/10 py-4">
                <summary className="flex min-h-11 cursor-pointer items-center text-lg font-medium">{faq.question}</summary>
                <p className="mt-3 max-w-3xl text-ink-soft">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
