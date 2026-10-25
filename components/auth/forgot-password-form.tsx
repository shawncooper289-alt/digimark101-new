"use client"

import Link from "next/link"
import { useState } from "react"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { emailFieldError } from "@/lib/auth/password"
import { resetPasswordUrl } from "@/lib/auth/site-url"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const supabase = createSupabaseBrowser()

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    setError("")
    const nextEmailError = emailFieldError(email)
    setEmailError(nextEmailError)
    if (nextEmailError) return
    if (!supabase) {
      setError("Sign-in is not configured on this site yet.")
      return
    }
    setPending(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: resetPasswordUrl(),
    })
    setPending(false)
    if (resetError) {
      setError("Could not send the reset email. Wait a minute and try again.")
      return
    }
    setMessage(`Check ${email.trim()} for a link to choose a new password. It expires soon. Look in spam if it is not in your inbox.`)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <Link href="/" aria-label="DigiMark101 home">
        <DigiMarkLogo variant="paper" />
      </Link>
      <h1 className="display mt-8 text-4xl">Reset your password</h1>
      <p className="mt-3 text-sm text-ink-soft">We will email you a link. It opens a page where you choose a new password.</p>
      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm" htmlFor="reset-email">
          Email
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "reset-email-error" : undefined}
            className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink"
          />
        </label>
        {emailError ? (
          <p id="reset-email-error" className="text-sm text-signal" role="alert">
            {emailError}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-signal" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="text-sm">{message}</p> : null}
        <button type="submit" className="btn btn-signal" disabled={pending}>
          {pending ? "Sending…" : "Email me a reset link"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        <Link href="/login" className="underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
