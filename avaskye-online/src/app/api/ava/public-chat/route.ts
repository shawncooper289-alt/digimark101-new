import { NextResponse } from "next/server"
import { omitBannedLine } from "@/lib/ava/banned-line"
import { PUBLIC_MODEL_MISSING, scriptedPublicReply } from "@/lib/public-chat"
import { openAiChat, openAiEnv } from "@/lib/openai/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const hits = new Map<string, { count: number; started: number }>()

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

function tooMany(ip: string) {
  const now = Date.now()
  const current = hits.get(ip)
  if (!current || now - current.started > 60_000) {
    hits.set(ip, { count: 1, started: now })
    return false
  }
  current.count += 1
  return current.count > 20
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  const host = request.headers.get("host")
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

type Turn = { role: "user" | "assistant"; content: string }

function historyFrom(input: unknown): Turn[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((item): item is Turn => {
      if (!item || typeof item !== "object") return false
      const turn = item as { role?: unknown; content?: unknown }
      return (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string" && turn.content.trim().length > 0 && turn.content.length < 800
    })
    .slice(-8)
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooMany(clientIp(request))) return NextResponse.json({ error: "Too many messages. Try again in a minute." }, { status: 429 })
  const body = (await request.json().catch(() => null)) as { message?: unknown; history?: unknown } | null
  const message = typeof body?.message === "string" ? body.message.trim() : ""
  if (!message || message.length > 1000) return NextResponse.json({ error: "Send a short question." }, { status: 400 })

  const scripted = scriptedPublicReply(message)
  if (scripted) return NextResponse.json({ text: omitBannedLine(scripted), live: false })

  if (!openAiEnv()) return NextResponse.json({ text: PUBLIC_MODEL_MISSING, live: false, notice: PUBLIC_MODEL_MISSING })

  const history = historyFrom(body?.history)
  const result = await openAiChat({
    temperature: 0.4,
    maxTokens: 400,
    messages: [
      {
        role: "system",
        content: `You are Ava Skye on a public page of avaskye.online. Answer in plain American English. Never invent client results, prices, or office records. Office tools, guided mode, and client lists are not available here. Signup is https://www.digimark101.com/signup. Pricing is https://www.digimark101.com/pricing. Contact is https://www.digimark101.com/contact. If you do not know, say so.`,
      },
      ...history.map((turn) => ({ role: turn.role, content: turn.content })),
      { role: "user", content: message },
    ],
  })
  if (!result.ok) {
    const text = result.reason === "missing" ? PUBLIC_MODEL_MISSING : result.message
    return NextResponse.json({ text, live: false, notice: text })
  }
  return NextResponse.json({ text: omitBannedLine(result.text), live: true })
}
