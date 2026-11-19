import { toolByApiName, toolByName, type Effect, type Role, type ToolScope } from "@/lib/ava/tools/registry"

const rank: Record<Role, number> = { guest: 0, member: 1, admin: 2, owner: 3 }

export type ActorContext = {
  role: Role
  confirmed: boolean
  workspaceMatch: boolean
  isPlatformOwner: boolean
}

export type Decision = {
  allow: boolean
  needsConfirmation: boolean
  reason: string
}

export function resolveRole(input: {
  signedIn: boolean
  isDataOwner: boolean
  isPlatformOwner: boolean
  membership: Exclude<Role, "guest"> | null
}): Role {
  if (!input.signedIn) return "guest"
  if (input.isPlatformOwner || input.isDataOwner) return "owner"
  return input.membership ?? "guest"
}

export function confirmationCopy(name: string) {
  if (name === "invoices.request_payment") {
    return "Confirm to record a payment request. This does not charge a card and does not change PayPal."
  }
  if (name.endsWith(".send") || name.endsWith(".publish") || name.endsWith(".request")) {
    return "Confirm to queue this in the workspace. It is not delivered to a phone, inbox, or social network."
  }
  if (name.endsWith(".delete") || name.endsWith(".cancel") || name.endsWith(".void")) {
    return "Confirm to delete or void this record."
  }
  return "Confirm to continue."
}

export function decide(input: ActorContext & { effect: Effect; minRole: Exclude<Role, "guest">; scope: ToolScope }): Decision {
  const effective: Role = input.isPlatformOwner ? "owner" : input.role
  if (effective === "guest") {
    return { allow: false, needsConfirmation: false, reason: "Sign in to use Ava on this workspace." }
  }
  if (!input.workspaceMatch && !input.isPlatformOwner) {
    return { allow: false, needsConfirmation: false, reason: "That workspace is outside your account." }
  }
  if (input.scope === "platform_owner" && !input.isPlatformOwner) {
    return { allow: false, needsConfirmation: false, reason: "Only the owner office can do that." }
  }
  if (rank[effective] < rank[input.minRole]) {
    return { allow: false, needsConfirmation: false, reason: "Your role cannot do that." }
  }
  if (input.effect === "destructive" || input.effect === "outbound") {
    if (!input.confirmed) {
      return { allow: true, needsConfirmation: true, reason: "Confirmation is required before this runs." }
    }
  }
  return { allow: true, needsConfirmation: false, reason: "Allowed." }
}

export function authorize(name: string, actor: ActorContext): Decision {
  const spec = toolByName(name) ?? toolByApiName(name)
  if (!spec) return { allow: false, needsConfirmation: false, reason: "That tool is not available." }
  return decide({
    role: actor.role,
    confirmed: actor.confirmed,
    workspaceMatch: actor.workspaceMatch,
    isPlatformOwner: actor.isPlatformOwner,
    effect: spec.effect,
    minRole: spec.minRole,
    scope: spec.scope,
  })
}
