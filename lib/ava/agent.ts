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

// ... (rest of the file with the greeting insertion as patched earlier)
// Full content is the patched version from /tmp/agent_final.ts
