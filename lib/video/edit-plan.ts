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
}

function seconds(ms: number) {
  return Math.max(0.4, ms / 1000)
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
  const filters: string[] = []
  input.clips.forEach((clip, index) => {
    const duration = seconds(clip.durationSec * 1000)
    filters.push(
      `[${index}:v]scale=${input.width}:${input.height}:force_original_aspect_ratio=increase,crop=${input.width}:${input.height},setsar=1,fps=${input.fps},format=yuv420p,trim=duration=${duration.toFixed(3)},setpts=PTS-STARTPTS[v${index}]`,
    )
  })
  let videoLabel = "v0"
  let cursor = seconds(input.clips[0].durationSec * 1000)
  for (let index = 1; index < input.clips.length; index += 1) {
    const clipLength = seconds(input.clips[index].durationSec * 1000)
    const fade = Math.min(input.clips[index].fadeSec || 0, cursor / 2, clipLength / 2)
    const next = `vx${index}`
    if (fade >= 0.05) {
      const offset = Math.max(0, cursor - fade)
      filters.push(`[${videoLabel}][v${index}]xfade=transition=fade:duration=${fade.toFixed(3)}:offset=${offset.toFixed(3)}[${next}]`)
      cursor = offset + clipLength
    } else {
      filters.push(`[${videoLabel}][v${index}]concat=n=2:v=1:a=0[${next}]`)
      cursor += clipLength
    }
    videoLabel = next
  }
  const audioLabels: string[] = []
  input.clips.forEach((clip, index) => {
    if (clip.sound !== "clip") return
    const delay = Math.max(0, Math.round(clip.startMs))
    const label = `ac${index}`
    filters.push(`[${index}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,adelay=${delay}|${delay},volume=1[${label}]`)
    audioLabels.push(`[${label}]`)
  })
  input.voices.forEach((voice, index) => {
    const inputIndex = input.clips.length + index
    const delay = Math.max(0, Math.round(voice.startMs))
    const label = `av${index}`
    const gain = voice.gain > 0 ? voice.gain : 1
    filters.push(`[${inputIndex}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,adelay=${delay}|${delay},volume=${gain}[${label}]`)
    audioLabels.push(`[${label}]`)
  })
  if (input.music) {
    const inputIndex = input.clips.length + input.voices.length
    const gain = input.music.gain > 0 ? input.music.gain : 0.18
    filters.push(`[${inputIndex}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=${gain},apad[${"music"}]`)
    audioLabels.push("[music]")
  }
  let audioLabel = ""
  if (audioLabels.length === 1) {
    audioLabel = audioLabels[0].slice(1, -1)
  } else if (audioLabels.length > 1) {
    filters.push(`${audioLabels.join("")}amix=inputs=${audioLabels.length}:duration=longest:dropout_transition=0:normalize=0[aout]`)
    audioLabel = "aout"
  }
  return { inputs: files, filter: filters.join(";"), videoLabel, audioLabel }
}
