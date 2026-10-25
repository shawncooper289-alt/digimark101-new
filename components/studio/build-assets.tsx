"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useStudioUser } from "@/components/studio/use-studio-user"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

type Asset = { id: string; asset_type: string; name: string; holding_url: string | null; final_url: string | null; status: string }

const input = "min-h-11 rounded-2xl border border-ink/15 px-3"
const httpUrl = (value: string) => !value || /^https?:\/\//i.test(value)

export function BuildAssets() {
  const { ready, userId } = useStudioUser()
  const [items, setItems] = useState<Asset[]>([])
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowser()
    if (!supabase || !userId) return
    const { data, error } = await supabase
      .from("client_build_assets")
      .select("id, asset_type, name, holding_url, final_url, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) setMessage("Could not load your builds. Try again in a moment.")
    setItems((data ?? []) as Asset[])
  }, [userId])

  useEffect(() => {
    queueMicrotask(() => void load())
  }, [load])

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const supabase = createSupabaseBrowser()
    if (!supabase || !userId) return
    const form = event.currentTarget
    const data = new FormData(form)
    const holding = String(data.get("holding_url") || "").trim()
    const final = String(data.get("final_url") || "").trim()
    if (!httpUrl(holding) || !httpUrl(final)) return setMessage("Links need to start with https://")
    const { error } = await supabase.from("client_build_assets").insert({
      user_id: userId,
      name: String(data.get("name") || "").trim(),
      asset_type: String(data.get("asset_type") || "website"),
      holding_url: holding || null,
      final_url: final || null,
      status: final ? "live" : "planned",
    })
    if (error) return setMessage("Could not save that build.")
    form.reset()
    setMessage("Saved.")
    await load()
  }

  async function setFinal(item: Asset) {
    const supabase = createSupabaseBrowser()
    if (!supabase || !userId) return
    const next = window.prompt("Final link (https://…)", item.final_url ?? "")
    if (next === null) return
    const value = next.trim()
    if (!httpUrl(value)) return setMessage("Links need to start with https://")
    await supabase.from("client_build_assets").update({ final_url: value || null, status: value ? "live" : "planned" }).eq("id", item.id).eq("user_id", userId)
    await load()
  }

  async function remove(id: string) {
    const supabase = createSupabaseBrowser()
    if (!supabase || !userId) return
    await supabase.from("client_build_assets").delete().eq("id", id).eq("user_id", userId)
    await load()
  }

  if (!ready) return <p className="text-sm text-ink-soft">Loading…</p>
  if (!userId) {
    return (
      <p className="rounded-3xl border border-ink/10 bg-card p-4 text-sm text-ink-soft">
        <Link href="/login" className="underline">Sign in</Link> to track your builds.
      </p>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <form onSubmit={(event) => void add(event)} className="grid h-fit gap-3 rounded-3xl border border-ink/10 bg-card p-4">
        <label className="grid gap-1 text-sm"><span className="font-medium">Name</span><input name="name" required className={input} /></label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Type</span>
          <select name="asset_type" className={input} defaultValue="website">
            <option value="website">Website</option>
            <option value="landing_page">Landing page</option>
            <option value="banner">Banner</option>
            <option value="email_template">Email template</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm"><span className="font-medium">Holding link</span><input name="holding_url" type="url" placeholder="https://" className={input} /></label>
        <label className="grid gap-1 text-sm"><span className="font-medium">Final link</span><input name="final_url" type="url" placeholder="https://" className={input} /></label>
        <button type="submit" className="btn btn-signal">Save build</button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>
      <div>
        {items.length === 0 ? <p className="text-sm text-ink-soft">No builds yet. Add a website, banner, or page with its holding and final links.</p> : null}
        <ul className="grid gap-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-ink/10 bg-card px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{item.name} <span className="text-sm font-normal text-ink-soft">· {item.asset_type.replace("_", " ")} · {item.status}</span></p>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost" onClick={() => void setFinal(item)}>Set final link</button>
                  <button type="button" className="btn btn-ghost" onClick={() => void remove(item.id)}>Delete</button>
                </div>
              </div>
              <p className="text-sm text-ink-soft">
                {item.holding_url ? <a className="underline" href={item.holding_url} target="_blank" rel="noopener noreferrer">Holding</a> : "No holding link"}
                {" · "}
                {item.final_url ? <a className="underline" href={item.final_url} target="_blank" rel="noopener noreferrer">Final</a> : "No final link"}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
