import { createClient } from "@supabase/supabase-js"

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.OWNER_EMAIL?.trim().toLowerCase()

if (!url || !key || !email) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OWNER_EMAIL.")
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const { error } = await admin.rpc("sync_owner_email", { owner_email: email })
if (error) {
  console.error("Could not grant the owner role. Run supabase/migrations/20261017_owner_role.sql first.")
  process.exit(1)
}
console.log("Owner role synced for the OWNER_EMAIL account.")
