import { LeadForm } from "@/components/contact/lead-form"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"
import { services, site } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Contact",
  description: "Start a project with DigiMark101. Send a note about the channel that feels stuck.",
  path: "/contact",
})

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string }>
}) {
  const { interest } = await searchParams
  const initialInterest = services.some((service) => service.slug === interest) ? interest : ""

  return (
    <>
      <PageHeader
        eyebrow="07 — Start"
        title="Tell the studio what is stuck."
        lede="A useful note includes the site, the channel, and what a good quarter would look like. You do not need a polished brief. Ava can help you write one first."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <LeadForm initialInterest={initialInterest} />
        </div>
        <aside className="lg:col-span-5">
          <div className="rounded-[1.5rem] bg-ink p-6 text-paper">
            <h2 className="font-serif text-3xl">What happens next</h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[#ebe2f4]">
              <li>1. You send the note. If Supabase is configured, it is stored. If not, the form says so and gives you an email draft.</li>
              <li>2. A person at the studio reads it. Ava does not reply to the form.</li>
              <li>3. If the fit is real, you get a proposal with scope, fee, and what we will not take on.</li>
            </ol>
            <p className="mt-6 text-sm">
              Or write directly to{" "}
              <a className="underline decoration-white/40 underline-offset-4" href={`mailto:${site.email}`}>
                {site.email}
              </a>
              .
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
