import { MediaDesk, type MediaRow } from "@/components/media-desk"
import { deskRows, deskRowsMaybe, text } from "@/lib/desk"
import { hubProduct } from "@/lib/products"

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const params = await searchParams
  const product = hubProduct(params.product)
  const tagged = await deskRowsMaybe(
    "office_media",
    "select=id,kind,title,url,notes,status,used_on,product_key&order=created_at.desc&limit=500",
  )
  const rows = tagged ?? await deskRows(
    "office_media",
    "select=id,kind,title,url,notes,status,used_on&order=created_at.desc&limit=500",
  )
  const items: MediaRow[] = rows.map((row) => ({
    id: text(row, "id"),
    kind: text(row, "kind"),
    title: text(row, "title"),
    url: text(row, "url"),
    notes: text(row, "notes"),
    status: text(row, "status") || "planned",
    productKey: text(row, "product_key") || "digimark101",
    usedOn: text(row, "used_on").slice(0, 10),
  }))
  return <MediaDesk items={items} productKey={product.key} />
}
