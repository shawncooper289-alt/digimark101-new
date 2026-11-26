import { approvalExpiry, approvalHash } from "@/lib/ava/team/approvals"
import { decideBudget, estimateCostMicro, estimateTokens, type CostRates, type BudgetInput } from "@/lib/ava/team/budget"
import type { AgentBrief } from "@/lib/ava/team/brief"
import { safeDraft } from "@/lib/ava/team/guard"
import { classifyCall, type ToolEffect, type ToolLookup } from "@/lib/ava/team/scope"

export const MAX_TOOL_STEPS = 4

export type LoopToolCall = { name: string; arguments: string }

export type LoopChatResult =
  | { ok: true; text: string; toolCalls: LoopToolCall[]; tokensIn: number; tokensOut: number }
  | { ok: false; reason: "missing" | "failed"; message: string }

export type LoopChat = (input: { system: string; user: string; tools: { name: string }[] }) => Promise<LoopChatResult>

export type PendingApproval = {
  tool: string
  target: string
  params: Record<string, unknown>
  effect: ToolEffect
  paramsHash: string
  expiresAt: string
}

export type LoopResult = {
  text: string
  steps: number
  denied: string[]
  approvals: PendingApproval[]
  executions: { name: string; summary: string }[]
  tokensIn: number
  tokensOut: number
  stopped: string | null
  missing: boolean
}

function argsOf(raw: string) {
  try {
    const parsed = JSON.parse(raw || "{}") as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>
  } catch {
    // A bad tool payload is ignored.
  }
  return {}
}

function targetOf(args: Record<string, unknown>) {
  for (const key of ["id", "target", "name", "platform", "url"]) {
    const value = args[key]
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 200)
  }
  return ""
}

export async function runBoundedLoop(input: {
  system: string
  brief: AgentBrief
  allow: readonly string[]
  sources: string[]
  lookup: (name: string) => ToolLookup
  chat: LoopChat
  execute: (name: string, args: Record<string, unknown>) => Promise<{ summary: string }>
  budget: Omit<BudgetInput, "nextTokens" | "nextMicro">
  rates?: CostRates
  maxSteps?: number
  now?: Date
  tools: { name: string }[]
}): Promise<LoopResult> {
  const maxSteps = input.maxSteps ?? MAX_TOOL_STEPS
  const denied: string[] = []
  const approvals: PendingApproval[] = []
  const executions: { name: string; summary: string }[] = []
  let tokensIn = 0
  let tokensOut = 0
  let runTokens = input.budget.runTokens
  let text = ""
  let missing = false
  let stopped: string | null = null
  const notes: string[] = []
  const now = input.now ?? new Date()

  for (let step = 0; step < maxSteps; step += 1) {
    const user = [
      `Goal: ${input.brief.goal}`,
      input.brief.audience ? `Audience: ${input.brief.audience}` : "",
      input.brief.constraints ? `Constraints: ${input.brief.constraints}` : "",
      notes.length ? `Tool notes:\n${notes.join("\n")}` : "Use only the tools you were given.",
    ].filter(Boolean).join("\n")
    const nextTokens = estimateTokens(`${input.system}\n${user}`) + 800
    const nextMicro = estimateCostMicro(nextTokens, 0, input.rates)
    const gate = decideBudget({ ...input.budget, runTokens, nextTokens, nextMicro })
    if (!gate.allow) {
      stopped = gate.reason
      break
    }
    const turned = await input.chat({ system: input.system, user, tools: input.tools })
    if (!turned.ok) {
      missing = turned.reason === "missing"
      stopped = turned.message
      break
    }
    tokensIn += turned.tokensIn
    tokensOut += turned.tokensOut
    runTokens += turned.tokensIn + turned.tokensOut
    if (turned.text) text = turned.text
    if (!turned.toolCalls.length) break
    let progressed = false
    for (const call of turned.toolCalls) {
      const spec = input.lookup(call.name)
      const kind = classifyCall(input.allow, call.name, spec)
      if (kind === "deny" || !spec) {
        denied.push(call.name)
        notes.push(`${call.name} is outside this agent's tools and was not run.`)
        continue
      }
      const args = argsOf(call.arguments)
      if (kind === "approve") {
        approvals.push({
          tool: spec.apiName,
          target: targetOf(args),
          params: args,
          effect: spec.effect,
          paramsHash: approvalHash({ tool: spec.apiName, target: targetOf(args), params: args }),
          expiresAt: approvalExpiry(now),
        })
        notes.push(`${spec.apiName} is waiting for the owner. It was not run.`)
        progressed = true
        continue
      }
      const outcome = await input.execute(spec.apiName, args)
      executions.push({ name: spec.apiName, summary: outcome.summary })
      notes.push(outcome.summary)
      progressed = true
    }
    if (!progressed) break
  }

  const safe = safeDraft(text || notes.join("\n") || "No draft was produced. Nothing was invented.", input.sources)
  return {
    text: safe.text,
    steps: executions.length + approvals.length + denied.length,
    denied,
    approvals,
    executions,
    tokensIn,
    tokensOut,
    stopped,
    missing,
  }
}
