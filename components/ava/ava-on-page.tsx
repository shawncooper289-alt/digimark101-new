"use client"

import { AvaWidget } from "@/components/ava/ava-widget"
import { PlatformProvider } from "@/components/studio/platform-provider"

/** Ava on workspace routes outside Studio, which supplies its own provider and widget. */
export function AvaOnPage() {
  return (
    <PlatformProvider>
      <AvaWidget />
    </PlatformProvider>
  )
}
