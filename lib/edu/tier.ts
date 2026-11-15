/**
 * Education tier for DigiMark101.
 * Free sandbox for marketing students and professors.
 * Isolated workspaces, rate-limited, sandbox brain for Ava.
 * Zero cost to schools until they request a paid pilot.
 */

export const EDU_TIER = {
  name: "DigiMark101 Education",
  cost: "Free for qualifying programs (rate-limited free tiers)",
  features: [
    "Isolated class workspaces",
    "Sample lead datasets for practice",
    "Student funnel performance dashboard",
    "Ava guidance in beginner teaching mode",
    "Sandbox Ava brain instance (does not affect production)",
    "Rate limits to protect free OpenAI / Supabase / Vercel tiers",
  ],
  limits: {
    studentsPerClass: 50,
    openaiDailyCredits: "Within free tier + soft per-student caps",
    dataRetention: "Semester length, then auto-archive",
  },
  upgradePath: "Paid pilot once a department wants dedicated support or higher volume",
} as const

export function isEduWorkspace(workspaceId: string): boolean {
  return workspaceId.startsWith("edu-")
}
