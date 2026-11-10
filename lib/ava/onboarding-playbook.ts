import { isNoRoadblock, NO_ROADBLOCK_NOTE, starterGrowthPlan } from "@/lib/onboarding/growth-plan"
import { onboardingPatch } from "@/lib/onboarding/fields"
import { site } from "@/lib/site"

/**
 * Ordered interview Ava uses for a brand-new account.
 * One friendly question at a time. The same answers fill the manual form.
 * Nothing is written until the person confirms.
 * Pronunciation stays in lib/ava/identity.ts. This file does not change her voice.
 */
export type NicheBranch = "local_service" | "professional" | "ecommerce" | "creator" | "other"

export type PlaybookQuestion = {
  id: string
  ask: string
  suggestions: readonly string[]
  fields: readonly string[]
  when?: readonly NicheBranch[]
}

export const ONBOARDING_PLAYBOOK: readonly PlaybookQuestion[] = [
  { id: "name", ask: "What should I call you?", suggestions: ["just my first name", "I'd rather not say yet"], fields: ["client_name"] },
  { id: "business_name", ask: "What's the business called?", suggestions: ["I don't have a name yet", "it's just me for now"], fields: ["business_name"] },
  { id: "niche", ask: "What do you do? For example, a bakery, a roofer, or a coaching business.", suggestions: ["a bakery", "a roofer", "a coaching business", "I'm not sure yet"], fields: ["niche"] },
  { id: "service_area", ask: "Where are you, and where are your customers? A city is plenty.", suggestions: ["my city", "online only", "the United States"], fields: ["service_area", "business_address"], when: ["local_service", "professional", "other"] },
  { id: "ship_area", ask: "Where do you sell or ship?", suggestions: ["the United States", "online only", "my city"], fields: ["service_area"], when: ["ecommerce"] },
  { id: "offer", ask: "What do you sell, and what does it cost? A rough price is fine.", suggestions: ["I don't know the price yet", "a service", "a product", "a class or a course"], fields: ["offer", "pricing"] },
  { id: "buyer", ask: "Who are your customers? A kind of person is perfect, not everyone.", suggestions: ["I'm not sure yet", "local homeowners", "small business owners", "people shopping online"], fields: ["target_customer"] },
  { id: "goals", ask: "What would you love to see happen first? If you have a time in mind, add it, like this month or this spring.", suggestions: ["more people calling", "a few sales", "a fuller calendar", "I'm not sure yet"], fields: ["goals"] },
  { id: "roadblock", ask: "What's the biggest thing slowing your business down or holding back growth right now? For example, not enough people hearing about you, or a website that doesn't say what you do. If you don't have one, just say so.", suggestions: ["not enough people know about us", "the website doesn't explain what we do", "I don't have one"], fields: ["main_roadblock"] },
  { id: "tools", ask: "What do you use to run things today? A website, email, a calendar, a spreadsheet of customer names, or nothing yet.", suggestions: ["nothing yet", "a website", "email", "a calendar"], fields: ["current_tools"] },
  { id: "website", ask: "Do you have a website? Paste the address, or say you don't have one.", suggestions: ["I don't have one", "I have one, but it's not ready"], fields: ["business_website"] },
  { id: "socials", ask: "Which social pages should I know about? Instagram, Facebook, Google, or others. Paste a link, name them, or say none.", suggestions: ["none", "Instagram", "Facebook", "Google"], fields: ["social_profiles"] },
  { id: "brand", ask: "How should the brand feel? Colors, a logo, or words like warm, simple, or bold.", suggestions: ["no logo yet", "simple and warm", "I'll add a logo later"], fields: ["brand_colors", "logo_note"] },
  { id: "booking_hours", ask: "When can people book time with you?", suggestions: ["weekdays 9 to 5", "by appointment", "I don't take bookings"], fields: ["booking_hours"], when: ["local_service", "professional", "creator"] },
  { id: "lead_sources", ask: "Where do customers come from today? For example, friends telling friends, Google, Instagram, or nowhere yet.", suggestions: ["friends and referrals", "Instagram", "Google", "nowhere yet"], fields: ["lead_sources"] },
  { id: "compliance", ask: "I only email people who have agreed to hear from you. Anything else I should be careful about?", suggestions: ["email only when they agree", "nothing else", "I'm not sure yet"], fields: ["compliance_notes"] },
  { id: "email", ask: "What email should this DigiMark101 account use?", suggestions: [], fields: ["personal_email"] },
] as const

const LABELS: Record<string, string> = {
  name: "What I'll call you",
  business_name: "Business name",
  niche: "What you do",
  service_area: "Where you are",
  ship_area: "Where you sell",
  offer: "What you sell and the price",
  buyer: "Who your customers are",
  goals: "Goal",
  roadblock: "What's slowing things down",
  tools: "Tools you use",
  website: "Website",
  socials: "Social pages",
  brand: "Brand style",
  booking_hours: "When people can book",
  lead_sources: "Where customers come from",
  compliance: "Email consent",
  email: "Account email",
}

export const CONFIRM_MARK = "Say yes to save these on your account."

const QUESTION_IDS = new Set(ONBOARDING_PLAYBOOK.map((item) => item.id))
const EMAIL_IN_TEXT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const SKIP = /^\s*(skip|pass|next|skip (?:it|this|that|this one))\s*[.!]*\s*$/i
const YES = /^\s*(yes|yep|yeah|save|save it|confirm|that(?:'|’)s right|looks good|go ahead)\b/i
const CORRECTION = /^\s*(actually|sorry|oops|wait|correction|i meant|i mean|no[,.!]\s|no\s+(?:it'?s|its|it is)\b|not\s+\w+[,.]?\s+(?:it'?s|its|it is))/i
const CHANGE_REQUEST = /\b(change|reset|update|go back to)\b/i
const QUESTION_START = /^\s*(why|what|what's|whats|how|who|when|where|can you|could you|can i|should i|do i|does|is it|are you|will you|why do)\b/i
const NOT_A_PLACE = /^(a|an|the|my|our|your|this|that|order|mind|general|person|people|business|online|town|city|it|which|what|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|autumn|winter|time|month|week|year|today|tomorrow)$/i

const CORRECTION_TARGETS: [RegExp, string][] = [
  [/\b(e-?mail)\b/i, "email"],
  [/\b(website|site|domain|url)\b/i, "website"],
  [/\b(color|logo|brand)\b/i, "brand"],
  [/\b(hour|booking|book)\b/i, "booking_hours"],
  [/\b(niche|industry|bakery|roofer|coach)\b/i, "niche"],
  [/\b(offer|price|pricing|sell)\b/i, "offer"],
  [/\b(customer|buyer|audience)\b/i, "buyer"],
  [/\b(goal|result)\b/i, "goals"],
  [/\b(slow|slowing|holding|stuck)\b/i, "roadblock"],
  [/\b(tool|calendar|spreadsheet)\b/i, "tools"],
  [/\b(social|instagram|facebook)\b/i, "socials"],
  [/\b(come from|referral|google)\b/i, "lead_sources"],
  [/\b(consent|careful|privacy)\b/i, "compliance"],
  [/\b(city|area|location|ship)\b/i, "service_area"],
  [/\b(call me|my name)\b/i, "name"],
  [/\b(business|company|brand name|shop|store)\b/i, "business_name"],
]

export type OutcomeName = "completed" | "skipped" | "corrected"
export type SetupPhase = "idle" | "asking" | "confirm" | "saved" | "paused"

export type PlaybookOutcome = {
  questionId: string
  outcome: OutcomeName
  niche: NicheBranch | null
}

export type PlaybookTurn = { role: string; content: string }

export type SetupDraftInput = {
  answers?: Record<string, string>
  plan?: string
  planEdited?: boolean
}

export type SetupSnapshot = {
  phase: SetupPhase
  answers: Record<string, string>
  fields: Record<string, string>
  plan: string
}

export type PlaybookResult = {
  text: string | null
  save: Record<string, string> | null
  outcomes: PlaybookOutcome[]
  setup: SetupSnapshot | null
}

const EMPTY_RESULT: PlaybookResult = { text: null, save: null, outcomes: [], setup: null }

export function nicheBranch(text: string | undefined): NicheBranch | null {
  if (!text) return null
  const q = text.toLowerCase()
  if (/bakery|baker|cafe|coffee|restaurant|salon|plumb|hvac|dentist|clinic|real estate|realtor|local|home service|gym|contractor|landscap|cleaning|roof/.test(q)) return "local_service"
  if (/store|ecommerce|e-commerce|shopify|retail|sku|ship/.test(q)) return "ecommerce"
  if (/coach|course|creator|youtube|influencer|podcast|community/.test(q)) return "creator"
  if (/consult|agency|lawyer|account|professional|saas|software|b2b|freelance/.test(q)) return "professional"
  return "other"
}

export function isExplicitTask(text: string) {
  return /\b(draft|create|start|add|write|build|make)\s+(?:a|an|the|my)?\s*(campaign|automation|contact|deal|task|funnel|site|email list|post|appointment|meeting)\b/i.test(text)
    || /\b(schedule|book)\s+(?:a|an|the|my)?\s*(appointment|meeting|call)\b/i.test(text)
    || /\b(open|go to|take me to|show me)\s+(?:the\s+|my\s+)?(studio|contacts|pipeline|calendar|inbox|campaigns|automations|reports|media|business setup|account setup)\b/i.test(text)
}

export function isSetupStart(text: string) {
  return /\b(set up my account|setup my account|new account|i'?m new|im new|newbie|newby|beta tester|help me start|start my account|set up my free account|just talk with ava)\b/i.test(text)
}

export function signupUrl(email?: string) {
  const address = email?.match(EMAIL_IN_TEXT)?.[0]
  const base = `${site.url}/signup`
  return address ? `${base}?email=${encodeURIComponent(address)}` : base
}

export function visiblePlaybook(branch: NicheBranch | null) {
  return ONBOARDING_PLAYBOOK.filter((item) => !item.when || (branch !== null && item.when.includes(branch)))
}

export function sanitizeSetupDraft(value: unknown): SetupDraftInput {
  if (!value || typeof value !== "object") return {}
  const record = value as Record<string, unknown>
  const source = record.answers && typeof record.answers === "object" ? record.answers as Record<string, unknown> : {}
  const answers: Record<string, string> = {}
  for (const [key, item] of Object.entries(source)) {
    if (!QUESTION_IDS.has(key) || typeof item !== "string") continue
    const trimmed = item.trim().slice(0, 300)
    if (trimmed) answers[key] = trimmed
  }
  const planEdited = record.planEdited === true
  const plan = planEdited && typeof record.plan === "string" ? record.plan.trim().slice(0, 2000) : undefined
  return { answers, plan, planEdited }
}

export function questionLabel(id: string) {
  return LABELS[id] ?? id
}

function questionByAsk(content: string) {
  return ONBOARDING_PLAYBOOK.find((item) => content.includes(item.ask))
}

function isQuestionText(text: string) {
  const trimmed = text.trim()
  if (EMAIL_IN_TEXT.test(trimmed)) return false
  if (trimmed.length > 180) return false
  if (/\?\s*$/.test(trimmed) && trimmed.length < 160) return true
  if (!QUESTION_START.test(trimmed) || trimmed.length > 80) return false
  return !/\b(is|are|was|were|sell|have|has|want|need|called)\b/i.test(trimmed.slice(8))
}

function correctionValue(text: string) {
  const named = text.match(/\b(?:called|named)\s+(.+)$/i) ?? text.match(/\b(?:it'?s|its|is|to|as|be)\s+(.+)$/i)
  const raw = named ? named[1] : text.replace(CORRECTION, "").replace(/^[\s,.:;-]+/, "")
  return raw.replace(/[.!\s]+$/, "").trim().slice(0, 300)
}

function correctionTarget(text: string, answered: string[]) {
  for (const [pattern, id] of CORRECTION_TARGETS) {
    if (pattern.test(text)) {
      if (id === "service_area" && !answered.includes("service_area") && answered.includes("ship_area")) return "ship_area"
      return id
    }
  }
  return answered[answered.length - 1] ?? null
}

function hasValue(value: string) {
  return value.length > 0 && !/^(my\s+)?(business|name|product|buyer|channels?|email|website|site)(\s+name)?$/i.test(value)
}

type Parsed = Map<string, { value: string; outcome: OutcomeName }>

function answersSoFar(turns: PlaybookTurn[]) {
  const answers: Parsed = new Map()
  const order: string[] = []
  for (let index = 0; index < turns.length; index += 1) {
    const turn = turns[index]
    if (turn?.role !== "assistant") continue
    const onConfirm = turn.content.includes(CONFIRM_MARK)
    const question = questionByAsk(turn.content)
    if (!question && !onConfirm) continue
    const reply = turns.slice(index + 1).find((item) => item.role === "user")
    if (!reply || isExplicitTask(reply.content)) continue
    const text = reply.content.trim()
    if (/\b(stop|cancel|never mind|nevermind)\b/i.test(text)) continue
    if (CORRECTION.test(text) || CHANGE_REQUEST.test(text)) {
      const target = correctionTarget(text, order.length ? order : [...answers.keys()])
      const value = correctionValue(text)
      if (target && hasValue(value)) {
        answers.set(target, { value, outcome: "corrected" })
        if (!order.includes(target)) order.push(target)
      }
      continue
    }
    if (!question || onConfirm || isQuestionText(text)) continue
    if (question.id === "email" && !EMAIL_IN_TEXT.test(text) && !SKIP.test(text)) continue
    const outcome: OutcomeName = SKIP.test(text) ? "skipped" : "completed"
    answers.set(question.id, { value: outcome === "skipped" ? "" : text.slice(0, 300), outcome })
    if (!order.includes(question.id)) order.push(question.id)
  }
  return answers
}

function branchFrom(answers: Parsed) {
  return nicheBranch(answers.get("niche")?.value)
}

function knownHit(question: PlaybookQuestion, known: Record<string, string>) {
  return question.fields.some((field) => Boolean(known[field]?.trim()))
}

function signupDirections(email: string | undefined) {
  const address = email?.match(EMAIL_IN_TEXT)?.[0]
  const url = signupUrl(address || email)
  if (address) {
    return `Create your account with ${address} here: ${url}\n\nSign up with ${address}, then check that inbox for the confirmation email, including spam.`
  }
  return `Create your account here: ${url}\n\nSign in later at ${site.url}/login. After you sign up, check your inbox for the confirmation email, including spam.`
}

function socialFields(answer: string) {
  const fields: Record<string, string> = { social_profiles: answer }
  const links = answer.match(/https?:\/\/\S+/gi) ?? []
  for (const link of links) {
    const clean = link.replace(/[),.;]+$/, "")
    if (/instagram\.com/i.test(clean)) fields.instagram_url = clean
    else if (/facebook\.com/i.test(clean)) fields.facebook_url = clean
    else if (/google\./i.test(clean)) fields.google_business_url = clean
    else if (/linkedin\.com/i.test(clean)) fields.linkedin_url = clean
    else if (/tiktok\.com/i.test(clean)) fields.tiktok_url = clean
    else if (/youtube\.com|youtu\.be/i.test(clean)) fields.youtube_url = clean
    else if (/x\.com|twitter\.com/i.test(clean)) fields.x_url = clean
    else if (!fields.business_website) fields.business_website = clean
  }
  return fields
}

function priceSnippet(answer: string) {
  const found = answer.match(/\$\s?\d[\d,]*(?:\.\d{2})?|\b\d[\d,]*(?:\.\d{2})?\s?(?:dollars|usd|a month|\/mo)\b/i)
  return found?.[0]?.trim() || answer
}

function inferPlace(text: string) {
  const match = text.match(/\b(?:based in|near|around|in)\s+([a-zA-Z][a-zA-Z.'-]*(?:\s+[a-zA-Z][a-zA-Z.'-]*){0,2})/)
  if (!match?.[1]) return ""
  const place = match[1].replace(/[.,!?]+$/, "").trim()
  const first = place.split(/\s+/)[0] ?? ""
  if (NOT_A_PLACE.test(first) || place.length < 3 || place.length > 48) return ""
  return place
}

function inferWebsite(text: string) {
  const link = text.match(/https?:\/\/[^\s)]+/i)
  if (link) return link[0].replace(/[),.;]+$/, "")
  if (/\b(no website|don'?t have (?:a )?(?:website|site)|do not have (?:a )?(?:website|site)|no site yet|without a website)\b/i.test(text)) {
    return "I don't have one yet"
  }
  return ""
}

function applyInferences(answers: Parsed) {
  const branch = branchFrom(answers)
  for (const row of [...answers.values()]) {
    if (!row.value || row.outcome === "skipped") continue
    const website = inferWebsite(row.value)
    if (website && !answers.has("website")) answers.set("website", { value: website, outcome: "completed" })
    const place = inferPlace(row.value)
    if (!place || answers.has("service_area") || answers.has("ship_area")) continue
    answers.set(branch === "ecommerce" ? "ship_area" : "service_area", { value: place, outcome: "completed" })
  }
}

function mergeDraft(fromChat: Parsed, draft: SetupDraftInput, freshId: string | null) {
  const answers: Parsed = new Map(fromChat)
  for (const [id, value] of Object.entries(draft.answers ?? {})) {
    if (id === freshId || !QUESTION_IDS.has(id)) continue
    const trimmed = value.trim().slice(0, 300)
    if (!trimmed) continue
    answers.set(id, { value: trimmed, outcome: "completed" })
  }
  applyInferences(answers)
  return answers
}

function freshAnswerId(turns: PlaybookTurn[], prior: string, priorQuestion: PlaybookQuestion | undefined, fromChat: Parsed) {
  const latest = turns[turns.length - 1]
  if (!latest || latest.role !== "user" || isSetupStart(latest.content)) return null
  if (prior.includes(CONFIRM_MARK)) return null
  if (CORRECTION.test(latest.content) || CHANGE_REQUEST.test(latest.content)) {
    return correctionTarget(latest.content, [...fromChat.keys()])
  }
  if (priorQuestion && fromChat.has(priorQuestion.id)) return priorQuestion.id
  return null
}

function collectedFields(answers: Parsed) {
  const raw: Record<string, string> = {}
  const visible = new Set(visiblePlaybook(branchFrom(answers)).map((item) => item.id))
  for (const question of ONBOARDING_PLAYBOOK) {
    if (!visible.has(question.id)) continue
    const row = answers.get(question.id)
    if (!row || row.outcome === "skipped" || !row.value) continue
    if (question.id === "socials") Object.assign(raw, socialFields(row.value))
    else if (question.id === "offer") {
      raw.offer = row.value
      raw.pricing = priceSnippet(row.value)
    } else if (question.id === "brand") {
      raw.brand_colors = row.value
      raw.logo_note = row.value
    } else if (question.id === "roadblock") {
      raw.main_roadblock = isNoRoadblock(row.value) ? NO_ROADBLOCK_NOTE : row.value
    } else if (question.id === "service_area" || question.id === "ship_area") {
      raw.service_area = row.value
      if (question.id === "service_area") raw.business_address = row.value
    } else if (question.id === "website") {
      raw.business_website = row.value
    } else {
      for (const field of question.fields) raw[field] = row.value
    }
  }
  return raw
}

function finalizeFields(answers: Parsed, planOverride?: string) {
  const raw = collectedFields(answers)
  const generated = starterGrowthPlan({
    business: raw.business_name,
    customer: raw.target_customer,
    sources: raw.lead_sources,
    goal: raw.goals,
    offer: raw.offer,
    website: raw.business_website,
    roadblock: raw.main_roadblock,
  })
  raw.growth_plan = planOverride?.trim() ? planOverride.trim().slice(0, 2000) : generated
  return onboardingPatch(raw)
}

export function fieldsFromDraft(draftAnswers: Record<string, string>, planOverride?: string) {
  const answers: Parsed = new Map()
  for (const [id, value] of Object.entries(draftAnswers)) {
    if (!QUESTION_IDS.has(id) || !value.trim()) continue
    answers.set(id, { value: value.trim().slice(0, 300), outcome: "completed" })
  }
  applyInferences(answers)
  return finalizeFields(answers, planOverride)
}

export function answersFromFields(fields: Record<string, string | null | undefined>) {
  const answers: Record<string, string> = {}
  for (const question of ONBOARDING_PLAYBOOK) {
    if (question.id === "offer") {
      const offer = fields.offer?.trim() ?? ""
      const pricing = fields.pricing?.trim() ?? ""
      if (offer && pricing && !offer.includes(pricing)) answers.offer = `${offer} (${pricing})`
      else if (offer || pricing) answers.offer = offer || pricing
      continue
    }
    if (question.id === "socials") {
      const social = fields.social_profiles?.trim()
      if (social) answers.socials = social
      continue
    }
    const value = question.fields.map((field) => fields[field]?.trim()).find(Boolean)
    if (value) answers[question.id] = value
  }
  return answers
}

function shownValue(item: PlaybookQuestion, answers: Parsed, known: Record<string, string>) {
  const row = answers.get(item.id)
  if (row?.value && row.outcome !== "skipped") {
    return item.id === "roadblock" && isNoRoadblock(row.value) ? NO_ROADBLOCK_NOTE : row.value
  }
  const stored = item.fields.map((field) => known[field]?.trim()).find(Boolean)
  if (stored) return stored
  if (row?.outcome === "skipped") return "left blank"
  return "not answered yet"
}

function recap(answers: Parsed, questions: PlaybookQuestion[], known: Record<string, string>) {
  return questions.map((item, index) => `${index + 1}. ${LABELS[item.id] ?? item.id}: ${shownValue(item, answers, known)}`).join("\n")
}

function confirmText(answers: Parsed, questions: PlaybookQuestion[], known: Record<string, string>, plan: string) {
  const email = answers.get("email")?.value || known.personal_email
  return `Here's what I'll save. You can change anything before it is written.\n\n${recap(answers, questions, known)}\n\nFirst growth plan:\n${plan}\n\n${CONFIRM_MARK} Say change the business name to … if something is wrong.\n\n${signupDirections(email)}`
}

function savedText(answers: Parsed, known: Record<string, string>) {
  const email = answers.get("email")?.value || known.personal_email
  return `Saved. Your setup and the first growth plan are on your account. You can change them anytime in Account setup.\n\n${signupDirections(email)}\n\nI still will not publish, spend, or send until you say yes to that separately.`
}

function followUp(question: PlaybookQuestion, value: string, outcome: OutcomeName) {
  if (outcome === "skipped" || !value.trim()) return "No problem. We can leave that for later."
  if (question.id === "roadblock" && isNoRoadblock(value)) {
    return "That's completely fine. Plenty of people are still figuring that out. I'll note that there isn't one main thing in the way yet, and I'll start a first growth plan from the goal you named."
  }
  const bit = value.replace(/\s+/g, " ").trim().slice(0, 90)
  if (question.id === "name") return `Nice to meet you, ${bit.replace(/\.$/, "")}.`
  if (question.id === "business_name") return `${bit}. I'll use that name.`
  if (question.id === "niche") {
    const kind = bit.replace(/^(?:i am|i'm|im|we are|we're|it's|its)\s+/i, "")
    return `${kind.charAt(0).toUpperCase()}${kind.slice(1)} — thanks, that helps.`
  }
  if (question.id === "goals") return `So the first thing you want is ${bit}.`
  if (question.id === "buyer") return `I'll keep ${bit} in mind.`
  return `Got it — ${bit}.`
}

function helpFor(question: PlaybookQuestion) {
  const suggestions = question.suggestions.length ? ` A few examples: ${question.suggestions.join(", ")}.` : ""
  return `Good question. I ask so the account matches the business. Answer in your own words, or say skip.${suggestions}\n\n${question.ask}`
}

function firstOpen(questions: PlaybookQuestion[], answers: Parsed, known: Record<string, string>) {
  return questions.find((item) => !answers.has(item.id) && !knownHit(item, known))
}

function skippedKnown(questions: PlaybookQuestion[], answers: Parsed, known: Record<string, string>, niche: NicheBranch | null) {
  return questions
    .filter((item) => !answers.has(item.id) && knownHit(item, known))
    .map((item) => ({ questionId: item.id, outcome: "skipped" as const, niche }))
}

function publicAnswers(answers: Parsed) {
  const values: Record<string, string> = {}
  for (const [id, row] of answers) {
    if (!row.value || row.outcome === "skipped") continue
    values[id] = row.value
  }
  return values
}

function pack(
  text: string | null,
  save: Record<string, string> | null,
  outcomes: PlaybookOutcome[],
  answers: Parsed,
  phase: SetupPhase,
  planOverride?: string,
): PlaybookResult {
  const fields = finalizeFields(answers, planOverride)
  return {
    text,
    save,
    outcomes,
    setup: {
      phase,
      answers: publicAnswers(answers),
      fields,
      plan: fields.growth_plan || "",
    },
  }
}

export function accountSetupBrief() {
  const lines = ONBOARDING_PLAYBOOK.map((item, index) => `${index + 1}. ${item.ask} Fills ${item.fields.join(", ")}.`).join(" ")
  return `New account interview, one friendly question at a time: ${lines}

Use everyday words. Follow what the person just said, and skip a question when the answer is already known or they already said it. A bakery, a roofer, or a coaching business are fair examples when they are stuck.

If they have nothing slowing the business down, or they don't know, say so warmly and save "${NO_ROADBLOCK_NOTE}". Still write a first growth plan from their goal. Do not leave that plan blank. Do not invent numbers or testimonials.

The same answers fill the form on ${site.url}/studio/setup. They can switch between the form and this conversation without losing answers. Do not write anything until they confirm. Recap the answers and the growth plan, then wait for yes.

When they need an account, send ${site.url}/signup and ${site.url}/login. Do not publish, spend, or send until they say yes to that action. A studio task leaves the interview.`
}

export function playbookGuide() {
  return ONBOARDING_PLAYBOOK.map((item) => {
    const branch = item.when ? ` Only when the business sounds like ${item.when.join(" or ")}.` : ""
    return `${LABELS[item.id] ?? item.id}: ${item.ask}${branch}`
  }).join(" ")
}

export function setupResult(turns: PlaybookTurn[], known: Record<string, string> = {}, draft: SetupDraftInput = {}): PlaybookResult {
  const latest = turns[turns.length - 1]?.content ?? ""
  const prior = [...turns].reverse().find((turn) => turn.role === "assistant")?.content ?? ""
  const priorQuestion = questionByAsk(prior)
  const inFlow = prior.includes(CONFIRM_MARK) || Boolean(priorQuestion) || isSetupStart(latest)
  if (!inFlow) return EMPTY_RESULT
  const fromChat = answersSoFar(turns)
  const answers = mergeDraft(fromChat, draft, freshAnswerId(turns, prior, priorQuestion, fromChat))
  if ((priorQuestion || prior.includes(CONFIRM_MARK)) && /\b(stop|cancel|never mind|nevermind)\b/i.test(latest)) {
    return pack("Setup is paused. Say set up my account when you want the next question. You can also change an earlier answer, or switch to the form.", null, [], answers, "paused", draft.plan)
  }
  if ((priorQuestion || prior.includes(CONFIRM_MARK)) && !isSetupStart(latest) && isExplicitTask(latest)) return EMPTY_RESULT
  const niche = branchFrom(answers)
  const questions = visiblePlaybook(niche)
  const opening = isSetupStart(latest) && !priorQuestion && !prior.includes(CONFIRM_MARK)
  const planOverride = draft.planEdited ? draft.plan : undefined

  if (/\b(where|how|link|url|page)\b/i.test(latest) && /\b(sign\s*up|signup|create (?:my |an )?account|register|log\s*in|login)\b/i.test(latest)) {
    const current = priorQuestion ?? firstOpen(questions, answers, known)
    const again = current ? `\n\n${current.ask}` : ""
    return pack(`${signupDirections(answers.get("email")?.value || known.personal_email)}${again}`, null, [], answers, current ? "asking" : "confirm", planOverride)
  }

  if (opening) {
    const next = firstOpen(questions, answers, known)
    const intro = "Hey, I'm Ava. I'll ask a few easy questions, one at a time. You can type, or turn on Voice and just talk. If you don't know something, say so. You can switch to the form on Account setup whenever you want. I won't save anything until you look it over and say yes, and I won't publish anything."
    const fields = finalizeFields(answers, planOverride)
    return pack(
      next ? `${intro}\n\n${next.ask}` : confirmText(answers, questions, known, fields.growth_plan || ""),
      null,
      skippedKnown(questions, answers, known, niche),
      answers,
      next ? "asking" : "confirm",
      planOverride,
    )
  }

  if (prior.includes(CONFIRM_MARK) && YES.test(latest)) {
    const fields = finalizeFields(answers, planOverride)
    return pack(savedText(answers, known), fields, [{ questionId: "confirm", outcome: "completed", niche }], answers, "saved", planOverride)
  }

  if (CORRECTION.test(latest) || CHANGE_REQUEST.test(latest)) {
    const target = correctionTarget(latest, [...answers.keys()])
    const value = correctionValue(latest)
    const current = priorQuestion ?? firstOpen(questions, answers, known)
    const fields = finalizeFields(answers, planOverride)
    if (target && hasValue(value)) {
      const follow = prior.includes(CONFIRM_MARK) || !current ? confirmText(answers, questions, known, fields.growth_plan || "") : current.ask
      return pack(
        `Updated ${LABELS[target]?.toLowerCase() ?? target} to: ${value}\n\n${follow}`,
        null,
        [{ questionId: target, outcome: "corrected", niche }],
        answers,
        prior.includes(CONFIRM_MARK) || !current ? "confirm" : "asking",
        planOverride,
      )
    }
    return pack(
      `Got it. Tell me the new value, like "change the business name to Flow Haus".\n\n${current?.ask ?? CONFIRM_MARK}`,
      null,
      [],
      answers,
      current ? "asking" : "confirm",
      planOverride,
    )
  }

  if (priorQuestion && isQuestionText(latest)) {
    return pack(helpFor(priorQuestion), null, [], answers, "asking", planOverride)
  }

  if (priorQuestion?.id === "email" && !EMAIL_IN_TEXT.test(latest) && !SKIP.test(latest)) {
    return pack(`That does not look like an email address. Type it like name@example.com, or say skip.\n\n${priorQuestion.ask}`, null, [], answers, "asking", planOverride)
  }

  if (prior.includes(CONFIRM_MARK)) {
    const fields = finalizeFields(answers, planOverride)
    return pack(confirmText(answers, questions, known, fields.growth_plan || ""), null, [], answers, "confirm", planOverride)
  }

  const justAnswered = priorQuestion ? fromChat.get(priorQuestion.id) : undefined
  const outcomes: PlaybookOutcome[] = []
  if (priorQuestion && justAnswered && (justAnswered.outcome === "completed" || justAnswered.outcome === "skipped")) {
    outcomes.push({ questionId: priorQuestion.id, outcome: justAnswered.outcome, niche })
  }
  const next = firstOpen(questions, answers, known)
  const note = priorQuestion && justAnswered ? followUp(priorQuestion, justAnswered.value, justAnswered.outcome) : ""
  const prefix = note ? `${note}\n\n` : ""
  if (!next) {
    const fields = finalizeFields(answers, planOverride)
    return pack(`${prefix}${confirmText(answers, questions, known, fields.growth_plan || "")}`, null, outcomes, answers, "confirm", planOverride)
  }
  return pack(`${prefix}${next.ask}`, null, outcomes, answers, "asking", planOverride)
}

export function setupReply(turns: PlaybookTurn[], known?: Record<string, string>, draft?: SetupDraftInput) {
  return setupResult(turns, known, draft).text
}
