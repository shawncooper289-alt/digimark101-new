"use client"

import { useEffect } from "react"

export function useAvaForm(apply: (fields: Record<string, string>) => void) {
  useEffect(() => {
    const onFill = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, string>>).detail
      if (!detail || typeof detail !== "object") return
      apply(detail)
    }
    window.addEventListener("ava:fill", onFill)
    return () => window.removeEventListener("ava:fill", onFill)
  }, [apply])
}
