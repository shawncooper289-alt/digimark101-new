import { missingOfficeEnv, officeConfig } from "@/lib/office-store"
import { readVisitorMode } from "@/lib/office-store"
import { OfficeExperience } from "@/components/office-experience"
import { casualLookFor } from "@/lib/casual-looks"

export default async function SettingsPage() {
  const missing = missingOfficeEnv()
  const appearance = await readVisitorMode()
  const config = officeConfig()
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Settings</h1>
      <p className="mt-3 max-w-2xl text-muted">The owner role is stamped when this mailbox signs in. Set OWNER_EMAIL to the founder mailbox, then sign in here. The server calls sync_owner_email, which writes app_metadata.role = owner. Customer accounts are not stamped.</p>
      <p className="mt-4 text-sm">{config.owner ? "Owner mailbox is set on this server." : "Owner mailbox is not set."}</p>
      {missing.length ? (
        <div className="mt-6">
          <h2 className="text-2xl">Still unset</h2>
          <ul className="mt-3 grid gap-1 text-sm text-muted">{missing.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : <p className="mt-6 text-sm text-muted">The office keys Ava uses are set.</p>}
      <div className="mt-10">
        <OfficeExperience visitorMode={appearance.visitorMode} isOwner configured={appearance.configured} casual={casualLookFor()} compact />
      </div>
    </section>
  )
}
