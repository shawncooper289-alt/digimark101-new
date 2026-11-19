import { HomeHero } from "@/components/home/home-hero"
import { HomeSections } from "@/components/home/home-sections"
import { JsonLd } from "@/components/site/json-ld"
import { homeFaqs } from "@/lib/home-content"
import { faqJsonLd, platformJsonLd } from "@/lib/seo"

export function HomePage() {
  return (
    <>
      <JsonLd data={[platformJsonLd(), faqJsonLd(homeFaqs)]} />
      <HomeHero />
      <HomeSections />
    </>
  )
}
