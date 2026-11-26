export function syncCreateUrl() {
  return "https://api.sync.so/v2/generate"
}

export function syncStatusUrl(id: string) {
  return `https://api.sync.so/v2/generate/${encodeURIComponent(id)}`
}

/** Optional pass. Only for a cutaway where Ava's mouth should follow the master voice. */
export function syncLipsyncBody(input: { videoUrl: string; audioUrl: string }) {
  return {
    model: "lipsync-2",
    input: [
      { type: "video", url: input.videoUrl },
      { type: "audio", url: input.audioUrl },
    ],
  }
}
