export type AvaAction =
  | 'create_work_item'
  | 'delegate_to_specialist'
  | 'request_approval'
  | 'run_automation'
  | 'publish_external_change'

export interface AvaCommand {
  workspaceId: string
  conversationId: string
  action: AvaAction
  workItemId?: string
  specialistKey?: string
  payload: Record<string, unknown>
}

export const APPROVAL_REQUIRED_ACTIONS = new Set<AvaAction>([
  'publish_external_change',
  'run_automation',
])

export function requiresApproval(command: AvaCommand): boolean {
  return APPROVAL_REQUIRED_ACTIONS.has(command.action)
}
