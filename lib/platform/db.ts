import type { SupabaseClient } from "@supabase/supabase-js"
import { applyAction } from "@/lib/platform/reduce"
import { emptyWorkspace, rosterFrom, type Action, type Roster, type Stage, type Trigger, type AutomationAction, type Workspace } from "@/lib/platform/types"

type Row = Record<string, unknown>

function text(row: Row, key: string) {
  const value = row[key]
  return typeof value === "string" ? value : ""
}

export async function loadWorkspace(supabase: SupabaseClient, ownerId: string): Promise<Workspace> {
  const [contacts, deals, appointments, threads, messages, campaigns, sites, automations, memory, files] = await Promise.all([
    supabase.from("contacts").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("deals").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("appointments").select("*").eq("owner_id", ownerId).order("starts_at", { ascending: true }),
    supabase.from("threads").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("thread_messages").select("*").eq("owner_id", ownerId).order("created_at", { ascending: true }),
    supabase.from("campaigns").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("sites").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("automations").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("client_memory").select("*").eq("owner_id", ownerId).order("updated_at", { ascending: false }),
    supabase.from("client_files").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
  ])

  const failed = [contacts, deals, appointments, threads, messages, campaigns, sites, automations, memory, files].find((result) => result.error)
  if (failed?.error) throw new Error(failed.error.message)

  const messageRows = (messages.data ?? []) as Row[]
  return {
    contacts: ((contacts.data ?? []) as Row[]).map((row) => ({
      id: text(row, "id"),
      name: text(row, "name"),
      email: text(row, "email"),
      phone: text(row, "phone"),
      company: text(row, "company"),
      notes: text(row, "notes"),
      createdAt: text(row, "created_at"),
    })),
    deals: ((deals.data ?? []) as Row[]).map((row) => ({
      id: text(row, "id"),
      title: text(row, "title"),
      contactName: text(row, "contact_name"),
      stage: text(row, "stage") as Stage,
      notes: text(row, "notes"),
      createdAt: text(row, "created_at"),
    })),
    appointments: ((appointments.data ?? []) as Row[]).map((row) => ({
      id: text(row, "id"),
      title: text(row, "title"),
      contactName: text(row, "contact_name"),
      startsAt: text(row, "starts_at"),
      notes: text(row, "notes"),
      createdAt: text(row, "created_at"),
    })),
    threads: ((threads.data ?? []) as Row[]).map((row) => ({
      id: text(row, "id"),
      contactName: text(row, "contact_name"),
      subject: text(row, "subject"),
      createdAt: text(row, "created_at"),
      messages: messageRows
        .filter((message) => message.thread_id === row.id)
        .map((message) => ({
          id: text(message, "id"),
          body: text(message, "body"),
          sender: text(message, "sender") === "client" ? "client" : "studio",
          createdAt: text(message, "created_at"),
        })),
    })),
    campaigns: ((campaigns.data ?? []) as Row[]).map((row) => ({
      id: text(row, "id"),
      name: text(row, "name"),
      channel: text(row, "channel"),
      status: (text(row, "status") || "draft") as Workspace["campaigns"][number]["status"],
      brief: text(row, "brief"),
      createdAt: text(row, "created_at"),
    })),
    sites: ((sites.data ?? []) as Row[]).map((row) => ({
      id: text(row, "id"),
      name: text(row, "name"),
      path: text(row, "path"),
      status: (text(row, "status") || "draft") as Workspace["sites"][number]["status"],
      headline: text(row, "headline"),
      createdAt: text(row, "created_at"),
    })),
    automations: ((automations.data ?? []) as Row[]).map((row) => ({
      id: text(row, "id"),
      name: text(row, "name"),
      trigger: text(row, "trigger_key") as Trigger,
      action: text(row, "action_key") as AutomationAction,
      enabled: Boolean(row.enabled),
      createdAt: text(row, "created_at"),
    })),
    memory: ((memory.data ?? []) as Row[]).map((row) => ({
      key: text(row, "memory_key"),
      value: text(row, "memory_value"),
      updatedAt: text(row, "updated_at"),
    })),
    files: ((files.data ?? []) as Row[]).map((row) => ({
      id: text(row, "id"),
      name: text(row, "filename"),
      path: text(row, "path"),
      createdAt: text(row, "created_at"),
    })),
  }
}

async function replaceOwned(supabase: SupabaseClient, table: string, ownerId: string, rows: Row[]) {
  const { data: existing, error: readError } = await supabase.from(table).select("id").eq("owner_id", ownerId)
  if (readError) throw new Error(readError.message)
  if (rows.length > 0) {
    const { error } = await supabase.from(table).upsert(rows)
    if (error) throw new Error(error.message)
  }
  const keep = new Set(rows.map((row) => String(row.id)))
  const remove = ((existing ?? []) as Row[]).map((row) => String(row.id)).filter((item) => !keep.has(item))
  if (remove.length > 0) {
    const { error } = await supabase.from(table).delete().in("id", remove).eq("owner_id", ownerId)
    if (error) throw new Error(error.message)
  }
}

export async function saveWorkspace(supabase: SupabaseClient, ownerId: string, workspace: Workspace) {
  await replaceOwned(
    supabase,
    "contacts",
    ownerId,
    workspace.contacts.map((contact) => ({
      id: contact.id,
      owner_id: ownerId,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      notes: contact.notes,
      created_at: contact.createdAt,
    })),
  )
  await replaceOwned(
    supabase,
    "deals",
    ownerId,
    workspace.deals.map((deal) => ({
      id: deal.id,
      owner_id: ownerId,
      title: deal.title,
      contact_name: deal.contactName,
      stage: deal.stage,
      notes: deal.notes,
      created_at: deal.createdAt,
    })),
  )
  await replaceOwned(
    supabase,
    "appointments",
    ownerId,
    workspace.appointments.map((item) => ({
      id: item.id,
      owner_id: ownerId,
      title: item.title,
      contact_name: item.contactName,
      starts_at: item.startsAt,
      notes: item.notes,
      created_at: item.createdAt,
    })),
  )
  await replaceOwned(
    supabase,
    "threads",
    ownerId,
    workspace.threads.map((thread) => ({
      id: thread.id,
      owner_id: ownerId,
      contact_name: thread.contactName,
      subject: thread.subject,
      created_at: thread.createdAt,
    })),
  )
  await replaceOwned(
    supabase,
    "thread_messages",
    ownerId,
    workspace.threads.flatMap((thread) =>
      thread.messages.map((message) => ({
        id: message.id,
        owner_id: ownerId,
        thread_id: thread.id,
        body: message.body,
        sender: message.sender,
        created_at: message.createdAt,
      })),
    ),
  )
  await replaceOwned(
    supabase,
    "campaigns",
    ownerId,
    workspace.campaigns.map((campaign) => ({
      id: campaign.id,
      owner_id: ownerId,
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      brief: campaign.brief,
      created_at: campaign.createdAt,
    })),
  )
  await replaceOwned(
    supabase,
    "sites",
    ownerId,
    workspace.sites.map((site) => ({
      id: site.id,
      owner_id: ownerId,
      name: site.name,
      path: site.path,
      status: site.status,
      headline: site.headline,
      created_at: site.createdAt,
    })),
  )
  await replaceOwned(
    supabase,
    "automations",
    ownerId,
    workspace.automations.map((automation) => ({
      id: automation.id,
      owner_id: ownerId,
      name: automation.name,
      trigger_key: automation.trigger,
      action_key: automation.action,
      enabled: automation.enabled,
      created_at: automation.createdAt,
    })),
  )
  const { data: memories, error: memoryRead } = await supabase.from("client_memory").select("id, memory_key").eq("owner_id", ownerId)
  if (memoryRead) throw new Error(memoryRead.message)
  if (workspace.memory.length > 0) {
    const { error } = await supabase.from("client_memory").upsert(
      workspace.memory.map((item) => ({
        owner_id: ownerId,
        memory_key: item.key,
        memory_value: item.value,
        updated_at: item.updatedAt,
      })),
      { onConflict: "owner_id,memory_key" },
    )
    if (error) throw new Error(error.message)
  }
  const keepKeys = new Set(workspace.memory.map((item) => item.key.toLowerCase()))
  const removeIds = ((memories ?? []) as Row[])
    .filter((row) => !keepKeys.has(text(row, "memory_key").toLowerCase()))
    .map((row) => String(row.id))
  if (removeIds.length > 0) {
    const { error } = await supabase.from("client_memory").delete().in("id", removeIds).eq("owner_id", ownerId)
    if (error) throw new Error(error.message)
  }
}

const socialPlatforms = new Set(["facebook", "instagram", "linkedin", "x", "tiktok", "youtube", "google"])

async function commitSideAction(supabase: SupabaseClient, ownerId: string, action: Action) {
  if (action.type === "create_task") {
    const title = action.title.trim().slice(0, 160)
    if (title.length < 2) return { summary: "A task needs a title." }
    const { error } = await supabase.from("tasks").insert({ owner_id: ownerId, title, status: "open" })
    if (error) throw new Error(error.message)
    return { summary: `Task “${title}” is open.${action.contactName ? ` It is for ${action.contactName.trim().slice(0, 80)}.` : ""}` }
  }
  if (action.type === "draft_email_list") {
    const name = action.name.trim().slice(0, 120)
    if (name.length < 2) return { summary: "An email list needs a name." }
    const { error } = await supabase.from("email_lists").insert({ owner_id: ownerId, name })
    if (error) throw new Error(error.message)
    return { summary: `Email list “${name}” is a draft. Nobody has been emailed.` }
  }
  if (action.type === "draft_social_post") {
    const platform = action.platform.trim().toLowerCase()
    const body = action.body.trim().slice(0, 2000)
    if (!socialPlatforms.has(platform) || body.length < 2) return { summary: "A social draft needs a supported network and some text." }
    const scheduled = action.scheduledFor ? new Date(action.scheduledFor) : null
    const when = scheduled && !Number.isNaN(scheduled.getTime()) ? scheduled.toISOString() : null
    const { error } = await supabase.from("scheduled_posts").insert({
      user_id: ownerId,
      platform,
      body,
      status: when ? "scheduled" : "draft",
      scheduled_for: when,
    })
    if (error) throw new Error(error.message)
    return { summary: `Social draft for ${platform} is saved. It has not been published.` }
  }
  if (action.type === "note_lead") {
    const niche = action.niche.trim().slice(0, 40) || "general"
    const note = action.note.trim().slice(0, 1000)
    if (note.length < 2) return { summary: "A lead note needs some text, and it cannot include a private email." }
    const current = await loadWorkspace(supabase, ownerId)
    const result = applyAction(current, { type: "remember", key: `lead:${niche}`.slice(0, 80), value: note })
    await saveWorkspace(supabase, ownerId, result.workspace)
    return { summary: `Saved a lead note for ${niche}. Private contact details stay out of this note.` }
  }
  if (action.type === "request_backend") {
    const name = action.name.trim().slice(0, 40)
    const region = (action.region || "us-east-1").trim()
    if (name.length < 2) return { summary: "A backend request needs a short name." }
    const { provisionBackend } = await import("@/lib/managed/backend")
    const result = await provisionBackend({ userId: ownerId, name, region })
    if (result.ok) return { summary: `Backend “${result.backend.name}” is ${result.backend.status}.` }
    if (result.reason === "unconfigured") {
      const { error } = await supabase.from("provisioning_jobs").insert({
        owner_id: ownerId,
        name,
        region: region || "us-east-1",
        status: "requested",
        detail: "Needs Supabase management credentials. No project was created.",
      })
      if (error) throw new Error(error.message)
      return { summary: "I recorded the backend request. Management credentials are not set, so no project was created." }
    }
    return { summary: "The backend request was not accepted." }
  }
  return null
}

export async function commitAction(supabase: SupabaseClient, ownerId: string, action: Action) {
  const side = await commitSideAction(supabase, ownerId, action)
  if (side) return { workspace: emptyWorkspace(), summary: side.summary }
  const current = await loadWorkspace(supabase, ownerId)
  const result = applyAction(current, action)
  await saveWorkspace(supabase, ownerId, result.workspace)
  return result
}

export async function rosterFor(supabase: SupabaseClient, ownerId: string): Promise<Roster> {
  const workspace = await loadWorkspace(supabase, ownerId)
  return rosterFrom(workspace)
}
