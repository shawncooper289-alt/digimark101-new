import { HomePage } from "@/components/home/home-page"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Digital marketing agency for small businesses | DigiMark101",
  description: site.description,
  path: "/",
  absolute: true,
})

export default function Page() {
  return <HomePage />
}
