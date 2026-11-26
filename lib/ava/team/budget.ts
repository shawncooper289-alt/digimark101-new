/** Planning rates for the circuit breaker. They are not ad results. */
export const DEFAULT_INPUT_USD_PER_MILLION = 0.15
export const DEFAULT_OUTPUT_USD_PER_MILLION = 0.6

/** Five agents at $12, held to about $60 for the month. */
export const MONTHLY_TOTAL_CAP_CENTS = 6000
export const DEFAULT_AGENT_MONTHLY_CENTS = 1200
export const DEFAULT_DAILY_TOKEN_CAP = 20_000
export const DEFAULT_PER_RUN_TOKEN_CAP = 4_000

export type CostRates = { inputUsdPerMillion: number; outputUsdPerMillion: number }

export const DEFAULT_RATES: CostRates = {
  inputUsdPerMillion: DEFAULT_INPUT_USD_PER_MILLION,
  outputUsdPerMillion: DEFAULT_OUTPUT_USD_PER_MILLION,
}

export function estimateTokens(text: string) {
  const length = text.trim().length
  if (!length) return 1
  return Math.ceil(length / 4)
}

/** Micro-dollars. 1 USD = 1_000_000. Rounds up so the cap trips early. */
export function estimateCostMicro(tokensIn: number, tokensOut: number, rates: CostRates = DEFAULT_RATES) {
  const micro = tokensIn * rates.inputUsdPerMillion + tokensOut * rates.outputUsdPerMillion
  if (!Number.isFinite(micro) || micro <= 0) return 0
  return Math.ceil(micro)
}

export function microToCents(micro: number) {
  if (!Number.isFinite(micro) || micro <= 0) return 0
  return Math.ceil(micro / 10_000)
}

export type BudgetInput = {
  paused: boolean
  runTokens: number
  dayTokens: number
  agentMonthMicro: number
  totalMonthMicro: number
  perRunCap: number
  dayCap: number
  agentMonthCapCents: number
  totalMonthCapCents: number
  nextTokens: number
  nextMicro: number
}

export type BudgetDecision = { allow: boolean; pause: boolean; pauseAll: boolean; reason: string }

export function decideBudget(input: BudgetInput): BudgetDecision {
  if (input.paused) {
    return { allow: false, pause: false, pauseAll: false, reason: "This agent is paused." }
  }
  const totalCents = microToCents(input.totalMonthMicro + input.nextMicro)
  if (totalCents > input.totalMonthCapCents) {
    return { allow: false, pause: true, pauseAll: true, reason: "The monthly team cap is reached. Every agent is paused." }
  }
  const agentCents = microToCents(input.agentMonthMicro + input.nextMicro)
  if (agentCents > input.agentMonthCapCents) {
    return { allow: false, pause: true, pauseAll: false, reason: "This agent's monthly cap is reached. It is paused." }
  }
  if (input.dayTokens + input.nextTokens > input.dayCap) {
    return { allow: false, pause: true, pauseAll: false, reason: "This agent's daily token cap is reached. It is paused." }
  }
  if (input.runTokens + input.nextTokens > input.perRunCap) {
    return { allow: false, pause: false, pauseAll: false, reason: "This run reached its token cap. The agent is not paused." }
  }
  return { allow: true, pause: false, pauseAll: false, reason: "Within cap." }
}

export function overCap(input: {
  dayTokens: number
  dayCap: number
  agentMonthMicro: number
  agentMonthCapCents: number
  totalMonthMicro: number
  totalMonthCapCents: number
}): BudgetDecision | null {
  if (microToCents(input.totalMonthMicro) >= input.totalMonthCapCents) {
    return { allow: false, pause: true, pauseAll: true, reason: "The monthly team cap is reached. Every agent is paused." }
  }
  if (microToCents(input.agentMonthMicro) >= input.agentMonthCapCents) {
    return { allow: false, pause: true, pauseAll: false, reason: "This agent's monthly cap is reached. It is paused." }
  }
  if (input.dayTokens >= input.dayCap) {
    return { allow: false, pause: true, pauseAll: false, reason: "This agent's daily token cap is reached. It is paused." }
  }
  return null
}

export function budgetMeter(spentMicro: number, capCents = MONTHLY_TOTAL_CAP_CENTS) {
  const spentCents = microToCents(spentMicro)
  const ratio = capCents <= 0 ? 0 : Math.min(1, spentCents / capCents)
  const label = `$${(spentCents / 100).toFixed(2)} of $${(capCents / 100).toFixed(2)} this month`
  return { spentCents, capCents, ratio, label }
}
