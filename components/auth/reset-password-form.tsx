"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { establishSessionFromUrl } from "@/lib/auth/establish-session"
import { PASSWORD_RULE, signupPasswordError } from "@/lib/auth/password"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

type Phase = "working" | "ready" | "saved" | "invalid" | "unconfigured"

export function ResetPasswordForm() {
  const [phase, setPhase] = useState<Phase>("working")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmError, setConfirmError] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    async function open() {
      const result = await establishSessionFromUrl()
      if (result.ok) {
        setPhase("ready")
        return
      }
      if (result.reason === "unconfigured") {
        setPhase("unconfigured")
        return
      }
      if (result.reason === "invalid") {
        setPhase("invalid")
        return
      }
      const supabase = createSupabaseBrowser()
      const user = supabase ? (await supabase.auth.getUser()).data.user : null
      setPhase(user ? "ready" : "invalid")
    }
    void open()
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    const nextPasswordError = signupPasswordError(password)
    const nextConfirmError = password !== confirm ? "Those passwords do not match." : ""
    setPasswordError(nextPasswordError)
    setConfirmError(nextConfirmError)
    if (nextPasswordError || nextConfirmError) return
    const supabase = createSupabaseBrowser()
    if (!supabase) {
      setPhase("unconfigured")
      return
    }
    setPending(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setPending(false)
    if (updateError) {
      setError("Could not update the password. Request a new reset link and try again.")
      return
    }
    setPhase("saved")
  }

  if (phase === "working") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <p className="text-sm text-ink-soft">Checking your reset link…</p>
      </main>
    )
  }

  if (phase === "saved") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <h1 className="font-serif text-4xl">Password updated</h1>
        <p className="mt-3 text-sm text-ink-soft">You can open the studio with the new password.</p>
        <Link href="/studio" className="btn btn-signal mt-6 w-fit">
          Open the studio
        </Link>
      </main>
    )
  }

  if (phase !== "ready") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <h1 className="font-serif text-4xl">{phase === "unconfigured" ? "Password reset is not available yet" : "This reset link didn't work"}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {phase === "unconfigured"
            ? "This site is not ready to reset passwords yet."
            : "This link is invalid or has expired. Request a new one and open it on this device."}
        </p>
        <Link href="/forgot-password" className="btn btn-signal mt-6 w-fit">
          Request a new link
        </Link>
        <p className="mt-4 text-sm">
          <Link href="/login" className="underline">
            Back to sign in
          </Link>
        </p>
      </main>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <Link href="/" aria-label="DigiMark101 home">
        <DigiMarkLogo variant="paper" />
      </Link>
      <h1 className="display mt-8 text-4xl">Choose a new password</h1>
      <p className="mt-3 text-sm text-ink-soft">{PASSWORD_RULE}</p>
      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm" htmlFor="new-password">
          New password
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            aria-invalid={passwordError ? true : undefined}
            aria-describedby="password-rule"
            className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink"
          />
        </label>
        <p id="password-rule" className="text-sm text-ink-soft">
          {PASSWORD_RULE}
        </p>
        {passwordError ? (
          <p className="text-sm text-signal" role="alert">
            {passwordError}
          </p>
        ) : null}
        <label className="grid gap-1 text-sm" htmlFor="confirm-password">
          Confirm password
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            aria-invalid={confirmError ? true : undefined}
            className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink"
          />
        </label>
        {confirmError ? (
          <p className="text-sm text-signal" role="alert">
            {confirmError}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-signal" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-signal" disabled={pending}>
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  )
}
