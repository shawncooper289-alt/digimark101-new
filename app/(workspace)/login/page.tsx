import type { Metadata } from "next"
import { AuthForm } from "@/components/auth/auth-form"
import { safeNextPath } from "@/lib/store/hosts"

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <AuthForm mode="login" nextPath={safeNextPath(next)} />
}
