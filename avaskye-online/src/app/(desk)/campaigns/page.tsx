import { CampaignDesk, type AccountOption, type CampaignRow } from "@/components/campaign-desk"
import { deskClients, deskRows, deskRowsMaybe, text } from "@/lib/desk"
import { readOfficeOwner } from "@/lib/office-store"
import { hubProduct } from "@/lib/products"

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const params = await searchParams
  const product = hubProduct(params.product)
  const [tagged, clients, owner] = await Promise.all([
    deskRowsMaybe("campaigns", "select=id,owner_id,name,channel,status,brief,product_key,created_at&order=created_at.desc&limit=1000"),
    deskClients(),
    readOfficeOwner(),
  ])
  const rows = tagged ?? await deskRows("campaigns", "select=id,owner_id,name,channel,status,brief,created_at&order=created_at.desc&limit=1000")
  const ownerId = owner?.id || ""
  const accounts: AccountOption[] = []
  if (ownerId) accounts.push({ id: ownerId, label: "DigiMark101" })
  for (const client of clients) {
    if (client.id === ownerId) continue
    accounts.push({ id: client.id, label: client.email })
  }
  const campaigns: CampaignRow[] = rows.map((row) => ({
    id: text(row, "id"),
    ownerId: text(row, "owner_id"),
    name: text(row, "name"),
    channel: text(row, "channel") || "email",
    status: text(row, "status") || "draft",
    brief: text(row, "brief"),
    productKey: text(row, "product_key") || "digimark101",
  }))
  return <CampaignDesk campaigns={campaigns} accounts={accounts} ownerId={ownerId} productKey={product.key} />
}
