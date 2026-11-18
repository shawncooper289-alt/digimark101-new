import type { Metadata } from "next"
import { OptOutForm } from "@/components/leads/opt-out-form"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Unsubscribe",
    description: "Opt out of DigiMark101 lead sharing, or ask for stored contact details to be deleted.",
    path: "/unsubscribe",
  }),
  robots: { index: false, follow: false },
}

export default function UnsubscribePage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="Unsubscribe"
        lede="Use the address you gave DigiMark101. Opting out stops future sharing and commercial mail. You can also ask for the stored contact details to be deleted."
      />
      <div className="mx-auto max-w-xl px-5 py-14">
        <OptOutForm />
      </div>
    </>
  )
}
