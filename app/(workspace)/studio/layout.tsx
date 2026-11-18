import type { Metadata } from "next"
import { AvaWidget } from "@/components/ava/ava-widget"
import { StudioShell } from "@/components/studio/shell"
import { PlatformProvider } from "@/components/studio/platform-provider"

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformProvider>
      <StudioShell>{children}</StudioShell>
      <AvaWidget />
    </PlatformProvider>
  )
}
