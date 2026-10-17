import { NextResponse } from "next/server"
import { answerAva } from "@/lib/ava/agent"
import { sanitizeTurns } from "@/lib/ava/respond"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { intakeFromAva } from "@/lib/leads/engine"
import type { Roster } from "@/lib/platform/types"

export async function handleAvaPost(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }
  if (tooManyRequests(clientIp(request))) {
    return NextResponse.json({ error: "Too many messages. Try again in a minute." }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 })
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  const turns = sanitizeTurns(
    Array.isArray(record.messages)
      ? record.messages
      : typeof record.message === "string"
        ? [{ role: "user", content: record.message }]
        : [],
  )

  if (!turns) {
    return NextResponse.json({ error: "Send a message between 1 and 4000 characters." }, { status: 400 })
  }

  const pageFields = Array.isArray(record.pageFields) ? record.pageFields.filter((item): item is string => typeof item === "string").slice(0, 20) : []
  const rosterHint = rosterFromClient(record.roster)
  const reply = await answerAva({ turns, pageFields, rosterHint })
  const userText = turns
    .filter((turn) => turn.role === "user")
    .map((turn) => turn.content)
    .join("\n")
    .slice(0, 4000)
  try {
    await intakeFromAva(userText)
  } catch {
    // Intake failures stay on the server and are not logged.
  }
  return NextResponse.json({
    text: reply.text,
    audioUrl: null,
    mode: reply.mode,
    live: reply.live,
    notice: reply.notice ?? null,
    fills: reply.fills ?? null,
    navigate: reply.navigate ?? null,
    clientActions: reply.clientActions ?? null,
    refresh: reply.refresh ?? false,
  })
}

function rosterFromClient(value: unknown): Roster | null {
  if (!value || typeof value !== "object") return null
  const roster = value as Partial<Roster>
  return {
    contacts: Array.isArray(roster.contacts) ? roster.contacts.filter((item): item is string => typeof item === "string").slice(0, 30) : [],
    deals: Array.isArray(roster.deals) ? roster.deals.filter((item): item is Roster["deals"][number] => !!item && typeof item === "object" && typeof (item as { title?: string }).title === "string").slice(0, 30) : [],
    appointments: [],
    campaigns: Array.isArray(roster.campaigns) ? roster.campaigns.filter((item): item is string => typeof item === "string").slice(0, 30) : [],
    memory: Array.isArray(roster.memory) ? roster.memory.filter((item): item is Roster["memory"][number] => !!item && typeof item === "object" && typeof (item as { key?: string }).key === "string" && typeof (item as { value?: string }).value === "string").slice(0, 20) : [],
  }
}
