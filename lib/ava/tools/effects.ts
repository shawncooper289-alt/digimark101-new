import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { ToolSpec } from "@/lib/ava/tools/registry"
import { isWorkspaceId } from "@/lib/owner/access"
import { stages } from "@/lib/platform/types"

export type ToolRow = { id: string; title: string; meta: string; stage?: string }

type Row = Record<string, unknown>

export class ToolFailure extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function text(row: Row, key: string) {
  const value = row[key]
  return typeof value === "string" ? value : ""
}

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function dollarsToCents(value: unknown) {
  const raw = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/[$,]/g, "")) : Number.NaN
  if (!Number.isFinite(raw) || raw < 0 || raw > 1_000_000) return null
  return Math.round(raw * 100)
}

function fail(error: { message: string }): never {
  console.error("Ava tool write failed", error.message)
  if (/does not exist|schema cache|Could not find the/i.test(error.message)) {
    throw new ToolFailure("Apply supabase/migrations/20261119_feature_parity.sql to turn this module on. Nothing was sent or charged.", 503)
  }
  throw new ToolFailure("Could not update this workspace.", 502)
}

async function rowsOf(query: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await query
  if (error) fail(error)
  return (data ?? []) as Row[]
}

async function one(query: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await query
  if (error) fail(error)
  return (data ?? null) as Row | null
}

function summaryOf(rows: ToolRow[], empty: string, noun: string) {
  if (!rows.length) return empty
  const names = rows.slice(0, 8).map((row) => row.title).join(", ")
  return `${rows.length} ${noun}. ${names}${rows.length > 8 ? "." : ""}`
}

async function countOf(supabase: SupabaseClient, table: string, ownerId: string, column = "owner_id") {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).eq(column, ownerId)
  if (error) return null
  return count ?? 0
}

export async function executeTool(supabase: SupabaseClient, spec: ToolSpec, ownerId: string, args: Record<string, unknown>): Promise<{ summary: string; rows: ToolRow[] }> {
  switch (spec.name) {
    case "contacts.list": {
      const data = await rowsOf(supabase.from("contacts").select("id,name,email,company").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(40))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "name"), meta: [text(row, "company"), text(row, "email")].filter(Boolean).join(" · ") }))
      return { rows, summary: summaryOf(rows, "This workspace has no contacts.", "contacts") }
    }
    case "contacts.create": {
      const name = clip(args.name, 80)
      if (name.length < 2) throw new ToolFailure("A contact needs a name.")
      const created = await one(supabase.from("contacts").insert({ owner_id: ownerId, name, email: clip(args.email, 160), phone: clip(args.phone, 40), company: clip(args.company, 120), notes: clip(args.notes, 1000) }).select("id,name,email,company").single())
      const row = { id: text(created ?? {}, "id"), title: name, meta: clip(args.email, 160) }
      return { rows: [row], summary: `${name} is in your contacts.` }
    }
    case "contacts.update": {
      const id = clip(args.id, 80)
      const patch: Row = {}
      for (const key of ["name", "email", "phone", "company", "notes"] as const) {
        if (typeof args[key] === "string") patch[key] = clip(args[key], key === "notes" ? 1000 : 160)
      }
      const saved = await one(supabase.from("contacts").update(patch).eq("id", id).eq("owner_id", ownerId).select("id,name,email").single())
      if (!saved) throw new ToolFailure("That contact is not in this workspace.", 404)
      return { rows: [{ id, title: text(saved, "name"), meta: text(saved, "email") }], summary: `Updated ${text(saved, "name")}.` }
    }
    case "contacts.delete": {
      const id = clip(args.id, 80)
      const { error } = await supabase.from("contacts").delete().eq("id", id).eq("owner_id", ownerId)
      if (error) fail(error)
      return { rows: [], summary: "The contact was deleted from this workspace." }
    }
    case "deals.list": {
      const data = await rowsOf(supabase.from("deals").select("id,title,stage,contact_name").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(60))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "title"), meta: text(row, "contact_name"), stage: text(row, "stage") }))
      return { rows, summary: summaryOf(rows, "The pipeline is empty.", "deals") }
    }
    case "deals.create": {
      const title = clip(args.title, 120)
      if (title.length < 2) throw new ToolFailure("A deal needs a title.")
      const stage = stages.find((item) => item === args.stage) ?? "new"
      const created = await one(supabase.from("deals").insert({ owner_id: ownerId, title, contact_name: clip(args.contactName, 80), stage, notes: clip(args.notes, 1000) }).select("id,title,stage,contact_name").single())
      return { rows: [{ id: text(created ?? {}, "id"), title, meta: clip(args.contactName, 80), stage }], summary: `Deal “${title}” is in ${stage}.` }
    }
    case "deals.move": {
      const stage = stages.find((item) => item === args.stage)
      if (!stage) throw new ToolFailure("Pick a pipeline stage.")
      const id = clip(args.id, 80)
      const title = clip(args.title, 120).replace(/[%_]/g, "")
      if (!id && title.length < 2) throw new ToolFailure("Name the deal.")
      const found = id
        ? await rowsOf(supabase.from("deals").select("id,title,contact_name").eq("owner_id", ownerId).eq("id", id).limit(1))
        : await rowsOf(supabase.from("deals").select("id,title,contact_name").eq("owner_id", ownerId).ilike("title", title).limit(1))
      const match = found[0]
      if (!match) throw new ToolFailure("That deal is not in this workspace.", 404)
      const saved = await one(supabase.from("deals").update({ stage }).eq("id", text(match, "id")).eq("owner_id", ownerId).select("id,title,stage,contact_name").single())
      return { rows: [{ id: text(saved ?? {}, "id"), title: text(saved ?? {}, "title"), meta: text(saved ?? {}, "contact_name"), stage }], summary: `“${text(match, "title")}” is now ${stage}.` }
    }
    case "deals.delete": {
      const id = clip(args.id, 80)
      const { error } = await supabase.from("deals").delete().eq("id", id).eq("owner_id", ownerId)
      if (error) fail(error)
      return { rows: [], summary: "The deal was deleted." }
    }
    case "pipelines.list":
    case "pipelines.ensure": {
      if (spec.name === "pipelines.ensure") {
        const name = clip(args.name, 80) || "Sales"
        const existing = await rowsOf(supabase.from("pipelines").select("id").eq("owner_id", ownerId).eq("name", name).limit(1))
        if (!existing.length) {
          const created = await one(supabase.from("pipelines").insert({ owner_id: ownerId, name }).select("id").single())
          const pipe = text(created ?? {}, "id")
          if (pipe) {
            const { error } = await supabase.from("pipeline_stages").insert([
              ["new", "New", 1],
              ["qualified", "Qualified", 2],
              ["proposal", "Proposal", 3],
              ["won", "Won", 4],
              ["lost", "Lost", 5],
            ].map(([key, label, position]) => ({ pipeline_id: pipe, owner_id: ownerId, key, label, position })))
            if (error) fail(error)
          }
        }
      }
      const pipes = await rowsOf(supabase.from("pipelines").select("id,name").eq("owner_id", ownerId).order("created_at", { ascending: true }).limit(20))
      const stageRows = await rowsOf(supabase.from("pipeline_stages").select("pipeline_id,key,label,position").eq("owner_id", ownerId).order("position", { ascending: true }).limit(100))
      const rows = pipes.map((pipe) => {
        const labels = stageRows.filter((stage) => stage.pipeline_id === pipe.id).map((stage) => text(stage, "label")).join(" → ")
        return { id: text(pipe, "id"), title: text(pipe, "name"), meta: labels }
      })
      return { rows, summary: summaryOf(rows, "No pipeline yet.", "pipelines") }
    }
    case "calendars.list": {
      const data = await rowsOf(supabase.from("calendars").select("id,name").eq("owner_id", ownerId).order("created_at", { ascending: true }).limit(20))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "name"), meta: "Calendar" }))
      return { rows, summary: summaryOf(rows, "No calendar yet. A booking still creates the Studio calendar.", "calendars") }
    }
    case "calendars.create": {
      const name = clip(args.name, 80)
      if (name.length < 2) throw new ToolFailure("A calendar needs a name.")
      const created = await one(supabase.from("calendars").insert({ owner_id: ownerId, name }).select("id,name").single())
      return { rows: [{ id: text(created ?? {}, "id"), title: name, meta: "Calendar" }], summary: `Calendar “${name}” is ready. It does not sync to Google.` }
    }
    case "bookings.list": {
      const data = await rowsOf(supabase.from("bookings").select("id,title,contact_name,starts_at").eq("owner_id", ownerId).order("starts_at", { ascending: true }).limit(40))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "title"), meta: `${text(row, "contact_name")} · ${text(row, "starts_at")}` }))
      return { rows, summary: summaryOf(rows, "Nothing is booked.", "bookings") }
    }
    case "bookings.create": {
      const startsAt = clip(args.startsAt, 40)
      const when = new Date(startsAt)
      if (Number.isNaN(when.getTime())) throw new ToolFailure("A booking needs a real date and time.")
      const title = clip(args.title, 120) || "Appointment"
      const created = await one(supabase.from("appointments").insert({ owner_id: ownerId, title, contact_name: clip(args.contactName, 80), starts_at: when.toISOString(), notes: clip(args.notes, 1000) }).select("id,title,contact_name,starts_at").single())
      return { rows: [{ id: text(created ?? {}, "id"), title, meta: when.toLocaleString() }], summary: `“${title}” is booked for ${when.toLocaleString()}. No reminder was sent.` }
    }
    case "bookings.cancel": {
      const id = clip(args.id, 80)
      if (!isWorkspaceId(id)) throw new ToolFailure("That booking id is not valid.")
      const booking = await one(supabase.from("bookings").select("id,appointment_id").eq("owner_id", ownerId).eq("id", id).maybeSingle())
      const linkedAppointment = text(booking ?? {}, "appointment_id")
      const { error: byId } = await supabase.from("bookings").delete().eq("owner_id", ownerId).eq("id", id)
      if (byId) fail(byId)
      const { error: byAppointment } = await supabase.from("bookings").delete().eq("owner_id", ownerId).eq("appointment_id", id)
      if (byAppointment) fail(byAppointment)
      const appointmentIds = [linkedAppointment, id].filter((item) => isWorkspaceId(item))
      if (appointmentIds.length) {
        const { error } = await supabase.from("appointments").delete().eq("owner_id", ownerId).in("id", appointmentIds)
        if (error) fail(error)
      }
      return { rows: [], summary: "The booking and its calendar appointment were cancelled. No one was texted." }
    }
    case "funnels.list": {
      const funnels = await rowsOf(supabase.from("funnels").select("id,name,status").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(30))
      const pages = await rowsOf(supabase.from("funnel_pages").select("funnel_id,headline,path,position").eq("owner_id", ownerId).order("position", { ascending: true }).limit(100))
      const rows = funnels.map((funnel) => {
        const steps = pages.filter((page) => page.funnel_id === funnel.id).map((page) => text(page, "headline") || text(page, "path")).filter(Boolean)
        return { id: text(funnel, "id"), title: text(funnel, "name"), meta: `${text(funnel, "status")} · ${steps.join(" → ") || "No pages yet"}` }
      })
      return { rows, summary: summaryOf(rows, "No funnels yet.", "funnels") }
    }
    case "funnels.create": {
      const name = clip(args.name, 120)
      if (name.length < 2) throw new ToolFailure("A funnel needs a name.")
      const headline = clip(args.headline, 160)
      const path = clip(args.path, 80)
      const site = await one(supabase.from("sites").insert({ owner_id: ownerId, name, headline, path, status: "draft" }).select("id,name").single())
      return { rows: [{ id: text(site ?? {}, "id"), title: name, meta: headline || "Draft" }], summary: `Draft funnel “${name}” is saved. It is not published.` }
    }
    case "sites.list": {
      const data = await rowsOf(supabase.from("sites").select("id,name,status,headline").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(30))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "name"), meta: `${text(row, "status")} · ${text(row, "headline")}` }))
      return { rows, summary: summaryOf(rows, "No sites yet.", "sites") }
    }
    case "sites.create": {
      const name = clip(args.name, 120)
      if (name.length < 2) throw new ToolFailure("A site needs a name.")
      const created = await one(supabase.from("sites").insert({ owner_id: ownerId, name, headline: clip(args.headline, 160), path: clip(args.path, 80), status: "draft" }).select("id,name,status,headline").single())
      return { rows: [{ id: text(created ?? {}, "id"), title: name, meta: "draft" }], summary: `Draft site “${name}” is saved. It is not published.` }
    }
    case "forms.list": {
      const data = await rowsOf(supabase.from("forms").select("id,name,kind,status").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(40))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "name"), meta: `${text(row, "kind")} · ${text(row, "status")}` }))
      return { rows, summary: summaryOf(rows, "No forms yet.", "forms") }
    }
    case "forms.create": {
      const name = clip(args.name, 120)
      if (name.length < 2) throw new ToolFailure("A form needs a name.")
      const kind = ["form", "survey", "quiz"].includes(clip(args.kind, 20)) ? clip(args.kind, 20) : "form"
      const created = await one(supabase.from("forms").insert({ owner_id: ownerId, name, kind, status: "draft" }).select("id,name,kind").single())
      const formId = text(created ?? {}, "id")
      if (formId) {
        const { error } = await supabase.from("form_fields").insert([
          { form_id: formId, owner_id: ownerId, key: "name", label: "Name", field_type: "text", required: true, position: 1 },
          { form_id: formId, owner_id: ownerId, key: "email", label: "Email", field_type: "email", required: false, position: 2 },
          { form_id: formId, owner_id: ownerId, key: "message", label: kind === "quiz" ? "Answer" : "Message", field_type: "textarea", required: false, position: 3 },
        ])
        if (error) fail(error)
      }
      return { rows: [{ id: formId, title: name, meta: kind }], summary: `${kind[0]?.toUpperCase()}${kind.slice(1)} “${name}” is a draft with name, email, and message fields.` }
    }
    case "forms.submit": {
      const formId = clip(args.formId, 80)
      const payload = {
        contactName: clip(args.contactName, 80),
        message: clip(args.message, 2000),
        email: clip(args.email, 160),
      }
      const created = await one(supabase.from("form_submissions").insert({ form_id: formId, owner_id: ownerId, contact_name: payload.contactName, payload }).select("id").single())
      return { rows: [{ id: text(created ?? {}, "id"), title: payload.contactName || "Submission", meta: payload.message }], summary: "The answer is stored in this workspace." }
    }
    case "campaigns.list": {
      const data = await rowsOf(supabase.from("campaigns").select("id,name,channel,status").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(40))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "name"), meta: `${text(row, "channel")} · ${text(row, "status")}` }))
      return { rows, summary: summaryOf(rows, "No campaigns yet.", "campaigns") }
    }
    case "campaigns.draft": {
      const name = clip(args.name, 120)
      if (name.length < 2) throw new ToolFailure("A campaign needs a name.")
      const channel = clip(args.channel, 20) === "sms" ? "sms" : "email"
      const created = await one(supabase.from("campaigns").insert({ owner_id: ownerId, name, channel, status: "draft", brief: clip(args.brief, 2000) }).select("id,name,channel,status").single())
      return { rows: [{ id: text(created ?? {}, "id"), title: name, meta: `${channel} · draft` }], summary: `Draft “${name}” is saved. It was not sent.` }
    }
    case "campaigns.send": {
      const id = clip(args.id, 80)
      const name = clip(args.name, 120).replace(/[%_]/g, "")
      if (!id && name.length < 2) throw new ToolFailure("Pick a campaign.")
      const found = id
        ? await one(supabase.from("campaigns").select("id,name,channel").eq("owner_id", ownerId).eq("id", id).maybeSingle())
        : await one(supabase.from("campaigns").select("id,name,channel").eq("owner_id", ownerId).ilike("name", name).limit(1).maybeSingle())
      if (!found) throw new ToolFailure("That campaign is not in this workspace.", 404)
      const queued = await one(supabase.from("email_sends").insert({ owner_id: ownerId, campaign_id: text(found, "id"), status: "queued" }).select("id,status").single())
      return { rows: [{ id: text(queued ?? {}, "id"), title: text(found, "name"), meta: "queued" }], summary: `“${text(found, "name")}” is queued in this workspace. It was not delivered.` }
    }
    case "inbox.list": {
      const channel = clip(args.channel, 20)
      let query = supabase.from("threads").select("id,contact_name,subject,channel,created_at").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(40)
      if (channel) query = query.eq("channel", channel)
      const data = await rowsOf(query)
      const messages = await rowsOf(supabase.from("thread_messages").select("thread_id,body,delivery").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(200))
      const rows = data.map((row) => {
        const latest = messages.find((message) => message.thread_id === row.id)
        return { id: text(row, "id"), title: text(row, "subject") || "Note", meta: `${text(row, "channel") || "note"} · ${text(row, "contact_name")} · ${text(latest ?? {}, "body")}` }
      })
      return { rows, summary: summaryOf(rows, "The inbox is empty.", "threads") }
    }
    case "inbox.log":
    case "inbox.send": {
      const body = clip(args.body, 2000)
      if (body.length < 1) throw new ToolFailure("A message needs text.")
      const channel = ["sms", "email", "facebook", "instagram", "whatsapp", "webchat", "phone", "note"].includes(clip(args.channel, 20)) ? clip(args.channel, 20) : "note"
      const contactName = clip(args.contactName, 80) || "Workspace"
      const subject = clip(args.subject, 140) || (channel === "note" ? "Note" : channel)
      const delivery = spec.name === "inbox.send" ? "queued" : "logged"
      const thread = await one(supabase.from("threads").insert({ owner_id: ownerId, contact_name: contactName, subject, channel }).select("id,subject,channel").single())
      const threadId = text(thread ?? {}, "id")
      await one(supabase.from("thread_messages").insert({ owner_id: ownerId, thread_id: threadId, body, sender: "studio", delivery }).select("id").single())
      const summary = spec.name === "inbox.send"
        ? `The ${channel} reply is queued in this workspace. It was not sent.`
        : `Logged on the ${channel} thread.`
      return { rows: [{ id: threadId, title: subject, meta: `${channel} · ${delivery}` }], summary }
    }
    case "social.list": {
      const data = await rowsOf(supabase.from("scheduled_posts").select("id,platform,body,status,scheduled_for").eq("user_id", ownerId).order("created_at", { ascending: false }).limit(40))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "platform"), meta: `${text(row, "status")} · ${text(row, "body")}` }))
      return { rows, summary: summaryOf(rows, "No social drafts yet.", "drafts") }
    }
    case "social.draft":
    case "social.publish": {
      const platform = clip(args.platform, 20)
      const body = clip(args.body, 2000)
      const id = clip(args.id, 80)
      const status = spec.name === "social.publish" ? "scheduled" : "draft"
      if (id && spec.name === "social.publish") {
        const saved = await one(supabase.from("scheduled_posts").update({ status: "scheduled" }).eq("id", id).eq("user_id", ownerId).select("id,platform,status").single())
        if (!saved) throw new ToolFailure("That draft is not in this workspace.", 404)
        return { rows: [{ id, title: text(saved, "platform"), meta: "scheduled" }], summary: "The post is marked scheduled here. It was not published to the network." }
      }
      if (!["facebook", "instagram", "linkedin", "x", "tiktok", "youtube", "google"].includes(platform) || body.length < 1) {
        throw new ToolFailure("A social draft needs a network and text.")
      }
      const scheduledFor = clip(args.scheduledFor, 40)
      const created = await one(supabase.from("scheduled_posts").insert({ user_id: ownerId, platform, body, status, scheduled_for: scheduledFor || null }).select("id,platform,status").single())
      const summary = status === "scheduled"
        ? "The post is marked scheduled here. It was not published to the network."
        : "The draft is saved. It was not published."
      return { rows: [{ id: text(created ?? {}, "id"), title: platform, meta: status }], summary }
    }
    case "workflows.list": {
      const rules = await rowsOf(supabase.from("workflow_rules").select("id,name,trigger_key,action_key,enabled").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(40))
      const runs = await rowsOf(supabase.from("workflow_runs").select("rule_id,status").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(40))
      const rows = rules.map((rule) => ({ id: text(rule, "id"), title: text(rule, "name"), meta: `${text(rule, "trigger_key")} → ${text(rule, "action_key")} · ${runs.find((run) => run.rule_id === rule.id) ? text(runs.find((run) => run.rule_id === rule.id) ?? {}, "status") : "not run"}` }))
      return { rows, summary: summaryOf(rows, "No workflow rules yet.", "workflows") }
    }
    case "workflows.create": {
      const triggers = ["contact.created", "appointment.booked", "deal.moved", "form.submitted", "review.received", "invoice.paid"]
      const actions = ["log_inbox", "remember", "draft_email", "draft_sms", "request_review", "create_task"]
      const trigger = clip(args.trigger, 40)
      const action = clip(args.action, 40)
      if (!triggers.includes(trigger) || !actions.includes(action)) throw new ToolFailure("Pick a trigger and an action from the list.")
      const name = clip(args.name, 120) || `${trigger} → ${action}`
      if (["contact.created", "appointment.booked", "deal.moved"].includes(trigger) && ["log_inbox", "remember"].includes(action)) {
        const { error } = await supabase.from("automations").insert({ owner_id: ownerId, name, trigger_key: trigger, action_key: action, enabled: true })
        if (error) fail(error)
      }
      const created = await one(supabase.from("workflow_rules").insert({ owner_id: ownerId, name, trigger_key: trigger, action_key: action, enabled: true }).select("id,name").single())
      return { rows: [{ id: text(created ?? {}, "id"), title: name, meta: `${trigger} → ${action}` }], summary: `Workflow “${name}” is on. It does not send mail or texts by itself.` }
    }
    case "workflows.run": {
      const id = clip(args.id, 80)
      const rule = await one(supabase.from("workflow_rules").select("id,name,action_key").eq("owner_id", ownerId).eq("id", id).maybeSingle())
      if (!rule) throw new ToolFailure("That workflow is not in this workspace.", 404)
      const action = text(rule, "action_key")
      let detail = "Ran inside the workspace."
      if (action === "log_inbox") {
        const thread = await one(supabase.from("threads").insert({ owner_id: ownerId, contact_name: "Workspace", subject: text(rule, "name"), channel: "note" }).select("id").single())
        await one(supabase.from("thread_messages").insert({ owner_id: ownerId, thread_id: text(thread ?? {}, "id"), body: `Workflow “${text(rule, "name")}” ran.`, sender: "studio", delivery: "logged" }).select("id").single())
        detail = "Wrote an inbox note."
      } else if (action === "remember") {
        await one(supabase.from("client_memory").upsert({ owner_id: ownerId, memory_key: text(rule, "name"), memory_value: "Workflow ran.", updated_at: new Date().toISOString() }, { onConflict: "owner_id,memory_key" }).select("memory_key").single())
        detail = "Saved a memory."
      } else if (action === "draft_email" || action === "draft_sms") {
        const channel = action === "draft_sms" ? "sms" : "email"
        await one(supabase.from("campaigns").insert({ owner_id: ownerId, name: text(rule, "name"), channel, status: "draft", brief: "Drafted by a workflow. Not sent." }).select("id").single())
        detail = `Saved a ${channel} draft. It was not sent.`
      } else if (action === "request_review") {
        await one(supabase.from("review_requests").insert({ owner_id: ownerId, contact_name: "Workspace", channel: "email", status: "draft", message: `Review request from “${text(rule, "name")}”. Not sent.` }).select("id").single())
        detail = "Saved a review request draft. It was not sent."
      } else if (action === "create_task") {
        await one(supabase.from("tasks").insert({ owner_id: ownerId, title: text(rule, "name"), status: "open" }).select("id").single())
        detail = "Added an open task."
      }
      await one(supabase.from("workflow_runs").insert({ rule_id: id, owner_id: ownerId, status: "succeeded", detail }).select("id").single())
      return { rows: [{ id, title: text(rule, "name"), meta: detail }], summary: detail }
    }
    case "reviews.list": {
      const reviews = await rowsOf(supabase.from("reviews").select("id,source,author,rating,body,reply").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(40))
      const requests = await rowsOf(supabase.from("review_requests").select("id,contact_name,channel,status").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(20))
      const rows = [
        ...reviews.map((row) => ({ id: text(row, "id"), title: text(row, "author") || text(row, "source"), meta: `${text(row, "source")} · ${String(row.rating ?? "")} · ${text(row, "body")}` })),
        ...requests.map((row) => ({ id: text(row, "id"), title: text(row, "contact_name"), meta: `request · ${text(row, "channel")} · ${text(row, "status")}` })),
      ]
      return { rows, summary: summaryOf(rows, "No reviews logged yet. Google and Facebook are not pulled in.", "reviews") }
    }
    case "reviews.log": {
      const body = clip(args.body, 2000)
      if (body.length < 2) throw new ToolFailure("A review needs text.")
      const source = ["google", "facebook", "manual"].includes(clip(args.source, 20)) ? clip(args.source, 20) : "manual"
      const rating = Math.min(5, Math.max(1, Math.round(Number(args.rating) || 5)))
      const created = await one(supabase.from("reviews").insert({ owner_id: ownerId, source, author: clip(args.author, 80), rating, body, status: "logged" }).select("id,author,source").single())
      return { rows: [{ id: text(created ?? {}, "id"), title: clip(args.author, 80) || source, meta: body }], summary: "The review is logged here. It was not pulled from Google or Facebook." }
    }
    case "reviews.reply": {
      const id = clip(args.id, 80)
      const reply = clip(args.reply, 2000)
      if (reply.length < 2) throw new ToolFailure("A reply needs text.")
      const saved = await one(supabase.from("reviews").update({ reply, status: "replied" }).eq("id", id).eq("owner_id", ownerId).select("id,author").single())
      if (!saved) throw new ToolFailure("That review is not in this workspace.", 404)
      return { rows: [{ id, title: text(saved, "author"), meta: reply }], summary: "The reply is saved here. It was not posted to Google or Facebook." }
    }
    case "reviews.request": {
      const contactName = clip(args.contactName, 80)
      if (contactName.length < 2) throw new ToolFailure("A review request needs a person.")
      const channel = clip(args.channel, 20) === "sms" ? "sms" : "email"
      const created = await one(supabase.from("review_requests").insert({ owner_id: ownerId, contact_name: contactName, channel, status: "queued", message: clip(args.message, 1000) || "Would you leave us a review?" }).select("id,contact_name,status").single())
      return { rows: [{ id: text(created ?? {}, "id"), title: contactName, meta: `${channel} · queued` }], summary: `The request for ${contactName} is queued here. It was not emailed or texted.` }
    }
    case "invoices.list": {
      const data = await rowsOf(supabase.from("invoices").select("id,contact_name,status,total_cents,currency").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(40))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "contact_name") || "Invoice", meta: `${text(row, "status")} · ${((Number(row.total_cents) || 0) / 100).toFixed(2)} ${text(row, "currency") || "USD"}` }))
      return { rows, summary: summaryOf(rows, "No invoices yet.", "invoices") }
    }
    case "invoices.create": {
      const description = clip(args.description, 200)
      const cents = dollarsToCents(args.amount)
      if (description.length < 2 || cents === null) throw new ToolFailure("An invoice needs a description and a dollar amount.")
      const quantity = Math.min(99, Math.max(1, Math.round(Number(args.quantity) || 1)))
      const total = cents * quantity
      const created = await one(supabase.from("invoices").insert({ owner_id: ownerId, contact_name: clip(args.contactName, 80), status: "draft", currency: "USD", total_cents: total, notes: clip(args.notes, 1000) }).select("id,contact_name,total_cents").single())
      const invoiceId = text(created ?? {}, "id")
      if (invoiceId) {
        const { error } = await supabase.from("invoice_lines").insert({ invoice_id: invoiceId, owner_id: ownerId, description, quantity, amount_cents: cents })
        if (error) fail(error)
      }
      return { rows: [{ id: invoiceId, title: clip(args.contactName, 80) || description, meta: `draft · ${(total / 100).toFixed(2)} USD` }], summary: `Draft invoice for $${(total / 100).toFixed(2)} is saved. Nobody was charged, and PayPal was not changed.` }
    }
    case "invoices.mark_paid":
    case "invoices.void":
    case "invoices.request_payment": {
      const id = clip(args.id, 80)
      const status = spec.name === "invoices.void" ? "void" : spec.name === "invoices.mark_paid" ? "paid" : "payment_requested"
      const saved = await one(supabase.from("invoices").update({ status }).eq("id", id).eq("owner_id", ownerId).select("id,contact_name,status,total_cents").single())
      if (!saved) throw new ToolFailure("That invoice is not in this workspace.", 404)
      const summary = status === "payment_requested"
        ? "The payment request is recorded. No charge was sent, and PayPal was not changed."
        : status === "void"
          ? "The invoice is void. Nothing was refunded through PayPal."
          : "The invoice is marked paid because you said the money arrived. No card was charged."
      return { rows: [{ id, title: text(saved, "contact_name") || "Invoice", meta: status }], summary }
    }
    case "reports.summary": {
      const tables = [
        ["contacts", "Contacts"],
        ["deals", "Deals"],
        ["bookings", "Bookings"],
        ["threads", "Inbox threads"],
        ["campaigns", "Campaigns"],
        ["funnels", "Funnels"],
        ["forms", "Forms"],
        ["reviews", "Reviews"],
        ["invoices", "Invoices"],
        ["workflow_rules", "Workflows"],
      ] as const
      const [counted, audit] = await Promise.all([
        Promise.all(
          tables.map(async ([table, label]) => {
            const count = await countOf(supabase, table, ownerId)
            return { id: table, title: label, meta: count === null ? "Apply the new migration to count this." : String(count) }
          }),
        ),
        countOf(supabase, "ava_audit_log", ownerId),
      ])
      const rows = [...counted, { id: "ava_audit_log", title: "Ava audit entries", meta: audit === null ? "Apply the new migration to count this." : String(audit) }]
      return { rows, summary: `Workspace counts: ${rows.map((row) => `${row.title} ${row.meta}`).join("; ")}. These are not ad results.` }
    }
    case "office.list": {
      const data = await rowsOf(supabase.from("office_records").select("id,kind,title,party,status,amount").order("created_at", { ascending: false }).limit(30))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "title"), meta: `${text(row, "kind")} · ${text(row, "status")} · ${text(row, "party")}` }))
      return { rows, summary: summaryOf(rows, "The owner office has no records.", "office records") }
    }
    case "office.create": {
      const title = clip(args.title, 140)
      if (title.length < 2) throw new ToolFailure("An office record needs a title.")
      const kind = ["invoice", "expense", "record", "legal"].includes(clip(args.kind, 20)) ? clip(args.kind, 20) : "record"
      const amount = dollarsToCents(args.amount)
      const created = await one(supabase.from("office_records").insert({ kind, title, party: clip(args.party, 120), amount: amount === null ? null : amount / 100, notes: clip(args.notes, 1000), status: "open" }).select("id,title,kind").single())
      return { rows: [{ id: text(created ?? {}, "id"), title, meta: kind }], summary: `Office record “${title}” is saved. Nobody was charged.` }
    }
    case "video.list": {
      const data = await rowsOf(supabase.from("client_media").select("id,title,kind,created_at").eq("owner_id", ownerId).eq("kind", "video").order("created_at", { ascending: false }).limit(20))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "title"), meta: "Stored video" }))
      return { rows, summary: summaryOf(rows, "No stored videos in this workspace. This did not start a render.", "videos") }
    }
    default: {
      const { handleOwnerTool } = await import("@/lib/ava/team/owner-tools")
      const team = await handleOwnerTool(supabase, spec, ownerId, args)
      if (team) return team
      throw new ToolFailure("That tool is not available.")
    }
  }
}
