"use client"

import Link from "next/link"

type TrackedLinkProps = {
  href: string
  event: string
  className?: string
  children: React.ReactNode
}

/** Privacy-safe click beacon: event name, path, and href. No cookies and no email. */
export function TrackedLink({ href, event, className, children }: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      prefetch={false}
      onClick={() => {
        const payload = JSON.stringify({
          event: event.slice(0, 64),
          path: window.location.pathname,
          href: href.split("?")[0].slice(0, 180),
        })
        if (typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon("/api/cta", new Blob([payload], { type: "application/json" }))
        }
      }}
    >
      {children}
    </Link>
  )
}
