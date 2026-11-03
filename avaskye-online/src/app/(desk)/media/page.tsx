import { MediaDesk, type MediaRow } from "@/components/media-desk"
import { deskClients, deskRows, deskRowsMaybe, text } from "@/lib/desk"
import { readOfficeOwner } from "@/lib/office-store"
import { hubProduct } from "@/lib/products"

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ product?: string; account?: string }> }) {
  const params = await searchParams
  const product = hubProduct(params.product)
  const [tagged, clients, owner] = await Promise.all([
    deskRowsMaybe(
      "office_media",
      "select=id,kind,title,url,notes,status,used_on,product_key,account_id&order=created_at.desc&limit=500",
    ),
    deskClients(),
    readOfficeOwner(),
  ])
  const rows = tagged ?? await deskRows(
    "office_media",
    "select=id,kind,title,url,notes,status,used_on&order=created_at.desc&limit=500",
  )
  const ownerId = owner?.id || ""
  const accounts = []
  if (ownerId) accounts.push({ id: ownerId, label: "DigiMark101" })
  for (const client of clients) {
    if (client.id === ownerId) continue
    accounts.push({ id: client.id, label: client.email })
  }
  const accountId = accounts.some((item) => item.id === params.account) ? params.account || ownerId : ownerId
  const items: MediaRow[] = rows.map((row) => ({
    id: text(row, "id"),
    kind: text(row, "kind"),
    title: text(row, "title"),
    url: text(row, "url"),
    notes: text(row, "notes"),
    status: text(row, "status") || "planned",
    productKey: text(row, "product_key") || "digimark101",
    accountId: text(row, "account_id"),
    usedOn: text(row, "used_on").slice(0, 10),
  }))
  return <MediaDesk items={items} productKey={product.key} accounts={accounts} accountId={accountId} ownerId={ownerId} />
}