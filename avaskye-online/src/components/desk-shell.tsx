"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, type FormEvent, type ReactNode } from "react"
import { AvaDesk } from "@/components/ava-desk"

const links = [
  { href: "/", label: "Today" },
  { href: "/products", label: "Hub" },
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
  { href: "/settings", label: "Settings" },
]

export function DeskShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [nextPassword, setNextPassword] = useState("")
  const [passwordNote, setPasswordNote] = useState<string | null>(null)
  const [passwordPending, setPasswordPending] = useState(false)

  async function signOut() {
    await fetch("/api/office/session", { method: "DELETE" })
    router.refresh()
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordPending(true)
    setPasswordNote(null)
    try {
      const response = await fetch("/api/office/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: nextPassword }),
      })
      const data = (await response.json()) as { error?: string }
      setPasswordNote(response.ok ? "Password updated." : data.error || "Could not update the password.")
      if (response.ok) setNextPassword("")
    } catch {
      setPasswordNote("Could not update the password.")
    } finally {
      setPasswordPending(false)
    }
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Ava Skye</p>
            <p className="text-sm">Owner office</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="https://www.digimark101.com">Customer site</a>
            <button type="button" className="rounded-full border border-border px-3 py-1" onClick={() => void signOut()}>Sign out</button>
          </div>
        </div>
        <form className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 pb-3 text-sm" onSubmit={changePassword}>
          <label className="text-muted" htmlFor="new-office-password">New password</label>
          <input id="new-office-password" type="password" autoComplete="new-password" minLength={8} value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} className="rounded-full border border-border bg-transparent px-3 py-1" />
          <button type="submit" className="rounded-full border border-border px-3 py-1" disabled={passwordPending || nextPassword.length < 8}>
            {passwordPending ? "Saving" : "Change password"}
          </button>
          {passwordNote ? <span className="text-muted">{passwordNote}</span> : null}
        </form>
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
      <main className={pathname === "/" ? "" : "mx-auto max-w-6xl px-5 py-8"}>{children}</main>
      {pathname === "/" ? null : <AvaDesk />}
    </div>
  )
}
