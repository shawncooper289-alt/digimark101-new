"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { applyAction } from "@/lib/platform/reduce"
import { emptyWorkspace, type Action, type Workspace } from "@/lib/platform/types"

const STORAGE_KEY = "digimark101.preview.v1"

type PlatformValue = {
  mode: "loading" | "preview" | "account"
  workspace: Workspace
  email: string | null
  error: string | null
  configured: boolean
  run: (action: Action) => Promise<string>
  refresh: () => Promise<void>
}

const PlatformContext = createContext<PlatformValue | null>(null)

export function usePlatform() {
  const value = useContext(PlatformContext)
  if (!value) throw new Error("usePlatform must be used inside PlatformProvider")
  return value
}

function readPreview(): Workspace {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return emptyWorkspace()
    return { ...emptyWorkspace(), ...JSON.parse(saved) }
  } catch {
    return emptyWorkspace()
  }
}

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PlatformValue["mode"]>("loading")
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace())
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [configured, setConfigured] = useState(false)

  const refresh = useCallback(async () => {
    const response = await fetch("/api/studio")
    const data = (await response.json()) as {
      mode?: "account" | "preview"
      email?: string | null
      workspace?: Workspace
      error?: string | null
      configured?: boolean
    }
    setConfigured(Boolean(data.configured))
    if (data.mode === "account" && data.workspace) {
      setMode("account")
      setEmail(data.email ?? null)
      setWorkspace({ ...emptyWorkspace(), ...data.workspace })
      setError(data.error ?? null)
      return
    }
    setMode("preview")
    setEmail(null)
    setError(null)
    setWorkspace(readPreview())
  }, [])

  useEffect(() => {
    const onRefresh = () => {
      void refresh()
    }
    const onActions = (event: Event) => {
      const detail = (event as CustomEvent<{ actions: Action[]; summaries: string[] }>).detail
      if (!detail?.actions) return
      setWorkspace((current) => {
        let next = current
        for (const action of detail.actions) {
          const result = applyAction(next, action)
          next = result.workspace
          detail.summaries.push(result.summary)
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }
    window.addEventListener("ava:refresh", onRefresh)
    window.addEventListener("ava:client-actions", onActions)
    const timer = window.setTimeout(onRefresh, 0)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("ava:refresh", onRefresh)
      window.removeEventListener("ava:client-actions", onActions)
    }
  }, [refresh])

  const run = useCallback(
    async (action: Action) => {
      if (mode === "account") {
        const response = await fetch("/api/studio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        })
        const data = (await response.json()) as { summary?: string; workspace?: Workspace; error?: string }
        if (!response.ok || !data.workspace) throw new Error(data.error || "Could not save that.")
        setWorkspace({ ...emptyWorkspace(), ...data.workspace })
        return data.summary || "Saved."
      }
      let summary = ""
      setWorkspace((current) => {
        const result = applyAction(current, action)
        summary = result.summary
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.workspace))
        return result.workspace
      })
      return summary
    },
    [mode],
  )

  const value = useMemo(
    () => ({ mode, workspace, email, error, configured, run, refresh }),
    [mode, workspace, email, error, configured, run, refresh],
  )

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}
