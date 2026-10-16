import membership from "./membership.json"

export type MembershipPlanKey = "monthly" | "quarterly" | "semiannual"

export type MembershipPlan = {
  key: MembershipPlanKey
  name: string
  months: number
  amount: string
  planEnv: string
}

const keys = new Set<string>(["monthly", "quarterly", "semiannual"])

export const membershipProductName = membership.productName
export const membershipCurrency = membership.currency

export function listPlans(): MembershipPlan[] {
  return membership.plans.filter((plan): plan is MembershipPlan => keys.has(plan.key))
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
