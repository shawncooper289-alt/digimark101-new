import { buildFirstDraft, cleanAnswers, jobName, readJob, writeJob, type FirstJob } from "@/lib/start/first-campaign"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

const NAME = "First campaign — %"

async function paymentFor(supabase: NonNullable<Awaited<ReturnType<typeof currentUser>>["supabase"]>, userId: string): Promise<FirstJob["payment"]> {
  const { data, error } = await supabase.from("subscriptions").select("status").eq("owner_id", userId).limit(10)
  if (error || !data) return "not-confirmed"
  return data.some((row) => row.status === "ACTIVE") ? "confirmed" : "not-confirmed"
}

async function existingCampaign(supabase: NonNullable<Awaited<ReturnType<typeof currentUser>>["supabase"]>, userId: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id,brief")
    .eq("owner_id", userId)
    .ilike("name", NAME)
    .order("created_at", { ascending: false })
    .limit(1)
  if (error) return { error: error.message, row: null }
  return { error: null, row: data?.[0] ?? null }
}

export async function GET() {
  const { supabase, user } = await currentUser()
  if (!supabase || !user) return Response.json({ signedIn: false })
  const found = await existingCampaign(supabase, user.id)
  if (found.error) return Response.json({ signedIn: true, error: found.error }, { status: 502 })
  const payment = await paymentFor(supabase, user.id)
  const job = found.row?.brief ? readJob(String(found.row.brief)) : null
  return Response.json({ signedIn: true, payment, job })
}

export async function POST(request: Request) {
  const { supabase, user } = await currentUser()
  if (!supabase || !user) return Response.json({ error: "Sign in first." }, { status: 401 })
  const body = (await request.json().catch(() => null)) as { action?: string; business?: string; sells?: string; buyer?: string; place?: string; result?: string } | null
  const found = await existingCampaign(supabase, user.id)
  if (found.error) return Response.json({ error: "The campaign table is not ready in Supabase yet." }, { status: 502 })
  const payment = await paymentFor(supabase, user.id)

  if (body?.action === "approve") {
    const current = found.row?.brief ? readJob(String(found.row.brief)) : null
    if (!current || !found.row) return Response.json({ error: "Answer the five questions before approving." }, { status: 400 })
    const next: FirstJob = { ...current, status: "live", payment }
    const saved = await supabase.from("campaigns").update({ status: "active", brief: writeJob(next) }).eq("id", found.row.id).eq("owner_id", user.id)
    if (saved.error) return Response.json({ error: "Could not mark the job live." }, { status: 502 })
    await supabase.from("sites").update({ status: "published" }).eq("owner_id", user.id).eq("path", "first-campaign")
    return Response.json({ job: next })
  }

  const answers = cleanAnswers(body || {})
  if (!answers) return Response.json({ error: "All five answers need at least a couple of words." }, { status: 400 })
  const job: FirstJob = { status: "draft", payment, answers, draft: buildFirstDraft(answers) }
  const brief = writeJob(job)
  const name = jobName(answers)
  const campaign = found.row
    ? await supabase.from("campaigns").update({ name, brief, status: "draft", channel: "email" }).eq("id", found.row.id).eq("owner_id", user.id)
    : await supabase.from("campaigns").insert({ owner_id: user.id, name, brief, status: "draft", channel: "email" })
  if (campaign.error) return Response.json({ error: "Could not save the draft. The workspace tables may not be installed yet." }, { status: 502 })

  const site = {
    owner_id: user.id,
    name,
    path: "first-campaign",
    status: "draft",
    headline: job.draft.headline,
  }
  const sites = await supabase.from("sites").select("id").eq("owner_id", user.id).eq("path", "first-campaign").limit(1)
  if (!sites.error) {
    if (sites.data?.[0]) await supabase.from("sites").update(site).eq("id", sites.data[0].id).eq("owner_id", user.id)
    else await supabase.from("sites").insert(site)
  }
  return Response.json({ job })
}
