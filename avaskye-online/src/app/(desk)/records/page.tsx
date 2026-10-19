import { RecordsDesk, type OfficeRecord } from "@/components/records-desk"
import { deskRows, deskRowsMaybe, text } from "@/lib/desk"
import { hubProduct } from "@/lib/products"

export default async function RecordsPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const params = await searchParams
  const product = hubProduct(params.product)
  const tagged = await deskRowsMaybe(
    "office_records",
    "select=id,kind,title,party,amount,currency,status,notes,occurred_on,product_key&order=created_at.desc&limit=500",
  )
  const rows = tagged ?? await deskRows(
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
    productKey: text(row, "product_key") || "digimark101",
  }))
  return <RecordsDesk records={records} productKey={product.key} />
}
