import type { Env } from "./providers"

/**
 * Same switch the chat path uses: OPENAI_MODEL, otherwise the current default.
 * This file does not import the chat client, so a model-default change there
 * cannot collide with the film job.
 */
const FALLBACK_MODEL = "gpt-4o-mini"

export function openAiEnvModel(env: Env) {
  const apiKey = env.OPENAI_API_KEY?.trim() || ""
  if (!apiKey) return null
  return { apiKey, model: env.OPENAI_MODEL?.trim() || FALLBACK_MODEL }
}
