import { redirect } from "next/navigation"
import { OfficeGate } from "@/components/office-gate"
import { readOfficeOwner } from "@/lib/office-store"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const owner = await readOfficeOwner()
  if (owner) redirect("/")
  return <OfficeGate next="/" />
}
