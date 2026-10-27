import Link from "next/link"
import { BetaJoinForm } from "@/components/beta/join-form"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Beta",
  description: "DigiMark101 is in beta. Request a free seat, then tell us what is missing or what broke.",
  path: "/beta",
})

const steps = [
  "Use the email you actually check. We send a sign-in link. There is no PayPal step.",
  "Open Studio. Ava can set up the account one question at a time, and she waits for yes before saving.",
  "Try one thing: a contact, a page draft, or the media library.",
  "Use What's missing / what broke inside the studio. That note is visible to the owner and stays off the public site.",
]

export default function BetaPage() {
  const inviteRequired = Boolean(process.env.BETA_INVITE_CODE?.trim())
  return (
    <>
      <PageHeader
        eyebrow="Beta"
        title="DigiMark101 is in beta."
        lede="The studio is open to testers. A beta seat is free, private to you, and flagged so we can read what still needs work. Nothing is published until you say yes."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <ol className="grid gap-4">
            {steps.map((step, index) => (
              <li key={step} className="rounded-[1.5rem] border border-ink/10 bg-card px-5 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">0{index + 1}</span>
                <p className="mt-2">{step}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-ink-soft">
            Already have a password? <Link href="/login" className="underline">Sign in</Link>. New testers should use the email link on this page so the seat is marked beta.
          </p>
        </div>
        <aside className="h-fit rounded-[1.75rem] border border-signal bg-mist p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Request a tester seat</p>
          <div className="mt-4">
            <BetaJoinForm inviteRequired={inviteRequired} />
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            The sign-in link is the welcome email. We store your consent time with the seat. Feedback you send later is readable by the owner, not by other testers.
          </p>
        </aside>
      </div>
    </>
  )
}
