import type { Metadata } from "next"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const nextPath = next?.startsWith("/start") || next === "/studio/setup" ? next : "/studio"
  return <AuthForm mode="login" nextPath={nextPath} />
}
