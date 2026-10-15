import { NextResponse } from "next/server"
import { sameOrigin } from "@/lib/http"

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }

  return NextResponse.json({ success: true, channel: "browser" })
}
