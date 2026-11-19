import { ImageResponse } from "next/og"
import { headers } from "next/headers"
import { OgCard } from "@/components/og/card"
import { bareHost, surfaceForHost } from "@/lib/store/hosts"

export const alt = "DigiMark101, an online digital marketing agency for small businesses"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage() {
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  const surface = surfaceForHost(host)
  if (surface?.id === "store") {
    return new ImageResponse(<OgCard kicker="One-time. Delivered now." title="Prompts, credits, and a lead list." />, size)
  }
  if (surface?.id === "leads") {
    return new ImageResponse(<OgCard kicker="Leads by niche" title="The count is public. The names are not." />, size)
  }
  if (surface?.id === "offers") {
    return new ImageResponse(<OgCard kicker="Offers" title="Upsells, bumps, and upgrades." />, size)
  }
  return new ImageResponse(<OgCard kicker="Online digital marketing agency" title="For small businesses. With Ava Skye." />, size)
}
