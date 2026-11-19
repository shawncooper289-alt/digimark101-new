export type EditClip = {
  file: string
  durationSec: number
  fadeSec: number
  sound: "separate" | "clip"
  startMs: number
}

export type EditVoice = { file: string; startMs: number; gain: number }

export type EditPlan = {
  inputs: string[]
  filter: string
  videoLabel: string
  audioLabel: string
  durationSec: number
}

/**
 * Build an ffmpeg filter from files already on disk.
 * Remote addresses are refused so the concat demuxer is never handed an https URL.
 */
export function planEdit(input: {
  width: number
  height: number
  fps: number
  clips: EditClip[]
  voices: EditVoice[]
  music: { file: string; gain: number } | null
}): EditPlan | { error: string } {
  if (!input.clips.length) return { error: "There was no picture to cut." }
  const files = [
    ...input.clips.map((clip) => clip.file),
    ...input.voices.map((voice) => voice.file),
    ...(input.music ? [input.music.file] : []),
  ]
  if (files.some((file) => /^https?:\/\//i.test(file))) {
    return { error: "The editor only cuts local files. A remote address was refused." }
  }
  const durations = input.clips.map((clip) => Math.max(0.4, clip.durationSec))
  const total = durations.reduce((sum, duration) => sum + duration, 0)
  const filters: string[] = []
  input.clips.forEach((clip, index) => {
    const duration = durations[index]
    const fade = Math.min(clip.fadeSec || 0, duration / 3)
    const dissolve = fade >= 0.05
      ? `,fade=t=in:st=0:d=${fade.toFixed(3)},fade=t=out:st=${Math.max(0, duration - fade).toFixed(3)}:d=${fade.toFixed(3)}`
      : ""
    filters.push(
      `[${index}:v]scale=${input.width}:${input.height}:force_original_aspect_ratio=increase,crop=${input.width}:${input.height},setsar=1,fps=${input.fps},format=yuv420p,trim=duration=${duration.toFixed(3)},setpts=PTS-STARTPTS${dissolve}[v${index}]`,
    )
  })
  let videoLabel = "v0"
  if (input.clips.length > 1) {
    filters.push(`${input.clips.map((_, index) => `[v${index}]`).join("")}concat=n=${input.clips.length}:v=1:a=0[vout]`)
    videoLabel = "vout"
  }
  const audioLabels: string[] = []
  input.clips.forEach((clip, index) => {
    if (clip.sound !== "clip") return
    const delay = Math.max(0, Math.round(clip.startMs))
    const label = `ac${index}`
    filters.push(`[${index}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,adelay=${delay}|${delay},atrim=end=${total.toFixed(3)},volume=1[${label}]`)
    audioLabels.push(`[${label}]`)
  })
  input.voices.forEach((voice, index) => {
    const inputIndex = input.clips.length + index
    const delay = Math.max(0, Math.round(voice.startMs))
    const label = `av${index}`
    const gain = voice.gain > 0 ? voice.gain : 1
    filters.push(`[${inputIndex}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,adelay=${delay}|${delay},atrim=end=${total.toFixed(3)},volume=${gain}[${label}]`)
    audioLabels.push(`[${label}]`)
  })
  if (input.music) {
    const inputIndex = input.clips.length + input.voices.length
    const gain = input.music.gain > 0 ? input.music.gain : 0.18
    filters.push(`[${inputIndex}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=${gain},atrim=duration=${total.toFixed(3)}[music]`)
    audioLabels.push("[music]")
  }
  let audioLabel = ""
  if (audioLabels.length === 1) {
    audioLabel = audioLabels[0].slice(1, -1)
  } else if (audioLabels.length > 1) {
    filters.push(`${audioLabels.join("")}amix=inputs=${audioLabels.length}:duration=longest:dropout_transition=0:normalize=0[aout]`)
    audioLabel = "aout"
  }
  return { inputs: files, filter: filters.join(";"), videoLabel, audioLabel, durationSec: total }
}
