"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useStudioUser } from "@/components/studio/use-studio-user"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

const FIELDS: { name: string; label: string; type?: string; hint?: string }[] = [
  { name: "legal_name", label: "Legal business name" },
  { name: "dba_name", label: "DBA (doing business as)" },
  { name: "business_type", label: "Business type", hint: "Sole proprietor, LLC, S-corp, nonprofit…" },
  { name: "ein", label: "EIN", hint: "Format 12-3456789. Only you can read this." },
  { name: "business_address", label: "Business address" },
  { name: "business_email", label: "Business email", type: "email" },
  { name: "business_phone", label: "Business phone", type: "tel" },
  { name: "business_website", label: "Website", type: "url" },
  { name: "facebook_url", label: "Facebook page", type: "url" },
  { name: "instagram_url", label: "Instagram", type: "url" },
  { name: "google_business_url", label: "Google Business Profile", type: "url" },
  { name: "privacy_url", label: "Privacy policy link", type: "url" },
  { name: "terms_url", label: "Terms link", type: "url" },
]

const input = "min-h-11 rounded-2xl border border-ink/15 px-3"

export function BusinessSetup() {
  const { ready, userId } = useStudioUser()
  const [values, setValues] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    if (!supabase || !userId) return
    void supabase
      .from("client_onboarding")
      .select(FIELDS.map((field) => field.name).join(","))
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        const row = data as unknown as Record<string, string | null>
        setValues(Object.fromEntries(FIELDS.map((field) => [field.name, row[field.name] ?? ""])))
      })
  }, [userId])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    const ein = (values.ein ?? "").trim()
    if (ein && !/^\d{2}-?\d{7}$/.test(ein)) return setMessage("An EIN has nine digits, like 12-3456789.")
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const body = (await response.json()) as { error?: string }
      setMessage(response.ok ? "Business details saved." : body.error || "Could not save business details.")
    } catch {
      setMessage("Could not save business details.")
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return <p className="text-sm text-ink-soft">Loading…</p>
  if (!userId) {
    return (
      <p className="rounded-3xl border border-ink/10 bg-card p-4 text-sm text-ink-soft">
        <Link href="/login" className="underline">Sign in</Link> to save your business details.
      </p>
    )
  }

  return (
    <form onSubmit={(event) => void save(event)} className="grid max-w-2xl gap-3 rounded-3xl border border-ink/10 bg-card p-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <label key={field.name} className="grid gap-1 text-sm">
          <span className="font-medium">{field.label}</span>
          <input
            name={field.name}
            type={field.type ?? "text"}
            value={values[field.name] ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
            className={input}
          />
          {field.hint ? <span className="text-xs text-ink-soft">{field.hint}</span> : null}
        </label>
      ))}
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-signal" disabled={busy}>{busy ? "Saving…" : "Save business details"}</button>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </div>
    </form>
  )
}
