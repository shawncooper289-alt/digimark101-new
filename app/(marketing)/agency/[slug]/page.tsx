import { notFound } from "next/navigation"
import { IntentPage } from "@/components/agency/intent-page"
import { agencyPages, getAgencyPage } from "@/lib/agency-pages"
import { pageMetadata } from "@/lib/seo"

export function generateStaticParams() {
  return agencyPages.map((page) => ({ slug: page.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = getAgencyPage(slug)
  if (!page) return {}
  return pageMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: page.path,
  })
}

export default async function AgencyIntentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = getAgencyPage(slug)
  if (!page) notFound()

  return (
    <IntentPage
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Agency", path: "/agency" },
        { name: page.metaTitle, path: page.path },
      ]}
      eyebrow={page.eyebrow}
      title={page.heading}
      lede={page.lede}
      sections={page.sections}
      links={page.links}
      faqs={page.faqs}
    />
  )
}
