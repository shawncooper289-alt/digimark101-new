import { NextResponse } from "next/server"
import { sameOrigin } from "@/lib/http"

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }

  return NextResponse.json({
    success: true,
    channel: "browser",
    note: "Voice uses this browser's speech APIs. Phone calling is not connected.",
  })
}
