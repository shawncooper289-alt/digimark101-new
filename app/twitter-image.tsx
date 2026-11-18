import { ImageResponse } from "next/og"
import { OgCard } from "@/components/og/card"

export const alt = "DigiMark101, an online digital marketing agency for small businesses"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(<OgCard kicker="Online digital marketing agency" title="For small businesses. With Ava Skye." />, size)
}
