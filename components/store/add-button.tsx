"use client"

import { useState } from "react"
import { addToCart } from "@/components/store/cart-panel"

export function AddToCart({ slug, name }: { slug: string; name: string }) {
  const [added, setAdded] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => {
        addToCart({ slug, name, qty: 1 })
        setAdded(true)
      }}
    >
      {added ? "Added" : "Add to cart"}
    </button>
  )
}
