import { FirstBrief } from "@/components/start/first-campaign"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Five questions",
  description: "Tell Ava the business, the offer, the buyer, the place, and the result. She drafts the first campaign from that.",
  path: "/start/brief",
})

export default function BriefPage() {
  return (
    <>
      <PageHeader
        eyebrow="Five questions"
        title="Tell Ava the job."
        lede="Short answers. She will not add a tactic you did not ask for."
      />
      <div className="mx-auto max-w-xl px-5 py-14">
        <FirstBrief />
      </div>
    </>
  )
}
