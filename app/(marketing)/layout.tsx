import { AvaOnPage } from "@/components/ava/ava-on-page"
import { Footer } from "@/components/site/footer"
import { Header } from "@/components/site/header"
import { partnerLinks } from "@/lib/partners"

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const partners = await partnerLinks()
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer partners={partners} />
      <AvaOnPage />
    </>
  )
}
