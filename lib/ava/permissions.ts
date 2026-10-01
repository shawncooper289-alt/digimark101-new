/**
 * Ava Skye's platform capability model.
 *
 * Granting an AI assistant literal, unrestricted admin access to an entire
 * platform is a security anti-pattern: no human-in-the-loop for destructive
 * or billing/security actions, unbounded blast radius from a model mistake
 * or prompt injection, and no clean audit trail. Instead Ava is granted a
 * broad but *scoped* set of capabilities over marketing surfaces (pages,
 * campaigns, social content), while platform-security-critical actions stay
 * behind explicit human approval.
 *
 * See `docs/AVA_KNOWLEDGE_BASE.md` §5 for the rationale.
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

  // Approval-required — Ava can prepare these, but a human must confirm.
  { id: 'pages.publish', description: 'Publish a page/funnel to production', tier: 'approval_required' },
  { id: 'social.publish', description: 'Publish/schedule a post live to a connected social account', tier: 'approval_required' },
  { id: 'campaigns.send', description: 'Send email/SMS campaigns to real contacts', tier: 'approval_required' },
  { id: 'ads.spend', description: 'Create or modify paid ad spend/budgets', tier: 'approval_required' },
  { id: 'domains.manage', description: 'Change DNS, domains, or hosting configuration', tier: 'approval_required' },
  { id: 'accounts.manage', description: "Modify user accounts, roles, or billing", tier: 'approval_required' },
  { id: 'data.delete', description: 'Delete user or platform data', tier: 'approval_required' },

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

export function requiresHumanApproval(id: string): boolean {
  const capability = getAvaCapability(id)
  return capability?.tier === 'approval_required' || capability === undefined
}
