import type { VideoBrief } from "./types"

export function scriptMessages(brief: VideoBrief) {
  const seconds = brief.seconds
  return [
    {
      role: "system" as const,
      content: [
        "You write a spoken script and a shot list for Ava Skye, a marketing guide.",
        "Her name is spelled Ava. Say nothing that you cannot stand behind.",
        "Return only JSON with title, script, and shots.",
        "shots is an array of { role, spoken, visual, camera }.",
        "role is talking, broll, or broll-ava.",
        "talking means Ava is on camera in the studio.",
        "broll means a cinematic plate with no face.",
        "broll-ava means Ava is in the world, same face as the reference photos.",
        "About 70 percent of the time is talking, a short stretch is broll-ava, and the rest is broll.",
        "Each shot is one to twelve seconds of speech. No freeze frames. No black frames.",
        `Aim near ${seconds} seconds of speech. Do not pad with silence.`,
      ].join(" "),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        title: brief.title,
        idea: brief.idea,
        audience: brief.audience,
        offer: brief.offer,
        cta: brief.cta,
        proof: brief.proof,
        style: brief.style,
        aspect: brief.aspect,
      }),
    },
  ]
}

export type LlmShot = { role: "talking" | "broll" | "broll-ava"; spoken: string; visual: string; camera: string }

export function parseScriptPlan(text: string): { title: string; script: string; shots: LlmShot[] } | null {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start < 0 || end <= start) return null
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
    const script = typeof parsed.script === "string" ? parsed.script.trim() : ""
    if (!script) return null
    const title = typeof parsed.title === "string" ? parsed.title.trim() : ""
    const shots: LlmShot[] = []
    if (Array.isArray(parsed.shots)) {
      for (const item of parsed.shots) {
        if (!item || typeof item !== "object") continue
        const row = item as Record<string, unknown>
        const spoken = typeof row.spoken === "string" ? row.spoken.trim() : ""
        if (!spoken) continue
        const role = row.role === "broll" || row.role === "broll-ava" || row.role === "talking" ? row.role : "talking"
        shots.push({
          role,
          spoken,
          visual: typeof row.visual === "string" ? row.visual.trim() : "",
          camera: typeof row.camera === "string" ? row.camera.trim() : "",
        })
      }
    }
    return { title, script, shots }
  } catch {
    return null
  }
}
