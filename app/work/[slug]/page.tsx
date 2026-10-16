import Link from "next/link"
import { notFound } from "next/navigation"
import { JsonLd } from "@/components/site/json-ld"
import { PageHeader } from "@/components/site/page-header"
import { PlaceholderNote } from "@/components/site/placeholder-note"
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo"
import { caseStudies, getCaseStudy } from "@/lib/site"

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) return {}
  return pageMetadata({
    title: `${study.title} (placeholder)`,
    description: study.summary,
    path: `/work/${study.slug}`,
  })
}

export default async function WorkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) notFound()

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: study.title, path: `/work/${study.slug}` },
        ])}
      />
      <PageHeader eyebrow={`Field note ${study.index} — placeholder`} title={study.title} lede={study.sector} />
      <article className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-12">
        <div className="md:col-span-7">
          <PlaceholderNote>
            No client is named on this page, and no result is claimed. It is a structural example of how DigiMark101 would run this kind of work.
          </PlaceholderNote>
          <p className="mt-8 text-lg leading-relaxed text-ink-soft">{study.situation}</p>
          <h2 className="mt-10 font-serif text-3xl">The sequence</h2>
          <ol className="mt-4 space-y-3">
            {study.approach.map((step, index) => (
              <li key={step} className="border-t border-ink/10 pt-3 text-ink-soft">
                <span className="mr-2 font-semibold text-ink">0{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <aside className="h-fit rounded-[1.5rem] border border-signal/30 bg-[#f4e9fb] p-6 md:col-span-5">
          <p className="stamp">No figures</p>
          <h2 className="mt-6 font-serif text-3xl">What a real readout would track</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {study.wouldMeasure.map((item) => (
              <li key={item} className="border-t border-signal/20 pt-2">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-soft">These are categories, not numbers. Nothing here is a measured result.</p>
          <Link href="/contact" className="btn btn-signal mt-6 w-full">
            Scope a real engagement
          </Link>
        </aside>
      </article>
    </>
  )
}
