import Link from "next/link"
import { MembershipPicker } from "@/components/pricing/membership-picker"
import { JsonLd } from "@/components/site/json-ld"
import { PageHeader } from "@/components/site/page-header"
import { membershipOffers } from "@/lib/paypal/config"
import { faqJsonLd, pageMetadata } from "@/lib/seo"
import { packages } from "@/lib/site"

const faqs = [
  {
    question: "Why do the packages not list a fee?",
    answer:
      "Field, Studio, and Partner describe the shape of the work. The fee, term, and what is out of scope are written in a proposal after a short briefing. Membership is the public price, and it renews until you cancel it in PayPal.",
  },
  {
    question: "Can we start with one channel?",
    answer: "Yes. That is the Field package. Studio connects up to three disciplines. Partner is for a company that wants the studio in the working week.",
  },
  {
    question: "Are the budget ranges on the contact form your prices?",
    answer: "No. They are the visitor's planning ranges so the studio can tell whether the conversation is in range. They are not quotes and not client spend.",
  },
]

export const metadata = pageMetadata({
  title: "Pricing",
  description:
    "Field, Studio, and Partner are quoted in a proposal. DigiMark101 Membership is a public auto-renewing price: monthly, quarterly, or semiannual.",
  path: "/pricing",
})

export default function PricingPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <PageHeader
        eyebrow="04 — Packages"
        title="Hire a channel, a system, or a seat in the week."
        lede="The packages are how the studio is staffed. The number lives in a proposal, where it can match the work instead of a menu."
      />
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-4 lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <article key={pkg.name} className={`rounded-[1.75rem] p-6 ${index === 1 ? "bg-ink text-paper" : "border border-ink/10 bg-card"}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${index === 1 ? "text-[#e7c0f4]" : "text-signal"}`}>{pkg.eyebrow}</p>
              <h2 className="mt-3 font-serif text-5xl">{pkg.name}</h2>
              <p className="mt-3">{pkg.summary}</p>
              <p className="mt-4 text-sm font-semibold">{pkg.priceLabel}</p>
              <p className="mt-4 text-sm">Best when {pkg.fits}</p>
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
        <MembershipPicker offers={membershipOffers()} />
        <section className="mt-14 grid gap-8 border-t border-ink/10 pt-10 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-4xl">What a proposal includes</h2>
            <ul className="mt-4 space-y-2 text-ink-soft">
              <li>The objective for the term.</li>
              <li>The disciplines in scope, and the ones that are not.</li>
              <li>The fee, the cadence, and the readout.</li>
              <li>What DigiMark101 will not claim in public.</li>
            </ul>
            <Link href="/contact" className="btn btn-signal mt-6">
              Request a proposal
            </Link>
          </div>
          <div>
            {faqs.map((faq) => (
              <details key={faq.question} className="faq border-t border-ink/10 py-4">
                <summary className="font-medium">{faq.question}</summary>
                <p className="mt-2 text-ink-soft">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
