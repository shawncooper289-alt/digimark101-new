import { FirstPreview } from "@/components/start/first-campaign"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"

export const metadata = {
  ...pageMetadata({
    title: "Campaign draft",
    description: "Review the page, the form, and the three emails. Approve them or send them back.",
    path: "/start/preview",
  }),
  robots: { index: false, follow: false },
}

export default function PreviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="Your draft"
        title="Nothing is live until you say so."
        lede="This is the page, the form, and the three emails. Change them, or approve them."
      />
      <div className="mx-auto max-w-3xl px-5 py-14">
        <FirstPreview />
      </div>
    </>
  )
}
