import Link from "next/link"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"
import { caseStudies } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Work",
  description:
    "Method walkthroughs showing how DigiMark101 approaches search, paid media, and lifecycle marketing. Client results are published only with partner approval.",
  path: "/work",
})

export default function WorkPage() {
  return (
    <>
      <PageHeader
        eyebrow="03 — The method"
        title="The work, explained."
        lede="Each walkthrough connects the decision, the sequence of work, and the measures that guide the next move. No client results are published here yet; client names and outcomes appear only with partner approval."
      />
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {caseStudies.map((study) => (
            <Link key={study.slug} href={`/work/${study.slug}`} className="rounded-[1.5rem] border border-ink/10 bg-card p-6 hover:border-ink/30">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">{study.sector}</p>
              <h2 className="mt-4 font-serif text-4xl">{study.title}</h2>
              <p className="mt-3 text-sm text-signal">{study.discipline}</p>
              <p className="mt-3 text-ink-soft">{study.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
