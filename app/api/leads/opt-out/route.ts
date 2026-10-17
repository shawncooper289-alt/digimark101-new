import { sameOrigin } from "@/lib/http"
import { suppressEmail } from "@/lib/leads/engine"

export const runtime = "nodejs"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "forbidden" }, { status: 403 })
  let email = ""
  try {
    const body = (await request.json()) as { email?: unknown; deletion?: unknown }
    email = typeof body.email === "string" ? body.email.trim() : ""
    if (!EMAIL.test(email)) return Response.json({ error: "Add a valid email." }, { status: 400 })
    const result = await suppressEmail(email, body.deletion === true ? "deletion" : "opt_out")
    if (!result.ok && result.reason === "unconfigured") {
      return Response.json({ ok: false, reason: "unconfigured" })
    }
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "That request could not be completed." }, { status: 502 })
  }
}
