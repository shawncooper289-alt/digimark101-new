import { SocialConnect } from "@/components/social-connect"
import { SocialDesk } from "@/components/social-desk"
import { deskRows, text } from "@/lib/desk"
import { missingOfficeSocial, OFFICE_SOCIAL } from "@/lib/social-office"

export default async function SocialPage() {
  const rows = await deskRows("platform_tokens", "select=platform,platform_account_name,updated_at&order=updated_at.desc&limit=50")
  const names = new Map(rows.map((row) => [text(row, "platform"), text(row, "platform_account_name")]))
  const providers = OFFICE_SOCIAL.map((provider) => {
    const missing = missingOfficeSocial(provider.id)
    return {
      id: provider.id,
      label: provider.label,
      missing,
      ready: missing.length === 0,
      accountName: names.get(provider.id) || null,
    }
  })
  return (
    <section>
      <SocialConnect providers={providers} />
      <div className="mt-12">
        <SocialDesk />
      </div>
    </section>
  )
}
