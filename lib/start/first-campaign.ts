export type FirstAnswers = {
  business: string
  sells: string
  buyer: string
  place: string
  result: string
}

export type FirstEmail = { subject: string; body: string }

export type FirstDraft = {
  headline: string
  subhead: string
  page: string[]
  formFields: string[]
  emails: FirstEmail[]
}

export type FirstJob = {
  status: "draft" | "live"
  payment: "confirmed" | "not-confirmed"
  answers: FirstAnswers
  draft: FirstDraft
}

const MARK = "FIRST-CAMPAIGN"

function clip(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max)
}

export function cleanAnswers(input: Partial<FirstAnswers>): FirstAnswers | null {
  const answers = {
    business: clip(input.business || "", 80),
    sells: clip(input.sells || "", 140),
    buyer: clip(input.buyer || "", 140),
    place: clip(input.place || "", 80),
    result: clip(input.result || "", 160),
  }
  if (Object.values(answers).some((value) => value.length < 2)) return null
  return answers
}

export function buildFirstDraft(answers: FirstAnswers): FirstDraft {
  const where = answers.place ? ` in ${answers.place}` : ""
  return {
    headline: `${answers.sells} for ${answers.buyer}${where}.`,
    subhead: `${answers.business} is here to ${answers.result.replace(/^\w/, (letter) => letter.toLowerCase())}.`,
    page: [
      `This page is only for ${answers.buyer}.`,
      `${answers.business} sells ${answers.sells}.`,
      `The one thing this campaign asks for: ${answers.result}.`,
      answers.place ? `It is written for ${answers.place}.` : "No city was named, so the page does not pretend to be local.",
    ],
    formFields: ["Name", "Email", "What do you need?"],
    emails: [
      {
        subject: `${answers.business} got your note`,
        body: `Thanks for telling ${answers.business} what you need. We sell ${answers.sells} to ${answers.buyer}. If that is you, reply with the one result you want. We will not send a pitch deck.`,
      },
      {
        subject: `Still the right fit for ${answers.buyer}?`,
        body: `A short reminder from ${answers.business}. The offer is ${answers.sells}. The result we are set up to deliver is ${answers.result}. If the timing is wrong, no need to reply.`,
      },
      {
        subject: `Last note from ${answers.business}`,
        body: `This is the last email in this sequence. ${answers.business} can ${answers.result}. If you want that, reply to this email. If not, we will leave it here.`,
      },
    ],
  }
}

export function jobName(answers: FirstAnswers) {
  return `First campaign — ${answers.business}`.slice(0, 120)
}

export function writeJob(job: FirstJob) {
  const { answers, draft } = job
  const emails = draft.emails
    .map((email, index) => `Email ${index + 1}: ${email.subject}\n${email.body}`)
    .join("\n\n")
  return [
    MARK,
    `Status: ${job.status === "live" ? "live" : "draft ready"}`,
    `Payment: ${job.payment === "confirmed" ? "confirmed" : "not confirmed on this account yet"}`,
    `Business: ${answers.business}`,
    `Sells: ${answers.sells}`,
    `Buyer: ${answers.buyer}`,
    `Place: ${answers.place}`,
    `Result: ${answers.result}`,
    "",
    "Page",
    draft.headline,
    draft.subhead,
    ...draft.page,
    "",
    `Lead form: ${draft.formFields.join(", ")}`,
    "",
    emails,
  ].join("\n")
}

function line(brief: string, label: string) {
  const match = brief.match(new RegExp(`^${label}: (.+)$`, "m"))
  return match?.[1]?.trim() || ""
}

export function readJob(brief: string): FirstJob | null {
  if (!brief.startsWith(MARK)) return null
  const answers = cleanAnswers({
    business: line(brief, "Business"),
    sells: line(brief, "Sells"),
    buyer: line(brief, "Buyer"),
    place: line(brief, "Place"),
    result: line(brief, "Result"),
  })
  if (!answers) return null
  const status = line(brief, "Status") === "live" ? "live" : "draft"
  const payment = line(brief, "Payment") === "confirmed" ? "confirmed" : "not-confirmed"
  return { status, payment, answers, draft: buildFirstDraft(answers) }
}
