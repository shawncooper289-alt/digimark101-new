import { NextResponse } from "next/server"
import { isHubProduct } from "@/lib/products"
import { officeConfig, readOfficeOwner, supabaseKeyHeaders } from "@/lib/office-store"

const stages = new Set(["new", "qualified", "proposal", "won", "lost"])
const triggers = new Set(["contact.created", "appointment.booked", "deal.moved"])
const actions = new Set(["log_inbox", "remember"])
const channels = new Set(["email", "search", "social", "site"])
const campaignStatuses = new Set(["draft", "active", "paused"])
const recordKinds = new Set(["invoice", "expense", "record", "legal"])
const recordStatuses = new Set(["open", "paid", "filed"])

async function rest(path: string, init: RequestInit) {
  const { url, service, configured } = officeConfig()
  if (!configured) return { ok: false, status: 503 }
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...supabaseKeyHeaders(service, {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      }),
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

  if (action === "create_campaign") {
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const channel = typeof body.channel === "string" && channels.has(body.channel) ? body.channel : "email"
    const brief = typeof body.brief === "string" ? body.brief.trim().slice(0, 1000) : ""
    if (name.length < 2) return NextResponse.json({ error: "A campaign needs a name." }, { status: 400 })
    const product = typeof body.product === "string" && isHubProduct(body.product) ? body.product : "digimark101"
    const payload = {
      owner_id: workspace,
      name: name.slice(0, 120),
      channel,
      status: "draft",
      brief,
      product_key: product,
    }
    let saved = await rest("campaigns", { method: "POST", body: JSON.stringify(payload) })
    if (!saved.ok) {
      const { product_key, ...withoutProduct } = payload
      void product_key
      saved = await rest("campaigns", { method: "POST", body: JSON.stringify(withoutProduct) })
    }
    return NextResponse.json(saved.ok ? { ok: true } : { error: "The campaign was not saved on digimark101.com." }, { status: saved.ok ? 200 : 503 })
  }

  if (action === "set_campaign_status") {
    const id = typeof body.id === "string" ? body.id : ""
    const status = typeof body.status === "string" ? body.status : ""
    if (!/^[0-9a-f-]{36}$/i.test(id) || !campaignStatuses.has(status)) {
      return NextResponse.json({ error: "That campaign change is not valid." }, { status: 400 })
    }
    const saved = await rest(`campaigns?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
    return NextResponse.json(saved.ok ? { ok: true } : { error: "The campaign status was not updated." }, { status: saved.ok ? 200 : 503 })
  }

  if (action === "create_record") {
    const title = typeof body.title === "string" ? body.title.trim() : ""
    const kind = typeof body.kind === "string" && recordKinds.has(body.kind) ? body.kind : ""
    if (title.length < 2 || !kind) return NextResponse.json({ error: "A record needs a title and a kind." }, { status: 400 })
    const amountRaw = typeof body.amount === "string" ? body.amount.trim() : ""
    const amount = amountRaw && /^\d+(\.\d{1,2})?$/.test(amountRaw) ? amountRaw : null
    const occurred = typeof body.occurredOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.occurredOn) ? body.occurredOn : null
    const product = typeof body.product === "string" && isHubProduct(body.product) ? body.product : "digimark101"
    const payload = {
      kind,
      title: title.slice(0, 160),
      party: typeof body.party === "string" ? body.party.trim().slice(0, 160) : "",
      amount,
      currency: "USD",
      status: "open",
      notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : "",
      occurred_on: occurred,
      product_key: product,
    }
    let saved = await rest("office_records", { method: "POST", body: JSON.stringify(payload) })
    if (!saved.ok) {
      const { product_key, ...withoutProduct } = payload
      void product_key
      saved = await rest("office_records", { method: "POST", body: JSON.stringify(withoutProduct) })
    }
    return NextResponse.json(saved.ok ? { ok: true } : { error: "The record was not saved. The office books table may not be installed yet." }, { status: saved.ok ? 200 : 503 })
  }

  if (action === "set_record_status") {
    const id = typeof body.id === "string" ? body.id : ""
    const status = typeof body.status === "string" ? body.status : ""
    if (!/^[0-9a-f-]{36}$/i.test(id) || !recordStatuses.has(status)) {
      return NextResponse.json({ error: "That record change is not valid." }, { status: 400 })
    }
    const saved = await rest(`office_records?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
    return NextResponse.json(saved.ok ? { ok: true } : { error: "The record was not updated." }, { status: saved.ok ? 200 : 503 })
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 })
}
