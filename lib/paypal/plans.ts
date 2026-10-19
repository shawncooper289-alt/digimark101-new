import membership from "./membership.json"

export type MembershipPlanKey = "starter" | "monthly" | "quarterly" | "semiannual"

export type MembershipPlan = {
  key: MembershipPlanKey
  name: string
  months: number
  amount: string
  listAmount: string
  planEnv: string
}

const keys = new Set<string>(["starter", "monthly", "quarterly", "semiannual"])

type RawPlan = {
  key: string
  name: string
  months: number
  amount: string
  foundingAmount?: string
  planEnv: string
}

export const membershipProductName = membership.productName
export const membershipCurrency = membership.currency
export const foundingUntil = membership.foundingUntil

function foundingOpen(now = new Date()) {
  const until = new Date(`${membership.foundingUntil}T23:59:59Z`)
  return now.getTime() <= until.getTime()
}

export function listPlans(now = new Date()): MembershipPlan[] {
  return (membership.plans as RawPlan[])
    .filter((plan): plan is RawPlan & { key: MembershipPlanKey } => keys.has(plan.key))
    .map((plan) => ({
      key: plan.key,
      name: plan.name,
      months: plan.months,
      amount: foundingOpen(now) && plan.foundingAmount ? plan.foundingAmount : plan.amount,
      listAmount: plan.amount,
      planEnv: plan.planEnv,
    }))
}

export function monthlyPlan() {
  const plan = listPlans().find((item) => item.key === "monthly")
  if (!plan) throw new Error("Membership config is missing the monthly plan")
  return plan
}

export function savingsPercent(plan: MembershipPlan) {
  if (plan.months <= 1) return 0
  const full = Number(monthlyPlan().amount) * plan.months
  if (!Number.isFinite(full) || full <= 0) return 0
  return Math.round((1 - Number(plan.amount) / full) * 100)
}

export function formatUsd(amount: string | number) {
  const value = typeof amount === "number" ? amount : Number(amount)
  const whole = Number.isInteger(value)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function cadenceLabel(months: number) {
  return months === 1 ? "every 1 month" : `every ${months} months`
}

export function compareLabel(plan: MembershipPlan) {
  if (plan.months <= 1) return null
  const full = Number(monthlyPlan().amount) * plan.months
  return `Monthly for the same ${plan.months} months would be ${formatUsd(full)}.`
}

export function membershipFacts() {
  return listPlans()
    .map((plan) => {
      const savings = savingsPercent(plan)
      const off = savings > 0 ? ` About ${savings}% off the monthly rate.` : ""
      return `${plan.name}: ${formatUsd(plan.amount)} ${cadenceLabel(plan.months)}, auto-renewing.${off}`
    })
    .join(" ")
}
