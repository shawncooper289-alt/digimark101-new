import { supabaseKeyHeaders } from "@/lib/supabase/headers"

export type LeadInput = {
  name: string
  email: string
  company: string | null
  website: string | null
  service: string | null
  budget: string | null
  message: string
  source: string
}

export type LeadResult =
  | { persisted: true }
  | { persisted: false; reason: "unconfigured" | "rejected" }

function supabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL ||
    ""
  ).replace(/\/$/, "")
}

export function leadsConfigured() {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function saveLead(lead: LeadInput): Promise<LeadResult> {
  const url = supabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { persisted: false, reason: "unconfigured" }

  const response = await fetch(`${url}/rest/v1/leads`, {
    method: "POST",
    headers: supabaseKeyHeaders(key, {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify({
      name: lead.name,
      email: lead.email,
      company: lead.company,
      website: lead.website,
      service: lead.service,
      budget: lead.budget,
      message: lead.message,
      source: lead.source,
    }),
    signal: AbortSignal.timeout(12000),
  })

  if (!response.ok) {
    console.error("Lead insert failed", response.status)
    return { persisted: false, reason: "rejected" }
  }

  return { persisted: true }
}
