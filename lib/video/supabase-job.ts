import type { VideoJob, VideoStore } from "./job"
import type { Env } from "./providers"

function keyHeaders(key: string, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { apikey: key, ...extra }
  if (!key.startsWith("sb_publishable_") && !key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`
  return headers
}

function projectUrl(env: Env) {
  return (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || "").trim().replace(/\/$/, "")
}

function uuidOrNull(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null
}

function rowFrom(job: VideoJob) {
  return {
    id: job.id,
    owner_id: uuidOrNull(job.ownerId),
    app: job.app,
    stage: job.stage,
    title: job.title,
    brief: job.brief || {},
    project: job.project,
    shots: job.shots,
    words: job.words,
    voice_url: job.voiceUrl,
    music_url: job.musicUrl,
    master_url: job.masterUrl,
    composition: job.composition,
    picture: job.picture,
    quality: job.quality,
    cost: job.cost,
    note: job.note,
    reasons: job.reasons,
    attempt: job.attempt,
    approved_at: job.approvedAt || null,
    published_at: job.publishedAt || null,
    assets: job.assets,
    updated_at: job.updatedAt,
  }
}

function jobFrom(row: Record<string, unknown>): VideoJob {
  return {
    id: String(row.id || ""),
    app: row.app === "office" ? "office" : "studio",
    ownerId: typeof row.owner_id === "string" ? row.owner_id : "",
    stage: (row.stage as VideoJob["stage"]) || "blocked",
    title: typeof row.title === "string" ? row.title : "",
    brief: (row.brief as VideoJob["brief"]) || null,
    project: (row.project as VideoJob["project"]) || null,
    shots: Array.isArray(row.shots) ? row.shots as VideoJob["shots"] : [],
    words: Array.isArray(row.words) ? row.words as VideoJob["words"] : [],
    voiceUrl: typeof row.voice_url === "string" ? row.voice_url : "",
    musicUrl: typeof row.music_url === "string" ? row.music_url : "",
    masterUrl: typeof row.master_url === "string" ? row.master_url : "",
    composition: (row.composition as VideoJob["composition"]) || null,
    picture: (row.picture as VideoJob["picture"]) || null,
    quality: (row.quality as VideoJob["quality"]) || null,
    cost: (row.cost as VideoJob["cost"]) || null,
    note: typeof row.note === "string" ? row.note : "",
    reasons: Array.isArray(row.reasons) ? row.reasons.filter((item): item is string => typeof item === "string") : [],
    attempt: typeof row.attempt === "number" ? row.attempt : 1,
    approvedAt: typeof row.approved_at === "string" ? row.approved_at : "",
    publishedAt: typeof row.published_at === "string" ? row.published_at : "",
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : "",
    assets: Array.isArray(row.assets) ? row.assets as VideoJob["assets"] : [],
  }
}

async function readJson(response: Response) {
  return response.json().catch(() => null)
}

export function supabaseVideoStore(env: Env, fetchImpl: typeof fetch = globalThis.fetch): VideoStore | null {
  const url = projectUrl(env)
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ""
  if (!url || !key) return null
  const headers = keyHeaders(key, { "Content-Type": "application/json" })

  async function writeChildren(job: VideoJob) {
    await fetchImpl(`${url}/rest/v1/video_shots?job_id=eq.${encodeURIComponent(job.id)}`, {
      method: "DELETE",
      headers,
    }).catch(() => null)
    const shots = job.shots.filter((shot) => shot.id !== "music").map((shot) => ({
      id: shot.id,
      job_id: job.id,
      index: shot.index,
      role: shot.role,
      spoken: shot.spoken,
      caption: shot.caption,
      visual: shot.visual,
      status: shot.status,
      provider: shot.provider,
      provider_id: shot.providerId,
      output_url: shot.outputUrl,
      audio_url: shot.audioUrl,
      error: shot.error,
      start_ms: shot.startMs,
      end_ms: shot.endMs,
    }))
    if (shots.length) {
      await fetchImpl(`${url}/rest/v1/video_shots`, { method: "POST", headers, body: JSON.stringify(shots) }).catch(() => null)
    }
    await fetchImpl(`${url}/rest/v1/video_assets?job_id=eq.${encodeURIComponent(job.id)}`, { method: "DELETE", headers }).catch(() => null)
    if (job.assets.length) {
      await fetchImpl(`${url}/rest/v1/video_assets`, {
        method: "POST",
        headers,
        body: JSON.stringify(job.assets.map((asset) => ({
          job_id: job.id,
          kind: asset.kind,
          storage_path: asset.path,
          url: asset.url,
        }))),
      }).catch(() => null)
    }
  }

  return {
    async save(job) {
      const response = await fetchImpl(`${url}/rest/v1/video_jobs?on_conflict=id`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rowFrom(job)),
      })
      if (!response.ok) {
        const detail = await response.text().catch(() => "")
        throw new Error(detail.includes("videos") ? detail : "The video library did not save this job.")
      }
      await writeChildren(job)
    },
    async load(id) {
      const response = await fetchImpl(`${url}/rest/v1/video_jobs?id=eq.${encodeURIComponent(id)}&select=*`, { headers })
      if (!response.ok) return null
      const rows = await readJson(response)
      const row = Array.isArray(rows) ? rows[0] as Record<string, unknown> | undefined : null
      return row ? jobFrom(row) : null
    },
    async list(limit = 20) {
      const response = await fetchImpl(`${url}/rest/v1/video_jobs?select=*&order=updated_at.desc&limit=${limit}`, { headers })
      if (!response.ok) return []
      const rows = await readJson(response)
      return Array.isArray(rows) ? rows.map((row) => jobFrom(row as Record<string, unknown>)) : []
    },
    async waiting() {
      const response = await fetchImpl(`${url}/rest/v1/video_jobs?stage=in.(script,voice,avatar,broll,lipsync,music,assemble,quality)&select=*&order=updated_at.asc&limit=8`, { headers })
      if (!response.ok) return []
      const rows = await readJson(response)
      return Array.isArray(rows) ? rows.map((row) => jobFrom(row as Record<string, unknown>)) : []
    },
    async putAsset(input) {
      const path = `jobs/${input.jobId}/${input.name}`
      const upload = await fetchImpl(`${url}/storage/v1/object/videos/${path}`, {
        method: "POST",
        headers: { ...keyHeaders(key), "Content-Type": input.contentType, "x-upsert": "true" },
        body: Buffer.from(input.bytes),
      })
      if (!upload.ok) {
        const text = await upload.text().catch(() => "")
        if (upload.status === 404 || /bucket/i.test(text)) {
          throw new Error("The private videos bucket is not there yet. Apply the new Supabase migration. Nothing was published.")
        }
        if (upload.status === 413 || /exceeded|too large|size/i.test(text)) {
          throw new Error("This file is larger than the Supabase plan allows. The Free plan stops at 50 MB per file. A 3.5 minute 1080p film needs the Pro plan.")
        }
        throw new Error("The voice file could not be stored.")
      }
      const signed = await fetchImpl(`${url}/storage/v1/object/sign/videos/${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 7 }),
      })
      const payload = await readJson(signed) as { signedURL?: string; signedUrl?: string } | null
      const relative = payload?.signedURL || payload?.signedUrl || ""
      if (!relative) throw new Error("The stored file could not be signed for the video service.")
      const full = relative.startsWith("http") ? relative : `${url}/storage/v1${relative}`
      return { path, url: full }
    },
  }
}
