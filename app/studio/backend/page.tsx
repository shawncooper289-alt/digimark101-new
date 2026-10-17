import { ManagedBackend } from "@/components/studio/managed-backend"
import { listManagedBackends, managedBackendConfigured } from "@/lib/managed/backend"
import { ensureOwnerGranted, isOwnerIdentity } from "@/lib/owner/access"
import { currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function BackendPage() {
  const { user } = await currentUser()
  await ensureOwnerGranted(user)
  const owner = isOwnerIdentity(user)
  const configured = managedBackendConfigured()
  const backends = user && configured ? await listManagedBackends(user, owner) : []

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">Managed backend</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        DigiMark101 can open a Supabase project for a workspace, set its site URL, and read status on the server. You see your own backend. The owner account also sees every provisioned workspace. API keys are not sent to the browser.
      </p>
      {!user ? <p className="mt-8 text-ink-soft">Sign in to see this workspace&apos;s backend.</p> : null}
      {user ? <ManagedBackend configured={configured} owner={owner} backends={backends} /> : null}
    </section>
  )
}
