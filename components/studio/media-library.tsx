"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { usePlatform } from "@/components/studio/platform-provider"
import { useStudioUser } from "@/components/studio/use-studio-user"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

type Media = { id: string; title: string; media_type: string; url: string | null; storage_path: string | null; notes: string | null }
type CampaignLink = { id: string; campaign_id: string; media_id: string }

const input = "min-h-11 rounded-2xl border border-ink/15 px-3"

export function MediaLibrary() {
  const { ready, userId } = useStudioUser()
  const platform = usePlatform()
  const [items, setItems] = useState<Media[]>([])
  const [links, setLinks] = useState<CampaignLink[]>([])
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowser()
    if (!supabase || !userId) return
    const [media, joined] = await Promise.all([
      supabase.from("client_media").select("id, title, media_type, url, storage_path, notes").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("campaign_media").select("id, campaign_id, media_id").eq("user_id", userId),
    ])
    if (media.error) setMessage("Could not load your media. Try again in a moment.")
    setItems((media.data ?? []) as Media[])
    setLinks((joined.data ?? []) as CampaignLink[])
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
    const title = String(data.get("title") || "").trim()
    const url = String(data.get("url") || "").trim()
    const file = data.get("file")
    const upload = file instanceof File && file.size > 0 ? file : null
    if (!title) return setMessage("Give this media a title.")
    if (!url && !upload) return setMessage("Choose a file or paste a link.")
    if (url && !/^https?:\/\//i.test(url)) return setMessage("Links need to start with https://")
    if (upload && upload.size > 5_000_000) return setMessage("Files need to be 5 MB or smaller.")
    setBusy(true)
    setMessage("")
    let storagePath: string | null = null
    if (upload) {
      const safe = upload.name.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 80) || "file"
      storagePath = `${userId}/media-${crypto.randomUUID()}-${safe}`
      const { error } = await supabase.storage.from("client-files").upload(storagePath, upload, { contentType: upload.type || "application/octet-stream" })
      if (error) {
        setBusy(false)
        return setMessage("Could not upload that file.")
      }
    }
    const { error } = await supabase.from("client_media").insert({
      user_id: userId,
      title,
      media_type: String(data.get("media_type") || "image"),
      url: url || null,
      storage_path: storagePath,
      notes: String(data.get("notes") || "").trim() || null,
    })
    setBusy(false)
    if (error) return setMessage("Could not save that media.")
    form.reset()
    setMessage("Saved to your media library.")
    await load()
  }

  async function open(item: Media) {
    if (item.url) return window.open(item.url, "_blank", "noopener,noreferrer")
    const supabase = createSupabaseBrowser()
    if (!supabase || !item.storage_path) return
    const { data } = await supabase.storage.from("client-files").createSignedUrl(item.storage_path, 300)
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer")
    else setMessage("Could not open that file.")
  }

  async function linkCampaign(mediaId: string, campaignId: string) {
    const supabase = createSupabaseBrowser()
    if (!supabase || !userId || !campaignId) return
    const { error } = await supabase.from("campaign_media").upsert({ user_id: userId, media_id: mediaId, campaign_id: campaignId }, { onConflict: "campaign_id,media_id" })
    setMessage(error ? "Could not link that campaign." : "Linked to the campaign.")
    await load()
  }

  async function unlink(id: string) {
    const supabase = createSupabaseBrowser()
    if (!supabase || !userId) return
    await supabase.from("campaign_media").delete().eq("id", id).eq("user_id", userId)
    await load()
  }

  async function remove(item: Media) {
    const supabase = createSupabaseBrowser()
    if (!supabase || !userId) return
    if (item.storage_path) await supabase.storage.from("client-files").remove([item.storage_path])
    await supabase.from("client_media").delete().eq("id", item.id).eq("user_id", userId)
    await load()
  }

  if (!ready) return <p className="text-sm text-ink-soft">Loading…</p>
  if (!userId) {
    return (
      <p className="rounded-3xl border border-ink/10 bg-card p-4 text-sm text-ink-soft">
        <Link href="/login" className="underline">Sign in</Link> to keep a media library. Preview mode does not store media.
      </p>
    )
  }

  const campaigns = platform.workspace.campaigns
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <form onSubmit={(event) => void add(event)} className="grid h-fit gap-3 rounded-3xl border border-ink/10 bg-card p-4">
        <label className="grid gap-1 text-sm"><span className="font-medium">Title</span><input name="title" required className={input} /></label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Type</span>
          <select name="media_type" className={input} defaultValue="image">
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="logo">Logo</option>
            <option value="document">Document</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm"><span className="font-medium">Upload a file</span><input name="file" type="file" className="text-sm" /></label>
        <label className="grid gap-1 text-sm"><span className="font-medium">Or paste a link</span><input name="url" type="url" placeholder="https://" className={input} /></label>
        <label className="grid gap-1 text-sm"><span className="font-medium">Notes</span><textarea name="notes" className="min-h-20 rounded-2xl border border-ink/15 px-3 py-2" /></label>
        <button type="submit" className="btn btn-signal" disabled={busy}>{busy ? "Saving…" : "Add to library"}</button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>
      <div>
        {items.length === 0 ? <p className="text-sm text-ink-soft">No media yet. Add a logo, photo, or video you want to reuse.</p> : null}
        <ul className="grid gap-2">
          {items.map((item) => {
            const attached = links.filter((row) => row.media_id === item.id)
            return (
              <li key={item.id} className="rounded-2xl border border-ink/10 bg-card px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.title} <span className="text-sm font-normal text-ink-soft">· {item.media_type}</span></p>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-ghost" onClick={() => void open(item)}>Open</button>
                    <button type="button" className="btn btn-ghost" onClick={() => void remove(item)}>Delete</button>
                  </div>
                </div>
                {item.notes ? <p className="text-sm text-ink-soft">{item.notes}</p> : null}
                {attached.length ? (
                  <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                    {attached.map((row) => (
                      <li key={row.id} className="rounded-full bg-mist px-3 py-1">
                        {campaigns.find((campaign) => campaign.id === row.campaign_id)?.name ?? "Campaign"}{" "}
                        <button type="button" className="underline" onClick={() => void unlink(row.id)} aria-label="Remove campaign link">remove</button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <label className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-ink-soft">Use in campaign</span>
                  <select className="min-h-9 rounded-xl border border-ink/15 px-2" value="" onChange={(event) => void linkCampaign(item.id, event.target.value)}>
                    <option value="">{campaigns.length ? "Choose…" : "No campaigns yet"}</option>
                    {campaigns.filter((campaign) => !attached.some((row) => row.campaign_id === campaign.id)).map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                    ))}
                  </select>
                </label>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 text-sm text-ink-soft">
          Need a campaign first? <Link href="/studio/campaigns" className="underline">Open Email</Link>.
        </p>
      </div>
    </div>
  )
}
