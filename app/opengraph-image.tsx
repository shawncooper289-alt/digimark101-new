import { ImageResponse } from "next/og"
import { OgCard } from "@/components/og/card"

export const alt = "DigiMark101 — Marketing, built as a system"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(<OgCard kicker="Digital marketing studio" title="Own the system. Build the dynasty." />, size)
}
