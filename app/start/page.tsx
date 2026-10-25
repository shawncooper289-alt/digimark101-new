import Link from "next/link"
import { PageHeader } from "@/components/site/page-header"
import { formatUsd, listPlans } from "@/lib/paypal/plans"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "First campaign",
  description: "One page, one lead form, and three follow-up emails. Ava drafts them after the starter membership. Nothing goes out until you approve.",
  path: "/start",
})

export default function StartPage() {
  const starter = listPlans().find((plan) => plan.key === "starter")
  const price = starter ? formatUsd(starter.amount) : "$179"

  return (
    <>
      <PageHeader
        eyebrow="First campaign"
        title="One page. One form. Three emails."
        lede="This is the job DigiMark101 starts with. Ava writes the draft from five answers. You approve it before anything is called live."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <ol className="grid gap-4">
            {[
              {
                text: "Create an account or sign in, then pay the starter membership on the pricing page. Use the same email.",
                links: [
                  { href: "/signup", label: "Create account" },
                  { href: "/login", label: "Sign in" },
                ],
              },
              { text: "Answer five questions. No deck and no strategy call." },
              { text: "Ava drafts the page, the lead form, and three emails." },
              { text: "Approve, or send it back. She does not publish on her own." },
            ].map((step, index) => (
              <li key={step.text} className="rounded-[1.5rem] border border-ink/10 bg-card px-5 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">0{index + 1}</span>
                <p className="mt-2">{step.text}</p>
                {step.links ? (
                  <p className="mt-3 flex flex-wrap gap-4 text-sm">
                    {step.links.map((link) => (
                      <Link key={link.href} href={link.href} className="underline">
                        {link.label}
                      </Link>
                    ))}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <aside className="h-fit rounded-[1.75rem] border border-signal bg-mist p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Starter, month to month</p>
          <p className="mt-3 font-serif text-5xl">{price}</p>
          <p className="mt-3 text-sm text-ink-soft">Founding rate while it is open. It renews in PayPal until you cancel it. This is not a lead list and not a video.</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/pricing" className="btn btn-signal">Pay the starter</Link>
            <Link href="/start/brief" className="btn btn-ghost">Answer the five questions</Link>
            <Link href="/beta" className="text-sm text-ink-soft underline">Trying it first? Beta seats are for seeing how it works and what it still needs.</Link>
          </div>
        </aside>
      </div>
    </>
  )
}
