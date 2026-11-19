export const PLATFORM_WALKTHROUGH_CONFIG_URL = "/media/platform-walkthrough.mp4"

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
