"use client"

import { useState } from "react"

type Provider = { id: string; label: string; missing: string[]; ready: boolean; accountName?: string | null }

export function SocialConnections({ providers, notice }: { providers: Provider[]; notice?: string | null }) {
  const [pending, setPending] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(notice || null)

  async function connect(id: string) {
    setPending(id)
    setMessage(null)
    try {
      const response = await fetch("/api/connect/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: id }),
      })
      const data = (await response.json()) as { authUrl?: string; message?: string; error?: string; missing?: string[] }
      if (data.authUrl) {
        window.location.assign(data.authUrl)
        return
      }
      setMessage(data.message || (data.missing?.length ? `Needs app credentials: ${data.missing.join(", ")}` : data.error || "Could not start that connection."))
    } catch {
      setMessage("Could not start that connection.")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="mt-8 grid gap-3">
      {message ? <p className="rounded-2xl bg-mist px-4 py-3 text-sm" role="status">{message}</p> : null}
      {providers.map((provider) => (
        <article key={provider.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-ink/10 bg-card p-4">
          <div>
            <h2 className="font-serif text-2xl">{provider.label}</h2>
            <p className="text-sm text-ink-soft">
              {provider.accountName ? `Connected as ${provider.accountName}` : provider.ready ? "Not connected yet." : `Needs app credentials: ${provider.missing.join(", ")}`}
            </p>
          </div>
          <button type="button" className="btn btn-signal" disabled={pending === provider.id} onClick={() => void connect(provider.id)}>
            {pending === provider.id ? "Starting…" : provider.ready ? "Connect" : "Needs app credentials"}
          </button>
        </article>
      ))}
    </div>
  )
}
