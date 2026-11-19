import { NextResponse } from "next/server"
import { runTool } from "@/lib/ava/tools/run"
import { parsePageContext } from "@/lib/ava/tools/page"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { deskById } from "@/lib/modules/desk"

export const dynamic = "force-dynamic"

async function limited(request: Request) {
  const result = tooManyRequests(`modules:${clientIp(request)}`, 60) as boolean | Promise<boolean>
  return await result
}

export async function GET(request: Request) {
  if (await limited(request)) {
    return NextResponse.json({ ok: false, summary: "Too many requests. Wait a minute and try again.", rows: [] }, { status: 429 })
  }
  const url = new URL(request.url)
  const moduleName = url.searchParams.get("module") || ""
  const desk = deskById(moduleName)
  if (!desk) return NextResponse.json({ ok: false, summary: "That module is not available.", rows: [] }, { status: 404 })
  const workspaceId = url.searchParams.get("workspace") || ""
  const result = await runTool({
    name: desk.listTool,
    args: workspaceId ? { workspaceId } : {},
    page: { path: desk.page, module: desk.id, title: desk.title, visible: [] },
  })
  return NextResponse.json(result, { status: result.status })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, summary: "Cross-origin request blocked.", rows: [] }, { status: 403 })
  if (await limited(request)) return NextResponse.json({ ok: false, summary: "Too many requests. Wait a minute and try again.", rows: [] }, { status: 429 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, summary: "A valid JSON request is required.", rows: [] }, { status: 400 })
  }
  const record = body && typeof body === "object" ? (body as { name?: unknown; args?: unknown; confirmed?: unknown; page?: unknown }) : {}
  if (typeof record.name !== "string") return NextResponse.json({ ok: false, summary: "Name the tool.", rows: [] }, { status: 400 })
  const result = await runTool({
    name: record.name,
    args: record.args && typeof record.args === "object" ? (record.args as Record<string, unknown>) : {},
    confirmed: record.confirmed === true,
    page: parsePageContext(record.page),
  })
  return NextResponse.json(result, { status: result.status })
}
