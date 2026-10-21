"use client"

import { useState } from "react"
import { SOCIAL_PLAYS, type SocialPlay } from "@/lib/social-strategies"

const PLATFORMS = ["facebook", "tiktok", "instagram", "youtube"] as const

export function SocialDesk() {
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number] | "all">("all")
  const [saved, setSaved] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const visible = platform === "all" ? SOCIAL_PLAYS : SOCIAL_PLAYS.filter((p) => p.platform === platform)

  async function saveAsCampaign(play: SocialPlay) {
    setPending(true)
    setSaved(null)
    try {
      const response = await fetch("/api/office/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          action: "create_campaign",
          name: play.name,
          channel: play.platform === "youtube" ? "site" : "social",
          brief: `${play.cadence}. ${play.goal}\n\nSteps:\n${play.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nExample: ${play.example}`,
          product: "digimark101",
        }),
      })
      const data = (await response.json()) as { error?: string }
      setSaved(response.ok ? `Saved “${play.name}” as a campaign.` : data.error || "Could not save.")
    } catch {
      setSaved("Could not save.")
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Social Automations</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Free organic plays for Facebook, TikTok, Instagram, and YouTube. Posts, Shorts/Reels, and banners. No paid spend. Save any play as a campaign so it lives with your other work.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className={`rounded-full px-4 py-1 text-sm ${platform === "all" ? "bg-accent text-accent-fg" : "border border-border"}`} onClick={() => setPlatform("all")}>
          All
        </button>
        {PLATFORMS.map((p) => (
          <button key={p} type="button" className={`rounded-full px-4 py-1 text-sm capitalize ${platform === p ? "bg-accent text-accent-fg" : "border border-border"}`} onClick={() => setPlatform(p)}>
            {p}
          </button>
        ))}
      </div>
      {saved ? <p className="mt-4 text-sm">{saved}</p> : null}
      <ul className="mt-8 grid gap-4">
        {visible.map((play) => (
          <li key={play.id} className="rounded-3xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">{play.platform} · {play.type} · {play.cadence}</p>
                <h2 className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>{play.name}</h2>
                <p className="mt-2 text-sm text-muted">{play.goal}</p>
              </div>
              <button type="button" className="rounded-full border border-border px-3 py-1 text-sm" disabled={pending} onClick={() => void saveAsCampaign(play)}>
                Save as campaign
              </button>
            </div>
            <ol className="mt-4 grid gap-1 text-sm">
              {play.steps.map((step, i) => (
                <li key={i}>{i + 1}. {step}</li>
              ))}
            </ol>
            <p className="mt-3 text-sm italic">“{play.example}”</p>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-muted">
        These are free organic only. When connectors are live they can post for you. Until then, copy the play and post it. DigiMark101 studio tools stay on digimark101.com/studio.
      </p>
    </section>
  )
}
