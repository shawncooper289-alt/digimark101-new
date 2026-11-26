"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"
import { StoreBuyPanel } from "@/components/store/buy-buttons"

type Item = { slug: string; name: string; qty: number }

const KEY = "dm_store_cart"
const EMPTY: Item[] = []
let cachedRaw = ""
let cachedItems: Item[] = EMPTY

function readCart() {
  const raw = localStorage.getItem(KEY) || "[]"
  if (raw === cachedRaw) return cachedItems
  cachedRaw = raw
  try {
    const parsed = JSON.parse(raw) as Item[]
    cachedItems = Array.isArray(parsed) ? parsed.filter((item) => item && item.slug).slice(0, 12) : EMPTY
  } catch {
    cachedItems = EMPTY
  }
  return cachedItems
}

export function CartPanel({ sdkSrc, sandbox }: { sdkSrc: string | null; sandbox: boolean }) {
  const items = useSyncExternalStore(() => () => {}, readCart, () => EMPTY)
  const payload = useMemo(() => ({ items: items.map((item) => ({ slug: item.slug, qty: item.qty || 1 })) }), [items])

  return (
    <>
      {items.length === 0 ? (
        <p className="mt-8 text-ink-soft">The cart is empty. Add a published product from its page.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((item) => (
            <li key={item.slug} className="flex items-center justify-between rounded-2xl border border-ink/10 px-4 py-3">
              <span>{item.name || item.slug}</span>
              <span className="text-ink-soft">× {item.qty || 1}</span>
            </li>
          ))}
        </ul>
      )}
      {items.length ? <StoreBuyPanel sku="catalog-cart" endpoint="/api/store/cart" payload={payload} sdkSrc={sdkSrc} sandbox={sandbox} /> : null}
      <p className="mt-6">
        <Link className="btn btn-ghost" href="/store">
          Back to the store
        </Link>
      </p>
    </>
  )
}

export function addToCart(item: Item) {
  const current = JSON.parse(localStorage.getItem(KEY) || "[]") as Item[]
  const next = Array.isArray(current) ? current.filter((row) => row.slug !== item.slug) : []
  next.push(item)
  localStorage.setItem(KEY, JSON.stringify(next.slice(0, 12)))
}
