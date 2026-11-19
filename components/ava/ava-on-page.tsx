"use client"

import { AvaWidget } from "@/components/ava/ava-widget"
import { PlatformProvider } from "@/components/studio/platform-provider"

/** Loads Ava only on the pages that import this. The homepage does not. */
export function AvaOnPage() {
  return (
    <PlatformProvider>
      <AvaWidget />
    </PlatformProvider>
  )
}
