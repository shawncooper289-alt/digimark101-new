"use client"

import { useState } from "react"

type Provider = { id: string; label: string; missing: string[]; ready: boolean; accountName?: string | null }

export function SocialConnect({ providers }: { providers: Provider[] }) {
  const [pending, setPending] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function connect(id: string) {
    setPending(id)
    setMessage(null)
    try {
      const response = await fetch("/api/office/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: id }),
      })
      const data = (await response.json()) as { authUrl?: string; message?: string; error?: string }
      if (data.authUrl) {
        window.location.assign(data.authUrl)
        return
      }
      setMessage(data.message || data.error || "Could not start that connection.")
    } catch {
      setMessage("Could not start that connection.")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="mt-8 grid gap-3">
      <h2 className="text-3xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Connected accounts</h2>
      <p className="max-w-2xl text-sm text-muted">These buttons connect the signed-in owner. Customer workspaces connect the same networks inside the studio on digimark101.com. A network stays on “Needs app credentials” until its client id, secret, and SOCIAL_TOKEN_KEY are set on this server.</p>
      {message ? <p className="text-sm" role="status">{message}</p> : null}
      {providers.map((provider) => (
        <article key={provider.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-surface p-4">
          <div>
            <p className="font-medium">{provider.label}</p>
            <p className="text-sm text-muted">
              {provider.accountName ? `Connected as ${provider.accountName}` : provider.ready ? "Not connected yet." : `Needs app credentials: ${provider.missing.join(", ")}`}
            </p>
          </div>
          <button type="button" className="rounded-full border border-border px-4 py-2 text-sm" disabled={pending === provider.id} onClick={() => void connect(provider.id)}>
            {pending === provider.id ? "Starting…" : provider.ready ? "Connect" : "Needs app credentials"}
          </button>
        </article>
      ))}
    </div>
  )
}
