import Link from "next/link"
import { notFound } from "next/navigation"
import { JsonLd } from "@/components/site/json-ld"
import { PageHeader } from "@/components/site/page-header"
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo"
import { getService, services } from "@/lib/site"

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}
  return pageMetadata({
    title: service.name,
    description: service.summary,
    path: `/services/${service.slug}`,
  })
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.name, path: `/services/${service.slug}` },
          ]),
          ...(service.faqs.length ? [faqJsonLd(service.faqs)] : []),
        ]}
      />
      <PageHeader eyebrow={`${service.index} — ${service.short}`} title={service.name} lede={service.summary} />
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
        <aside className="h-fit rounded-[1.5rem] bg-ink p-6 text-paper md:col-span-5">
          <h2 className="font-serif text-3xl">Included</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {service.includes.map((item) => (
              <li key={item} className="border-t border-white/15 pt-2">
                {item}
              </li>
            ))}
          </ul>
          <Link href={`/contact?interest=${service.slug}`} className="btn btn-paper mt-6 w-full">
            Start with {service.name}
          </Link>
        </aside>
        {service.faqs.length ? (
          <div className="md:col-span-12">
            <h2 className="font-serif text-3xl">Questions</h2>
            <div className="mt-4">
              {service.faqs.map((faq) => (
                <details key={faq.question} className="faq border-t border-ink/10 py-4">
                  <summary className="text-lg font-medium">{faq.question}</summary>
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
