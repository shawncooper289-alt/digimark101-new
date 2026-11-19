import { NextResponse } from "next/server"
import { clientIp, tooManyRequests } from "@/lib/http"

export const dynamic = "force-dynamic"

/** Accepts a click beacon and does not store it. No cookies, no email, no user id. */
export async function POST(request: Request) {
  if (await tooManyRequests(`cta:${clientIp(request)}`, 60)) {
    return new NextResponse(null, { status: 429, headers: { "Cache-Control": "no-store" } })
  }
  try {
    const body = (await request.json()) as { event?: unknown; path?: unknown; href?: unknown }
    const event = typeof body.event === "string" ? body.event.slice(0, 64) : ""
    const path = typeof body.path === "string" ? body.path.split("?")[0].slice(0, 180) : ""
    const href = typeof body.href === "string" ? body.href.split("?")[0].slice(0, 180) : ""
    if (event) console.info(JSON.stringify({ type: "cta", event, path, href }))
  } catch {
    // A bad beacon is still a 204. Tracking must not break the click.
  }
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  })
}
