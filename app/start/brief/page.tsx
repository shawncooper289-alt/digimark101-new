import { FirstBrief } from "@/components/start/first-campaign"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Five questions",
  description: "Answer five short questions: the business, the offer, the buyer, the place, and the result. Studio fills the first-campaign template with your answers.",
  path: "/start/brief",
})

export default function BriefPage() {
  return (
    <>
      <PageHeader
        eyebrow="Five questions"
        title="Five short answers."
        lede="Use your own words. Studio puts them into a ready-made template for one page, one form, and three emails. Nothing is added that you did not say."
      />
      <div className="mx-auto max-w-xl px-5 py-14">
        <FirstBrief />
      </div>
    </>
  )
}
