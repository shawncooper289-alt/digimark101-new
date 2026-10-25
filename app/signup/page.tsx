import type { Metadata } from "next"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } }

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const { next, email } = await searchParams
  return <AuthForm mode="signup" nextPath={next?.startsWith("/start") ? next : "/studio"} initialEmail={email ?? ""} />
}
