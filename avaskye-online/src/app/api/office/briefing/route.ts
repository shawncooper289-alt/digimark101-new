import { NextResponse } from "next/server"
import { respondToAva } from "@shared/ava/respond"
import { officeConfig, readOfficeOwner, supabaseKeyHeaders } from "@/lib/office-store"

export async function POST(request: Request) {
  const owner = await readOfficeOwner()
  if (!owner) return NextResponse.json({ error: "Owner access required." }, { status: 403 })
  const origin = request.headers.get("origin")
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const { url, service } = officeConfig()
  if (!url || !service) return NextResponse.json({ error: "The office administration key is required to preserve briefing records." }, { status: 503 })
  const key = `ava.daily-briefing.${new Date().toISOString().slice(0, 10)}`
  const headers = supabaseKeyHeaders(service, { "Content-Type": "application/json" })
  const existing = await fetch(`${url}/rest/v1/client_memory?owner_id=eq.${owner.id}&memory_key=eq.${key}&select=memory_value`, { headers, cache: "no-store" })
  if (!existing.ok) return NextResponse.json({ error: "Briefing storage is unavailable." }, { status: 503 })
  const saved = await existing.json() as { memory_value: string }[]
  if (saved.length) return NextResponse.json({ ok: true, reused: true })
  const answer = await respondToAva([{ role: "user", content: "Prepare today's owner planning brief: three possible low-maintenance bot-operated income projects. For each give customer problem, build/run tasks, assumptions, cost categories, maintenance, risks, validation experiment and stop criteria. No guaranteed returns. Clearly say these are hypotheses, not newly researched market opportunities." }], {
    extra: "Private owner planning brief. No web research or external tools are connected to this request. Do not claim current sources, new trends, revenue, live customer demand, or that a bot was built. Separate facts from assumptions. No spending or deployment is authorized by this briefing.",
  })
  if (!answer.live) return NextResponse.json({ error: "Live AI is unavailable. No substitute briefing was stored." }, { status: 503 })
  const record = await fetch(`${url}/rest/v1/client_memory?on_conflict=owner_id,memory_key`, {
    method: "POST", headers: { ...headers, Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ owner_id: owner.id, memory_key: key, memory_value: `Planning hypotheses — not live market research.\n${answer.text}`, updated_at: new Date().toISOString() }), cache: "no-store",
  })
  if (!record.ok) return NextResponse.json({ error: "The briefing was generated but could not be preserved. No success recorded." }, { status: 503 })
  return NextResponse.json({ ok: true })
}
