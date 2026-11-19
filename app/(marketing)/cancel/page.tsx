import Link from "next/link"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"

export const metadata = {
  ...pageMetadata({
    title: "Checkout cancelled",
    description: "The DigiMark101 membership checkout was cancelled before PayPal completed it.",
    path: "/cancel",
  }),
  robots: { index: false, follow: false },
}

export default function CancelPage() {
  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="No subscription was started."
        lede="PayPal cancelled this checkout before it finished. Nothing new was billed from this visit."
      />
      <div className="mx-auto max-w-3xl px-5 py-14">
        <div className="flex flex-wrap gap-3">
          <Link href="/pricing" className="btn btn-signal">
            Return to pricing
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Request a proposal
          </Link>
        </div>
      </div>
    </>
  )
}
