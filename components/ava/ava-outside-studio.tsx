"use client"

import { usePathname } from "next/navigation"
import { AvaOnPage } from "@/components/ava/ava-on-page"

export function AvaOutsideStudio() {
  const pathname = usePathname()
  if (pathname.startsWith("/studio")) return null
  return <AvaOnPage />
}
