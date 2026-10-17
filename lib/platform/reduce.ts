import type { Action, Automation, Stage, Workspace } from "@/lib/platform/types"

function id() {
  return crypto.randomUUID()
}

function now() {
  return new Date().toISOString()
}

function clip(value: string | undefined, max: number) {
  return (value ?? "").trim().slice(0, max)
}

function addMessage(workspace: Workspace, contactName: string, subject: string, body: string): Workspace {
  const message = { id: id(), body, sender: "studio" as const, createdAt: now() }
  const existing = workspace.threads.find((thread) => thread.contactName.toLowerCase() === contactName.toLowerCase() && thread.subject === subject)
  if (existing) {
    return {
      ...workspace,
      threads: workspace.threads.map((thread) => (thread.id === existing.id ? { ...thread, messages: [...thread.messages, message] } : thread)),
    }
  }
  return {
    ...workspace,
    threads: [
      { id: id(), contactName, subject, createdAt: now(), messages: [message] },
      ...workspace.threads,
    ],
  }
}

function remember(workspace: Workspace, key: string, value: string): Workspace {
  const updatedAt = now()
  const current = workspace.memory.findIndex((item) => item.key.toLowerCase() === key.toLowerCase())
  if (current >= 0) {
    const memory = workspace.memory.slice()
    memory[current] = { key, value, updatedAt }
    return { ...workspace, memory }
  }
  return { ...workspace, memory: [{ key, value, updatedAt }, ...workspace.memory] }
}

function runAutomations(workspace: Workspace, trigger: Automation["trigger"], subject: string): Workspace {
  let next = workspace
  for (const automation of workspace.automations) {
    if (!automation.enabled || automation.trigger !== trigger) continue
    if (automation.action === "log_inbox") {
      next = addMessage(next, subject || "Workspace", automation.name, `Automation “${automation.name}” ran because ${trigger.replace(".", " ")}.`)
    }
    if (automation.action === "remember") {
      next = remember(next, automation.name, `${trigger} · ${subject}`.slice(0, 500))
    }
  }
  return next
}

export function applyAction(workspace: Workspace, action: Action): { workspace: Workspace; summary: string } {
  switch (action.type) {
    case "create_contact": {
      const name = clip(action.name, 80)
      if (name.length < 2) return { workspace, summary: "A contact needs a name." }
      const contact = {
        id: id(),
        name,
        email: clip(action.email, 160),
        phone: clip(action.phone, 40),
        company: clip(action.company, 120),
        notes: clip(action.notes, 1000),
        createdAt: now(),
      }
      const withContact = { ...workspace, contacts: [contact, ...workspace.contacts] }
      return {
        workspace: runAutomations(withContact, "contact.created", name),
        summary: `${name} is in your contacts.`,
      }
    }
    case "create_deal": {
      const title = clip(action.title, 120)
      if (title.length < 2) return { workspace, summary: "A deal needs a title." }
      const stage: Stage = action.stage ?? "new"
      const deal = {
        id: id(),
        title,
        contactName: clip(action.contactName, 80),
        stage,
        notes: clip(action.notes, 1000),
        createdAt: now(),
      }
      return { workspace: { ...workspace, deals: [deal, ...workspace.deals] }, summary: `Deal “${title}” is in ${stage}.` }
    }
    case "move_deal": {
      const title = action.title.trim().toLowerCase()
      const match = workspace.deals.find((deal) => deal.title.toLowerCase() === title) ?? workspace.deals.find((deal) => deal.title.toLowerCase().includes(title))
      if (!match) return { workspace, summary: `I could not find a deal called “${action.title}”.` }
      const deals = workspace.deals.map((deal) => (deal.id === match.id ? { ...deal, stage: action.stage } : deal))
      return {
        workspace: runAutomations({ ...workspace, deals }, "deal.moved", match.title),
        summary: `“${match.title}” is now ${action.stage}.`,
      }
    }
    case "book_appointment": {
      const title = clip(action.title, 120) || "Appointment"
      const starts = new Date(action.startsAt)
      if (Number.isNaN(starts.getTime())) return { workspace, summary: "I need a real date and time for that appointment." }
      const appointment = {
        id: id(),
        title,
        contactName: clip(action.contactName, 80),
        startsAt: starts.toISOString(),
        notes: clip(action.notes, 1000),
        createdAt: now(),
      }
      const withAppointment = { ...workspace, appointments: [appointment, ...workspace.appointments] }
      return {
        workspace: runAutomations(withAppointment, "appointment.booked", appointment.contactName || title),
        summary: `${title} is on the calendar for ${starts.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.`,
      }
    }
    case "log_message": {
      const body = clip(action.body, 2000)
      const contactName = clip(action.contactName, 80) || "Workspace"
      if (body.length < 1) return { workspace, summary: "A message needs some text." }
      return {
        workspace: addMessage(workspace, contactName, clip(action.subject, 120) || "Note", body),
        summary: `Logged a note for ${contactName}.`,
      }
    }
    case "start_campaign": {
      const name = clip(action.name, 120)
      if (name.length < 2) return { workspace, summary: "A campaign needs a name." }
      const campaign = {
        id: id(),
        name,
        channel: clip(action.channel, 40) || "email",
        status: "draft" as const,
        brief: clip(action.brief, 1000),
        createdAt: now(),
      }
      return {
        workspace: { ...workspace, campaigns: [campaign, ...workspace.campaigns] },
        summary: `Campaign “${name}” is a draft. Sending is not connected yet, so nothing has gone out.`,
      }
    }
    case "create_site": {
      const name = clip(action.name, 120)
      if (name.length < 2) return { workspace, summary: "A site needs a name." }
      const path = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "site"
      const site = {
        id: id(),
        name,
        path,
        status: "draft" as const,
        headline: clip(action.headline, 160),
        createdAt: now(),
      }
      return {
        workspace: { ...workspace, sites: [site, ...workspace.sites] },
        summary: `Site “${name}” is registered as a draft. The page builder is a later phase, so this does not publish a public page.`,
      }
    }
    case "create_automation": {
      const name = clip(action.name, 120) || "Untitled automation"
      const automation = {
        id: id(),
        name,
        trigger: action.trigger,
        action: action.action,
        enabled: true,
        createdAt: now(),
      }
      return {
        workspace: { ...workspace, automations: [automation, ...workspace.automations] },
        summary: `Automation “${name}” is on. It runs inside this workspace when ${action.trigger.replaceAll(".", " ")}.`,
      }
    }
    case "remember": {
      const key = clip(action.key, 80)
      const value = clip(action.value, 1000)
      if (key.length < 2 || value.length < 1) return { workspace, summary: "Tell me what to remember, and a short label for it." }
      return { workspace: remember(workspace, key, value), summary: `Remembered “${key}” for this client only.` }
    }
    default:
      return { workspace, summary: "I could not do that." }
  }
}
