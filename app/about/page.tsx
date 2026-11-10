import Link from "next/link"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "About",
  description: "DigiMark101 is an all-in-one marketing platform and a studio. Ava Skye sets it up with you. You keep the system.",
  path: "/about",
})

const principles = [
  {
    title: "One thing at a time",
    body: "You rarely need all eight kinds of marketing on Monday. You need the page, the measurement, or the channel that is stuck. We start there.",
  },
  {
    title: "A person stays accountable",
    body: "Ava can draft, sort, and explain. A person approves anything a customer will see, and a person sends the invoice.",
  },
  {
    title: "Proof is earned",
    body: "Client names and statistics are published only after a partner approves them. The empty frames on the work pages are a policy, not a placeholder we forgot.",
  },
  {
    title: "The readout is short",
    body: "What changed, what it cost, what we will stop. If the monthly note needs a tour guide, it is not finished.",
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A platform you own, and a studio when you want help."
        lede="DigiMark101 is the all-in-one marketing platform for people who want to make money online. Studio is the workspace. Ava Skye is the assistant who sets it up with you. You confirm before anything is saved."
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-12">
        <div className="prose-studio md:col-span-7">
          <p>
            The name is the stance. Marketing 101 is the sequence that makes the rest of the work understandable: an offer, a page, a next step you can count, and one channel you can keep up with.
          </p>
          <p>
            Beginners, side hustlers, creators, local businesses, and agencies can use the same login. Contacts, a pipeline, email drafts, page plans, social drafts, files, and automations live in Studio. The eight disciplines — search, paid ads, social, content, web design, email, analytics, and AI automation — are the map of the work.
          </p>
          <p>
            Ava Skye asks one question at a time and fills the forms. That is the time saver: you review the setup instead of retyping it. She will not invent a client or a result to make the work sound larger than it is.
          </p>
          <h2>How a project is staffed</h2>
          <p>
            When you want the studio in the work, a strategist names the one thing slowing the business down. A maker builds the page, the campaign, or the sequence. An analyst keeps the readout honest. Ava holds the brief so the team is not starting from zero between meetings. The proposal says which of those seats are in the room. Field, Studio, and Partner are quoted there. Membership prices are on the pricing page.
          </p>
          <p>
            This page does not invent a founder biography, a headcount, or an office we have not published. The work is the introduction.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="btn btn-signal">
              Create your account
            </Link>
            <Link href="/beta" className="btn btn-ghost">
              Join the beta
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Write to the studio
            </Link>
          </div>
        </div>
        <div className="md:col-span-5">
          <ol className="grid gap-4">
            {principles.map((principle, index) => (
              <li key={principle.title} className="rounded-3xl border border-ink/10 bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">0{index + 1}</p>
                <h2 className="mt-2 font-serif text-2xl">{principle.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{principle.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  )
}
