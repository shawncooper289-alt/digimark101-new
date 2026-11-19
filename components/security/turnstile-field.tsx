"use client"

import { useEffect, useRef } from "react"

type TurnstileApi = {
  render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

/** Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. */
export function TurnstileField({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ""
  const host = useRef<HTMLDivElement>(null)
  const onTokenRef = useRef(onToken)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!siteKey || !host.current) return
    let widgetId = ""
    let cancelled = false
    const render = () => {
      if (cancelled || !host.current || !window.turnstile) return
      widgetId = window.turnstile.render(host.current, {
        sitekey: siteKey,
        callback: (token) => onTokenRef.current(token),
      })
    }
    if (window.turnstile) {
      render()
    } else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-ava-turnstile]")
      if (existing) existing.addEventListener("load", render, { once: true })
      else {
        const script = document.createElement("script")
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        script.async = true
        script.dataset.avaTurnstile = "true"
        script.onload = render
        document.head.appendChild(script)
      }
    }
    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [siteKey])

  if (!siteKey) return null
  return <div ref={host} />
}
