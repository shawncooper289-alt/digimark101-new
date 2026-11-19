export type LeadFlags = {
  premium: boolean
  sellable: boolean
  consentContact: boolean
  consentShare: boolean
  optedOut: boolean
  suppressed: boolean
  /** null when public.lead_consent has no row for this lead. */
  consentRowShare: boolean | null
}

export function leadIsDeliverable(lead: LeadFlags) {
  if (!lead.premium || !lead.sellable || !lead.consentContact || !lead.consentShare) return false
  if (lead.optedOut || lead.suppressed) return false
  if (lead.consentRowShare === false) return false
  return true
}

export function csvCell(value: string) {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export type LeadCsvRow = {
  name: string
  email: string
  phone: string
  company: string
  region: string
  companySize: string
  score: string
}

export function leadsToCsv(rows: LeadCsvRow[]) {
  const header = ["name", "email", "phone", "company", "region", "company_size", "score"]
  const lines = rows.map((row) =>
    [row.name, row.email, row.phone, row.company, row.region, row.companySize, row.score].map((cell) => csvCell(cell)).join(","),
  )
  return `${header.join(",")}\n${lines.join("\n")}${lines.length ? "\n" : ""}`
}
