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
          <li>The membership renews on its own until you cancel it in PayPal.</li>
          <li>If you were signed in, the subscription is linked to that account when the webhook arrives.</li>
          <li>A membership is not a project. Field, Studio, and Partner still start with a proposal.</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/studio" className="btn btn-signal">
            Open the studio
          </Link>
          <Link href="/pricing" className="btn btn-ghost">
            Back to pricing
          </Link>
        </div>
        <p className="mt-8 text-sm text-ink-soft">
          Questions about a charge: {site.email}.
        </p>
      </div>
    </>
  )
}
