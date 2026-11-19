"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { moduleFromPath, type PageContext } from "@/lib/ava/tools/page"

declare global {
  interface Window {
    __AVA_PAGE__?: PageContext
    __AVA_DESK__?: PageContext | null
  }
}

function headings() {
  return Array.from(document.querySelectorAll("h1, h2"))
    .slice(0, 8)
    .map((node, index) => ({
      type: "heading",
      id: `heading-${index}`,
      label: (node.textContent || "").trim().slice(0, 140),
    }))
    .filter((item) => item.label.length > 0)
}

export function publishPageContext() {
  const path = window.location.pathname
  const desk = window.__AVA_DESK__
  const useDesk = Boolean(desk && desk.path === path)
  window.__AVA_PAGE__ = {
    path,
    module: useDesk && desk?.module ? desk.module : moduleFromPath(path),
    title: document.title,
    visible: useDesk && desk?.visible?.length ? desk.visible : headings(),
  }
}

export function SitePageBeacon() {
  const pathname = usePathname()
  useEffect(() => {
    publishPageContext()
    const onContext = () => publishPageContext()
    window.addEventListener("ava:context", onContext)
    return () => window.removeEventListener("ava:context", onContext)
  }, [pathname])
  return null
}

export function rememberDesk(page: PageContext) {
  window.__AVA_DESK__ = page
  window.dispatchEvent(new CustomEvent("ava:context"))
  publishPageContext()
}

export function forgetDesk(path: string) {
  if (window.__AVA_DESK__?.path === path) window.__AVA_DESK__ = null
}
