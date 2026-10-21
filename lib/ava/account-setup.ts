/**
 * The order Ava uses for a new DigiMark101 account.
 * She asks one question, waits, then asks the next. She does not skip ahead.
 */
export const ACCOUNT_SETUP_QUESTIONS = [
  { id: "name", ask: "What should I call you?" },
  { id: "business", ask: "What is the business called?" },
  { id: "sells", ask: "What do you sell, in one sentence?" },
  { id: "buyer", ask: "Who buys it? Name a kind of person, not everyone." },
  { id: "place", ask: "Where are those buyers? A city, or say online only." },
  { id: "site", ask: "Do you have a website? Paste the address, or say none." },
  { id: "channels", ask: "Which do you already use: Google, Facebook, Instagram, an email list, or none?" },
  { id: "control", ask: "Do you want me to guide every step, or do you want the controls yourself?" },
  { id: "result", ask: "What is the one result this first campaign should get?" },
  { id: "email", ask: "What email should this DigiMark101 account use? Sign up with that same email." },
  { id: "beta", ask: "You are a beta tester. What was confusing, missing, or broken? One note is enough. If nothing yet, say nothing yet." },
] as const

export function accountSetupBrief() {
  const lines = ACCOUNT_SETUP_QUESTIONS.map((item, index) => `${index + 1}. ${item.ask}`).join(" ")
  return `New account setup, asked in this order and one at a time: ${lines} Do not publish, spend, or send until the person says yes. Beta testers are trying the platform and reporting what it still needs. They are not finished clients.`
}

export function isSetupStart(text: string) {
  return /\b(set up my account|setup my account|new account|i'?m new|im new|newbie|newby|beta tester|help me start|start my account)\b/i.test(text)
}

export function setupReply(turns: { role: string; content: string }[]): string | null {
  const latest = turns[turns.length - 1]?.content ?? ""
  const prior = [...turns].reverse().find((turn) => turn.role === "assistant")?.content ?? ""
  const step = ACCOUNT_SETUP_QUESTIONS.findIndex((item) => prior.includes(item.ask))
  if (step < 0 && !isSetupStart(latest)) return null
  if (step >= 0 && /\b(stop|cancel|never mind|nevermind)\b/i.test(latest)) {
    return "Setup is paused. Say set up my account when you want the next question."
  }
  if (step < 0) {
    return `I will set the account up one question at a time. Answer in a sentence. I will not publish anything.\n\n${ACCOUNT_SETUP_QUESTIONS[0].ask}`
  }
  const next = ACCOUNT_SETUP_QUESTIONS[step + 1]
  if (!next) {
    return "That is enough to open the account. Sign up with the email you just gave, then open Studio. I still will not publish until you say yes. Because this is a beta, send what is missing or broken to hello@digimark101.com."
  }
  return next.ask
}
