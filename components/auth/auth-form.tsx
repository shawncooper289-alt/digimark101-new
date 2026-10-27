"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAvaForm } from "@/components/ava/use-ava-form"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { authCallbackUrl } from "@/lib/auth/site-url"
import { EMAIL_PATTERN, emailFieldError, PASSWORD_RULE, signupPasswordError } from "@/lib/auth/password"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

export function AuthForm({
  mode,
  nextPath = "/studio",
  initialEmail = "",
}: {
  mode: "login" | "signup"
  nextPath?: string
  initialEmail?: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState(() => (EMAIL_PATTERN.test(initialEmail.trim()) ? initialEmail.trim() : ""))
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
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
    const nextEmailError = emailFieldError(email)
    const nextPasswordError = mode === "signup" ? signupPasswordError(password) : password ? "" : "Enter your password."
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    if (nextEmailError || nextPasswordError) return
    if (!supabase) {
      setError("Add the Supabase URL and anon key, then restart.")
      return
    }
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: authCallbackUrl() },
        })
    if (result.error) {
      setError(result.error.message)
      return
    }
    if (mode === "signup" && !result.data.session) {
      setMessage(`We sent a confirmation email to ${email.trim()}. Open it to confirm your account. If you don't see it, check spam.`)
      return
    }
    router.push(nextPath.startsWith("/start") ? nextPath : "/studio")
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <Link href="/" aria-label="DigiMark101 home">
        <DigiMarkLogo variant="paper" />
      </Link>
      <h1 className="display mt-8 text-4xl">{mode === "login" ? "Sign in" : "Create your workspace"}</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Each login is one client, and your workspace stays private to you. Signing in does not buy a lead list or start a membership charge.
      </p>
      {supabase ? null : (
        <p className="mt-4 rounded-2xl bg-mist px-3 py-3 text-sm">
          Supabase is not configured. You can still open the <Link className="underline" href="/studio">preview studio</Link>. It stays in this browser.
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm" htmlFor="auth-email">
          Email
          <input
            id="auth-email"
            data-ava-field="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "auth-email-error" : undefined}
            className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink"
          />
        </label>
        {emailError ? (
          <p id="auth-email-error" className="text-sm text-signal" role="alert">
            {emailError}
          </p>
        ) : null}
        <label className="grid gap-1 text-sm" htmlFor="auth-password">
          Password
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={mode === "signup" ? "auth-password-rule" : passwordError ? "auth-password-error" : undefined}
            className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink"
          />
        </label>
        {mode === "signup" ? (
          <p id="auth-password-rule" className="text-sm text-ink-soft">
            {PASSWORD_RULE}
          </p>
        ) : null}
        {passwordError ? (
          <p id="auth-password-error" className="text-sm text-signal" role="alert">
            {passwordError}
          </p>
        ) : null}
        {mode === "login" ? (
          <p className="text-sm">
            <Link href="/forgot-password" className="underline">
              Forgot password?
            </Link>
          </p>
        ) : null}
        {error ? <p className="text-sm text-signal" role="alert">{error}</p> : null}
        {message ? <p className="text-sm">{message}</p> : null}
        <button type="submit" className="btn btn-signal">
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        {mode === "login" ? <Link href={nextPath.startsWith("/start") ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"} className="underline">Create an account</Link> : <Link href={nextPath.startsWith("/start") ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"} className="underline">Already have an account</Link>}
      </p>
    </div>
  )
}
