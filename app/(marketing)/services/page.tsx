import Link from "next/link"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { JsonLd } from "@/components/site/json-ld"
import { PageHeader } from "@/components/site/page-header"
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo"
import { services } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Digital marketing agency services",
  description:
    "SEO, ads management, social media, content, website design, email, analytics, and an AI assistant for US small businesses. DigiMark101 works online. Fees are quoted in a proposal.",
  path: "/services",
})

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Agency", path: "/agency" },
  { name: "Services", path: "/services" },
]

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <PageHeader
        eyebrow="Services"
        title="Digital marketing agency services"
        lede="Hire one discipline or connect several. Each practice has a job, a set of deliverables, and a limit: we do not invent proof to make it sound finished. Clients are remote, across the United States."
      />
      <div className="mx-auto grid max-w-6xl gap-4 px-5 py-12 md:grid-cols-2 md:py-16">
        {services.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="rounded-[1.5rem] border border-ink/10 bg-card p-6 hover:border-ink/30"
          >
            <p className="font-serif text-2xl text-signal">{service.index}</p>
            <h2 className="mt-3 font-serif text-4xl">{service.name}</h2>
            <p className="mt-3 text-ink-soft">{service.summary}</p>
            <p className="mt-6 text-sm font-semibold">Open the practice</p>
          </Link>
        ))}
      </div>
    </>
  )
}
