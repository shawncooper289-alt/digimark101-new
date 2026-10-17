import Link from "next/link"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "About",
  description: "DigiMark101 is a digital marketing studio. The work is planned, made, and measured without invented proof.",
  path: "/about",
})

const principles = [
  {
    title: "One bottleneck at a time",
    body: "A company rarely needs eight channels on Monday. It needs the page, the event, or the channel that is currently lying.",
  },
  {
    title: "A person stays accountable",
    body: "Ava can draft, sort, and explain. A person approves anything a customer will see, and a person sends the invoice.",
  },
  {
    title: "Proof is earned",
    body: "Client names and results are published only after a partner approves the facts and context. Until then, the site explains the method without implying a track record.",
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
        eyebrow="05 — Studio"
        title="A studio for the work, and the system under it."
        lede="DigiMark101 is a digital marketing agency. We plan, make, and measure search, media, content, sites, email, and the automations that keep a team moving."
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-12">
        <div className="prose-studio md:col-span-7">
          <p>
            The name is the stance. Marketing 101 is not beginner work. It is the unglamorous sequence that makes the rest of the spend intelligible: an offer, a page, a trusted event, and a channel that can learn.
          </p>
          <p>
            Ava Skye is the studio assistant and the public face of that stance. She will talk through a brief. She will not decorate the site with a client we do not have.
          </p>
          <h2>How a project is staffed</h2>
          <p>
            A strategist names the bottleneck. A maker builds the page, the campaign, or the sequence. An analyst keeps the readout honest. Ava holds the brief so the team is not starting from zero between meetings. The proposal says which of those seats are in the room.
          </p>
          <p>
            This page does not invent a founder biography, a headcount, or an office we have not published. The work is the introduction. If you want the studio on a real account, start with a note.
          </p>
          <Link href="/contact" className="btn btn-signal mt-6">
            Write to the studio
          </Link>
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
