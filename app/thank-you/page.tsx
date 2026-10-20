import Link from "next/link"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/lib/site"

export const metadata = {
  ...pageMetadata({
    title: "Thank you",
    description: "DigiMark101 membership checkout confirmation.",
    path: "/thank-you",
  }),
  robots: { index: false, follow: false },
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ subscription_id?: string }>
}) {
  const { subscription_id: subscriptionId } = await searchParams
  const shownId = subscriptionId && /^I-[A-Z0-9]+$/i.test(subscriptionId) ? subscriptionId : null

  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="PayPal has the subscription."
        lede="If the approval went through, PayPal will email a receipt. DigiMark101 records the subscription when PayPal sends the confirmation. That can take a moment."
      />
      <div className="mx-auto max-w-3xl px-5 py-14">
        {shownId ? (
          <p className="text-sm text-ink-soft">
            PayPal subscription id: <span className="font-semibold text-ink">{shownId}</span>
          </p>
        ) : null}
        <ul className="mt-6 space-y-2 text-ink-soft">
          <li>Next, answer five questions. Ava drafts one page, one lead form, and three emails.</li>
          <li>Nothing is marked live until you approve it.</li>
          <li>The membership renews until you cancel it in PayPal.</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/start/brief" className="btn btn-signal">
            Answer the five questions
          </Link>
          <Link href="/studio" className="btn btn-ghost">
            Open the studio
          </Link>
        </div>
        <p className="mt-8 text-sm text-ink-soft">
          Questions about a charge: {site.email}.
        </p>
      </div>
    </>
  )
}
