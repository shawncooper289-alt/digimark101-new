import { currentUser } from "@/lib/supabase/server"
import { ingestLead, type LeadSource } from "@/lib/leads/engine"

export const runtime = "nodejs"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function flag(value: unknown) {
  if (typeof value === "boolean") return value
  return ["true", "yes", "1"].includes(String(value ?? "").trim().toLowerCase())
}

function parseCsv(input: string) {
  const lines = input.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((item) => item.trim().toLowerCase())
  return lines.slice(1, 201).map((line) => {
    const cells = splitCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? ""
    })
    return row
  })
}

function splitCsvLine(line: string) {
  const cells: string[] = []
  let current = ""
  let quoted = false
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (char === "," && !quoted) {
      cells.push(current)
      current = ""
      continue
    }
    current += char
  }
  cells.push(current)
  return cells
}

async function authorized(request: Request) {
  const key = process.env.LEAD_IMPORT_KEY?.trim()
  const header = request.headers.get("authorization")
  if (key && header === `Bearer ${key}`) return true
  const { user } = await currentUser()
  const ownerId = process.env.LEAD_OWNER_USER_ID?.trim()
  return Boolean(ownerId && user?.id === ownerId)
}

export async function POST(request: Request) {
  if (!(await authorized(request))) return Response.json({ error: "unauthorized" }, { status: 401 })
  const contentType = request.headers.get("content-type") || ""
  let rows: Record<string, unknown>[] = []
  const source: LeadSource = contentType.includes("text/csv") ? "csv" : "api"
  try {
    if (source === "csv") {
      rows = parseCsv(await request.text())
    } else {
      const body = (await request.json()) as { rows?: unknown }
      if (!Array.isArray(body.rows)) return Response.json({ error: "rows array required" }, { status: 400 })
      rows = body.rows.filter((row): row is Record<string, unknown> => !!row && typeof row === "object").slice(0, 200)
    }
  } catch {
    return Response.json({ error: "unreadable" }, { status: 400 })
  }

  let accepted = 0
  let rejected = 0
  let suppressed = 0
  for (const row of rows) {
    const email = text(row.email, 160)
    if (!EMAIL.test(email) || !flag(row.consent_contact ?? row.consent)) {
      rejected += 1
      continue
    }
    const result = await ingestLead({
      email,
      name: text(row.name ?? row.full_name, 80),
      phone: text(row.phone, 40),
      company: text(row.company, 120),
      website: text(row.website, 200),
      message: text(row.message ?? row.notes, 4000),
      service: text(row.niche ?? row.service, 40),
      region: text(row.region, 40),
      companySize: text(row.company_size ?? row.companySize, 20),
      source,
      consentContact: true,
      consentShare: flag(row.consent_share ?? row.consentShare),
    })
    if (result.stored) accepted += 1
    else if (result.reason === "suppressed") suppressed += 1
    else rejected += 1
  }
  return Response.json({ accepted, rejected, suppressed })
}
