import { ImageResponse } from "next/og"
import { headers } from "next/headers"
import { OgCard } from "@/components/og/card"
import { bareHost, isStoreHost } from "@/lib/store/hosts"

export const alt = "DigiMark101, an online digital marketing agency for small businesses"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function TwitterImage() {
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  if (isStoreHost(host)) {
    return new ImageResponse(<OgCard kicker="One-time. Delivered now." title="Prompts, credits, and a lead list." />, size)
  }
  return new ImageResponse(<OgCard kicker="Online digital marketing agency" title="For small businesses. With Ava Skye." />, size)
}
