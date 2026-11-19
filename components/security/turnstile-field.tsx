"use client"

import { useEffect, useRef } from "react"

type TurnstileApi = {
  render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string
  reset: (id?: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

/** Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Increase resetKey after a rejected submit so the widget issues a new token. */
export function TurnstileField({ onToken, resetKey = 0 }: { onToken: (token: string) => void; resetKey?: number }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ""
  const host = useRef<HTMLDivElement>(null)
  const widgetId = useRef("")
  const onTokenRef = useRef(onToken)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!resetKey) return
    onTokenRef.current("")
    if (widgetId.current) window.turnstile?.reset(widgetId.current)
  }, [resetKey])

  useEffect(() => {
    if (!siteKey || !host.current) return
    let cancelled = false
    const render = () => {
      if (cancelled || !host.current || !window.turnstile) return
      widgetId.current = window.turnstile.render(host.current, {
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
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
    }
  }, [siteKey])

  if (!siteKey) return null
  return <div ref={host} />
}
