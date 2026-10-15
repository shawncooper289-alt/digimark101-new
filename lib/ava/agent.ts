import { respondToAva, type ChatTurn } from "@/lib/ava/respond"
import { interpret } from "@/lib/platform/interpret"
import { commitAction, rosterFor } from "@/lib/platform/db"
import type { Action, Roster, Stage, Trigger, AutomationAction } from "@/lib/platform/types"
import { automationActions, stages, triggers } from "@/lib/platform/types"
import { createSupabaseServer } from "@/lib/supabase/server"

export type AvaAnswer = {
  text: string
  mode: "xai" | "openai" | "compatible" | "guide"
  live: boolean
  notice?: string
  fills?: Record<string, string>
  navigate?: string
  clientActions?: Action[]
  refresh?: boolean
}

type ToolCall = { id: string; function: { name: string; arguments: string } }

const toolDefs = [
  { type: "function", function: { name: "create_contact", description: "Create a contact in the signed-in client's workspace.", parameters: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, company: { type: "string" }, notes: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "create_deal", description: "Add a pipeline deal.", parameters: { type: "object", properties: { title: { type: "string" }, contactName: { type: "string" }, stage: { type: "string", enum: stages }, notes: { type: "string" } }, required: ["title"] } } },
  { type: "function", function: { name: "move_deal", description: "Move a deal to another stage.", parameters: { type: "object", properties: { title: { type: "string" }, stage: { type: "string", enum: stages } }, required: ["title", "stage"] } } },
  { type: "function", function: { name: "book_appointment", description: "Book an appointment. startsAt must be an ISO datetime.", parameters: { type: "object", properties: { title: { type: "string" }, contactName: { type: "string" }, startsAt: { type: "string" }, notes: { type: "string" } }, required: ["title", "startsAt"] } } },
  { type: "function", function: { name: "log_message", description: "Log an inbox note.", parameters: { type: "object", properties: { contactName: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["body"] } } },
  { type: "function", function: { name: "start_campaign", description: "Create a draft campaign. This does not send it.", parameters: { type: "object", properties: { name: { type: "string" }, channel: { type: "string" }, brief: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "create_site", description: "Register a draft site record. This does not publish a page.", parameters: { type: "object", properties: { name: { type: "string" }, headline: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "create_automation", description: "Create an automation inside the workspace.", parameters: { type: "object", properties: { name: { type: "string" }, trigger: { type: "string", enum: triggers }, action: { type: "string", enum: automationActions } }, required: ["trigger", "action"] } } },
  { type: "function", function: { name: "remember", description: "Save a memory that only this client can read.", parameters: { type: "object", properties: { key: { type: "string" }, value: { type: "string" } }, required: ["key", "value"] } } },
  { type: "function", function: { name: "navigate", description: "Open a page in this product.", parameters: { type: "object", properties: { href: { type: "string" } }, required: ["href"] } } },
  { type: "function", function: { name: "fill_form", description: "Fill visible form fields on the current page.", parameters: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, company: { type: "string" }, website: { type: "string" }, phone: { type: "string" }, message: { type: "string" }, title: { type: "string" }, headline: { type: "string" }, brief: { type: "string" } } } } },
]

function str(value: unknown) {
  return typeof value === "string" ? value : undefined
}

function actionFromTool(name: string, args: Record<string, unknown>): Action | null {
  switch (name) {
    case "create_contact":
      return str(args.name) ? { type: "create_contact", name: str(args.name)!, email: str(args.email), phone: str(args.phone), company: str(args.company), notes: str(args.notes) } : null
    case "create_deal":
      return str(args.title) ? { type: "create_deal", title: str(args.title)!, contactName: str(args.contactName), stage: stages.find((item) => item === args.stage), notes: str(args.notes) } : null
    case "move_deal":
      return str(args.title) && stages.includes(args.stage as Stage) ? { type: "move_deal", title: str(args.title)!, stage: args.stage as Stage } : null
    case "book_appointment":
      return str(args.startsAt) ? { type: "book_appointment", title: str(args.title) || "Appointment", contactName: str(args.contactName), startsAt: str(args.startsAt)!, notes: str(args.notes) } : null
    case "log_message":
      return str(args.body) ? { type: "log_message", contactName: str(args.contactName) || "Workspace", subject: str(args.subject), body: str(args.body)! } : null
    case "start_campaign":
      return str(args.name) ? { type: "start_campaign", name: str(args.name)!, channel: str(args.channel), brief: str(args.brief) } : null
    case "create_site":
      return str(args.name) ? { type: "create_site", name: str(args.name)!, headline: str(args.headline) } : null
    case "create_automation":
      return triggers.includes(args.trigger as Trigger) && automationActions.includes(args.action as AutomationAction)
        ? { type: "create_automation", name: str(args.name) || "Studio automation", trigger: args.trigger as Trigger, action: args.action as AutomationAction }
        : null
    case "remember":
      return str(args.key) && str(args.value) ? { type: "remember", key: str(args.key)!, value: str(args.value)! } : null
    default:
      return null
  }
}

function rosterReply(question: string, roster: Roster | null): string | null {
  const q = question.toLowerCase()
  if (!roster) return null
  if (/how many contacts|who (is|are) (in|on) (my )?contacts|list contacts/.test(q)) {
    return roster.contacts.length ? `This workspace has ${roster.contacts.length} contact${roster.contacts.length === 1 ? "" : "s"}: ${roster.contacts.join(", ")}.` : "This workspace has no contacts yet."
  }
  if (/what do you remember|show (my )?memory|recall/.test(q)) {
    return roster.memory.length ? roster.memory.map((item) => `${item.key}: ${item.value}`).join("\n") : "I have nothing stored in this client's memory yet."
  }
  if (/how many deals|what is in the pipeline|pipeline status/.test(q)) {
    return roster.deals.length ? roster.deals.map((deal) => `${deal.title} (${deal.stage})`).join(", ") : "The pipeline is empty."
  }
  return null
}

function allowedHref(value: string) {
  return ["/studio", "/contact", "/pricing", "/services", "/work", "/about", "/blog", "/ava"].some((path) => value === path || value.startsWith(`${path}/`))
}

async function runAction(action: Action, userId: string | null): Promise<Pick<AvaAnswer, "text" | "clientActions" | "refresh" | "navigate">> {
  const navigate = action.type === "create_contact" ? "/studio/contacts"
    : action.type === "create_deal" || action.type === "move_deal" ? "/studio/pipeline"
    : action.type === "book_appointment" ? "/studio/calendar"
    : action.type === "log_message" ? "/studio/inbox"
    : action.type === "start_campaign" ? "/studio/campaigns"
    : action.type === "create_site" ? "/studio/sites"
    : action.type === "create_automation" ? "/studio/automations"
    : action.type === "remember" ? "/studio/memory"
    : undefined

  if (!userId) {
    return { text: "", clientActions: [action], navigate }
  }
  const supabase = await createSupabaseServer()
  if (!supabase) return { text: "Supabase is not configured, so I could not save that.", clientActions: [action], navigate }
  const result = await commitAction(supabase, userId, action)
  return { text: result.summary, refresh: true, navigate }
}

export async function answerAva(input: {
  turns: ChatTurn[]
  pageFields: string[]
  rosterHint: Roster | null
}): Promise<AvaAnswer> {
  const latest = input.turns[input.turns.length - 1]?.content ?? ""
  const session = await createSupabaseServer()
  const user = session ? (await session.auth.getUser()).data.user : null
  const roster = user && session ? await rosterFor(session, user.id).catch(() => input.rosterHint) : input.rosterHint
  const found = interpret(latest, input.pageFields)
  const fromRoster = rosterReply(latest, roster)

  if (found.handled && found.action) {
    const ran = await runAction(found.action, user?.id ?? null)
    return {
      text: ran.text || found.summary,
      mode: "guide",
      live: false,
      fills: found.fills,
      navigate: found.navigate || ran.navigate,
      clientActions: ran.clientActions,
      refresh: ran.refresh,
    }
  }

  if (found.handled) {
    return { text: fromRoster || found.summary, mode: "guide", live: false, fills: found.fills, navigate: found.navigate }
  }

  if (fromRoster) {
    return { text: fromRoster, mode: "guide", live: false }
  }

  const model = await respondToAva(input.turns, {
    tools: user ? toolDefs : undefined,
    extra: `Workspace roster, which is the only set of names and counts you may cite:\n${JSON.stringify(roster ?? { contacts: [], deals: [], appointments: [], campaigns: [], memory: [] })}\nVisible form fields: ${input.pageFields.join(", ") || "none"}.\nYou may call tools to change this client's workspace. Never invent clients, revenue, or campaign results. Campaign and site tools create drafts only.`,
  })

  if (!model.toolCalls?.length || !user) {
    return { text: model.text, mode: model.mode, live: model.live, notice: model.notice }
  }

  const fills: Record<string, string> = {}
  let navigate: string | undefined
  const summaries: string[] = []
  for (const call of model.toolCalls) {
    let args: Record<string, unknown> = {}
    try {
      args = JSON.parse(call.function.arguments) as Record<string, unknown>
    } catch {
      args = {}
    }
    if (call.function.name === "navigate" && typeof args.href === "string" && allowedHref(args.href)) {
      navigate = args.href
      summaries.push(`Opening ${args.href}.`)
      continue
    }
    if (call.function.name === "fill_form") {
      for (const [key, value] of Object.entries(args)) {
        if (typeof value === "string" && input.pageFields.includes(key)) fills[key] = value
      }
      summaries.push("I filled the form fields that are on this page.")
      continue
    }
    const action = actionFromTool(call.function.name, args)
    if (!action) continue
    const ran = await runAction(action, user.id)
    if (ran.text) summaries.push(ran.text)
    navigate = navigate || ran.navigate
  }

  const text = [model.text, ...summaries].filter(Boolean).join("\n\n")
  return {
    text: text || "Done.",
    mode: model.mode,
    live: model.live,
    notice: model.notice,
    fills: Object.keys(fills).length ? fills : undefined,
    navigate,
    refresh: true,
  }
}

export type { ToolCall }
