export type PublicLeadSample = {
  region: string
  companySize: string
  score: number
}

/** Fields a buyer can see before they pay. Personal details are dropped. */
export function anonymizedLead(row: Record<string, unknown>): PublicLeadSample {
  const score = typeof row.score === "number" ? row.score : Number(row.score)
  return {
    region: typeof row.region === "string" ? row.region : "",
    companySize: typeof row.company_size === "string" ? row.company_size : "",
    score: Number.isFinite(score) ? score : 0,
  }
}
