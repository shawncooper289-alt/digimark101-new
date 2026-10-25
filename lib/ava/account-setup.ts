import { site } from "@/lib/site"

/**
 * The order Ava uses for a new DigiMark101 account.
 * She asks one question, waits, then asks the next. She does not skip ahead.
 * Beginners get suggestions. Any previous answer can be updated later.
 */
export const ACCOUNT_SETUP_QUESTIONS = [
  { id: "name", ask: "What should I call you?", suggestions: ["Shawn", "just my first name", "I prefer not to say yet"] },
  { id: "business", ask: "What is the business called?", suggestions: ["I don't have a name yet", "DigiMark101", "my personal brand", "I'll decide later"] },
  { id: "sells", ask: "What do you sell, in one sentence?", suggestions: ["I don't know yet", "a service", "a product", "a course", "help me figure it out"] },
  { id: "buyer", ask: "Who buys it? Name a kind of person, not everyone.", suggestions: ["I'm not sure yet", "small business owners", "people like me", "online buyers"] },
  { id: "place", ask: "Where are those buyers? A city, or say online only.", suggestions: ["online only", "United States", "my local city", "I don't know yet"] },
  { id: "site", ask: "Do you have a website? Paste the address, or say none.", suggestions: ["none", "I have one but it's not ready", "I'll build one later"] },
  { id: "channels", ask: "Which do you already use: Google, Facebook, Instagram, an email list, or none?", suggestions: ["none", "Instagram", "email", "Facebook"] },
  { id: "control", ask: "Do you want me to guide every step, or do you want the controls yourself?", suggestions: ["guide me", "I want the controls", "mix of both"] },
  { id: "result", ask: "What is the one result this first campaign should get?", suggestions: ["first sale", "more leads", "I don't know yet", "help me pick"] },
  { id: "email", ask: "What email should this DigiMark101 account use? Sign up with that same email.", suggestions: [] },
  { id: "beta", ask: "You are a beta tester. What was confusing, missing, or broken? One note is enough. If nothing yet, say nothing yet.", suggestions: ["nothing yet", "I need more help with the first steps"] },
] as const

const ANSWER_LABELS: Record<(typeof ACCOUNT_SETUP_QUESTIONS)[number]["id"], string> = {
  name: "What to call you",
  business: "Business",
  sells: "What you sell",
  buyer: "Who buys it",
  place: "Where buyers are",
  site: "Website",
  channels: "Channels",
  control: "How you want help",
  result: "First result",
  email: "Account email",
  beta: "Beta note",
}

const EMAIL_IN_TEXT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const CHANGE_REQUEST = /\b(change|reset|update|go back to)\b.*(name|business|product|sell|buyer|channel|email|website|site)/i

export function signupUrl(email?: string) {
  const address = email?.match(EMAIL_IN_TEXT)?.[0]
  const base = `${site.url}/signup`
  return address ? `${base}?email=${encodeURIComponent(address)}` : base
}

export function accountSetupBrief() {
  const lines = ACCOUNT_SETUP_QUESTIONS.map((item, index) => `${index + 1}. ${item.ask}`).join(" ")
  return `New account setup, asked in this order and one at a time: ${lines}

Beginner help: If the person does not know the answer, offer 2–4 concrete suggestions and let them pick, adapt, or say "I don't know yet". Never leave them stuck. Explain why the question matters in one plain sentence if they ask.

Updating earlier answers: The person can come back to any previous question at any time by saying "change my business name", "reset the product", "go back to who buys it", or similar. Confirm the new value, update it, and continue from the current step. Everything is editable later.

When setup is finished, recap every answer, then send them to create the account at ${site.url}/signup. Include the email they gave as ?email= on that link. Tell them to sign up with that email and to check the inbox, including spam, to confirm. Sign-in is ${site.url}/login. Never say you have no signup link.

Do not publish, spend, or send until the person says yes. Beta testers are trying the platform and reporting what it still needs. They are not finished clients. If they ask you to draft a campaign, create an automation, or do another studio task, do that instead of asking the next setup question.`
}

export function isExplicitTask(text: string) {
  return /\b(draft|create|start|add|write|build|make)\s+(?:a|an|the|my)?\s*(campaign|automation|contact|deal|task|funnel|site|email list|post|appointment|meeting)\b/i.test(text)
    || /\b(schedule|book)\s+(?:a|an|the|my)?\s*(appointment|meeting|call)\b/i.test(text)
    || /\b(open|go to|take me to|show me)\s+(?:the\s+|my\s+)?(studio|contacts|pipeline|calendar|inbox|campaigns|automations|reports|media|business setup)\b/i.test(text)
}

function isAccountLinkQuestion(text: string) {
  const q = text.toLowerCase()
  const asksWhere = /\b(where|how|link|url|page)\b/.test(q)
  const aboutAccount = /\b(sign\s*up|signup|create (?:my |an )?account|register|log\s*in|login)\b/.test(q)
  return asksWhere && aboutAccount
}

type Turn = { role: string; content: string }
type QuestionId = (typeof ACCOUNT_SETUP_QUESTIONS)[number]["id"]

const CORRECTION = /^\s*(actually|sorry|oops|wait|correction|i meant|i mean|no[,.!]?\s|not\s+\w+[,.]?\s+(?:it'?s|its|it is))/i
const SKIP = /^\s*(skip|pass|next|skip (?:it|this|that|this one))\s*[.!]*\s*$/i
const QUESTION_START = /^\s*(why|what|what's|whats|how|who|when|where|can you|could you|can i|should i|do i|does|is it|are you|will you|why do)\b/i
const CORRECTION_TARGETS: [RegExp, QuestionId][] = [
  [/\b(e-?mail)\b/i, "email"],
  [/\b(website|site|url|web ?page)\b/i, "site"],
  [/\b(business|studio|company|brand|shop|store|agency)\b/i, "business"],
  [/\b(call me|my name)\b/i, "name"],
  [/\b(sell|selling|product|service|offer)\b/i, "sells"],
  [/\b(buyer|customer|client|audience)\b/i, "buyer"],
  [/\b(city|location|located|based)\b/i, "place"],
]

function isCorrection(text: string) {
  return CORRECTION.test(text)
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

function correctionTarget(text: string, answered: QuestionId[]): QuestionId | null {
  for (const [pattern, id] of CORRECTION_TARGETS) {
    if (pattern.test(text)) return id
  }
  return answered[answered.length - 1] ?? null
}

function answersSoFar(turns: Turn[]) {
  const answers = new Map<string, string>()
  const order: QuestionId[] = []
  for (let index = 0; index < turns.length; index += 1) {
    const turn = turns[index]
    if (turn?.role !== "assistant") continue
    const question = ACCOUNT_SETUP_QUESTIONS.find((item) => turn.content.includes(item.ask))
    if (!question) continue
    const reply = turns.slice(index + 1).find((item) => item.role === "user")
    if (!reply || isExplicitTask(reply.content) || isAccountLinkQuestion(reply.content)) continue
    const text = reply.content.trim()
    if (/\b(stop|cancel|never mind|nevermind)\b/i.test(text)) continue
    if (isCorrection(text) || CHANGE_REQUEST.test(text)) {
      const target = correctionTarget(text, order)
      const value = correctionValue(text)
      if (target && value) {
        answers.set(target, value)
        if (!order.includes(target)) order.push(target)
      }
      continue
    }
    if (isQuestionText(text)) continue
    if (question.id === "email" && !EMAIL_IN_TEXT.test(text) && !SKIP.test(text)) continue
    answers.set(question.id, SKIP.test(text) ? "skipped" : text.slice(0, 300))
    if (!order.includes(question.id)) order.push(question.id)
  }
  return answers
}

function signupDirections(email: string | undefined) {
  const address = email?.match(EMAIL_IN_TEXT)?.[0]
  const url = signupUrl(address || email)
  if (address) {
    return `Create your account with ${address} here: ${url}\n\nSign up with ${address}, then check that inbox for the confirmation email, including spam.`
  }
  return `Create your account here: ${url}\n\nSign in later at ${site.url}/login. After you sign up, check your inbox for the confirmation email, including spam.`
}

function closingMessage(turns: Turn[]) {
  const answers = answersSoFar(turns)
  const lines = ACCOUNT_SETUP_QUESTIONS.map((item, index) => {
    const value = answers.get(item.id)
    return `${index + 1}. ${ANSWER_LABELS[item.id]}: ${value || "not answered"}`
  }).join("\n")
  const email = answers.get("email")
  return `That is enough to open the account. Here is everything you told me:\n\n${lines}\n\n${signupDirections(email)}\n\nI still will not publish until you say yes. You can change any earlier answer later. Because this is a beta, send what is missing or broken to ${site.email}.`
}

export function isSetupStart(text: string) {
  return /\b(set up my account|setup my account|new account|i'?m new|im new|newbie|newby|beta tester|help me start|start my account|set up my free account)\b/i.test(text)
}

export function setupReply(turns: Turn[]): string | null {
  const latest = turns[turns.length - 1]?.content ?? ""
  const prior = [...turns].reverse().find((turn) => turn.role === "assistant")?.content ?? ""
  const step = ACCOUNT_SETUP_QUESTIONS.findIndex((item) => prior.includes(item.ask))
  if (step < 0 && !isSetupStart(latest)) return null
  if (step >= 0 && /\b(stop|cancel|never mind|nevermind)\b/i.test(latest)) {
    return "Setup is paused. Say set up my account when you want the next question. You can also say change my business name or go back to any earlier answer."
  }
  if (step >= 0 && !isSetupStart(latest) && isExplicitTask(latest)) return null
  const current = step >= 0 ? ACCOUNT_SETUP_QUESTIONS[step] : undefined
  if (isAccountLinkQuestion(latest)) {
    const email = answersSoFar(turns).get("email")
    const again = current ? `\n\n${current.ask}` : ""
    return `${signupDirections(email)}${again}`
  }
  if (step < 0) {
    return `I will set the account up one question at a time. Answer in a sentence, or say I don't know and I will give you options. I will not publish anything.\n\n${ACCOUNT_SETUP_QUESTIONS[0].ask}`
  }
  if (isCorrection(latest) || CHANGE_REQUEST.test(latest)) {
    const answers = answersSoFar(turns)
    const answered = ACCOUNT_SETUP_QUESTIONS.map((item) => item.id).filter((id) => answers.has(id))
    const target = correctionTarget(latest, answered)
    const value = correctionValue(latest)
    const hasValue = value.length > 0 && !/^(my\s+)?(business|name|product|buyer|channels?|email|website|site)(\s+name)?$/i.test(value)
    if (target && hasValue) {
      return `Updated ${ANSWER_LABELS[target].toLowerCase()} to: ${value}\n\n${current?.ask ?? ""}`
    }
    return `Got it. Tell me the new value, like "change my business name to Flow Haus", and I will update it. For now I am still on this one:\n\n${current?.ask ?? ""}`
  }
  if (isQuestionText(latest)) {
    const help = current?.suggestions.length ? ` Some options: ${current.suggestions.join(", ")}.` : ""
    return `Good question. I ask this so your first campaign fits your business. You can answer in a sentence, say I don't know yet, or say skip.${help}\n\n${current?.ask ?? ""}`
  }
  if (current?.id === "email" && !EMAIL_IN_TEXT.test(latest) && !SKIP.test(latest)) {
    return `That does not look like an email address. Type it like name@example.com, or say skip.\n\n${current.ask}`
  }
  const next = ACCOUNT_SETUP_QUESTIONS[step + 1]
  if (!next) return closingMessage(turns)
  return next.ask
}
