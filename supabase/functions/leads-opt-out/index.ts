import { authorized, rest } from "../_shared/gate.ts"

async function hashEmail(email: string) {
  const salt = Deno.env.get("LEAD_HASH_SALT") || ""
  if (!salt) return null
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${email.trim().toLowerCase()}`))
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("")
}

Deno.serve(async (req) => {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null) as { email?: string; email_hash?: string; reason?: string } | null
  const emailHash = body?.email_hash || (body?.email ? await hashEmail(body.email) : null)
  if (!emailHash) return Response.json({ error: "email or hash required" }, { status: 400 })
  const reason = body?.reason === "deletion" ? "deletion" : "opt_out"
  return rest("lead_suppressions", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ email_hash: emailHash, reason }),
  })
})
