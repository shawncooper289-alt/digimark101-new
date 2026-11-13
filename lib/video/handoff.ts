import { NETWORKS, type HandoffNetwork } from "./types"

export function networkForAspect(aspect: "9:16" | "1:1" | "16:9"): HandoffNetwork {
  if (aspect === "16:9") return "youtube"
  if (aspect === "1:1") return "instagram"
  return "tiktok"
}

export function handoffCaption(input: { title: string; script: string; delivery: "final" | "preview-draft" }) {
  const lead = input.delivery === "final"
    ? "Finished video is ready to attach. It has not been posted."
    : "PREVIEW DRAFT only. This is not a finished video. Do not post it as a final ad."
  const body = input.script.replace(/\s+/g, " ").trim().slice(0, 1500)
  return `${lead}\n\n${input.title}\n\n${body}`.slice(0, 2000)
}

export function readNetwork(value: unknown, aspect: "9:16" | "1:1" | "16:9"): HandoffNetwork {
  if (typeof value === "string" && (NETWORKS as readonly string[]).includes(value)) return value as HandoffNetwork
  return networkForAspect(aspect)
}
