import Link from "next/link"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Beta",
  description: "Beta testers try DigiMark101 and say what it still needs. Ava sets up the account one question at a time.",
  path: "/beta",
})

const steps = [
  "Sign up with the email you actually use.",
  "Click Ava and say: set up my account. She asks one question at a time.",
  "Open Studio and try one thing: a contact, a page draft, or the first campaign.",
  "Reply with what was confusing, missing, or broken. That note is the point of the seat.",
]

export default function BetaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Beta"
        title="Try it. Tell us what is missing."
        lede="These seats are for people learning the platform, not for a finished client engagement. Ava will not publish anything until you say yes."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_0.8fr]">
        <ol className="grid gap-4">
          {steps.map((step, index) => (
            <li key={step} className="rounded-[1.5rem] border border-ink/10 bg-card px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">0{index + 1}</span>
              <p className="mt-2">{step}</p>
            </li>
          ))}
        </ol>
        <aside className="h-fit rounded-[1.75rem] border border-signal bg-mist p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">What Ava asks</p>
          <p className="mt-3 text-sm text-ink-soft">Your name, the business, what it sells, who buys it, where they are, a website or none, the channels you already have, guided or manual, the one result, the account email, then what broke.</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/signup" className="btn btn-signal">Create the account</Link>
            <Link href="/start" className="btn btn-ghost">See the first campaign</Link>
          </div>
          <p className="mt-4 text-sm text-ink-soft">Send the gap note to {site.email}.</p>
        </aside>
      </div>
    </>
  )
}
