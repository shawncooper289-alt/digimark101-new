import { RecordsDesk, type OfficeRecord } from "@/components/records-desk"
import { deskRows, text } from "@/lib/desk"

export default async function RecordsPage() {
  const rows = await deskRows(
    "office_records",
    "select=id,kind,title,party,amount,currency,status,notes,occurred_on&order=created_at.desc&limit=500",
  )
  const records: OfficeRecord[] = rows.map((row) => ({
    id: text(row, "id"),
    kind: text(row, "kind"),
    title: text(row, "title"),
    party: text(row, "party"),
    amount: text(row, "amount"),
    currency: text(row, "currency") || "USD",
    status: text(row, "status") || "open",
    notes: text(row, "notes"),
    occurredOn: text(row, "occurred_on").slice(0, 10),
  }))
  return <RecordsDesk records={records} />
}
