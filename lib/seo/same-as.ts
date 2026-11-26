import { publicSameAs } from "@/lib/business-profile"

/** https profile URLs from config plus ORGANIZATION_SAME_AS. Blank and non-https values are dropped. */
export function sameAsFromEnv(raw: string | undefined, configured: readonly string[] = []) {
  const extra = (raw ?? "")
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean)
  return publicSameAs([...configured, ...extra])
}
