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

export function accountSetupBrief() {
  const lines = ACCOUNT_SETUP_QUESTIONS.map((item, index) => `${index + 1}. ${item.ask}`).join(" ")
  return `New account setup, asked in this order and one at a time: ${lines}

Beginner help: If the person does not know the answer, offer 2–4 concrete suggestions and let them pick, adapt, or say "I don't know yet". Never leave them stuck. Explain why the question matters in one plain sentence if they ask.

Updating earlier answers: The person can come back to any previous question at any time by saying "change my business name", "reset the product", "go back to who buys it", or similar. Confirm the new value, update it, and continue from the current step. Everything is editable later.

Do not publish, spend, or send until the person says yes. Beta testers are trying the platform and reporting what it still needs. They are not finished clients.`
}

export function isSetupStart(text: string) {
  return /\b(set up my account|setup my account|new account|i'?m new|im new|newbie|newby|beta tester|help me start|start my account|set up my free account)\b/i.test(text)
}

export function setupReply(turns: { role: string; content: string }[]): string | null {
  const latest = turns[turns.length - 1]?.content ?? ""
  const prior = [...turns].reverse().find((turn) => turn.role === "assistant")?.content ?? ""
  const step = ACCOUNT_SETUP_QUESTIONS.findIndex((item) => prior.includes(item.ask))
  if (step < 0 && !isSetupStart(latest)) return null
  if (step >= 0 && /\b(stop|cancel|never mind|nevermind)\b/i.test(latest)) {
    return "Setup is paused. Say set up my account when you want the next question. You can also say change my business name or go back to any earlier answer."
  }
  if (/\b(change|reset|update|go back to)\b.*(name|business|product|sell|buyer|channel)/i.test(latest)) {
    return "Got it. Tell me the new value and I will update it. What should it be?"
  }
  if (step < 0) {
    return `I will set the account up one question at a time. Answer in a sentence, or say I don't know and I will give you options. I will not publish anything.\n\n${ACCOUNT_SETUP_QUESTIONS[0].ask}`
  }
  const next = ACCOUNT_SETUP_QUESTIONS[step + 1]
  if (!next) {
    return "That is enough to open the account. Sign up with the email you just gave, then open Studio. I still will not publish until you say yes. You can change any earlier answer later just by telling me. Because this is a beta, send what is missing or broken to hello@digimark101.com."
  }
  return next.ask
}
