import { MUSE_BRIEF_FIELDS, type AgentBrief } from "@/lib/ava/team/brief"
import { clientSafeText, reviewArtifact } from "@/lib/ava/team/guard"

const VOICE = "Plain American English. Warm, direct, and specific. No invented numbers, reviews, or results. Ava is pronounced AY-vuh and is the only name a client hears."

export function museBriefText(brief: AgentBrief) {
  const assets = brief.assets.length ? brief.assets.map((item) => `- ${item}`).join("\n") : "- None attached."
  return [
    "Muse brief",
    "",
    `Goal: ${brief.goal}`,
    `Audience: ${brief.audience || "Not set."}`,
    `Brand voice: ${brief.brandVoice || VOICE}`,
    "Assets:",
    assets,
    `Constraints: ${brief.constraints || "Do not invent numbers. Do not publish, send, or spend."}`,
    `Deadline: ${brief.deadline || "Not set."}`,
    `Approval needs: ${brief.approvalNeeds || "Shawn approves anything that publishes, sends, spends, or contacts a person."}`,
    `Success metric: ${brief.successMetric || "A draft Shawn can edit. No live result is claimed."}`,
  ].join("\n")
}

export function museBriefComplete(brief: AgentBrief) {
  const text = museBriefText(brief)
  const missing = MUSE_BRIEF_FIELDS.filter((field) => {
    if (field === "assets") return false
    return !text.toLowerCase().includes(field === "brandVoice" ? "brand voice" : field === "approvalNeeds" ? "approval needs" : field === "successMetric" ? "success metric" : field)
  })
  return { text, missing }
}

export function reviewMuseResult(result: string, brief: AgentBrief) {
  const sources = [brief.goal, brief.notes, brief.successMetric, ...brief.assets]
  const review = reviewArtifact(result, sources)
  const note = review.pass
    ? "The paste matches the brief well enough to keep. It is still a draft until Shawn uses it."
    : `Held back: ${review.issues.join(", ")}. Nothing was published or sent.`
  return { review, text: clientSafeText(note) }
}
