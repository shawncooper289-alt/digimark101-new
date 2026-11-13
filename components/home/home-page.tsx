import { HomeHero } from "@/components/home/home-hero"
import { HomeSections } from "@/components/home/home-sections"
import { MeetAva } from "@/components/home/meet-ava"
import { JsonLd } from "@/components/site/json-ld"
import { homeFaqs } from "@/lib/home-content"
import { faqJsonLd, platformJsonLd } from "@/lib/seo"
import { avaIntroVideoUrl } from "@/lib/video/ava-intro"

export function HomePage() {
  return (
    <>
      <JsonLd data={[platformJsonLd(), faqJsonLd(homeFaqs)]} />
      <HomeHero />
      <MeetAva src={avaIntroVideoUrl()} />
      <HomeSections />
    </>
  )
}
