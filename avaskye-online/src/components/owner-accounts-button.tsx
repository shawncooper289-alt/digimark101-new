"use client"

import { useState } from "react"

const OWNER_EMAILS = [
  "shawncooper289@gmail.com",
  "digimark101s@gmail.com",
  "dailydollar101@gmail.com",
  "earndaily101@mail.com",
]

export function OwnerAccountsButton() {
  const [open, setOpen] = useState(false)

  function startSetup(email: string) {
    setOpen(false)
    window.dispatchEvent(new CustomEvent("ava:start-setup", { detail: { email } }))
  }

  return (
    <>
      <button
        type="button"
        className="rounded-full border border-border bg-accent/10 px-3 py-1 text-sm font-medium"
        onClick={() => setOpen(true)}
      >
        Owner accounts
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs uppercase tracking-[0.18em] text-accent">Free founder accounts</p>
            <h2 className="mt-2 text-2xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Choose an email</h2>
            <p className="mt-2 text-sm text-muted">Pick an email and she'll get it started.</p>
            <ul className="mt-5 grid gap-2">
              {OWNER_EMAILS.map((email) => (
                <li key={email}>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-border px-4 py-3 text-left text-sm hover:bg-accent/10"
                    onClick={() => startSetup(email)}
                  >
                    {email}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-5 text-sm text-muted underline" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
