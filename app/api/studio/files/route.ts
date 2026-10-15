import { NextResponse } from "next/server"
import { sameOrigin } from "@/lib/http"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const { supabase, user } = await currentUser()
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to store files." }, { status: 401 })

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file." }, { status: 400 })
  if (file.size > 5_000_000) return NextResponse.json({ error: "Files need to be 5 MB or smaller." }, { status: 413 })

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 80) || "file"
  const path = `${user.id}/${crypto.randomUUID()}-${safe}`
  const { error: uploadError } = await supabase.storage.from("client-files").upload(path, await file.arrayBuffer(), {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  })
  if (uploadError) {
    console.error("File upload failed", uploadError.message)
    return NextResponse.json({ error: "Could not store that file. Confirm the client-files bucket exists." }, { status: 502 })
  }

  const { error } = await supabase.from("client_files").insert({ owner_id: user.id, filename: safe, path })
  if (error) return NextResponse.json({ error: "The file uploaded, but the index row failed." }, { status: 502 })
  return NextResponse.json({ ok: true })
}
