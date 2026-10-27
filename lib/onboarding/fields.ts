/** Columns the signed-in user may write on client_onboarding. Names match the live table. */
export const ONBOARDING_TEXT_FIELDS = [
  "client_name",
  "personal_email",
  "business_email",
  "business_name",
  "personal_phone",
  "business_phone",
  "business_address",
  "business_website",
  "facebook_url",
  "instagram_url",
  "google_business_url",
  "linkedin_url",
  "tiktok_url",
  "youtube_url",
  "x_url",
  "legal_business_name",
  "dba_name",
  "business_type",
  "ein_tax_id",
  "privacy_policy_url",
  "terms_url",
  "niche",
  "service_area",
  "offer",
  "pricing",
  "target_customer",
  "goals",
  "current_tools",
  "brand_colors",
  "logo_note",
  "booking_hours",
  "lead_sources",
  "compliance_notes",
  "social_profiles",
] as const

export type OnboardingTextField = (typeof ONBOARDING_TEXT_FIELDS)[number]

export function onboardingPatch(input: Record<string, unknown>) {
  const fields: Record<string, string> = {}
  for (const key of ONBOARDING_TEXT_FIELDS) {
    const value = input[key]
    if (typeof value !== "string") continue
    const trimmed = value.trim()
    if (!trimmed) continue
    fields[key] = trimmed.slice(0, 2000)
  }
  return fields
}
