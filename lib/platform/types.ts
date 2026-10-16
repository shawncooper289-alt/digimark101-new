export const stages = ["new", "qualified", "proposal", "won", "lost"] as const
export type Stage = (typeof stages)[number]

export const triggers = ["contact.created", "appointment.booked", "deal.moved"] as const
export type Trigger = (typeof triggers)[number]

export const automationActions = ["log_inbox", "remember"] as const
export type AutomationAction = (typeof automationActions)[number]

export type Contact = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  notes: string
  createdAt: string
}

export type Deal = {
  id: string
  title: string
  contactName: string
  stage: Stage
  notes: string
  createdAt: string
}

export type Appointment = {
  id: string
  title: string
  contactName: string
  startsAt: string
  notes: string
  createdAt: string
}

export type ThreadMessage = {
  id: string
  body: string
  sender: "client" | "studio"
  createdAt: string
}

export type Thread = {
  id: string
  contactName: string
  subject: string
  createdAt: string
  messages: ThreadMessage[]
}

export type Campaign = {
  id: string
  name: string
  channel: string
  status: "draft" | "active" | "paused"
  brief: string
  createdAt: string
}

export type SiteRecord = {
  id: string
  name: string
  path: string
  status: "draft" | "published"
  headline: string
  createdAt: string
}

export type Automation = {
  id: string
  name: string
  trigger: Trigger
  action: AutomationAction
  enabled: boolean
  createdAt: string
}

export type MemoryItem = {
  key: string
  value: string
  updatedAt: string
}

export type ClientFile = {
  id: string
  name: string
  path: string
  createdAt: string
}

export type Workspace = {
  contacts: Contact[]
  deals: Deal[]
  appointments: Appointment[]
  threads: Thread[]
  campaigns: Campaign[]
  sites: SiteRecord[]
  automations: Automation[]
  memory: MemoryItem[]
  files: ClientFile[]
}

export type Action =
  | { type: "create_contact"; name: string; email?: string; phone?: string; company?: string; notes?: string }
  | { type: "create_deal"; title: string; contactName?: string; stage?: Stage; notes?: string }
  | { type: "move_deal"; title: string; stage: Stage }
  | { type: "book_appointment"; title: string; contactName?: string; startsAt: string; notes?: string }
  | { type: "log_message"; contactName: string; subject?: string; body: string }
  | { type: "start_campaign"; name: string; channel?: string; brief?: string }
  | { type: "create_site"; name: string; headline?: string }
  | { type: "create_automation"; name: string; trigger: Trigger; action: AutomationAction }
  | { type: "remember"; key: string; value: string }

export function emptyWorkspace(): Workspace {
  return {
    contacts: [],
    deals: [],
    appointments: [],
    threads: [],
    campaigns: [],
    sites: [],
    automations: [],
    memory: [],
    files: [],
  }
}

export type Roster = {
  contacts: string[]
  deals: { title: string; stage: string }[]
  appointments: { title: string; startsAt: string }[]
  campaigns: string[]
  memory: { key: string; value: string }[]
}

export function rosterFrom(workspace: Workspace): Roster {
  return {
    contacts: workspace.contacts.slice(0, 30).map((contact) => contact.name),
    deals: workspace.deals.slice(0, 30).map((deal) => ({ title: deal.title, stage: deal.stage })),
    appointments: workspace.appointments.slice(0, 30).map((item) => ({ title: item.title, startsAt: item.startsAt })),
    campaigns: workspace.campaigns.slice(0, 30).map((campaign) => campaign.name),
    memory: workspace.memory.slice(0, 20).map((item) => ({ key: item.key, value: item.value })),
  }
}
