import { SequenceDesk, type SequenceRow, type StoreAccount } from "@/components/sequence-desk"
import { BETA_SEQUENCE_NAME, BETA_SEQUENCE_STEPS } from "@/lib/beta-script"
import { deskClients, deskInsert, deskRowsMaybe, text } from "@/lib/desk"
import { readOfficeOwner } from "@/lib/office-store"
import { hubProduct } from "@/lib/products"

export default async function SequencesPage({ searchParams }: { searchParams: Promise<{ account?: string; product?: string }> }) {
  const params = await searchParams
  const product = hubProduct(params.product)
  const [clients, owner] = await Promise.all([deskClients(), readOfficeOwner()])
  const ownerId = owner?.id || ""
  const accounts: StoreAccount[] = []
  if (ownerId) accounts.push({ id: ownerId, label: "DigiMark101" })
  for (const client of clients) {
    if (client.id === ownerId) continue
    accounts.push({ id: client.id, label: client.email })
  }
  const accountId = accounts.some((item) => item.id === params.account) ? params.account || ownerId : ownerId
  if (ownerId && accountId === ownerId) {
    const named = encodeURIComponent(BETA_SEQUENCE_NAME)
    const existing = await deskRowsMaybe("office_sequences", `select=id&account_id=eq.${ownerId}&name=eq.${named}&limit=1`)
    if (existing && existing.length === 0) {
      await deskInsert("office_sequences", {
        account_id: ownerId,
        product_key: "digimark101",
        name: BETA_SEQUENCE_NAME,
        steps: BETA_SEQUENCE_STEPS,
        status: "ready",
      })
    }
  }
  const rows = await deskRowsMaybe(
    "office_sequences",
    "select=id,account_id,name,steps,status,product_key&order=created_at.desc&limit=500",
  )
  const items: SequenceRow[] = (rows ?? []).map((row) => ({
    id: text(row, "id"),
    accountId: text(row, "account_id"),
    name: text(row, "name"),
    steps: text(row, "steps"),
    status: text(row, "status") || "draft",
    productKey: text(row, "product_key") || "digimark101",
  }))
  if (ownerId && !items.some((item) => item.accountId === ownerId && item.name === BETA_SEQUENCE_NAME)) {
    items.unshift({
      id: "beta-script",
      accountId: ownerId,
      name: BETA_SEQUENCE_NAME,
      steps: BETA_SEQUENCE_STEPS,
      status: rows === null ? "table not installed yet" : "ready",
      productKey: "digimark101",
    })
  }
  return <SequenceDesk items={items} accounts={accounts} accountId={accountId} productKey={product.key} />
}
