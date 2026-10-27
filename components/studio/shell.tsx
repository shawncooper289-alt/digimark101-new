"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { BetaFeedback } from "@/components/studio/beta-feedback"
import { usePlatform } from "@/components/studio/platform-provider"
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
      { href: "/studio/campaigns", label: "Email" },
      { href: "/studio/social", label: "Socials" },
      { href: "/studio/sites", label: "Funnels" },
      { href: "/studio/automations", label: "Automations" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/studio/reports", label: "Reports" },
      { href: "/studio/leads", label: "Leads" },
      { href: "/studio/files", label: "Files" },
      { href: "/studio/media", label: "Media" },
      { href: "/studio/builds", label: "Builds" },
      { href: "/studio/business", label: "Business setup" },
      { href: "/studio/memory", label: "Memory" },
      { href: "/studio/knowledge", label: "Ava skills" },
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
              ? `Signed in as ${platform.email ?? "your account"}`
              : "Preview workspace"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
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
            You&apos;re in preview mode.{" "}
            <Link href="/signup" className="underline">
              Create a free account
            </Link>{" "}
            to save your work.
          </p>
        ) : null}
        {platform.error ? <p className="border-b border-signal/30 bg-mist px-5 py-3 text-sm text-signal">{platform.error}</p> : null}
        <div className="px-5 py-8">{children}</div>
      </div>
      <BetaFeedback />
    </div>
  )
}
