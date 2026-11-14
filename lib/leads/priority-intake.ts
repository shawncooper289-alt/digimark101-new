import { PRIORITY_NICHES, type PriorityNiche, isPriorityNiche } from "./priority-niches"

/**
 * Helpers to score and classify priority high-value niches
 * for the owner Lead Engine.
 */

export function scorePriorityLead(niche: PriorityNiche, answers: Record<string, string | number | boolean>) {
  const config = PRIORITY_NICHES.find((n) => n.key === niche)
  if (!config) return 0

  let score = 40 // base for completing the form
  for (const boost of config.scoreBoosts) {
    // Simple keyword / presence checks; expand as forms post structured data
    if (boost.condition.includes("90 days") && answers.incident_date) score += boost.points
    if (boost.condition.includes("treatment") && String(answers.treatment_status || "").includes("Yes")) score += boost.points
    if (boost.condition.includes("clear fault") && String(answers.fault || "").includes("Other")) score += boost.points
    if (boost.condition.includes("ready to close") && String(answers.timeline || "").includes("30")) score += boost.points
    if (boost.condition.includes("680+") && String(answers.credit_range || "").includes("680")) score += boost.points
    if (boost.condition.includes("$20k+") && Number(answers.amount_needed || 0) >= 20000) score += boost.points
    if (boost.condition.includes("12+ months") && String(answers.time_in_business || "").includes("1-2") || String(answers.time_in_business || "").includes("2+")) score += boost.points
    if (boost.condition.includes("$10k+") && String(answers.monthly_revenue || "").includes("$10k") || String(answers.monthly_revenue || "").includes("$25k") || String(answers.monthly_revenue || "").includes("$50k")) score += boost.points
    if (boost.condition.includes("phone + email") && answers.email && answers.phone) score += boost.points
  }
  return Math.min(100, score)
}

export function detectPriorityNiche(text: string): PriorityNiche | null {
  const hay = text.toLowerCase()
  if (hay.includes("injury") || hay.includes("accident") || hay.includes("mva") || hay.includes("car crash")) return "personal-injury"
  if (hay.includes("mortgage") || hay.includes("home buyer") || hay.includes("refinance") || hay.includes("home loan")) return "mortgage"
  if (hay.includes("business loan") || hay.includes("mca") || hay.includes("merchant cash") || hay.includes("funding")) return "business-loan"
  return null
}

export { PRIORITY_NICHES, isPriorityNiche }
