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
      <main className="mx-auto min-h-dvh max-w-xl px-5 py-16">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Private</p>
        <h1 className="mt-3 text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Owner office</h1>
        <p className="mt-4 text-muted">This is Shawn Cooper’s back office for DigiMark101. Customer accounts on digimark101.com cannot open it. Sign in with the owner mailbox.</p>
        <OwnerSignIn configured={officeConfig().configured} />
        <p className="mt-8 text-sm text-muted">
          <a className="underline" href="https://www.digimark101.com">Back to the customer site</a>
        </p>
        {missing.length ? <p className="mt-4 text-sm text-muted">Still unset on this server: {missing.join(", ")}.</p> : null}
      </main>
    )
  }
  return <DeskShell>{children}</DeskShell>
}
