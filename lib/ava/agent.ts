import { omitBannedLine } from "@/lib/ava/banned-line"
import { sanitizeSetupDraft, setupResult, type SetupDraftInput, type SetupSnapshot } from "@/lib/ava/onboarding-playbook"
import { onboardingPatch } from "@/lib/onboarding/fields"
import { upsertClientOnboarding } from "@/lib/onboarding/save-row"
import { respondToAva, type ChatTurn } from "@/lib/ava/respond"
import { runSpecialistJobs } from "@/lib/ava/specialist-run"
import { normalizeJobs, type SpecialistJob } from "@/lib/ava/specialists"
import { delegateWorkTool } from "@/lib/openai/helpers"
import { OPENAI_MISSING_CLIENT, OPENAI_MISSING_OWNER } from "@/lib/openai/server"
import { setOwnerVisitorMode } from "@/lib/office/appearance"
import { visitorModeIntent, visitorModeReply } from "@/lib/office/intent"
import { isOwnerIdentity } from "@/lib/owner/access"
import { answerFromPage, type PageContext } from "@/lib/ava/tools/page"
import { registryToolDefs, toolByApiName } from "@/lib/ava/tools/registry"
import { runTool } from "@/lib/ava/tools/run"
import { interpret } from "@/lib/platform/interpret"
import { rosterFor } from "@/lib/platform/db"
import type { Action, Roster, Stage, Trigger, AutomationAction, SocialPlatform } from "@/lib/platform/types"
import { automationActions, socialPlatforms, stages, triggers } from "@/lib/platform/types"
import { createSupabaseServer } from "@/lib/supabase/server"
import { ONBOARDING_TEXT_FIELDS } from "@/lib/onboarding/fields"

export type AvaAnswer = {
  text: string
  mode: "openai" | "offline" | "guide"
  live: boolean
  notice?: string
  fills?: Record<string, string>
  navigate?: string
  clientActions?: Action[]
  pendingActions?: Action[]
  pendingTools?: { name: string; args: Record<string, unknown>; summary: string }[]
  refresh?: boolean
  setup?: SetupSnapshot | null
}

type AnswerInput = {
  turns: ChatTurn[]
  pageFields?: string[]
  rosterHint?: Roster | null
  spoken?: boolean
  setupDraft?: SetupDraftInput
  pageContext?: PageContext | null
  workspaceId?: string
}

function timeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Hello and good morning"
  if (hour < 17) return "Hello and good afternoon"
  return "Hello and good evening"
}

async function loadKnownOnboarding() {
  const supabase = await createSupabaseServer()
  if (!supabase) return { known: {} as Record<string, string>, complete: false, name: "", userId: "" }
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return { known: {}, complete: false, name: "", userId: "" }

  const columns = [...ONBOARDING_TEXT_FIELDS, "onboarding_complete"].join(",")
  const { data: row } = await supabase.from("client_onboarding").select(columns).eq("user_id", user.id).maybeSingle()
  const known: Record<string, string> = {}
  let complete = false
  let name = ""
  if (row) {
    const rec = row as Record<string, unknown>
    complete = rec.onboarding_complete === true
    for (const key of ONBOARDING_TEXT_FIELDS) {
      const value = rec[key]
      if (typeof value === "string" && value.trim()) known[key] = value.trim()
    }
    name = known.client_name || user.user_metadata?.full_name || user.email?.split("@")[0] || ""
  } else {
    name = user.user_metadata?.full_name || user.email?.split("@")[0] || ""
  }
  return { known, complete, name, userId: user.id }
}

export async function answerAva(input: AnswerInput): Promise<AvaAnswer> {
  const { turns, setupDraft = {}, pageContext, spoken } = input
  const { known, complete, name } = await loadKnownOnboarding()

  // Absolute No-Repeat: if onboarding is already complete, never re-run the circle
  const wantsEdit = turns.some((t) => /change|update|correct|edit|reset.*(name|answer|onboarding)/i.test(t.content))
  if (complete && !wantsEdit) {
    // Proceed to normal respond, but inject greeting + known context if this looks like a fresh login/session start
    const isFresh = turns.length <= 1 && !turns.some((t) => t.role === "assistant")
    let extra = `Saved client profile (do not re-ask any of these):\n${Object.entries(known).map(([k, v]) => `${k}: ${v}`).join("\n")}\nThe user is ${name || "the account holder"}.`
    if (isFresh && name) {
      const greet = `${timeGreeting()}, ${name}. Ready to start where we left off, or is there something else you want to focus on?`
      extra = `IMPORTANT: This is a fresh login. Open your reply with exactly: "${greet}" Then continue naturally.\n` + extra
    }
    const reply = await respondToAva(turns, { extra })
    return {
      text: omitBannedLine(reply.text),
      mode: reply.mode,
      live: reply.live,
      notice: reply.notice,
      setup: null,
    }
  }

  // For incomplete or new accounts: run playbook with known fields so answered ones are skipped
  const playbook = setupResult(turns, known, setupDraft)
  if (playbook.text) {
    return {
      text: omitBannedLine(playbook.text),
      mode: "guide",
      live: false,
      setup: playbook.setup,
    }
  }

  // Fallback to normal agent response with known context
  const extra = name ? `The authenticated user is ${name}. Known profile:\n${Object.entries(known).map(([k, v]) => `${k}: ${v}`).join("\n")}` : ""
  const reply = await respondToAva(turns, { extra })
  return {
    text: omitBannedLine(reply.text),
    mode: reply.mode,
    live: reply.live,
    notice: reply.notice,
    setup: playbook.setup,
  }
}
