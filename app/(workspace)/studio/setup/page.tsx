import type { Metadata } from "next"
import { AccountSetup } from "@/components/studio/account-setup"

export const metadata: Metadata = {
  title: "Account setup",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AccountSetup />
}
