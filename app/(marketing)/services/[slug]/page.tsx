import Link from "next/link"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { JsonLd } from "@/components/site/json-ld"
import { PageHeader } from "@/components/site/page-header"
import { serviceExtraFaqs, serviceSeo } from "@/lib/service-seo"
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo"
import { getService, services, site } from "@/lib/site"

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}
  const seo = serviceSeo[service.slug]
  return pageMetadata({
    title: seo?.metaTitle ?? service.name,
    description: seo?.metaDescription ?? service.summary,
    path: `/services/${service.slug}`,
  })
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()
  const seo = serviceSeo[service.slug]
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Agency", path: "/agency" },
    { name: "Services", path: "/services" },
    { name: service.name, path: `/services/${service.slug}` },
  ]
  const faqs = [...service.faqs, ...(serviceExtraFaqs[service.slug] ?? [])]
  const related = services.filter((item) => item.slug !== service.slug).slice(0, 3)

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(crumbs), ...(faqs.length ? [faqJsonLd(faqs)] : [])]} />
      <Breadcrumbs items={crumbs} />
      <PageHeader
        eyebrow={`${service.index} — ${service.short}`}
        title={seo?.heading ?? service.name}
        lede={seo?.lede ?? service.summary}
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-12">
        <div className="md:col-span-7">
          <h2 className="font-serif text-3xl">What the work is for</h2>
          <ul className="mt-4 space-y-3 text-ink-soft">
            {service.outcomes.map((outcome) => (
              <li key={outcome} className="border-t border-ink/10 pt-3">
                {outcome}
              </li>
            ))}
          </ul>
          <h2 className="mt-12 font-serif text-3xl">How it runs</h2>
          <ol className="mt-4 space-y-5">
            {service.steps.map((step, index) => (
              <li key={step.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">0{index + 1}</p>
                <h3 className="mt-1 font-serif text-2xl">{step.title}</h3>
                <p className="mt-1 text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <aside className="h-fit rounded-[1.5rem] border border-ink/10 bg-card p-6 text-ink md:col-span-5">
          <h2 className="font-serif text-3xl">Included</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {service.includes.map((item) => (
              <li key={item} className="border-t border-ink/10 pt-2">
                {item}
              </li>
            ))}
          </ul>
          <Link href={`/contact?interest=${service.slug}`} className="btn btn-signal mt-6 w-full">
            Talk to a person about {service.short}
          </Link>
          <p className="mt-4 text-sm text-ink-soft">
            Or email <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>. The fee is quoted in a proposal.
          </p>
        </aside>
        <div className="md:col-span-12">
          <h2 className="font-serif text-3xl">Keep going</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/services/${item.slug}`} className="block rounded-2xl border border-ink/10 p-4 hover:border-signal/50">
                  <span className="font-serif text-2xl">{item.name}</span>
                  <span className="mt-2 block text-sm text-ink-soft">{item.short}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            <Link href="/agency" className="font-semibold text-signal">
              Back to the agency
            </Link>
            {" · "}
            <Link href="/agency/small-business" className="font-semibold text-signal">
              Small businesses
            </Link>
            {" · "}
            <Link href="/beta" className="font-semibold text-signal">
              Free beta seat
            </Link>
          </p>
        </div>
        {faqs.length ? (
          <div className="md:col-span-12">
            <h2 className="font-serif text-3xl">Questions</h2>
            <div className="mt-4">
              {faqs.map((faq) => (
                <details key={faq.question} className="faq border-t border-ink/10 py-4">
                  <summary className="min-h-11 cursor-pointer text-lg font-medium">{faq.question}</summary>
                  <p className="mt-2 max-w-3xl text-ink-soft">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
