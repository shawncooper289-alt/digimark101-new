"use client"

import { useEffect, useState } from "react"

type Scene = {
  caption: string
  visual: string
  camera: string
  transition: string
  lighting: string
  startMs: number
  endMs: number
  talking: boolean
}

type Project = {
  title: string
  script: string
  spokenSeconds: number
  requestedSeconds: number
  lengthNote: string
  voiceLabel: string
  lighting: string
  aspect: string
  style: string
  scenes: Scene[]
  next: { title: string; hook: string }[]
  captionsVtt: string
  ignoredOverrides: string[]
}

type Capabilities = {
  final?: { ready?: boolean; missing?: string[]; note?: string }
  preview?: { note?: string }
  voice?: { label?: string; note?: string }
  music?: { note?: string }
  broll?: { note?: string }
  stockAvatars?: { label: string; note: string }[]
  stockVoices?: { label: string; note: string }[]
  attire?: { id: string; label: string; connected: boolean }[]
  avatarSource?: string
  locked?: boolean
}

type Result = {
  delivery?: string
  delivered?: boolean
  label?: string
  reasons?: string[]
  note?: string
  html?: string
  fileName?: string
  videoUrl?: string
  subtitleUrl?: string
  soundtrackUrl?: string
  videoId?: string
  provider?: string
  attempt?: number
  picture?: string
  project?: Project
  saved?: string
  error?: string
  posted?: boolean
}

type Brief = {
  title: string
  idea: string
  audience: string
  offer: string
  cta: string
  proof: string
  seconds: number
  aspect: string
  style: string
  presenter: string
  stockLabel: string
  voiceChoice: string
  attire: string
  brand: { primary: string; accent: string; font: string; logoUrl: string }
  scriptOverride: string
}

const EMPTY: Brief = {
  title: "",
  idea: "",
  audience: "",
  offer: "",
  cta: "",
  proof: "",
  seconds: 60,
  aspect: "9:16",
  style: "presenter",
  presenter: "ava",
  stockLabel: "",
  voiceChoice: "",
  attire: "navy-blazer",
  brand: { primary: "#14181a", accent: "#cbb082", font: "Georgia", logoUrl: "" },
  scriptOverride: "",
}

const input = "min-h-11 rounded-2xl border border-ink/15 bg-transparent px-3"

function download(name: string, contents: string, type: string) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function VideoMaker() {
  const [brief, setBrief] = useState<Brief>(EMPTY)
  const [caps, setCaps] = useState<Capabilities | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [when, setWhen] = useState("")
  const [network, setNetwork] = useState("tiktok")
  const [library, setLibrary] = useState<{ title: string; delivery: string; at: string }[]>([])
  const [polls, setPolls] = useState(0)

  useEffect(() => {
    void fetch("/api/studio/video").then((response) => response.json()).then((data: Capabilities) => setCaps(data)).catch(() => setCaps(null))
    queueMicrotask(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("digimark-video-library") || "[]") as { title: string; delivery: string; at: string }[]
        if (Array.isArray(saved)) setLibrary(saved.slice(0, 8))
      } catch {
        setLibrary([])
      }
    })
  }, [])

  function patch(partial: Partial<Brief>) {
    setBrief((current) => ({ ...current, ...partial }))
  }

  async function send(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true)
    try {
      const response = await fetch("/api/studio/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, brief, ...extra }),
      })
      const data = (await response.json()) as Result
      setResult(data)
      if (data.project?.script && action === "prepare") patch({ scriptOverride: data.project.script, title: data.project.title || brief.title })
      if (data.delivery === "preview-draft" || data.delivery === "final") {
        const entry = { title: data.project?.title || brief.title || "Video", delivery: data.delivery, at: new Date().toISOString() }
        const next = [entry, ...library].slice(0, 8)
        setLibrary(next)
        localStorage.setItem("digimark-video-library", JSON.stringify(next))
      }
      return data
    } catch {
      setResult({ error: "The video maker did not answer." })
      return null
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (result?.delivery !== "rendering" || !result.videoId || !result.provider || polls > 40) return
    const videoId = result.videoId
    const provider = result.provider
    const attempt = result.attempt || 1
    const timer = window.setTimeout(() => {
      void fetch("/api/studio/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", brief, videoId, provider, attempt }),
      })
        .then((response) => response.json())
        .then((data: Result) => {
          setResult(data)
          setPolls((count) => count + 1)
        })
        .catch(() => setPolls((count) => count + 1))
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [brief, result?.delivery, result?.videoId, result?.provider, result?.attempt, polls])

  const project = result?.project
  return (
    <div className="grid gap-8">
      <form className="grid gap-4 rounded-3xl border border-ink/10 bg-card p-5" onSubmit={(event) => { event.preventDefault(); void send("prepare") }}>
        <label className="grid gap-1 text-sm"><span className="font-medium">Working title</span><input className={input} value={brief.title} onChange={(event) => patch({ title: event.target.value })} /></label>
        <label className="grid gap-1 text-sm"><span className="font-medium">What is this video about?</span><textarea required className="min-h-24 rounded-2xl border border-ink/15 bg-transparent px-3 py-2" value={brief.idea} onChange={(event) => patch({ idea: event.target.value })} /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm"><span className="font-medium">Who is it for?</span><input className={input} value={brief.audience} onChange={(event) => patch({ audience: event.target.value })} /></label>
          <label className="grid gap-1 text-sm"><span className="font-medium">The offer, if you have one</span><input className={input} value={brief.offer} onChange={(event) => patch({ offer: event.target.value })} /></label>
          <label className="grid gap-1 text-sm"><span className="font-medium">What should they do next?</span><input className={input} value={brief.cta} onChange={(event) => patch({ cta: event.target.value })} /></label>
          <label className="grid gap-1 text-sm"><span className="font-medium">A proof line you can stand behind</span><input className={input} value={brief.proof} onChange={(event) => patch({ proof: event.target.value })} placeholder="Leave blank if you do not have one" /></label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm"><span className="font-medium">Length</span>
            <select className={input} value={brief.seconds} onChange={(event) => patch({ seconds: Number(event.target.value) })}>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={180}>3 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm"><span className="font-medium">Shape</span>
            <select className={input} value={brief.aspect} onChange={(event) => patch({ aspect: event.target.value })}>
              <option value="9:16">9:16 Vertical</option>
              <option value="1:1">1:1 Square</option>
              <option value="16:9">16:9 Wide</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm"><span className="font-medium">Look</span>
            <select className={input} value={brief.style} onChange={(event) => patch({ style: event.target.value })}>
              <option value="presenter">Presenter</option>
              <option value="cinematic">Cinematic</option>
              <option value="motion">Animated</option>
              <option value="promo">Product promo</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm"><span className="font-medium">Who is on camera?</span>
            <select className={input} value={brief.presenter} onChange={(event) => patch({ presenter: event.target.value })}>
              <option value="ava">Ava Skye</option>
              <option value="stock">A ready-made presenter</option>
              <option value="none">No person on camera</option>
            </select>
          </label>
          {brief.presenter === "ava" ? (
            <label className="grid gap-1 text-sm"><span className="font-medium">Ava&apos;s outfit</span>
              <select className={input} value={brief.attire} onChange={(event) => patch({ attire: event.target.value })}>
                {(caps?.attire || [{ id: "navy-blazer", label: "Navy blazer" }, { id: "black-suit", label: "Black suit" }, { id: "tailored-jacket", label: "Tailored jacket" }]).map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          ) : null}
          {brief.presenter === "stock" ? (
            <label className="grid gap-1 text-sm"><span className="font-medium">Ready-made presenter</span>
              <select className={input} value={brief.stockLabel} onChange={(event) => patch({ stockLabel: event.target.value })}>
                <option value="">None connected yet</option>
                {(caps?.stockAvatars || []).map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
              </select>
            </label>
          ) : null}
        </div>
        {brief.presenter !== "ava" ? (
          <label className="grid gap-1 text-sm"><span className="font-medium">Voice</span>
            <select className={input} value={brief.voiceChoice} onChange={(event) => patch({ voiceChoice: event.target.value })}>
              <option value="">House voice</option>
              {(caps?.stockVoices || []).map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
            </select>
          </label>
        ) : null}
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm"><span className="font-medium">Brand color</span><input className={input} value={brief.brand.primary} onChange={(event) => patch({ brand: { ...brief.brand, primary: event.target.value } })} /></label>
          <label className="grid gap-1 text-sm"><span className="font-medium">Accent color</span><input className={input} value={brief.brand.accent} onChange={(event) => patch({ brand: { ...brief.brand, accent: event.target.value } })} /></label>
          <label className="grid gap-1 text-sm"><span className="font-medium">Logo link</span><input className={input} placeholder="https://" value={brief.brand.logoUrl} onChange={(event) => patch({ brand: { ...brief.brand, logoUrl: event.target.value } })} /></label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-signal" type="submit" disabled={busy}>Write the script</button>
          <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => void send("preview")}>Make a preview draft</button>
          <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => { setPolls(0); void send("render") }}>Render a finished video</button>
        </div>
      </form>

      <section className="rounded-3xl border border-ink/10 p-5" aria-live="polite">
        <h2 className="font-serif text-2xl">What is ready today</h2>
        <ul className="mt-3 grid gap-2 text-sm text-ink-soft">
          <li>Quality stays on the premium setting. A lower setting is ignored.</li>
          <li>{caps?.preview?.note || "A preview draft is labeled and is not a finished video."}</li>
          <li>{caps?.final?.note || "A finished video waits for the pro keys."}</li>
          <li>{caps?.voice?.note}</li>
          <li>{caps?.music?.note}</li>
          <li>{caps?.broll?.note}</li>
          <li>{caps?.avatarSource}</li>
          {caps?.final?.ready ? null : (caps?.final?.missing || []).map((item) => <li key={item}>Still needed: {item}</li>)}
        </ul>
        {(caps?.stockAvatars || []).length ? (
          <ul className="mt-3 grid gap-1 text-sm">
            {caps?.stockAvatars?.map((item) => <li key={item.label}>{item.label}. {item.note}</li>)}
          </ul>
        ) : <p className="mt-3 text-sm text-ink-soft">No ready-made presenters are connected. None are invented here.</p>}
      </section>

      {result?.error ? <p className="text-sm text-signal">{result.error}</p> : null}
      {result?.reasons?.length ? (
        <div className="rounded-3xl border border-signal/40 bg-card p-5">
          <h2 className="font-serif text-2xl">Not delivered</h2>
          <ul className="mt-3 grid gap-1 text-sm">{result.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          {result.note ? <p className="mt-2 text-sm text-ink-soft">{result.note}</p> : null}
        </div>
      ) : null}
      {result?.delivery === "rendering" ? <p className="text-sm">Render in progress. This page checks again on its own. Nothing is marked finished yet.{polls > 40 ? " It is still working. Use Render a finished video to check again." : ""}</p> : null}
      {result?.delivery === "preview-draft" && result.html ? (
        <section className="grid gap-3">
          <h2 className="font-serif text-2xl">{result.label}</h2>
          <iframe title="Preview draft" className="h-[640px] w-full rounded-3xl border border-ink/10 bg-paper" sandbox="allow-scripts" srcDoc={result.html} />
          <button type="button" className="btn btn-ghost w-fit" onClick={() => download(result.fileName || "preview-draft.html", result.html || "", "text/html")}>Download the preview draft</button>
        </section>
      ) : null}
      {result?.delivery === "final" && result.delivered && result.videoUrl ? (
        <section className="grid gap-3 rounded-3xl border border-ink/10 bg-card p-5">
          <h2 className="font-serif text-2xl">Finished video</h2>
          <p className="text-sm text-ink-soft">{result.picture} The quality checks passed.</p>
          <video className="w-full rounded-2xl" controls src={result.videoUrl} />
          <a className="btn btn-signal w-fit" href={result.videoUrl}>Download the finished video</a>
          {result.subtitleUrl ? <a className="text-sm underline" href={result.subtitleUrl}>Caption file from the video service</a> : null}
          {result.soundtrackUrl ? <a className="text-sm underline" href={result.soundtrackUrl}>Soundtrack</a> : <p className="text-sm text-ink-soft">No soundtrack was added.</p>}
        </section>
      ) : null}

      {project ? (
        <section className="grid gap-4">
          <div>
            <h2 className="font-serif text-2xl">Script</h2>
            <p className="mt-1 text-sm text-ink-soft">{project.lengthNote} About {project.spokenSeconds} seconds of speech. Voice: {project.voiceLabel}. Light: {project.lighting}</p>
            {project.ignoredOverrides?.length ? <p className="mt-1 text-sm">A lower quality setting was ignored.</p> : null}
            <textarea className="mt-3 min-h-36 w-full rounded-2xl border border-ink/15 bg-transparent px-3 py-2" value={brief.scriptOverride || project.script} onChange={(event) => patch({ scriptOverride: event.target.value })} />
          </div>
          <div>
            <h2 className="font-serif text-2xl">Scenes</h2>
            <ol className="mt-3 grid gap-3">
              {project.scenes.map((scene, index) => (
                <li key={`${scene.startMs}-${index}`} className="rounded-2xl border border-ink/10 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">Scene {index + 1} · {(scene.endMs - scene.startMs) / 1000}s {scene.talking ? "· talking" : ""}</p>
                  <p className="mt-2 font-medium">{scene.caption}</p>
                  <p className="mt-1 text-sm text-ink-soft">{scene.visual}</p>
                  <p className="mt-1 text-sm text-ink-soft">{scene.camera} {scene.transition}</p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="font-serif text-2xl">Captions</h2>
            <button type="button" className="btn btn-ghost mt-3" onClick={() => download("captions.vtt", project.captionsVtt, "text/vtt")}>Download captions</button>
          </div>
          <div>
            <h2 className="font-serif text-2xl">What could come next</h2>
            <ul className="mt-3 grid gap-2 text-sm">{project.next.map((item) => <li key={item.title}><span className="font-medium">{item.title}.</span> {item.hook}</li>)}</ul>
          </div>
          <form className="grid gap-3 rounded-3xl border border-ink/10 p-4" onSubmit={(event) => { event.preventDefault(); void send("handoff", { platform: network, scheduledFor: when, delivery: result?.delivery === "final" ? "final" : "preview-draft" }) }}>
            <h2 className="font-serif text-2xl">Put it on the schedule</h2>
            <p className="text-sm text-ink-soft">This saves a draft for social. It does not post.</p>
            <div className="flex flex-wrap gap-2">
              <select className={input} value={network} onChange={(event) => setNetwork(event.target.value)}>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
              </select>
              <input className={input} type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
              <button className="btn btn-ghost" type="submit" disabled={busy}>Save the draft</button>
            </div>
            {result?.saved ? <p className="text-sm">{result.saved}</p> : null}
          </form>
        </section>
      ) : null}

      <section>
        <h2 className="font-serif text-2xl">Library on this browser</h2>
        {library.length === 0 ? <p className="mt-2 text-sm text-ink-soft">Finished videos and preview drafts you make here show up in this list.</p> : null}
        <ul className="mt-3 grid gap-2 text-sm">
          {library.map((item, index) => (
            <li key={`${item.at}-${index}`}>{item.title} · {item.delivery === "final" ? "Finished video" : "Preview draft"}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
