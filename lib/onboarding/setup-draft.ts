export type SetupPath = "choose" | "manual" | "ava"
export type SetupPhase = "idle" | "asking" | "confirm" | "saved" | "paused"

export type StoredSetupDraft = {
  path: SetupPath
  step: number
  answers: Record<string, string>
  plan: string
  planEdited: boolean
  phase: SetupPhase
}

export const SETUP_DRAFT_KEY = "digimark101.setup.draft"

export const EMPTY_SETUP_DRAFT: StoredSetupDraft = {
  path: "choose",
  step: 0,
  answers: {},
  plan: "",
  planEdited: false,
  phase: "idle",
}

const PATHS = new Set<SetupPath>(["choose", "manual", "ava"])
const PHASES = new Set<SetupPhase>(["idle", "asking", "confirm", "saved", "paused"])

const listeners = new Set<() => void>()
let memory = EMPTY_SETUP_DRAFT
let raw = ""
let loaded = false

function answersFrom(value: unknown) {
  const answers: Record<string, string> = {}
  if (!value || typeof value !== "object") return answers
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[a-z0-9_]{1,40}$/i.test(key) || typeof item !== "string") continue
    answers[key] = item.slice(0, 300)
  }
  return answers
}

export function parseSetupDraft(text: string | null): StoredSetupDraft {
  if (!text) return EMPTY_SETUP_DRAFT
  try {
    const parsed = JSON.parse(text) as Partial<StoredSetupDraft>
    const path = PATHS.has(parsed.path as SetupPath) ? (parsed.path as SetupPath) : "choose"
    const phase = PHASES.has(parsed.phase as SetupPhase) ? (parsed.phase as SetupPhase) : "idle"
    const step = typeof parsed.step === "number" && parsed.step >= 0 ? Math.min(40, Math.floor(parsed.step)) : 0
    return {
      path,
      step,
      answers: answersFrom(parsed.answers),
      plan: typeof parsed.plan === "string" ? parsed.plan.slice(0, 2000) : "",
      planEdited: parsed.planEdited === true,
      phase,
    }
  } catch {
    return EMPTY_SETUP_DRAFT
  }
}

function remember(next: StoredSetupDraft, serialized: string) {
  memory = next
  raw = serialized
  loaded = true
}

export function readSetupDraft(): StoredSetupDraft {
  if (typeof window === "undefined") return EMPTY_SETUP_DRAFT
  let next = ""
  try {
    next = window.localStorage.getItem(SETUP_DRAFT_KEY) || ""
  } catch {
    next = ""
  }
  if (loaded && next === raw) return memory
  const parsed = parseSetupDraft(next)
  remember(parsed, next)
  return memory
}

export function writeSetupDraft(draft: StoredSetupDraft) {
  const next: StoredSetupDraft = {
    path: PATHS.has(draft.path) ? draft.path : "choose",
    step: Number.isFinite(draft.step) ? Math.max(0, Math.min(40, Math.floor(draft.step))) : 0,
    answers: answersFrom(draft.answers),
    plan: draft.plan.slice(0, 2000),
    planEdited: draft.planEdited === true,
    phase: PHASES.has(draft.phase) ? draft.phase : "idle",
  }
  const serialized = JSON.stringify(next)
  remember(next, serialized)
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SETUP_DRAFT_KEY, serialized)
    } catch {
      // Private browsing can block storage. The answers still live for this visit.
    }
  }
  listeners.forEach((listener) => listener())
}

export function patchSetupDraft(patch: Partial<StoredSetupDraft> & { answers?: Record<string, string> }) {
  const current = readSetupDraft()
  writeSetupDraft({
    ...current,
    ...patch,
    answers: patch.answers ? { ...current.answers, ...patch.answers } : current.answers,
  })
}

export function applySetupSnapshot(value: unknown) {
  if (!value || typeof value !== "object") return
  const snapshot = value as { answers?: unknown; phase?: unknown; plan?: unknown }
  const current = readSetupDraft()
  const phase = PHASES.has(snapshot.phase as SetupPhase) ? (snapshot.phase as SetupPhase) : current.phase
  const answers = snapshot.answers && typeof snapshot.answers === "object" ? answersFrom(snapshot.answers) : current.answers
  const plan = typeof snapshot.plan === "string" ? snapshot.plan.slice(0, 2000) : current.plan
  writeSetupDraft({
    ...current,
    answers,
    phase,
    plan: current.planEdited ? current.plan : plan,
  })
}

export function subscribeSetupDraft(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETUP_DRAFT_KEY) listener()
  }
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage)
  }
}
