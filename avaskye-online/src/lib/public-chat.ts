const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i

export const PUBLIC_MODEL_MISSING =
  "Ava's model is not connected on this server. Add OPENAI_API_KEY, then ask again. I did not make up an answer."

export function signupLink(message: string) {
  const address = message.match(EMAIL)?.[0]
  const base = "https://www.digimark101.com/signup"
  return address ? `${base}?email=${encodeURIComponent(address)}` : base
}

/** Answers that do not need the model, and refusals that must not reach office data. */
export function scriptedPublicReply(message: string) {
  const text = message.trim()
  if (!text) return "Ask a short question about pricing, Studio, or creating an account."
  if (/\b(office records|service role|all clients|every workspace|owner mailbox|guided mode)\b/i.test(text)) {
    return "Office records and guided mode stay on the signed-in desk. This page can't open them."
  }
  if (/\b(where|how|link|url)\b/i.test(text) && /\b(sign\s*up|signup|create (?:my |an )?account|register)\b/i.test(text)) {
    return `Create an account at ${signupLink(text)}. After you sign up, check that inbox, including spam.`
  }
  if (/\b(pric|plan|cost|membership)\b/i.test(text)) {
    return "Public pricing is on https://www.digimark101.com/pricing. I won't invent a fee that isn't listed there."
  }
  if (/\b(studio|draft)\b/i.test(text)) {
    return "Studio on this site drafts a post, email, page, or automation from your brief. The draft is not sent until you approve it."
  }
  if (/\b(contact|help|human|email you)\b/i.test(text)) {
    return "Write the studio at https://www.digimark101.com/contact. I won't invent a client result while you wait."
  }
  if (/^(hi|hey|hello|help)\b/i.test(text) && text.length < 40) {
    return "Hey, I'm Ava. I can point you to pricing, Studio, signup, or the contact page. I stay out of the way until you ask."
  }
  return null
}
