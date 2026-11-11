import { FirstPreview } from "@/components/start/first-campaign"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"

export const metadata = {
  ...pageMetadata({
    title: "Campaign draft",
    description: "Read the page, the form, and the three emails filled from your answers. Approving saves them. It does not publish or send.",
    path: "/start/preview",
  }),
  robots: { index: false, follow: false },
}

export default function PreviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="Your draft"
        title="Your filled-in template."
        lede="This is the page, the form, and the three emails, filled from your answers. Approving saves them in your studio. It does not publish a page or send email."
      />
      <div className="mx-auto max-w-3xl px-5 py-14">
        <FirstPreview />
      </div>
    </>
  )
}
