"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { AvaDesk } from "@/components/ava-desk"

const links = [
  { href: "/", label: "Today" },
  { href: "/platform", label: "Main office" },
  { href: "/beta", label: "Beta testers" },
  { href: "/niches", label: "Niche inventory" },
  { href: "/skills", label: "Ava skills" },
  { href: "/briefings", label: "Daily briefings" },
  { href: "/products", label: "Hub" },
  { href: "/content", label: "Content" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/leads", label: "Leads" },
  { href: "/crm", label: "CRM" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/automations", label: "Automations" },
  { href: "/billing", label: "Billing" },
  { href: "/records", label: "Records" },
  { href: "/clients", label: "Clients" },
  { href: "/reports", label: "Reports" },
  { href: "/tools", label: "Tools" },
  { href: "/calendar", label: "Calendar" },
  { href: "/inbox", label: "Inbox" },
  { href: "/memory", label: "Memory" },
  { href: "/files", label: "Files" },
  { href: "/settings", label: "Settings" },
]

export function DeskShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    await fetch("/api/office/session", { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Ava Skye</p>
            <p className="text-sm">DigiMark101 main office</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="https://www.digimark101.com">Customer site</a>
            <button type="button" className="rounded-full border border-border px-3 py-1" onClick={() => void signOut()}>Sign out</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 pb-3 text-sm" aria-label="Owner office">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname === link.href
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-full px-3 py-1 ${active ? "bg-accent text-accent-fg" : "text-muted"}`}>
                {link.label}
              </Link>
            )
          })}
        </nav>
      </header>
      {pathname === "/" ? <main>{children}</main> : (
        <div className="mx-auto grid max-w-[1600px] gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="order-first self-start lg:sticky lg:top-4 lg:order-last"><AvaDesk /></div>
          <main className="min-w-0">{children}</main>
        </div>
      )}
    </div>
  )
}
