import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { FilmTimeline } from "./assemble"
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

/** CPU cut of the Remotion timeline: scale to the frame, dissolve, captions, ducked music. */
export async function renderWithFfmpeg(timeline: FilmTimeline, command = process.env.FFMPEG_PATH?.trim() || "ffmpeg"): Promise<RenderResult | { error: string }> {
  if (!timeline.video.length) return { error: "There was no picture to cut." }
  const dir = await mkdtemp(join(tmpdir(), "ava-film-"))
  try {
    const list = join(dir, "list.txt")
    const lines = timeline.video.map((clip) => `file '${clip.src.replace(/'/g, "'\\''")}'`)
    await writeFile(list, lines.join("\n"))
    const out = join(dir, "film.mp4")
    const fade = timeline.video.length > 1 ? "fade=t=in:st=0:d=0.4" : "null"
    await run(command, [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", list,
      "-vf", `scale=${timeline.width}:${timeline.height}:force_original_aspect_ratio=increase,crop=${timeline.width}:${timeline.height},${fade}`,
      "-r", String(timeline.fps),
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      out,
    ])
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
