import { SocialConnections } from "@/components/studio/social-connections"
import { SOCIAL_PROVIDERS, missingSocialEnv } from "@/lib/social/tokens"
import { createSupabaseServer, currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function StudioSocialPage({ searchParams }: { searchParams: Promise<{ connect?: string; success?: string; error?: string }> }) {
  const query = await searchParams
  const { user } = await currentUser()
  const supabase = user ? await createSupabaseServer() : null
  const { data } = supabase
    ? await supabase.from("social_account_status").select("platform, platform_account_name, connected")
    : { data: null }
  const connected = new Map((data ?? []).map((row) => [String(row.platform), row.platform_account_name as string | null]))
  const providers = SOCIAL_PROVIDERS.map((provider) => {
    const missing = missingSocialEnv(provider.id)
    return {
      id: provider.id,
      label: provider.label,
      missing,
      ready: missing.length === 0,
      accountName: connected.get(provider.id) || null,
    }
  })
  const notice = query.error
    ? `${query.connect || "That network"} did not connect (${query.error}).`
    : query.success
      ? `${query.connect || "That network"} is connected. The token is stored encrypted on the server.`
      : null

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">Socials</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Connect the accounts Ava can draft for. Each network stays on “Needs app credentials” until its client id and secret are set. Tokens are encrypted before they are stored. Ava does not publish a post until you confirm a draft.
      </p>
      {!user ? <p className="mt-8 text-ink-soft">Sign in to connect accounts for this workspace.</p> : null}
      {user ? <SocialConnections providers={providers} notice={notice} /> : null}
    </section>
  )
}
