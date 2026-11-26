import type { AgentProfile } from "@/lib/ava/team/profiles"

export type ToolEffect = "read" | "write" | "destructive" | "outbound"

export type ToolLookup = { apiName: string; name: string; effect: ToolEffect } | null

export type CallClass = "deny" | "run" | "approve"

export function classifyCall(allow: readonly string[], called: string, lookup: ToolLookup): CallClass {
  if (!lookup) return "deny"
  const known = called === lookup.apiName || called === lookup.name
  if (!known) return "deny"
  if (!allow.includes(lookup.apiName) && !allow.includes(lookup.name)) return "deny"
  if (lookup.effect === "outbound" || lookup.effect === "destructive") return "approve"
  return "run"
}

export function allowListIsReadOnly(profile: AgentProfile, effects: Map<string, ToolEffect>) {
  return profile.tools.every((name) => effects.get(name) === "read")
}

export function lookupTools(tools: { apiName: string; name: string; effect: ToolEffect }[]) {
  const map = new Map<string, { apiName: string; name: string; effect: ToolEffect }>()
  for (const tool of tools) {
    map.set(tool.apiName, tool)
    map.set(tool.name, tool)
  }
  return (name: string): ToolLookup => map.get(name) ?? null
}

const RELEASABLE = new Set(["content_request_publish", "nurture_request_send", "indexnow_submit"])

export function approvedAction(tool: string) {
  if (!RELEASABLE.has(tool)) return null
  return tool
}
