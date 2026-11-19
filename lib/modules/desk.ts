export const deskIds = ["inbox", "pipeline", "calendar", "funnels", "forms", "workflows", "reputation", "invoices", "reports", "campaigns", "social", "products", "offers"] as const
export type DeskId = (typeof deskIds)[number]

export type DeskField = {
  name: string
  label: string
  kind?: "text" | "textarea" | "select" | "number" | "datetime"
  options?: string[]
}

export type DeskAction = {
  label: string
  tool: string
  confirm: boolean
}

export type DeskConfig = {
  id: DeskId
  title: string
  lede: string
  page: string
  listTool: string
  fields: DeskField[]
  actions: DeskAction[]
}

export const DESKS: Record<DeskId, DeskConfig> = {
  inbox: {
    id: "inbox",
    title: "Unified inbox",
    lede: "Log SMS, email, Facebook, Instagram, WhatsApp, web chat, and phone in one place. Queueing a reply keeps it here. It does not leave this workspace.",
    page: "/studio/inbox",
    listTool: "inbox.list",
    fields: [
      { name: "channel", label: "Channel", kind: "select", options: ["sms", "email", "facebook", "instagram", "whatsapp", "webchat", "phone", "note"] },
      { name: "contactName", label: "Person" },
      { name: "subject", label: "Subject" },
      { name: "body", label: "Message", kind: "textarea" },
    ],
    actions: [
      { label: "Log message", tool: "inbox.log", confirm: false },
      { label: "Queue reply", tool: "inbox.send", confirm: true },
    ],
  },
  pipeline: {
    id: "pipeline",
    title: "Pipeline",
    lede: "Deals sit on the Sales pipeline. Moving a deal updates this workspace only.",
    page: "/studio/pipeline",
    listTool: "deals.list",
    fields: [
      { name: "title", label: "Deal" },
      { name: "contactName", label: "Person" },
      { name: "stage", label: "Stage", kind: "select", options: ["new", "qualified", "proposal", "won", "lost"] },
      { name: "notes", label: "Notes", kind: "textarea" },
    ],
    actions: [
      { label: "Add deal", tool: "deals.create", confirm: false },
      { label: "Create pipeline", tool: "pipelines.ensure", confirm: false },
    ],
  },
  calendar: {
    id: "calendar",
    title: "Booking calendar",
    lede: "Book a time on a calendar in this workspace. Nothing is texted, and Google Calendar is not synced.",
    page: "/studio/calendar",
    listTool: "bookings.list",
    fields: [
      { name: "name", label: "New calendar name" },
      { name: "title", label: "Title" },
      { name: "contactName", label: "Person" },
      { name: "startsAt", label: "Starts", kind: "datetime" },
      { name: "notes", label: "Notes", kind: "textarea" },
    ],
    actions: [
      { label: "Add calendar", tool: "calendars.create", confirm: false },
      { label: "Book time", tool: "bookings.create", confirm: false },
    ],
  },
  funnels: {
    id: "funnels",
    title: "Funnel steps",
    lede: "Save the pages of a funnel. This is a draft. It does not publish a website.",
    page: "/studio/sites",
    listTool: "funnels.list",
    fields: [
      { name: "name", label: "Funnel name" },
      { name: "headline", label: "First page headline" },
      { name: "path", label: "Path" },
    ],
    actions: [{ label: "Save draft funnel", tool: "funnels.create", confirm: false }],
  },
  forms: {
    id: "forms",
    title: "Forms, surveys, and quizzes",
    lede: "Build a form, survey, or quiz and store answers in this workspace.",
    page: "/studio/forms",
    listTool: "forms.list",
    fields: [
      { name: "name", label: "Name" },
      { name: "kind", label: "Kind", kind: "select", options: ["form", "survey", "quiz"] },
      { name: "formId", label: "Form id for a test answer" },
      { name: "contactName", label: "Person" },
      { name: "message", label: "Answer", kind: "textarea" },
    ],
    actions: [
      { label: "Create draft", tool: "forms.create", confirm: false },
      { label: "Store answer", tool: "forms.submit", confirm: false },
    ],
  },
  workflows: {
    id: "workflows",
    title: "Workflows",
    lede: "Rules run inside this workspace. A send step is saved as a draft. It does not email or text anyone.",
    page: "/studio/automations",
    listTool: "workflows.list",
    fields: [
      { name: "name", label: "Name" },
      { name: "trigger", label: "When", kind: "select", options: ["contact.created", "appointment.booked", "deal.moved", "form.submitted", "review.received", "invoice.paid"] },
      { name: "action", label: "Then", kind: "select", options: ["log_inbox", "remember", "draft_email", "draft_sms", "request_review", "create_task"] },
      { name: "id", label: "Rule id to run" },
    ],
    actions: [
      { label: "Save rule", tool: "workflows.create", confirm: false },
      { label: "Run inside workspace", tool: "workflows.run", confirm: false },
    ],
  },
  reputation: {
    id: "reputation",
    title: "Reputation",
    lede: "Log a review and write a reply here. Requesting a review queues it. Google and Facebook are not contacted.",
    page: "/studio/reputation",
    listTool: "reviews.list",
    fields: [
      { name: "source", label: "Source", kind: "select", options: ["manual", "google", "facebook"] },
      { name: "author", label: "Author" },
      { name: "rating", label: "Rating", kind: "select", options: ["5", "4", "3", "2", "1"] },
      { name: "body", label: "Review", kind: "textarea" },
      { name: "id", label: "Review id for a reply" },
      { name: "reply", label: "Reply", kind: "textarea" },
      { name: "contactName", label: "Ask this person" },
      { name: "channel", label: "Request channel", kind: "select", options: ["email", "sms"] },
      { name: "message", label: "Request", kind: "textarea" },
    ],
    actions: [
      { label: "Log review", tool: "reviews.log", confirm: false },
      { label: "Save reply", tool: "reviews.reply", confirm: false },
      { label: "Queue request", tool: "reviews.request", confirm: true },
    ],
  },
  invoices: {
    id: "invoices",
    title: "Invoices",
    lede: "Draft an invoice in dollars. Requesting payment only records the request. It does not charge a card and it does not change PayPal.",
    page: "/studio/invoices",
    listTool: "invoices.list",
    fields: [
      { name: "contactName", label: "Bill to" },
      { name: "description", label: "Line" },
      { name: "amount", label: "Amount in dollars", kind: "number" },
      { name: "quantity", label: "Quantity", kind: "number" },
      { name: "notes", label: "Notes", kind: "textarea" },
      { name: "id", label: "Invoice id" },
    ],
    actions: [
      { label: "Save draft", tool: "invoices.create", confirm: false },
      { label: "Mark paid", tool: "invoices.mark_paid", confirm: false },
      { label: "Void", tool: "invoices.void", confirm: true },
      { label: "Request payment", tool: "invoices.request_payment", confirm: true },
    ],
  },
  reports: {
    id: "reports",
    title: "Workspace report",
    lede: "Counts of your own rows, plus Ava's audit log. These are not ad results and not attribution.",
    page: "/studio/reports",
    listTool: "reports.summary",
    fields: [],
    actions: [],
  },
  campaigns: {
    id: "campaigns",
    title: "Email and SMS drafts",
    lede: "Save a draft, or queue one after you confirm. Queueing does not deliver the message.",
    page: "/studio/campaigns",
    listTool: "campaigns.list",
    fields: [
      { name: "name", label: "Name" },
      { name: "channel", label: "Channel", kind: "select", options: ["email", "sms"] },
      { name: "brief", label: "What it should say", kind: "textarea" },
      { name: "id", label: "Campaign id to queue" },
    ],
    actions: [
      { label: "Save draft", tool: "campaigns.draft", confirm: false },
      { label: "Queue send", tool: "campaigns.send", confirm: true },
    ],
  },
  social: {
    id: "social",
    title: "Social planner",
    lede: "Draft a post or mark it scheduled. Scheduling here does not publish it to the network.",
    page: "/studio/social",
    listTool: "social.list",
    fields: [
      { name: "platform", label: "Network", kind: "select", options: ["facebook", "instagram", "linkedin", "x", "tiktok", "youtube", "google"] },
      { name: "body", label: "Post", kind: "textarea" },
      { name: "scheduledFor", label: "When", kind: "datetime" },
      { name: "id", label: "Draft id to schedule" },
    ],
    actions: [
      { label: "Save draft", tool: "social.draft", confirm: false },
      { label: "Mark scheduled", tool: "social.publish", confirm: true },
    ],
  },
  products: {
    id: "products",
    title: "Store products",
    lede: "Draft a token bundle, prompt pack, or one-time product. Publishing puts it on the store. Nothing is charged from this page, and PayPal plans stay as they are.",
    page: "/studio/products",
    listTool: "products.list",
    fields: [
      { name: "name", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "kind", label: "Kind", kind: "select", options: ["token", "prompt_pack", "one_time"] },
      { name: "amount", label: "Price in dollars", kind: "number" },
      { name: "credits", label: "Credits, for a token product", kind: "number" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "promptBody", label: "Prompt text", kind: "textarea" },
      { name: "id", label: "Product id" },
    ],
    actions: [
      { label: "Save draft", tool: "products.create", confirm: false },
      { label: "Publish", tool: "products.publish", confirm: false },
      { label: "Delete", tool: "products.delete", confirm: true },
    ],
  },
  offers: {
    id: "offers",
    title: "Offers",
    lede: "Upsells, order bumps, and plan upgrades for appdm101.ink. An upgrade page sends people to the existing membership pricing. It does not create a PayPal plan.",
    page: "/studio/offers",
    listTool: "offers.list",
    fields: [
      { name: "name", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "kind", label: "Kind", kind: "select", options: ["upsell", "bump", "upgrade"] },
      { name: "headline", label: "Headline" },
      { name: "body", label: "Page", kind: "textarea" },
      { name: "cta", label: "Button" },
      { name: "amount", label: "Price in dollars", kind: "number" },
      { name: "id", label: "Offer id" },
    ],
    actions: [
      { label: "Save draft", tool: "offers.create", confirm: false },
      { label: "Publish", tool: "offers.publish", confirm: false },
      { label: "Unpublish", tool: "offers.unpublish", confirm: true },
    ],
  },
}

export function fieldDefaults(config: DeskConfig) {
  const next: Record<string, string> = {}
  for (const field of config.fields) {
    if (field.kind === "select" && field.options?.[0]) next[field.name] = field.options[0]
  }
  return next
}

export function deskById(value: string): DeskConfig | null {
  return deskIds.includes(value as DeskId) ? DESKS[value as DeskId] : null
}
