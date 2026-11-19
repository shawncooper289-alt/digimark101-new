export type GuideStep = {
  id: string
  title: string
  detail: string
}

export type PageGuide = {
  href: string
  label: string
  steps: GuideStep[]
  nextHref: string | null
  nextLabel: string | null
}

const PAGES: PageGuide[] = [
  {
    href: "/",
    label: "Today",
    nextHref: "/products",
    nextLabel: "Hub",
    steps: [
      { id: "counts", title: "Read the counts", detail: "Today shows leads, contacts, deals, and plans from the desk. If a count is missing, the page says so. Ava does not invent a number." },
      { id: "table", title: "Pick a table", detail: "Choose Hub, Campaigns, Leads, or another table. Ava can open it. She does not publish or save until you say yes." },
      { id: "ask", title: "Ask about this page", detail: "Ask what a count means, or which table to open next. Guided mode can move to Hub when you are ready." },
    ],
  },
  {
    href: "/products",
    label: "Hub",
    nextHref: "/clients",
    nextLabel: "Clients",
    steps: [
      { id: "hub", title: "See the product hub", detail: "Hub is the list of what the office can run. Open one product when you want its page." },
      { id: "next", title: "Leave the rest for later", detail: "You do not have to set up every product today. Skip anything you are not using." },
    ],
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    nextHref: "/social",
    nextLabel: "Social",
    steps: [
      { id: "look", title: "Look at the campaigns", detail: "Campaigns are drafts and plans. Opening one does not send it." },
      { id: "draft", title: "Ask for a draft", detail: "Ask Ava for a draft in plain words. Confirm before anything is saved." },
    ],
  },
  {
    href: "/social",
    label: "Social",
    nextHref: "/leads",
    nextLabel: "Leads",
    steps: [
      { id: "free", title: "Stay on free organic plays", detail: "Social here is free organic posting. It does not buy ads." },
      { id: "play", title: "Pick one play", detail: "Choose a play that matches the platform you named, or skip this page." },
    ],
  },
  {
    href: "/media",
    label: "Media",
    nextHref: "/video",
    nextLabel: "Video",
    steps: [
      { id: "files", title: "Find the files", detail: "Media holds files for a client. Nothing here publishes a website." },
      { id: "account", title: "Choose the account", detail: "If you came from Clients, the account is already in the link. Otherwise pick one before you upload." },
    ],
  },
  {
    href: "/video",
    label: "Video",
    nextHref: "/sequences",
    nextLabel: "Mail",
    steps: [
      { id: "script", title: "Start from a script", detail: "The video maker can load the Meet Ava intro or a new brief. A preview draft is labeled. It is not a finished ad." },
      { id: "keys", title: "Finished video needs keys", detail: "A finished render needs the avatar and video keys. Until then, keep the preview draft." },
    ],
  },
  {
    href: "/sequences",
    label: "Mail",
    nextHref: "/leads",
    nextLabel: "Leads",
    steps: [
      { id: "draft", title: "Read the sequence", detail: "Mail sequences are drafts. Saving one does not send email." },
      { id: "account", title: "Keep it on one account", detail: "Open mail from a client row when the sequence belongs to that account." },
    ],
  },
  {
    href: "/leads",
    label: "Leads",
    nextHref: "/crm",
    nextLabel: "CRM",
    steps: [
      { id: "list", title: "Review the lead list", detail: "Leads are people who might fit a client. Staging and rejected stay labeled." },
      { id: "no-invent", title: "Use only the rows you see", detail: "If the list is empty, say so. Do not add a lead from a guess." },
    ],
  },
  {
    href: "/crm",
    label: "CRM",
    nextHref: "/pipeline",
    nextLabel: "Pipeline",
    steps: [
      { id: "list", title: "Read the people", detail: "CRM is the contact list from the client workspaces. A CRM is a list of customer names." },
      { id: "draft", title: "Draft, then confirm", detail: "Ask Ava to draft a contact. Nothing is saved until you confirm." },
      { id: "skip", title: "Skip a person", detail: "You can leave a contact for later. Skip does not delete anyone." },
    ],
  },
  {
    href: "/pipeline",
    label: "Pipeline",
    nextHref: "/automations",
    nextLabel: "Automations",
    steps: [
      { id: "stages", title: "See the stages", detail: "A pipeline is the path a deal moves along, from new to won. Moving a card does not charge anyone." },
      { id: "one", title: "Move one deal", detail: "Pick one deal that needs a next step. Leave the others." },
    ],
  },
  {
    href: "/automations",
    label: "Automations",
    nextHref: "/billing",
    nextLabel: "Billing",
    steps: [
      { id: "off", title: "Check what is on", detail: "An automation runs only when it is turned on. Drafts stay drafts." },
      { id: "confirm", title: "Confirm a change", detail: "Ask Ava before you turn one on. She will not start a send from a question." },
    ],
  },
  {
    href: "/billing",
    label: "Billing",
    nextHref: "/records",
    nextLabel: "Records",
    steps: [
      { id: "paypal", title: "Read PayPal status", detail: "Billing shows subscriptions the office can see. It does not charge a card from this page." },
      { id: "gap", title: "Leave a gap alone", detail: "If a number is missing, the page should say unavailable. Do not fill it in." },
    ],
  },
  {
    href: "/records",
    label: "Records",
    nextHref: "/clients",
    nextLabel: "Clients",
    steps: [
      { id: "kinds", title: "Pick a record kind", detail: "Records cover invoices, expenses, and legal notes for the office. Adding one does not send it." },
      { id: "confirm", title: "Confirm before it is stored", detail: "A draft stays a draft until you confirm the save." },
    ],
  },
  {
    href: "/clients",
    label: "Clients",
    nextHref: "/accounts",
    nextLabel: "Accounts",
    steps: [
      { id: "accounts", title: "Find the account", detail: "Clients lists accounts in the shared project. A customer role cannot open this office." },
      { id: "jump", title: "Open mail or media", detail: "Each row can open that account's mail or media. That does not send or publish." },
      { id: "next", title: "Continue setup", detail: "When the account looks right, the next setup page is Accounts." },
    ],
  },
  {
    href: "/accounts",
    label: "Accounts",
    nextHref: "/settings",
    nextLabel: "Settings",
    steps: [
      { id: "seats", title: "Check the seats", detail: "Accounts is where founder mailboxes and seats are reviewed." },
      { id: "one", title: "Change one thing", detail: "Do one account change, then confirm it. Skip the rest." },
    ],
  },
  {
    href: "/feedback",
    label: "Beta notes",
    nextHref: "/reports",
    nextLabel: "Reports",
    steps: [
      { id: "read", title: "Read the notes", detail: "Beta notes are what testers reported. They are not testimonials." },
      { id: "one", title: "Pick one note", detail: "Choose one note to act on. Leave the others unread if you need to." },
    ],
  },
  {
    href: "/reports",
    label: "Reports",
    nextHref: "/tools",
    nextLabel: "Tools",
    steps: [
      { id: "source", title: "Use the numbers on the page", detail: "Reports only mean what the desk could load. Missing data stays missing." },
      { id: "ask", title: "Ask for a readout", detail: "Ask Ava to explain a figure you can see. She should not add one you cannot." },
    ],
  },
  {
    href: "/tools",
    label: "Tools",
    nextHref: "/helpers",
    nextLabel: "Helpers",
    steps: [
      { id: "backends", title: "See what is connected", detail: "Tools lists backends and connections. A missing key is listed. It is not treated as connected." },
      { id: "skip", title: "Skip a tool", detail: "You can leave a connection off. Skip does not turn it on." },
    ],
  },
  {
    href: "/helpers",
    label: "Helpers",
    nextHref: "/settings",
    nextLabel: "Settings",
    steps: [
      { id: "review", title: "Review helper drafts", detail: "Helpers write drafts for you to review. Clients do not see them. Nothing sends until you confirm." },
      { id: "one", title: "Open one draft", detail: "Read one draft. Send it back if it invented a fact." },
    ],
  },
  {
    href: "/settings",
    label: "Settings",
    nextHref: null,
    nextLabel: null,
    steps: [
      { id: "owner", title: "Check the owner mailbox", detail: "Settings shows whether the founder mailbox is set. Customer accounts are not stamped as owner." },
      { id: "model", title: "Check the model key", detail: "If OpenAI is not connected, Ava says so and does not invent an answer. Guided mode still walks the page." },
      { id: "look", title: "Visitor look", detail: "Visitor mode changes Ava's look for guests. It does not hide the desk from you." },
    ],
  },
]

const FALLBACK: PageGuide = {
  href: "",
  label: "This page",
  nextHref: "/",
  nextLabel: "Today",
  steps: [
    { id: "look", title: "Read the heading", detail: "Start with the heading on this page. Ava can answer a question about it, and she will not invent a number." },
    { id: "ask", title: "Ask or skip", detail: "Type a question for Ava. You can turn guided mode off whenever you want." },
  ],
}

export function guideForPath(pathname: string): PageGuide {
  const path = (pathname || "/").split("?")[0] || "/"
  return PAGES.find((page) => page.href === path) ?? { ...FALLBACK, href: path }
}

export function answerAboutPage(message: string, pathname: string) {
  if (!/\b(this page|where am i|what page|what is this|what do i do here|help me here|what(?:'|’)s this)\b/i.test(message)) return null
  const guide = guideForPath(pathname)
  const step = guide.steps[0]
  return `You're on ${guide.label}. ${step?.detail ?? "Ask a question about what you see."}`
}
