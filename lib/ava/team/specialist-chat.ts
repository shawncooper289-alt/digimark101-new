import "server-only"

import { estimateTokens } from "@/lib/ava/team/budget"
import { OPENAI_FAILED_MESSAGE, OPENAI_MISSING_OWNER, openAiChat, openAiEnv, type OpenAiToolCall } from "@/lib/openai/server"
import { specialistEndpoint } from "@/lib/openai/provider"

type Env = Record<string, string | undefined>
type ChatFetch = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>

export async function specialistChat(input: {
  messages: { role: "system" | "user" | "assistant"; content: string }[]
  tools?: unknown[]
  temperature?: number
  maxTokens?: number
  env?: Env
  fetchImpl?: ChatFetch
}) {
  const env = input.env ?? process.env
  const endpoint = specialistEndpoint(env, openAiEnv(env))
  if (!endpoint) return { ok: false as const, reason: "missing" as const, message: OPENAI_MISSING_OWNER }
  if (endpoint.provider === "openai") {
    const result = await openAiChat({ ...input, env })
    if (!result.ok) return result
    const tokensIn = estimateTokens(input.messages.map((message) => message.content).join("\n"))
    return { ...result, usage: { input: tokensIn, output: estimateTokens(result.text) } }
  }
  const fetchImpl = input.fetchImpl ?? fetch
  try {
    const response = await fetchImpl(`${endpoint.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${endpoint.apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: endpoint.model,
        temperature: input.temperature ?? 0.3,
        max_tokens: input.maxTokens ?? 700,
        messages: input.messages,
        ...(input.tools?.length ? { tools: input.tools, tool_choice: "auto" } : {}),
      }),
    })
    if (!response.ok) {
      console.error("Specialist model failed", response.status)
      return { ok: false as const, reason: "failed" as const, message: OPENAI_FAILED_MESSAGE }
    }
    const data = await response.json() as {
      usage?: { prompt_tokens?: number; completion_tokens?: number }
      choices?: Array<{ message?: { content?: unknown; tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: unknown } }> } }>
    }
    const message = data.choices?.[0]?.message
    const text = typeof message?.content === "string" ? message.content.trim() : ""
    const toolCalls: OpenAiToolCall[] = []
    for (const [index, call] of (message?.tool_calls ?? []).entries()) {
      const name = call.function?.name
      if (!name) continue
      const raw = call.function?.arguments
      toolCalls.push({ id: call.id || `call_${index}`, name, arguments: typeof raw === "string" ? raw : JSON.stringify(raw ?? {}) })
    }
    if (!text && toolCalls.length === 0) return { ok: false as const, reason: "failed" as const, message: OPENAI_FAILED_MESSAGE }
    return {
      ok: true as const,
      text,
      toolCalls,
      model: endpoint.model,
      usage: { input: data.usage?.prompt_tokens ?? estimateTokens(input.messages.map((item) => item.content).join("\n")), output: data.usage?.completion_tokens ?? estimateTokens(text) },
    }
  } catch (error) {
    console.error("Specialist model unreachable", error instanceof Error ? error.name : "error")
    return { ok: false as const, reason: "failed" as const, message: OPENAI_FAILED_MESSAGE }
  }
}
