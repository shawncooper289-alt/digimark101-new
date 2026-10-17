import { NextResponse } from "next/server"
import { officeConfig, readOfficeOwner } from "@/lib/office-store"

const stages = new Set(["new", "qualified", "proposal", "won", "lost"])
const triggers = new Set(["contact.created", "appointment.booked", "deal.moved"])
const actions = new Set(["log_inbox", "remember"])

async function rest(path: string, init: RequestInit) {
  const { url, service, configured } = officeConfig()
  if (!configured) return { ok: false, status: 503 }
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(init.headers || {}),
    },
    cache: "no-store",
  })
  return { ok: response.ok, status: response.status }
}

export async function POST(request: Request) {
  const owner = await readOfficeOwner()
  if (!owner) return NextResponse.json({ error: "The owner office is closed." }, { status: 403 })
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (body?.confirmed !== true) return NextResponse.json({ error: "Confirm the draft before saving." }, { status: 400 })
  const action = body.action
  const workspace = typeof body.workspaceId === "string" && /^[0-9a-f-]{36}$/i.test(body.workspaceId) ? body.workspaceId : owner.id

  if (action === "create_contact") {
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) return NextResponse.json({ error: "A contact needs a name." }, { status: 400 })
    const saved = await rest("contacts", {
      method: "POST",
      body: JSON.stringify({
        owner_id: workspace,
        name,
        email: typeof body.email === "string" ? body.email.trim() : "",
        phone: typeof body.phone === "string" ? body.phone.trim() : "",
        company: typeof body.company === "string" ? body.company.trim() : "",
        notes: typeof body.notes === "string" ? body.notes.trim() : "",
      }),
    })
    return NextResponse.json(saved.ok ? { ok: true } : { error: "The contact was not saved." }, { status: saved.ok ? 200 : 503 })
  }

  if (action === "move_deal") {
    const id = typeof body.id === "string" ? body.id : ""
    const stage = typeof body.stage === "string" ? body.stage : ""
    if (!/^[0-9a-f-]{36}$/i.test(id) || !stages.has(stage)) return NextResponse.json({ error: "That deal move is not valid." }, { status: 400 })
    const saved = await rest(`deals?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ stage }) })
    return NextResponse.json(saved.ok ? { ok: true } : { error: "The deal was not moved." }, { status: saved.ok ? 200 : 503 })
  }

  if (action === "set_automation") {
    const id = typeof body.id === "string" ? body.id : ""
    if (!/^[0-9a-f-]{36}$/i.test(id) || typeof body.enabled !== "boolean") return NextResponse.json({ error: "That automation change is not valid." }, { status: 400 })
    const saved = await rest(`automations?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ enabled: body.enabled }) })
    return NextResponse.json(saved.ok ? { ok: true } : { error: "The automation was not updated." }, { status: saved.ok ? 200 : 503 })
  }

  if (action === "create_automation") {
    const trigger = typeof body.trigger === "string" ? body.trigger : ""
    const actionKey = typeof body.actionKey === "string" ? body.actionKey : ""
    if (!triggers.has(trigger) || !actions.has(actionKey)) return NextResponse.json({ error: "That automation is not valid." }, { status: 400 })
    const saved = await rest("automations", {
      method: "POST",
      body: JSON.stringify({
        owner_id: workspace,
        name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Office automation",
        trigger_key: trigger,
        action_key: actionKey,
        enabled: true,
      }),
    })
    return NextResponse.json(saved.ok ? { ok: true } : { error: "The automation was not saved." }, { status: saved.ok ? 200 : 503 })
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 })
}
