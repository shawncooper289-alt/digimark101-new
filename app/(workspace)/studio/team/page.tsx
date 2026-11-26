import { TeamDesk } from "@/components/studio/team-desk"
import { teamDeskData } from "@/lib/ava/team/view"
import { monthStart, TeamMigrationNeeded } from "@/lib/ava/team/store"
import { supabaseTeamStore } from "@/lib/ava/team/supabase-store"
import { ensureOwnerGranted, isOwnerIdentity } from "@/lib/owner/access"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function TeamPage() {
  const { user } = await currentUser()
  await ensureOwnerGranted(user)
  const owner = isOwnerIdentity(user)
  if (!owner || !user?.id) {
    return (
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>
        <h1 className="display mt-2 text-4xl">Team</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">This desk is for the owner. Sign in with the owner account to see drafts, approvals, and the Muse brief.</p>
      </section>
    )
  }
  const admin = createSupabaseAdmin()
  const store = admin ? supabaseTeamStore(admin) : null
  let data = teamDeskData({
    ready: false,
    message: "The server key is not set, so stored work cannot load. Nothing was invented.",
    profiles: [],
    runs: [],
    approvals: [],
    handoffs: [],
    spentMicro: 0,
  })
  if (store) {
    try {
      await store.ensureProfiles(user.id)
      const [profiles, runs, approvals, handoffs, usage] = await Promise.all([
        store.listProfiles(user.id),
        store.listRuns(user.id),
        store.listApprovals(user.id),
        store.listHandoffs(user.id),
        store.usageSince(user.id, "traffic", new Date(0).toISOString(), monthStart(new Date())),
      ])
      data = teamDeskData({ ready: true, profiles, runs, approvals, handoffs, spentMicro: usage.totalMonthMicro })
    } catch (error) {
      data = teamDeskData({
        ready: false,
        message: error instanceof TeamMigrationNeeded ? error.message : "The team desk could not be loaded.",
        profiles: [],
        runs: [],
        approvals: [],
        handoffs: [],
        spentMicro: 0,
      })
    }
  }
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">Team</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">Ava manages five draft agents. Publishing, sending, spending, and contacting a person wait in the inbox. Clients never hear the agents&apos; names.</p>
      <div className="mt-8">
        <TeamDesk initial={data} />
      </div>
    </section>
  )
}
