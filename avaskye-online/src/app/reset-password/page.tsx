"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { consumeOfficeLink } from "@/lib/finish-office-link"

export default function ResetPasswordPage() {
  const started = useRef(false)
  const [phase, setPhase] = useState<"working" | "ready" | "saved" | "error">("working")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void consumeOfficeLink()
      .then((result) => {
        setPhase(result.result === "rejected" || result.result === "failed" ? "error" : "ready")
      })
      .catch(() => setPhase("error"))
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    if (password.length < 8) {
      setError("Use at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Those passwords do not match.")
      return
    }
    setPending(true)
    setError("")
    try {
      const response = await fetch("/api/office/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        signal: AbortSignal.timeout(20000),
      })
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        setError(
          response.status === 401
            ? "This reset link is missing or expired. Request a new one from the sign-in page."
            : data?.error || "Could not update the password.",
        )
        return
      }
      setPassword("")
      setConfirm("")
      setPhase("saved")
    } catch {
      setError("Could not update the password.")
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-accent">Ava&apos;s Skye Studio</p>
      <h1 className="mt-3 text-4xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>
        Choose a new password
      </h1>
      {phase === "working" ? <p className="mt-4 text-sm text-muted">Checking your reset link…</p> : null}
      {phase === "error" ? (
        <p className="mt-4 text-sm" role="alert">
          This reset link was rejected or has expired. Request a new one from the sign-in page, and open it in this browser.
        </p>
      ) : null}
      {phase === "saved" ? (
        <p className="mt-4 text-sm text-muted">Password updated. You can open the office with the new password.</p>
      ) : null}
      {phase === "ready" ? (
        <form className="mt-6 grid gap-3" onSubmit={submit}>
          <p className="text-sm text-muted">Open the link from your email in this browser, then choose the new password.</p>
          <label className="text-sm" htmlFor="office-reset-password">
            New password
          </label>
          <input
            id="office-reset-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-full border border-border bg-transparent px-4 py-2"
            required
          />
          <label className="text-sm" htmlFor="office-reset-confirm">
            Confirm password
          </label>
          <input
            id="office-reset-confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="rounded-full border border-border bg-transparent px-4 py-2"
            required
          />
          {error ? (
            <p className="text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="mt-2 w-fit rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending}>
            {pending ? "Saving…" : "Update password"}
          </button>
        </form>
      ) : null}
      <p className="mt-6 text-sm">
        <a className="underline" href="/login">
          Back to owner sign-in
        </a>
      </p>
    </main>
  )
}
