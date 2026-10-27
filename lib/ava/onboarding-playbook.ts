import { site } from "@/lib/site"
import { onboardingPatch } from "@/lib/onboarding/fields"

/**
 * Ordered interview Ava uses for a brand-new account.
 * Each question names the client_onboarding columns it fills after the person confirms.
 * Niche picks a branch. Questions whose fields are already stored are skipped.
 * Nothing is written until the person says yes on the confirm step.
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
  { id: "name", ask: "What should I call you?", suggestions: ["just my first name", "I prefer not to say yet"], fields: ["client_name"] },
  { id: "business_name", ask: "What is the business called?", suggestions: ["I don't have a name yet", "my personal brand", "I'll decide later"], fields: ["business_name"] },
  { id: "niche", ask: "What niche or industry are you in?", suggestions: ["home services", "a professional service", "an online store", "coaching", "I don't know yet"], fields: ["niche"] },
  { id: "service_area", ask: "Where are you based, and what area do you serve?", suggestions: ["my local city", "online only", "United States"], fields: ["service_area", "business_address"], when: ["local_service", "professional", "other"] },
  { id: "ship_area", ask: "Where do you ship or sell?", suggestions: ["United States", "online only", "my local city"], fields: ["service_area"], when: ["ecommerce"] },
  { id: "offer", ask: "What is the offer, and what does it cost?", suggestions: ["I don't know the price yet", "a service", "a product", "a course"], fields: ["offer", "pricing"] },
  { id: "buyer", ask: "Who is the target customer? Name a kind of person, not everyone.", suggestions: ["I'm not sure yet", "small business owners", "local homeowners", "online buyers"], fields: ["target_customer"] },
  { id: "goals", ask: "What is the one result this first campaign should get?", suggestions: ["first sale", "more leads", "booked calls", "I don't know yet"], fields: ["goals"] },
  { id: "tools", ask: "What tools do you use today? Name a website, scheduler, CRM, or say none.", suggestions: ["none", "a website", "email", "a calendar"], fields: ["current_tools"] },
  { id: "website", ask: "What is the website or domain? Paste the address, or say none.", suggestions: ["none", "I have one but it's not ready"], fields: ["business_website"] },
  { id: "socials", ask: "Which social pages should I list? Paste links, name them, or say none.", suggestions: ["none", "Instagram", "Facebook", "Google"], fields: ["social_profiles"] },
  { id: "brand", ask: "What are the brand colors, and do you have a logo?", suggestions: ["no logo yet", "black and white", "I'll upload it in Media"], fields: ["brand_colors", "logo_note"] },
  { id: "booking_hours", ask: "What days and hours can people book?", suggestions: ["weekdays 9 to 5", "by appointment", "I don't take bookings"], fields: ["booking_hours"], when: ["local_service", "professional", "creator"] },
  { id: "lead_sources", ask: "Where do leads come from today?", suggestions: ["referrals", "Instagram", "Google", "I don't have any yet"], fields: ["lead_sources"] },
  { id: "compliance", ask: "What consent or compliance rule should I follow?", suggestions: ["email only with consent", "nothing special", "I don't know yet"], fields: ["compliance_notes"] },
  { id: "email", ask: "What email should this DigiMark101 account use?", suggestions: [], fields: ["personal_email"] },
] as const

const LABELS: Record<string, string> = {
  name: "What to call you",
  business_name: "Business",
  niche: "Niche",
  service_area: "Service area",
  ship_area: "Where you sell",
  offer: "Offer and price",
  buyer: "Target customer",
  goals: "Goal",
  tools: "Current tools",
  website: "Website",
  socials: "Socials",
  brand: "Brand colors and logo",
  booking_hours: "Booking hours",
  lead_sources: "Lead sources",
  compliance: "Consent and compliance",
  email: "Account email",
}

export const CONFIRM_MARK = "Say yes to save these on your account."

const EMAIL_IN_TEXT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const SKIP = /^\s*(skip|pass|next|skip (?:it|this|that|this one))\s*[.!]*\s*$/i
const YES = /^\s*(yes|yep|yeah|save|save it|confirm|that(?:'|’)s right|looks good|go ahead)\b/i
const CORRECTION = /^\s*(actually|sorry|oops|wait|correction|i meant|i mean|no[,.!]\s|no\s+(?:it'?s|its|it is)\b|not\s+\w+[,.]?\s+(?:it'?s|its|it is))/i
const CHANGE_REQUEST = /\b(change|reset|update|go back to)\b/i
const QUESTION_START = /^\s*(why|what|what's|whats|how|who|when|where|can you|could you|can i|should i|do i|does|is it|are you|will you|why do)\b/i

const CORRECTION_TARGETS: [RegExp, string][] = [
  [/\b(e-?mail)\b/i, "email"],
  [/\b(website|site|domain|url)\b/i, "website"],
  [/\b(color|logo|brand)\b/i, "brand"],
  [/\b(hour|booking|book)\b/i, "booking_hours"],
  [/\b(niche|industry)\b/i, "niche"],
  [/\b(offer|price|pricing|sell)\b/i, "offer"],
  [/\b(customer|buyer|audience)\b/i, "buyer"],
  [/\b(goal|result)\b/i, "goals"],
  [/\b(tool|crm|scheduler)\b/i, "tools"],
  [/\b(social|instagram|facebook)\b/i, "socials"],
  [/\b(lead source|referral)\b/i, "lead_sources"],
  [/\b(consent|compliance|privacy)\b/i, "compliance"],
  [/\b(city|area|location|ship)\b/i, "service_area"],
  [/\b(call me|my name)\b/i, "name"],
  [/\b(business|company|brand name|shop|store)\b/i, "business_name"],
]

export type OutcomeName = "completed" | "skipped" | "corrected"

export type PlaybookOutcome = {
  questionId: string
  outcome: OutcomeName
  niche: NicheBranch | null
}

export type PlaybookTurn = { role: string; content: string }

export type PlaybookResult = {
  text: string | null
  save: Record<string, string> | null
  outcomes: PlaybookOutcome[]
}

export function nicheBranch(text: string | undefined): NicheBranch | null {
  if (!text) return null
  const q = text.toLowerCase()
  if (/restaurant|salon|plumb|hvac|dentist|clinic|real estate|realtor|local|home service|gym|contractor|landscap|cleaning|roof/.test(q)) return "local_service"
  if (/store|ecommerce|e-commerce|shopify|retail|sku|ship/.test(q)) return "ecommerce"
  if (/coach|course|creator|youtube|influencer|podcast|community/.test(q)) return "creator"
  if (/consult|agency|lawyer|account|professional|saas|software|b2b|freelance/.test(q)) return "professional"
  if (/\b(i don't know|idk|not sure|other)\b/.test(q)) return "other"
  return "other"
}

export function isExplicitTask(text: string) {
  return /\b(draft|create|start|add|write|build|make)\s+(?:a|an|the|my)?\s*(campaign|automation|contact|deal|task|funnel|site|email list|post|appointment|meeting)\b/i.test(text)
    || /\b(schedule|book)\s+(?:a|an|the|my)?\s*(appointment|meeting|call)\b/i.test(text)
    || /\b(open|go to|take me to|show me)\s+(?:the\s+|my\s+)?(studio|contacts|pipeline|calendar|inbox|campaigns|automations|reports|media|business setup)\b/i.test(text)
}

export function isSetupStart(text: string) {
  return /\b(set up my account|setup my account|new account|i'?m new|im new|newbie|newby|beta tester|help me start|start my account|set up my free account)\b/i.test(text)
}

export function signupUrl(email?: string) {
  const address = email?.match(EMAIL_IN_TEXT)?.[0]
  const base = `${site.url}/signup`
  return address ? `${base}?email=${encodeURIComponent(address)}` : base
}

function visibleQuestions(branch: NicheBranch | null) {
  return ONBOARDING_PLAYBOOK.filter((item) => !item.when || (branch !== null && item.when.includes(branch)))
}

function questionByAsk(content: string) {
  return ONBOARDING_PLAYBOOK.find((item) => content.includes(item.ask))
}

function isQuestionText(text: string) {
  const trimmed = text.trim()
  if (EMAIL_IN_TEXT.test(trimmed)) return false
  if (trimmed.length > 300) return false
  return /\?\s*$/.test(trimmed) || QUESTION_START.test(trimmed)
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

export function fieldsFromAnswers(answers: Parsed) {
  const raw: Record<string, string> = {}
  for (const question of ONBOARDING_PLAYBOOK) {
    const row = answers.get(question.id)
    if (!row || row.outcome === "skipped" || !row.value) continue
    if (question.id === "socials") Object.assign(raw, socialFields(row.value))
    else if (question.id === "offer") {
      raw.offer = row.value
      raw.pricing = priceSnippet(row.value)
    } else if (question.id === "brand") {
      raw.brand_colors = row.value
      raw.logo_note = row.value
    } else if (question.id === "service_area" || question.id === "ship_area") {
      raw.service_area = row.value
      if (question.id === "service_area") raw.business_address = row.value
    } else if (question.id === "website") {
      raw.business_website = row.value
    } else {
      for (const field of question.fields) raw[field] = row.value
    }
  }
  return onboardingPatch(raw)
}

function recap(answers: Parsed, questions: PlaybookQuestion[]) {
  return questions.map((item, index) => {
    const row = answers.get(item.id)
    const value = !row || row.outcome === "skipped" || !row.value ? "not answered" : row.value
    return `${index + 1}. ${LABELS[item.id] ?? item.id}: ${value}`
  }).join("\n")
}

function confirmText(answers: Parsed, questions: PlaybookQuestion[]) {
  const email = answers.get("email")?.value
  return `Here is what I will save. Nothing is written until you say yes.\n\n${recap(answers, questions)}\n\n${CONFIRM_MARK} Say change the business name to … if something is wrong.\n\n${signupDirections(email)}`
}

function savedText(answers: Parsed) {
  const email = answers.get("email")?.value
  return `Saved. Those details are on your account. You can change any of them later in Business setup.\n\n${signupDirections(email)}\n\nI still will not publish, spend, or send until you say yes to that separately.`
}

function helpFor(question: PlaybookQuestion) {
  const suggestions = question.suggestions.length ? ` Some options: ${question.suggestions.join(", ")}.` : ""
  return `Good question. I ask this so the account matches the business. You can answer in a sentence, or say skip.${suggestions}\n\n${question.ask}`
}

function firstOpen(questions: PlaybookQuestion[], answers: Parsed, known: Record<string, string>) {
  return questions.find((item) => !answers.has(item.id) && !knownHit(item, known))
}

function skippedKnown(questions: PlaybookQuestion[], answers: Parsed, known: Record<string, string>, niche: NicheBranch | null, log: boolean) {
  if (!log) return [] as PlaybookOutcome[]
  return questions
    .filter((item) => !answers.has(item.id) && knownHit(item, known))
    .map((item) => ({ questionId: item.id, outcome: "skipped" as const, niche }))
}

export function accountSetupBrief() {
  const lines = ONBOARDING_PLAYBOOK.map((item, index) => `${index + 1}. ${item.ask} Fills ${item.fields.join(", ")}.`).join(" ")
  return `New account interview, one question at a time, from the onboarding playbook: ${lines}

Branch on the niche answer. Local services, professional firms, and other businesses get a service area. An online store gets where they ship. Booking hours are for local services, professional firms, and coaches. Skip a question when that field is already stored, or when the person says skip.

Do not write the answers until they confirm. Recap the mapped fields, then wait for yes. If they correct an earlier answer, confirm the new value and ask again before saving.

When they need an account, send ${site.url}/signup and ${site.url}/login. Beginners may say they do not know yet. Offer the suggestions on the question. Do not publish, spend, or send until they say yes to that action. A studio task leaves the interview.`
}

export function playbookGuide() {
  return ONBOARDING_PLAYBOOK.map((item) => {
    const branch = item.when ? ` Asked when the niche is ${item.when.join(", ")}.` : ""
    return `${LABELS[item.id] ?? item.id}: ${item.ask} Writes ${item.fields.join(", ")} after confirm.${branch}`
  }).join(" ")
}

export function setupResult(turns: PlaybookTurn[], known: Record<string, string> = {}): PlaybookResult {
  const latest = turns[turns.length - 1]?.content ?? ""
  const prior = [...turns].reverse().find((turn) => turn.role === "assistant")?.content ?? ""
  const priorQuestion = questionByAsk(prior)
  const inFlow = prior.includes(CONFIRM_MARK) || Boolean(priorQuestion) || isSetupStart(latest)
  if (!inFlow) return { text: null, save: null, outcomes: [] }
  if ((priorQuestion || prior.includes(CONFIRM_MARK)) && /\b(stop|cancel|never mind|nevermind)\b/i.test(latest)) {
    return { text: "Setup is paused. Say set up my account when you want the next question. You can also change an earlier answer.", save: null, outcomes: [] }
  }
  if ((priorQuestion || prior.includes(CONFIRM_MARK)) && !isSetupStart(latest) && isExplicitTask(latest)) {
    return { text: null, save: null, outcomes: [] }
  }

  const answers = answersSoFar(turns)
  const niche = branchFrom(answers)
  const questions = visibleQuestions(niche)
  const opening = isSetupStart(latest) && !priorQuestion && !prior.includes(CONFIRM_MARK)

  if (/\b(where|how|link|url|page)\b/i.test(latest) && /\b(sign\s*up|signup|create (?:my |an )?account|register|log\s*in|login)\b/i.test(latest)) {
    const current = priorQuestion ?? firstOpen(questions, answers, known)
    const again = current ? `\n\n${current.ask}` : ""
    return { text: `${signupDirections(answers.get("email")?.value)}${again}`, save: null, outcomes: [] }
  }

  if (opening) {
    const next = firstOpen(questions, answers, known)
    const intro = "I will set the account up one question at a time. Answer in a sentence, or say skip. I will not save anything until you confirm, and I will not publish anything."
    return {
      text: next ? `${intro}\n\n${next.ask}` : confirmText(answers, questions),
      save: null,
      outcomes: skippedKnown(questions, answers, known, niche, true),
    }
  }

  if (prior.includes(CONFIRM_MARK) && YES.test(latest)) {
    return {
      text: savedText(answers),
      save: fieldsFromAnswers(answers),
      outcomes: [{ questionId: "confirm", outcome: "completed", niche }],
    }
  }

  if (CORRECTION.test(latest) || CHANGE_REQUEST.test(latest)) {
    const target = correctionTarget(latest, [...answers.keys()])
    const value = correctionValue(latest)
    const current = priorQuestion ?? firstOpen(questions, answers, known)
    if (target && hasValue(value)) {
      const follow = prior.includes(CONFIRM_MARK) ? confirmText(answers, questions) : current?.ask ?? confirmText(answers, questions)
      return {
        text: `Updated ${LABELS[target]?.toLowerCase() ?? target} to: ${value}\n\n${follow}`,
        save: null,
        outcomes: [{ questionId: target, outcome: "corrected", niche }],
      }
    }
    return {
      text: `Got it. Tell me the new value, like "change the business name to Flow Haus".\n\n${current?.ask ?? CONFIRM_MARK}`,
      save: null,
      outcomes: [],
    }
  }

  if (priorQuestion && isQuestionText(latest)) {
    return { text: helpFor(priorQuestion), save: null, outcomes: [] }
  }

  if (priorQuestion?.id === "email" && !EMAIL_IN_TEXT.test(latest) && !SKIP.test(latest)) {
    return { text: `That does not look like an email address. Type it like name@example.com, or say skip.\n\n${priorQuestion.ask}`, save: null, outcomes: [] }
  }

  if (prior.includes(CONFIRM_MARK)) {
    return { text: confirmText(answers, questions), save: null, outcomes: [] }
  }

  const justAnswered = priorQuestion ? answers.get(priorQuestion.id) : undefined
  const outcomes: PlaybookOutcome[] = []
  if (priorQuestion && justAnswered && (justAnswered.outcome === "completed" || justAnswered.outcome === "skipped")) {
    outcomes.push({ questionId: priorQuestion.id, outcome: justAnswered.outcome, niche })
  }
  const next = firstOpen(questions, answers, known)
  if (!next) {
    return { text: confirmText(answers, questions), save: null, outcomes }
  }
  return { text: next.ask, save: null, outcomes }
}

export function setupReply(turns: PlaybookTurn[], known?: Record<string, string>) {
  return setupResult(turns, known).text
}
