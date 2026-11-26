import { VIDEO_QUALITY_POLICY } from "./quality"

export function elevenSpeechUrl(voiceId: string) {
  const format = VIDEO_QUALITY_POLICY.ttsOutputFormat
  return `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=${format}`
}

export function elevenSpeechBody(input: { text: string; previousText: string; nextText: string; model: string }) {
  return {
    text: input.text,
    model_id: input.model || VIDEO_QUALITY_POLICY.ttsModel,
    previous_text: input.previousText || undefined,
    next_text: input.nextText || undefined,
  }
}

export type ElevenAlignment = {
  characters?: string[]
  character_start_times_seconds?: number[]
  character_end_times_seconds?: number[]
}

export function wordsFromAlignment(alignment: ElevenAlignment | null, offsetMs = 0) {
  const chars = alignment?.characters || []
  const starts = alignment?.character_start_times_seconds || []
  const ends = alignment?.character_end_times_seconds || []
  const words: { word: string; startMs: number; endMs: number }[] = []
  let current = ""
  let start = -1
  let end = 0
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index]
    if (char === " " || char === "\n") {
      if (current) words.push({ word: current, startMs: offsetMs + start, endMs: offsetMs + end })
      current = ""
      start = -1
      continue
    }
    if (start < 0) start = Math.round((starts[index] || 0) * 1000)
    end = Math.round((ends[index] || starts[index] || 0) * 1000)
    current += char
  }
  if (current) words.push({ word: current, startMs: offsetMs + start, endMs: offsetMs + end })
  return words
}
