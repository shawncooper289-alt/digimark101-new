/**
 * Priority high-value niches for the owner Lead Engine.
 * Personal Injury / MVA, Mortgage / Home Buyers, Business Loans / MCA.
 * Highest revenue and fastest returns per 2026 market data.
 *
 * Forms, required fields, and scoring weights are ready for capture pages
 * and automatic routing into the owner office by niche.
 */

export type PriorityNiche = "personal-injury" | "mortgage" | "business-loan"

export const PRIORITY_NICHES: {
  key: PriorityNiche
  label: string
  description: string
  requiredFields: string[]
  scoreBoosts: { condition: string; points: number }[]
  formQuestions: { id: string; label: string; type: "text" | "select" | "date" | "number"; options?: string[] }[]
}[] = [
  {
    key: "personal-injury",
    label: "Personal Injury / MVA",
    description: "Highest per-lead revenue. Exclusive and live-transfer preferred.",
    requiredFields: ["injury_type", "incident_date", "treatment_status", "fault", "state", "email", "phone"],
    scoreBoosts: [
      { condition: "incident within 90 days", points: 25 },
      { condition: "medical treatment started", points: 20 },
      { condition: "clear fault of other party", points: 20 },
      { condition: "phone + email provided", points: 15 },
    ],
    formQuestions: [
      { id: "injury_type", label: "What type of injury or accident?", type: "select", options: ["Car accident", "Truck accident", "Motorcycle", "Slip and fall", "Workplace", "Other"] },
      { id: "incident_date", label: "Date of the incident", type: "date" },
      { id: "treatment_status", label: "Have you started medical treatment?", type: "select", options: ["Yes, currently treating", "Yes, completed", "No, not yet", "Unsure"] },
      { id: "fault", label: "Who was at fault?", type: "select", options: ["Other party", "Shared", "Unsure", "I was at fault"] },
      { id: "state", label: "State where it happened", type: "text" },
      { id: "email", label: "Email", type: "text" },
      { id: "phone", label: "Phone", type: "text" },
    ],
  },
  {
    key: "mortgage",
    label: "Mortgage / Home Buyers",
    description: "Strong volume and solid pricing. Purchase and refinance close relatively fast.",
    requiredFields: ["loan_purpose", "credit_range", "property_state", "timeline", "email", "phone"],
    scoreBoosts: [
      { condition: "ready to close or pre-approved", points: 30 },
      { condition: "timeline under 60 days", points: 20 },
      { condition: "credit 680+", points: 15 },
      { condition: "phone + email provided", points: 15 },
    ],
    formQuestions: [
      { id: "loan_purpose", label: "Purchase or refinance?", type: "select", options: ["Purchase", "Refinance", "Cash-out refinance", "HELOC"] },
      { id: "credit_range", label: "Approximate credit score range", type: "select", options: ["Under 580", "580-619", "620-679", "680-719", "720+", "Unsure"] },
      { id: "property_state", label: "Property state", type: "text" },
      { id: "timeline", label: "How soon are you looking to close?", type: "select", options: ["Under 30 days", "30-60 days", "60-90 days", "Just exploring"] },
      { id: "loan_amount", label: "Approximate loan amount", type: "number" },
      { id: "email", label: "Email", type: "text" },
      { id: "phone", label: "Phone", type: "text" },
    ],
  },
  {
    key: "business-loan",
    label: "Business Loans / MCA",
    description: "High ticket when funded. Real-time exclusive preferred for best conversion.",
    requiredFields: ["monthly_revenue", "time_in_business", "amount_needed", "industry", "email", "phone"],
    scoreBoosts: [
      { condition: "amount requested $20k+", points: 25 },
      { condition: "12+ months in business", points: 20 },
      { condition: "monthly revenue $10k+", points: 20 },
      { condition: "phone + email provided", points: 15 },
    ],
    formQuestions: [
      { id: "monthly_revenue", label: "Approximate monthly revenue", type: "select", options: ["Under $10k", "$10k-$25k", "$25k-$50k", "$50k+"] },
      { id: "time_in_business", label: "How long has the business been operating?", type: "select", options: ["Under 6 months", "6-12 months", "1-2 years", "2+ years"] },
      { id: "amount_needed", label: "Funding amount needed", type: "number" },
      { id: "industry", label: "Industry", type: "text" },
      { id: "email", label: "Email", type: "text" },
      { id: "phone", label: "Phone", type: "text" },
    ],
  },
]

export function isPriorityNiche(key: string): key is PriorityNiche {
  return PRIORITY_NICHES.some((n) => n.key === key)
}
