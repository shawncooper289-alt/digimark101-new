/** Saved when a client has no single thing slowing the business down, or does not know yet. */
export const NO_ROADBLOCK_NOTE = "No main roadblock yet; Ava will help find one"

const UNKNOWN_ROADBLOCK = /^(no|none|nope|nothing|idk|not sure(?: yet)?|i'?m not sure(?: yet)?|im not sure(?: yet)?|i don'?t know(?: yet)?|don'?t know(?: yet)?|do not know(?: yet)?|no idea|i don'?t have one|don'?t have one|do not have one|i don'?t have a main thing|nothing comes to mind|not really|i can'?t think of one|can'?t think of one|no main thing(?: yet)?|no main one(?: yet)?)$/i

const UNKNOWN_PHRASE = /\b(don'?t know|do not know|not sure|no idea|don'?t have one|do not have one|nothing slowing|nothing comes to mind|can'?t think of (?:one|anything)|not holding (?:me|us|the business) back)\b/i

export function isNoRoadblock(text: string | undefined) {
  const value = text?.trim().replace(/[.!]+$/, "") ?? ""
  if (!value) return false
  if (value === NO_ROADBLOCK_NOTE) return true
  return UNKNOWN_ROADBLOCK.test(value) || UNKNOWN_PHRASE.test(value)
}

function clean(value: string | undefined, fallback: string) {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? ""
  if (!trimmed || /^(not answered yet|left blank|skipped)$/i.test(trimmed)) return fallback
  return trimmed.slice(0, 240)
}

export function starterGrowthPlan(input: {
  business?: string
  customer?: string
  sources?: string
  goal?: string
  offer?: string
  website?: string
  roadblock?: string
}) {
  const business = clean(input.business, "your business")
  const goal = clean(input.goal, "get the first customers in the door")
  const customer = clean(input.customer, "the people you want to reach")
  const offer = clean(input.offer, "what you sell")
  const sources = clean(input.sources, "the places customers already find you")
  const unknown = !input.roadblock?.trim() || isNoRoadblock(input.roadblock)
  const opening = unknown
    ? `There isn't one main thing slowing ${business} down yet. This first plan starts from the goal: ${goal}.`
    : `The first thing to work on for ${business} is ${clean(input.roadblock, goal)}. The goal is ${goal}.`
  const website = input.website?.trim() ?? ""
  const page = website && !/don'?t have|do not have|none|not ready|no site/i.test(website)
    ? `Send people to ${website} so they can say yes.`
    : "A simple page can be the place they say yes. Ava can draft one after this setup is saved."
  return [
    opening,
    `Talk to ${customer} about ${offer}.`,
    `Start where customers already come from: ${sources}.`,
    page,
    "Nothing is published, emailed, or paid for until you say yes to that separately.",
  ].join(" ")
}
