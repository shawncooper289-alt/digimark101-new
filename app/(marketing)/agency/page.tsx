import Link from "next/link"
import { IntentPage } from "@/components/agency/intent-page"
import { agencyHubFaqs } from "@/lib/agency-pages"
import { pageMetadata } from "@/lib/seo"
import { services } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Online digital marketing agency",
  description:
    "DigiMark101 is an online digital marketing agency for small businesses in the United States. Search, ads, social, sites, email, and an AI assistant. Remote. No published street address.",
  path: "/agency",
})

const sections = [
  {
    heading: "What the agency actually sells",
    paragraphs: [
      "Eight disciplines: SEO, paid ads, social, content, web design, email, analytics, and AI automation. Field is one of them. The Studio package connects up to three. Partner is a seat in the working week. The fee is written in a proposal.",
      "The same company makes Studio, the workspace. Contacts, a pipeline, calendar, email drafts, page plans, social drafts, files, and automations live in one login. Ava Skye asks one question at a time, fills the forms, and saves only after you say yes.",
    ],
  },
  {
    heading: "Served online, across the United States",
    paragraphs: [
      "There is no city page and no published street address. Clients are remote. If a business has several real locations, the work names those places. We do not invent a service area to look local.",
      "A beta seat for the software is free for testers and does not start a payment. Hiring the studio is a separate conversation, and it starts with the contact form.",
    ],
  },
]

const links = [
  { href: "/agency/small-business", label: "Small businesses", body: "The primary customer: one offer, one workspace, served online." },
  { href: "/agency/lead-generation", label: "Lead generation", body: "A named next step and a record. No guaranteed lead volume." },
  { href: "/agency/ai", label: "AI marketing assistant", body: "Ava drafts and waits for yes. She does not spend or send on her own." },
  { href: "/services", label: "All eight services", body: "Open a discipline to see what is included and what we will not promise." },
  { href: "/pricing", label: "Pricing", body: "Agency packages are quoted. Software membership prices are listed." },
  { href: "/work", label: "Work samples", body: "Labeled structures. Not client results." },
]

export default function AgencyPage() {
  return (
    <>
      <IntentPage
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Agency", path: "/agency" },
        ]}
        eyebrow="Agency"
        title="An online digital marketing agency for small businesses."
        lede="DigiMark101 plans the marketing and leaves you with the workspace. The work is remote, for clients in the United States. Ava Skye sets the software up with you. A person still approves anything a customer will see."
        sections={sections}
        links={links}
        faqs={agencyHubFaqs}
      />
      <section className="border-t border-ink/10" aria-labelledby="disciplines-heading">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 id="disciplines-heading" className="font-serif text-3xl">
            Services
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`} className="block rounded-[1.4rem] border border-ink/10 p-5 hover:border-signal/50">
                  <span className="font-serif text-2xl">{service.name}</span>
                  <span className="mt-2 block text-sm text-ink-soft">{service.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
