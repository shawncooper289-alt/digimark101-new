export type SetupTurn = { role?: string; content?: string }

type Step = { id: string; ask: string; label: string }

const STEPS: readonly Step[] = [
  { id: "name", ask: "What should I call you?", label: "What I'll call you" },
  { id: "business", ask: "What's the business called?", label: "Business" },
  { id: "sell", ask: "What do you sell?", label: "What you sell" },
  { id: "who", ask: "Who is it for?", label: "Who it's for" },
  { id: "website", ask: "Do you have a website, or not yet?", label: "Website" },
  { id: "email", ask: "Which email should the account use?", label: "Account email" },
]

const CONFIRM_MARK = "Here's what I heard. Nothing is saved on this desk."
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const QUESTION = /^\s*(why|what|what's|whats|how|who|when|where|can you|could you|can i|should i|do i|does|is it|are you|will you)\b/i
const CORRECTION = /^\s*(actually|sorry|oops|wait|correction|i meant|i mean|no[,.!]\s|no\s+(?:it'?s|its|it is)\b|not\s+\w+[,.]?\s+(?:it'?s|its|it is))/i
const CHANGE = /\b(change|reset|update|go back to)\b/i
const START = /\b(set up my (?:free )?account|setup my account|set up a free account|free account|i'?m new|im new|help me start|get started|new account)\b/i
const YES = /^\s*(yes|yep|yeah|save|confirm|that(?:'|’)s right|looks good|go ahead)\b/i
const SKIP = /^\s*(skip|pass|next)\s*[.!]*\s*$/i
const LEAVE = /\b(open|go to|take me to|show me)\s+/i

const TARGETS: [RegExp, string][] = [
  [/\b(e-?mail)\b/i, "email"],
  [/\b(website|site|url)\b/i, "website"],
  [/\b(sell|offer|product|price)\b/i, "sell"],
  [/\b(customer|buyer|audience|who it(?:'|’)?s for)\b/i, "who"],
  [/\b(call me|my name)\b/i, "name"],
  [/\b(business|company|studio|shop|store)\b/i, "business"],
]

export function signupUrl(email?: string) {
  const address = email?.match(EMAIL)?.[0]
  const base = "https://www.digimark101.com/signup"
  return address ? `${base}?email=${encodeURIComponent(address)}` : base
}

function asks(step: Step) {
  return step.ask
}

function isQuestion(text: string) {
  const trimmed = text.trim()
  if (EMAIL.test(trimmed)) return false
  if (trimmed.length > 180) return false
  if (/\?\s*$/.test(trimmed) && trimmed.length < 160) return true
  if (!QUESTION.test(trimmed) || trimmed.length > 90) return false
  return true
}

function handoff(email?: string) {
  const url = signupUrl(email)
  const address = email?.match(EMAIL)?.[0]
  if (address) {
    return `Create the account with ${address} here: ${url}\n\nSign up with ${address}, then check that inbox for the confirmation email, including spam. This desk does not create the login.`
  }
  return `Create the account here: ${url}\n\nAfter you sign up, check your inbox for the confirmation email, including spam. This desk does not create the login.`
}

function shown(step: Step, answers: Map<string, string>) {
  if (!answers.has(step.id)) return "not answered yet"
  return answers.get(step.id) || "left blank"
}

function recap(answers: Map<string, string>) {
  const lines = STEPS.map((step, index) => `${index + 1}. ${step.label}: ${shown(step, answers)}`)
  return `${CONFIRM_MARK}\n\n${lines.join("\n")}\n\n${handoff(answers.get("email"))}\n\nSay change the business to … if something is wrong.`
}

function targetFor(text: string, answered: string[]) {
  for (const [pattern, id] of TARGETS) {
    if (pattern.test(text)) return id
  }
  return answered[answered.length - 1] ?? null
}

function correctionValue(text: string) {
  const named = text.match(/\b(?:called|named)\s+(.+)$/i) ?? text.match(/\b(?:it'?s|its|is|to|as|be)\s+(.+)$/i)
  const raw = named ? named[1] : text.replace(CORRECTION, "").replace(/^[\s,.:;-]+/, "")
  return raw.replace(/[.!\s]+$/, "").trim().slice(0, 200)
}

function answersFrom(history: SetupTurn[]) {
  const answers = new Map<string, string>()
  const order: string[] = []
  for (let index = 0; index < history.length; index += 1) {
    const turn = history[index]
    if (turn?.role !== "assistant" || !turn.content) continue
    const onConfirm = turn.content.includes(CONFIRM_MARK)
    const step = STEPS.find((item) => turn.content?.includes(asks(item)))
    if (!step && !onConfirm) continue
    const reply = history.slice(index + 1).find((item) => item.role === "user")
    if (!reply?.content) continue
    const text = reply.content.trim()
    if (isQuestion(text) || LEAVE.test(text)) continue
    if (CORRECTION.test(text) || CHANGE.test(text)) {
      const target = targetFor(text, order.length ? order : [...answers.keys()])
      const value = correctionValue(text)
      if (target && value) {
        answers.set(target, value)
        if (!order.includes(target)) order.push(target)
      }
      continue
    }
    if (!step || onConfirm) continue
    if (step.id === "email" && !EMAIL.test(text) && !SKIP.test(text)) continue
    answers.set(step.id, SKIP.test(text) ? "" : text.slice(0, 200))
    if (!order.includes(step.id)) order.push(step.id)
  }
  return answers
}

function openStep(answers: Map<string, string>) {
  return STEPS.find((step) => !answers.has(step.id)) ?? null
}

function help(step: Step) {
  return `Good question. Answer in your own words, or say skip. I will not save this on the desk.\n\n${asks(step)}`
}

export function officeSetupReply(message: string, history: SetupTurn[]) {
  const latest = message.trim()
  if (!latest) return null
  const prior = [...history].reverse().find((turn) => turn.role === "assistant")?.content || ""
  const priorStep = STEPS.find((item) => prior.includes(asks(item)))
  const onConfirm = prior.includes(CONFIRM_MARK)
  const said = history.filter((turn) => turn.role === "assistant").map((turn) => turn.content || "").join("\n")
  const starting = START.test(latest) && !priorStep && !onConfirm
  const underway = Boolean(priorStep || onConfirm || STEPS.some((step) => said.includes(asks(step))))
  if (!starting && !underway) return null
  if ((priorStep || onConfirm) && LEAVE.test(latest) && !START.test(latest)) return null

  const answers = answersFrom([...history, { role: "user", content: latest }])

  if (/\b(where|how|link|url|page)\b/i.test(latest) && /\b(sign\s*up|signup|create (?:my |an )?account|register)\b/i.test(latest)) {
    const current = priorStep ?? openStep(answers)
    return `${handoff(answers.get("email"))}${current ? `\n\n${asks(current)}` : ""}`
  }

  if (starting) {
    const next = openStep(answers)
    const intro = "Hey, I'm Ava. I'll ask a few easy questions, one at a time. If you don't know, say so. I won't create the login from this desk."
    return next ? `${intro}\n\n${asks(next)}` : recap(answers)
  }

  if ((priorStep || onConfirm) && isQuestion(latest)) {
    const current = priorStep ?? openStep(answers)
    return current ? help(current) : `${handoff(answers.get("email"))}\n\n${CONFIRM_MARK}`
  }

  if (CORRECTION.test(latest) || CHANGE.test(latest)) {
    const target = targetFor(latest, [...answers.keys()])
    const value = correctionValue(latest)
    const current = onConfirm ? null : priorStep ?? openStep(answers)
    if (target && value) {
      const label = STEPS.find((step) => step.id === target)?.label ?? target
      const follow = current ? asks(current) : recap(answers)
      return `Updated ${label.toLowerCase()} to: ${value}\n\n${follow}`
    }
    return `Got it. Tell me the new value, like "change the business to Flow Haus".\n\n${current ? asks(current) : CONFIRM_MARK}`
  }

  if (priorStep?.id === "email" && !EMAIL.test(latest) && !SKIP.test(latest)) {
    return `That does not look like an email address. Type it like name@example.com, or say skip.\n\n${asks(priorStep)}`
  }

  if (onConfirm && YES.test(latest)) {
    return `The signup page is where the account is created.\n\n${handoff(answers.get("email"))}`
  }

  if (onConfirm) return recap(answers)

  const next = openStep(answers)
  const note = priorStep && answers.has(priorStep.id) ? "Got it.\n\n" : ""
  if (!next) return `${note}${recap(answers)}`
  return `${note}${asks(next)}`
}
