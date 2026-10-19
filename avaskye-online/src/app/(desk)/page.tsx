import { StudioHome } from "@/components/studio-home"
import { deskSnapshot } from "@/lib/desk"

export default async function TodayPage() {
  const snap = await deskSnapshot()
  const counts = [
    { label: "Leads", value: snap.premium },
    { label: "Staging", value: snap.staging },
    { label: "Rejected", value: snap.rejected },
    { label: "Contacts", value: snap.contacts },
    { label: "Deals", value: snap.deals },
    { label: "Automations", value: snap.automations },
    { label: "Plans", value: snap.subscriptions },
    { label: "Orders", value: snap.orders },
  ]
  return <StudioHome counts={counts} />
}
