"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { usePlatform } from "@/components/studio/platform-provider"
import { FOUNDER_OFFICE_URL } from "@/lib/owner/public"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

const groups = [
  {
    label: "Today",
    items: [{ href: "/studio", label: "Today" }],
  },
  {
    label: "People",
    items: [
      { href: "/studio/contacts", label: "Contacts" },
      { href: "/studio/pipeline", label: "Pipeline" },
      { href: "/studio/calendar", label: "Calendar" },
      { href: "/studio/inbox", label: "Inbox" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/studio/campaigns", label: "Campaigns" },
      { href: "/studio/sites", label: "Sites" },
      { href: "/studio/automations", label: "Automations" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/studio/reports", label: "Reports" },
      { href: "/studio/leads", label: "Leads" },
      { href: "/studio/files", label: "Files" },
      { href: "/studio/memory", label: "Memory" },
      { href: "/studio/backend", label: "Backend" },
    ],
  },
]

function active(pathname: string, href: string) {
  return href === "/studio" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const platform = usePlatform()

  async function signOut() {
    const supabase = createSupabaseBrowser()
    if (supabase) await supabase.auth.signOut()
    await platform.refresh()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-[232px_1fr]">
      <aside className="border-b border-ink/10 bg-card md:min-h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <Link href="/" aria-label="DigiMark101 home">
            <DigiMarkLogo variant="paper" compact />
          </Link>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-4 pb-4 md:block md:px-3" aria-label="Studio">
          {groups.map((group) => (
            <div key={group.label} className="md:mb-5">
              <p className="hidden px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft md:block">{group.label}</p>
              <ul className="mt-2 flex gap-2 md:grid">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block whitespace-nowrap rounded-full px-3 py-2 text-sm md:rounded-xl ${active(pathname, item.href) ? "bg-ink text-paper" : "hover:bg-paper-deep"}`}
                      aria-current={active(pathname, item.href) ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
          <p className="text-sm text-ink-soft">
            {platform.mode === "account"
              ? platform.isOwner
                ? `Owner · ${platform.workspaceLabel}`
                : `Signed in as ${platform.email ?? "your account"}`
              : "Preview workspace"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {platform.isOwner && platform.mode === "account" ? (
              <>
                <label className="text-sm text-ink-soft">
                  <span className="sr-only">Workspace</span>
                  <select
                    value={platform.workspaceId ?? ""}
                    onChange={(event) => void platform.switchWorkspace(event.target.value)}
                    className="min-h-10 rounded-full border border-ink/15 bg-mist px-3 text-sm text-ink"
                  >
                    {platform.workspaces.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <a className="btn btn-ghost" href={FOUNDER_OFFICE_URL}>
                  Founder office
                </a>
              </>
            ) : null}
            {platform.mode === "account" ? (
              <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
                Sign out
              </button>
            ) : (
              <Link href="/login" className="btn btn-signal">
                Sign in
              </Link>
            )}
          </div>
        </div>
        {platform.mode === "preview" ? (
          <p className="border-b border-signal/20 bg-mist px-5 py-3 text-sm text-ink">
            This preview stays in this browser. Sign in with Supabase so each client gets a private workspace. Row-level security keeps one client from reading another.
          </p>
        ) : null}
        {platform.error ? <p className="border-b border-signal/30 bg-mist px-5 py-3 text-sm text-signal">{platform.error}</p> : null}
        <div className="px-5 py-8">{children}</div>
      </div>
    </div>
  )
}
