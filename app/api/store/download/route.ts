import { productBySku } from "@/lib/store/catalog"
import { deliverySecret, leadCsvForOrder, orderForReceipt, readPromptFile } from "@/lib/store/fulfill"
import { clientIp, tooManyRequests } from "@/lib/http"
import { isOwnerIdentity } from "@/lib/owner/access"
import { deliverySigOk, isOrderId } from "@/lib/store/token"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  if (tooManyRequests(`store-download:${clientIp(request)}`, 30)) {
    return new Response("Too many requests.", { status: 429 })
  }
  const url = new URL(request.url)
  const orderId = url.searchParams.get("order") || ""
  const exp = Number(url.searchParams.get("exp") || "")
  const sig = url.searchParams.get("sig") || ""
  if (!isOrderId(orderId)) return new Response("Not found.", { status: 404 })
  const sigOk = deliverySigOk(orderId, exp, sig, deliverySecret())
  const { user } = await currentUser()
  const order = await orderForReceipt(orderId, {
    sigOk,
    viewer: user ? { id: user.id, email: user.email, owner: isOwnerIdentity(user) } : null,
  })
  if (!order) return new Response("Not found.", { status: 404 })
  const product = productBySku(order.sku)
  if (!product || product.kind === "credits") return new Response("Not found.", { status: 404 })

  if (product.kind === "download") {
    const file = await readPromptFile(product.file || "")
    if (!file) return new Response("File unavailable.", { status: 404 })
    return new Response(file, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"ava-marketer-prompts.md\"",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  }

  const csv = await leadCsvForOrder(order.id)
  if (csv === null) return new Response("File unavailable.", { status: 503 })
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"niche-leads.csv\"",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
