"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/site/footer"
import { Header } from "@/components/site/header"
import type { PartnerLink } from "@/lib/partners"

export function SiteChrome({ children, partners = [] }: { children: React.ReactNode; partners?: PartnerLink[] }) {
  const pathname = usePathname()
  const app = pathname.startsWith("/studio") || pathname.startsWith("/login") || pathname.startsWith("/signup")
  if (app) return <main id="main">{children}</main>
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer partners={partners} />
    </>
  )
}
