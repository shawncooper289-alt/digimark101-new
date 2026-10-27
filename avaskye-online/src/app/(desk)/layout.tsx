import type { ReactNode } from "react"
import { DeskShell } from "@/components/desk-shell"
import { OwnerSignIn } from "@/components/owner-sign-in"
import { missingOfficeAuthEnv } from "@/lib/office-redirect"
import { missingOfficeEnv, officeConfig, readOfficeOwner } from "@/lib/office-store"

export const dynamic = "force-dynamic"

export default async function DeskLayout({ children }: { children: ReactNode }) {
  const owner = await readOfficeOwner()
  if (!owner) {
    const missing = missingOfficeEnv()
    return (
      <main className="relative min-h-dvh">
        <img src="/ava/desk-sitting.jpg" alt="Ava at the desk in Ava's Skye Studio" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/25" />
        <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-16">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Ava&apos;s Skye Studio</p>
          <h1 className="mt-3 text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Ava&apos;s Skye Studio</h1>
          <p className="mt-4 text-fg/90">This is Ava&apos;s studio, even on the founder account. Customer accounts cannot open it.</p>
          <OwnerSignIn configured={officeConfig().configured} missing={missingOfficeAuthEnv()} />
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
