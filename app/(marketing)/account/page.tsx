import type { Metadata } from "next"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } }

export default function AccountPage() {
  return <AuthForm mode="login" />
}
