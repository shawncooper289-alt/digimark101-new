/**
 * Ava Skye's platform capability model.
 *
 * Granting an AI assistant literal, unrestricted admin access to an entire
 * platform is a security anti-pattern: no human-in-the-loop for destructive
 * or billing/security actions, unbounded blast radius from a model mistake
 * or prompt injection, and no clean audit trail. Instead Ava is granted a
 * broad but *scoped* set of capabilities over marketing surfaces (pages,
 * campaigns, social content), client management, bot/agent delegation, and
 * sales/admin work, while platform-security-critical actions stay behind
 * explicit human approval.
 *
 * See `docs/AVA_KNOWLEDGE_BASE.md` §9 for the rationale.
 */

export type AvaCapabilityTier = 'autonomous' | 'approval_required' | 'never_allowed'

export interface AvaCapability {
  /** Short machine-readable identifier, e.g. "pages.draft.edit". */
  id: string
  description: string
  tier: AvaCapabilityTier
}

export const AVA_CAPABILITIES: AvaCapability[] = [
  // Autonomous — safe to perform without a human approval step.
  { id: 'pages.draft.create', description: 'Create/edit landing pages, websites, and funnels in draft/preview state', tier: 'autonomous' },
  { id: 'social.draft.create', description: 'Draft social business page content and calendars', tier: 'autonomous' },
  { id: 'analytics.read', description: 'Read analytics, funnel, and campaign performance data', tier: 'autonomous' },
  { id: 'experiments.propose', description: 'Propose A/B tests and copy/design variants', tier: 'autonomous' },
  { id: 'assets.generate', description: 'Generate copy, images, and other marketing assets', tier: 'autonomous' },
  { id: 'agents.orchestrate', description: 'Assign/monitor tasks for sub-agents and bots', tier: 'autonomous' },
  { id: 'clients.communication.draft', description: 'Draft client communications, status reports, and onboarding docs', tier: 'autonomous' },
  { id: 'clients.onboarding.manage', description: "Manage a client's onboarding checklist/status", tier: 'autonomous' },
  { id: 'sales.calls.inbound.handle', description: 'Handle inbound sales calls and qualify leads', tier: 'autonomous' },
  { id: 'admin.scheduling.manage', description: 'Manage calendars, scheduling, and follow-up reminders', tier: 'autonomous' },
  { id: 'admin.crm.update', description: 'Update CRM records: call outcomes, deal/contact stages, lead tagging', tier: 'autonomous' },
  { id: 'admin.reporting.generate', description: 'Generate routine pipeline/campaign/content-calendar reports', tier: 'autonomous' },

  // Approval-required — Ava can prepare these, but a human must confirm.
  { id: 'pages.publish', description: 'Publish a page/funnel to production', tier: 'approval_required' },
  { id: 'social.publish', description: 'Publish/schedule a post live to a connected social account', tier: 'approval_required' },
  { id: 'campaigns.send', description: 'Send email/SMS campaigns to real contacts', tier: 'approval_required' },
  { id: 'ads.spend', description: 'Create or modify paid ad spend/budgets', tier: 'approval_required' },
  { id: 'domains.manage', description: 'Change DNS, domains, or hosting configuration', tier: 'approval_required' },
  { id: 'accounts.manage', description: "Modify user accounts, roles, or billing", tier: 'approval_required' },
  { id: 'data.delete', description: 'Delete user or platform data', tier: 'approval_required' },
  { id: 'agents.bots.deploy', description: 'Deploy a new bot/agent into a live (production) workflow', tier: 'approval_required' },
  { id: 'clients.contracts.modify', description: "Modify a client's contract or pricing", tier: 'approval_required' },
  { id: 'sales.calls.outbound.initiate', description: 'Initiate first-touch outbound sales contact with a new prospect', tier: 'approval_required' },
  { id: 'sales.deals.close', description: 'Finalize/close a sales deal or contract', tier: 'approval_required' },

  // Never allowed, regardless of who is asking.
  { id: 'security.settings.modify', description: 'Change platform security/auth settings', tier: 'never_allowed' },
  { id: 'tenants.cross_access', description: "Access another tenant's or user's data", tier: 'never_allowed' },
  { id: 'secrets.manage', description: 'View or manage API keys/secrets', tier: 'never_allowed' },
  { id: 'auth.disable', description: 'Disable or bypass authentication', tier: 'never_allowed' },
]

export function getAvaCapability(id: string): AvaCapability | undefined {
  return AVA_CAPABILITIES.find((capability) => capability.id === id)
}

export function isAvaActionAutonomous(id: string): boolean {
  return getAvaCapability(id)?.tier === 'autonomous'
}

/**
 * Whether an action requires explicit human sign-off before Ava (or a bot/
 * agent she has delegated it to) may perform it.
 *
 * An unregistered capability id is treated as approval-required as a
 * fail-safe default (never silently autonomous), but is logged as a
 * distinct "unknown capability" warning so misconfigured/typo'd capability
 * checks are surfaced instead of masked.
 */
export function requiresHumanApproval(id: string): boolean {
  const capability = getAvaCapability(id)

  if (capability === undefined) {
    console.warn(`[ava/permissions] Unknown capability id "${id}" — defaulting to approval-required.`)
    return true
  }

  return capability.tier === 'approval_required'
}
