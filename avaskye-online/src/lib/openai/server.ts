import "server-only"

/**
 * The only server-side OpenAI client for Ava.
 * Chat, helper runs, and the office desk all go through these functions.
 * Never log the key, the request body, or a reply that may contain personal data.
 */

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini"

/** OpenAI Realtime and speech fallback. ElevenLabs stays the main voice when it is configured. */
export const OPENAI_PLATFORM_VOICE = "coral"

export const OPENAI_MISSING_OWNER =
  "OpenAI is not connected. Add OPENAI_API_KEY on this Vercel project, then ask again. I did not make up an answer."

export const OPENAI_MISSING_CLIENT =
  "I can't finish that yet. The studio connection is off, so I won't guess. Please try again later, or use the contact page."

export const OPENAI_FAILED_MESSAGE =
  "I could not reach OpenAI just now. Nothing was made up. Please try again in a moment."

type Env = Record<string, string | undefined>

export type OpenAiToolCall = { id: string; name: string; arguments: string }

export type OpenAiChatResult =
  | { ok: true; text: string; toolCalls: OpenAiToolCall[]; model: string }
  | { ok: false; reason: "missing" | "failed"; message: string }

type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

type ChatFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>

export function openAiEnv(env: Env = process.env) {
  const apiKey = env.OPENAI_API_KEY?.trim() || ""
  if (!apiKey) return null
  const model = env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL
  return { apiKey, model, baseUrl: "https://api.openai.com/v1" }
}

/** Safe for an owner-only screen. The key is never included. */
export function openAiStatus(env: Env = process.env) {
  const config = openAiEnv(env)
  return {
    connected: Boolean(config),
    model: config?.model || DEFAULT_OPENAI_MODEL,
    voice: OPENAI_PLATFORM_VOICE,
  }
}

export async function openAiChat(input: {
  messages: ChatMessage[]
  tools?: unknown[]
  temperature?: number
  maxTokens?: number
  env?: Env
  fetchImpl?: ChatFetch
  timeoutMs?: number
}): Promise<OpenAiChatResult> {
  const config = openAiEnv(input.env ?? process.env)
  if (!config) return { ok: false, reason: "missing", message: OPENAI_MISSING_OWNER }
  const fetchImpl = input.fetchImpl ?? fetch
  try {
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(input.timeoutMs ?? 25000),
      body: JSON.stringify({
        model: config.model,
        temperature: input.temperature ?? 0.4,
        max_tokens: input.maxTokens ?? 900,
        messages: input.messages,
        ...(input.tools?.length ? { tools: input.tools, tool_choice: "auto" } : {}),
      }),
    })
    if (!response.ok) {
      console.error("OpenAI chat failed", response.status)
      return { ok: false, reason: "failed", message: OPENAI_FAILED_MESSAGE }
    }
    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: unknown
          tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: unknown } }>
        }
      }>
    }
    const message = data.choices?.[0]?.message
    const text = typeof message?.content === "string" ? message.content.trim() : ""
    const toolCalls: OpenAiToolCall[] = []
    for (const [index, call] of (message?.tool_calls ?? []).entries()) {
      const name = call.function?.name
      if (!name) continue
      const raw = call.function?.arguments
      const args = typeof raw === "string" ? raw : JSON.stringify(raw ?? {})
      toolCalls.push({ id: call.id || `call_${index}`, name, arguments: args })
    }
    if (!text && toolCalls.length === 0) {
      return { ok: false, reason: "failed", message: OPENAI_FAILED_MESSAGE }
    }
    return { ok: true, text, toolCalls, model: config.model }
  } catch (error) {
    console.error("OpenAI chat unreachable", error instanceof Error ? error.name : "error")
    return { ok: false, reason: "failed", message: OPENAI_FAILED_MESSAGE }
  }
}
