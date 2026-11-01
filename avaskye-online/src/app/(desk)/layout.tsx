import type { ReactNode } from "react"
import { DeskShell } from "@/components/desk-shell"
import { OfficeGate } from "@/components/office-gate"
import { founderAccountEmails, readOfficeOwner } from "@/lib/office-store"

export const dynamic = "force-dynamic"

export default async function DeskLayout({ children }: { children: ReactNode }) {
  const owner = await readOfficeOwner()
  if (!owner) return <OfficeGate />
  const emails = await founderAccountEmails()
  return <DeskShell founderEmails={emails}>{children}</DeskShell>
}
