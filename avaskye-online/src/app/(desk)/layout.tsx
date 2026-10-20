import type { ReactNode } from "react"
import { DeskShell } from "@/components/desk-shell"

export const dynamic = "force-dynamic"
import { OwnerSignIn } from "@/components/owner-sign-in"
import { missingOfficeEnv, officeConfig, readOfficeOwner } from "@/lib/office-store"

export default async function DeskLayout({ children }: { children: ReactNode }) {
  const owner = await readOfficeOwner()
  if (!owner) {
    const missing = missingOfficeEnv()
    return (
      <main className="relative min-h-dvh">
        <img src="/ava/desk-sitting.jpg" alt="Ava Skye sitting at the desk in Skye Studio" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/25" />
        <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-16">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Skye Studio</p>
          <h1 className="mt-3 text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Owner office</h1>
          <p className="mt-4 text-fg/90">Ava is at the night-city desk. This office is private to Shawn Cooper. Customer accounts cannot open it.</p>
          <OwnerSignIn configured={officeConfig().configured} />
          <p className="mt-8 text-sm text-muted">
            <a className="underline" href="https://www.digimark101.com">Back to the customer site</a>
          </p>
          {missing.length ? <p className="mt-4 text-sm text-muted">Still unset on this server: {missing.join(", ")}.</p> : null}
        </div>
      </main>
    )
  }
  return <DeskShell>{children}</DeskShell>
}
