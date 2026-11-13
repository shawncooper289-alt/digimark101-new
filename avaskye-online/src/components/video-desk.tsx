"use client"

import { useEffect, useMemo, useState } from "react"

type Scene = { caption: string; visual: string; camera: string; transition: string; startMs: number; endMs: number; talking: boolean }
type Project = {
  title: string
  script: string
  spokenSeconds: number
  lengthNote: string
  voiceLabel: string
  lighting: string
  scenes: Scene[]
  next: { title: string; hook: string }[]
  captionsVtt: string
}
type Caps = {
  final?: { ready?: boolean; missing?: string[]; note?: string }
  preview?: { note?: string }
  voice?: { note?: string }
  music?: { note?: string }
  broll?: { note?: string }
  avatarSource?: string
  stockAvatars?: { label: string; note: string }[]
  attire?: { id: string; label: string }[]
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
  videoId?: string
  provider?: string
  attempt?: number
  project?: Project
  saved?: string
  error?: string
}

const field = "rounded-2xl border border-border bg-transparent px-3 py-2"

export function VideoDesk() {
  const [idea, setIdea] = useState("")
  const [audience, setAudience] = useState("")
  const [cta, setCta] = useState("")
  const [seconds, setSeconds] = useState(60)
  const [aspect, setAspect] = useState("9:16")
  const [style, setStyle] = useState("presenter")
  const [attire, setAttire] = useState("navy-blazer")
  const [scriptOverride, setScriptOverride] = useState("")
  const [caps, setCaps] = useState<Caps | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [polls, setPolls] = useState(0)
  const [when, setWhen] = useState("")
  const brief = useMemo(() => ({
    idea, audience, cta, seconds, aspect, style, presenter: "ava", attire, scriptOverride, title: "Ava video",
  }), [idea, audience, cta, seconds, aspect, style, attire, scriptOverride])

  useEffect(() => {
    void fetch("/api/office/video").then((response) => response.json()).then((data: Caps) => setCaps(data)).catch(() => setCaps(null))
  }, [])

  async function send(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true)
    try {
      const response = await fetch("/api/office/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, brief, ...extra }),
      })
      const data = (await response.json()) as Result
      setResult(data)
      if (action === "prepare" && data.project?.script) setScriptOverride(data.project.script)
    } catch {
      setResult({ error: "The video maker did not answer." })
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
      void fetch("/api/office/video", {
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

  function download(name: string, contents: string, type: string) {
    const blob = new Blob([contents], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  const project = result?.project
  return (
    <section className="grid gap-8">
      <div>
        <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Video maker</h1>
        <p className="mt-3 max-w-2xl text-muted">
          This is Ava&apos;s video maker. Her face stays the same. Only the business outfit changes. A finished video stays premium. A preview draft is marked as a draft.
        </p>
      </div>
      <form className="grid gap-3 rounded-3xl border border-border bg-surface p-5" onSubmit={(event) => { event.preventDefault(); void send("prepare") }}>
        <label className="grid gap-1 text-sm">What is this video about?<textarea required className={field} value={idea} onChange={(event) => setIdea(event.target.value)} /></label>
        <label className="grid gap-1 text-sm">Who is it for?<input className={field} value={audience} onChange={(event) => setAudience(event.target.value)} /></label>
        <label className="grid gap-1 text-sm">What should they do next?<input className={field} value={cta} onChange={(event) => setCta(event.target.value)} /></label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm">Length
            <select className={field} value={seconds} onChange={(event) => setSeconds(Number(event.target.value))}>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={180}>3 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">Shape
            <select className={field} value={aspect} onChange={(event) => setAspect(event.target.value)}>
              <option value="9:16">9:16 Vertical</option>
              <option value="1:1">1:1 Square</option>
              <option value="16:9">16:9 Wide</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">Outfit
            <select className={field} value={attire} onChange={(event) => setAttire(event.target.value)}>
              {(caps?.attire || [{ id: "navy-blazer", label: "Navy blazer" }, { id: "black-suit", label: "Black suit" }, { id: "tailored-jacket", label: "Tailored jacket" }]).map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-1 text-sm">Look
          <select className={field} value={style} onChange={(event) => setStyle(event.target.value)}>
            <option value="presenter">Presenter</option>
            <option value="cinematic">Cinematic</option>
            <option value="motion">Animated</option>
            <option value="promo">Product promo</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" type="submit" disabled={busy}>Write the script</button>
          <button className="rounded-full border border-border px-4 py-2 text-sm" type="button" disabled={busy} onClick={() => void send("preview")}>Make a preview draft</button>
          <button className="rounded-full border border-border px-4 py-2 text-sm" type="button" disabled={busy} onClick={() => { setPolls(0); void send("render") }}>Render a finished video</button>
        </div>
      </form>
      <section className="rounded-3xl border border-border p-5 text-sm text-muted" aria-live="polite">
        <p>{caps?.final?.note}</p>
        <p className="mt-2">{caps?.preview?.note}</p>
        <p className="mt-2">{caps?.voice?.note}</p>
        <p className="mt-2">{caps?.music?.note}</p>
        <p className="mt-2">{caps?.broll?.note}</p>
        <p className="mt-2">{caps?.avatarSource}</p>
        {(caps?.final?.missing || []).map((item) => <p key={item} className="mt-2">Still needed: {item}</p>)}
      </section>
      {result?.error ? <p className="text-sm">{result.error}</p> : null}
      {result?.reasons?.length ? (
        <div className="rounded-3xl border border-border p-5">
          <h2 className="text-2xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Not delivered</h2>
          <ul className="mt-3 grid gap-1 text-sm">{result.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </div>
      ) : null}
      {result?.delivery === "rendering" ? <p className="text-sm">Render in progress. Nothing is marked finished yet.</p> : null}
      {result?.delivery === "preview-draft" && result.html ? (
        <div className="grid gap-3">
          <h2 className="text-2xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>{result.label}</h2>
          <iframe title="Preview draft" className="h-[640px] w-full rounded-3xl border border-border" sandbox="allow-scripts" srcDoc={result.html} />
          <button type="button" className="w-fit rounded-full border border-border px-4 py-2 text-sm" onClick={() => download(result.fileName || "preview-draft.html", result.html || "", "text/html")}>Download the preview draft</button>
        </div>
      ) : null}
      {result?.delivery === "final" && result.videoUrl ? (
        <div className="grid gap-3">
          <h2 className="text-2xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Finished video</h2>
          <video className="w-full rounded-2xl" controls src={result.videoUrl} />
          <a className="w-fit rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" href={result.videoUrl}>Download the finished video</a>
        </div>
      ) : null}
      {project ? (
        <div className="grid gap-4">
          <h2 className="text-2xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Script</h2>
          <p className="text-sm text-muted">{project.lengthNote} About {project.spokenSeconds} seconds. Voice: {project.voiceLabel}.</p>
          <textarea className={field} value={scriptOverride || project.script} onChange={(event) => setScriptOverride(event.target.value)} />
          <ol className="grid gap-3">
            {project.scenes.map((scene, index) => (
              <li key={`${scene.startMs}-${index}`} className="rounded-2xl border border-border p-4 text-sm">
                <p className="text-muted">Scene {index + 1}</p>
                <p className="mt-1 font-medium">{scene.caption}</p>
                <p className="mt-1 text-muted">{scene.camera} {scene.transition}</p>
              </li>
            ))}
          </ol>
          <button type="button" className="w-fit rounded-full border border-border px-4 py-2 text-sm" onClick={() => download("captions.vtt", project.captionsVtt, "text/vtt")}>Download captions</button>
          <ul className="grid gap-1 text-sm">{project.next.map((item) => <li key={item.title}>{item.title}. {item.hook}</li>)}</ul>
          <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); void send("handoff", { scheduledFor: when, delivery: result?.delivery === "final" ? "final" : "preview-draft" }) }}>
            <h2 className="text-2xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Hand off to social</h2>
            <p className="text-sm text-muted">This saves a draft. It does not post.</p>
            <input className={field} type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
            <button className="w-fit rounded-full border border-border px-4 py-2 text-sm" disabled={busy} type="submit">Save the draft</button>
            {result?.saved ? <p className="text-sm">{result.saved}</p> : null}
          </form>
        </div>
      ) : null}
    </section>
  )
}
