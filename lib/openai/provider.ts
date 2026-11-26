type Env = Record<string, string | undefined>

export const META_API_DEFAULT_BASE = "https://api.meta.ai/v1"

export function isContributorModel(model: string) {
  return /-contributor\b/i.test(model.trim())
}

export type SpecialistEndpoint = {
  provider: "openai" | "meta"
  apiKey: string
  model: string
  baseUrl: string
}

/**
 * Specialists only. Off the Meta path unless AVA_SPECIALIST_PROVIDER=meta.
 * A model id ending in -contributor is refused. Ava's own chat does not use this.
 */
export function specialistEndpoint(env: Env, openai: { apiKey: string; model: string; baseUrl: string } | null): SpecialistEndpoint | null {
  const provider = env.AVA_SPECIALIST_PROVIDER?.trim().toLowerCase() || "openai"
  if (provider === "meta") {
    const apiKey = env.META_MODEL_API_KEY?.trim() || ""
    const model = env.META_MODEL?.trim() || ""
    const baseUrl = (env.META_API_BASE?.trim() || META_API_DEFAULT_BASE).replace(/\/$/, "")
    if (!apiKey || !model || isContributorModel(model)) return null
    return { provider: "meta", apiKey, model, baseUrl }
  }
  if (!openai || isContributorModel(openai.model)) return null
  return { provider: "openai", apiKey: openai.apiKey, model: openai.model, baseUrl: openai.baseUrl }
}
