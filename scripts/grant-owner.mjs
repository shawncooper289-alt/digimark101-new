import { createClient } from "@supabase/supabase-js"

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const emailsRaw = process.env.OWNER_EMAILS || process.env.OWNER_EMAIL || ""
const emails = emailsRaw
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter((e) => e && e.includes("@"))

if (!url || !key || emails.length === 0) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OWNER_EMAILS (comma-separated) or OWNER_EMAIL.")
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

for (const email of emails) {
  const { error } = await admin.rpc("sync_owner_email", { owner_email: email })
  if (error) {
    console.error(`Could not grant owner role for ${email}:`, error.message)
    process.exit(1)
  }
  console.log(`Owner role synced for: ${email}`)
}
