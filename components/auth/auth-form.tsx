"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAvaForm } from "@/components/ava/use-ava-form"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const supabase = createSupabaseBrowser()
  useAvaForm((fills) => {
    if (fills.email) setEmail(fills.email)
  })

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    if (!supabase) {
      setError("Add the Supabase URL and anon key, then restart.")
      return
    }
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (result.error) {
      setError(result.error.message)
      return
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. If email confirmation is on, open the link Supabase sends, then sign in.")
      return
    }
    router.push("/studio")
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <Link href="/" aria-label="DigiMark101 home">
        <DigiMarkLogo />
      </Link>
      <h1 className="display mt-8 text-4xl">{mode === "login" ? "Sign in" : "Create your workspace"}</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Each login is one client. Supabase row-level security keeps that workspace private.
      </p>
      {supabase ? null : (
        <p className="mt-4 rounded-2xl bg-mist px-3 py-3 text-sm">
          Supabase is not configured. You can still open the <Link className="underline" href="/studio">preview studio</Link>. It stays in this browser.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm">
          Email
          <input data-ava-field="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="min-h-11 rounded-2xl border border-ink/15 px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          Password
          <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} className="min-h-11 rounded-2xl border border-ink/15 px-3" />
        </label>
        {error ? <p className="text-sm text-signal">{error}</p> : null}
        {message ? <p className="text-sm">{message}</p> : null}
        <button type="submit" className="btn btn-signal">
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        {mode === "login" ? <Link href="/signup" className="underline">Create an account</Link> : <Link href="/login" className="underline">Already have an account</Link>}
      </p>
    </div>
  )
}
