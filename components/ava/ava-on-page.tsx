"use client"

import { AvaWidget } from "@/components/ava/ava-widget"
import { PlatformProvider } from "@/components/studio/platform-provider"

/** Ava on marketing pages. Studio keeps its own copy inside the workspace provider. */
export function AvaOnPage() {
  return (
    <PlatformProvider>
      <AvaWidget />
    </PlatformProvider>
  )
}
