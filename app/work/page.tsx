import Link from "next/link"
import { PageHeader } from "@/components/site/page-header"
import { PlaceholderNote } from "@/components/site/placeholder-note"
import { pageMetadata } from "@/lib/seo"
import { caseStudies } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Work",
  description:
    "Placeholder structures for DigiMark101 engagements. No client names or performance statistics are claimed.",
  path: "/work",
})

export default function WorkPage() {
  return (
    <>
      <PageHeader
        eyebrow="03 — Field notes"
        title="Structures, not trophies."
        lede="These pages show how an engagement is shaped. They are not case studies of real clients, and they do not report results."
      />
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <PlaceholderNote>
          Replace a card only when a partner approves the client name and the numbers. Until then, the stamp stays.
        </PlaceholderNote>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {caseStudies.map((study) => (
            <Link key={study.slug} href={`/work/${study.slug}`} className="rounded-[1.5rem] border border-ink/10 bg-card p-6 hover:border-ink/30">
              <span className="stamp">Sample only</span>
              <p className="mt-8 text-xs uppercase tracking-[0.16em] text-ink-soft">{study.sector}</p>
              <h2 className="mt-3 font-serif text-4xl">{study.title}</h2>
              <p className="mt-3 text-sm text-signal">{study.discipline}</p>
              <p className="mt-3 text-ink-soft">{study.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
