/**
 * Platform walkthrough on the public homepage.
 * Leave the config URL empty until a real screen recording exists.
 * NEXT_PUBLIC_PLATFORM_WALKTHROUGH_URL overrides it with an https file or a site path.
 * A poster-only frame is not a video and the player says so.
 */

export const PLATFORM_WALKTHROUGH_CONFIG_URL = "/media/platform-walkthrough.mp4"

export const PLATFORM_WALKTHROUGH_POSTER = "/media/platform-walkthrough-poster.jpg"

export const PLATFORM_WALKTHROUGH_CAPTIONS = "/captions/platform-walkthrough.vtt"

export function platformWalkthroughUrl(value = process.env.NEXT_PUBLIC_PLATFORM_WALKTHROUGH_URL || PLATFORM_WALKTHROUGH_CONFIG_URL) {
  const raw = value.trim()
  if (!raw || /^(javascript|data|vbscript):/i.test(raw)) return ""
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") && !raw.includes("..")) return raw
  try {
    const url = new URL(raw)
    return url.protocol === "https:" ? url.toString() : ""
  } catch {
    return ""
  }
}

export function platformWalkthroughWebm(mp4: string) {
  if (!mp4.startsWith("/") || !mp4.endsWith(".mp4")) return ""
  return mp4.replace(/\.mp4$/, ".webm")
}
