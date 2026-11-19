import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { FilmTimeline } from "./assemble"
import { planEdit } from "./edit-plan"
import type { RenderResult } from "./pipeline"

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] })
    let error = ""
    child.stderr.on("data", (chunk) => {
      error += String(chunk)
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(error.slice(-500) || `ffmpeg exited ${code}`))
    })
  })
}

export async function ffmpegAvailable(command = process.env.FFMPEG_PATH?.trim() || "ffmpeg") {
  try {
    await run(command, ["-version"])
    return { ok: true as const, command }
  } catch {
    return { ok: false as const, reason: "The film editor is not installed on this server. Nothing was sent to a paid service." }
  }
}

async function saveSource(url: string, dest: string) {
  if (/^https?:\/\//i.test(url)) {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`A shot could not be downloaded (${response.status}).`)
    await writeFile(dest, Buffer.from(await response.arrayBuffer()))
    return
  }
  await writeFile(dest, await readFile(url))
}

/** CPU cut of the Remotion timeline. Sources are copied locally before ffmpeg sees them. */
export async function renderWithFfmpeg(timeline: FilmTimeline, command = process.env.FFMPEG_PATH?.trim() || "ffmpeg"): Promise<RenderResult | { error: string }> {
  if (!timeline.video.length) return { error: "There was no picture to cut." }
  const dir = await mkdtemp(join(tmpdir(), "ava-film-"))
  try {
    const videos: string[] = []
    for (let index = 0; index < timeline.video.length; index += 1) {
      const dest = join(dir, `picture-${index}.mp4`)
      await saveSource(timeline.video[index].src, dest)
      videos.push(dest)
    }
    const voices: string[] = []
    for (let index = 0; index < timeline.voice.length; index += 1) {
      const dest = join(dir, `voice-${index}.mp3`)
      await saveSource(timeline.voice[index].src, dest)
      voices.push(dest)
    }
    let music = ""
    if (timeline.music?.src) {
      music = join(dir, "music.mp3")
      await saveSource(timeline.music.src, music)
    }
    const plan = planEdit({
      width: timeline.width,
      height: timeline.height,
      fps: timeline.fps,
      clips: timeline.video.map((clip, index) => ({
        file: videos[index],
        durationSec: Math.max(0.4, (clip.endMs - clip.startMs) / 1000),
        fadeSec: clip.fadeMs > 0 ? clip.fadeMs / 1000 : 0,
        sound: clip.sound,
        startMs: clip.startMs,
      })),
      voices: timeline.voice.map((voice, index) => ({
        file: voices[index],
        startMs: voice.startMs,
        gain: voice.gain,
      })),
      music: music ? { file: music, gain: timeline.music?.gain || 0.18 } : null,
    })
    if ("error" in plan) return plan
    const out = join(dir, "film.mp4")
    const args = ["-y"]
    for (const file of plan.inputs) args.push("-i", file)
    args.push("-filter_complex", plan.filter, "-map", `[${plan.videoLabel}]`)
    if (plan.audioLabel) args.push("-map", `[${plan.audioLabel}]`)
    args.push("-r", String(timeline.fps), "-pix_fmt", "yuv420p", "-movflags", "+faststart", out)
    await run(command, args)
    const bytes = new Uint8Array(await readFile(out))
    return {
      url: "",
      bytes,
      width: timeline.width,
      height: timeline.height,
      fps: timeline.fps,
      videoDurationMs: timeline.durationMs,
      audioDurationMs: timeline.durationMs,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The film editor failed."
    return { error: `The film could not be cut. ${message}`.slice(0, 500) }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined)
  }
}
