"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
export function BriefingButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  return <div className="mt-5"><button disabled={pending} className="rounded-full border border-border px-4 py-2" onClick={async () => {
    setPending(true)
    try {
      const response = await fetch("/api/office/briefing", { method: "POST" })
      const data = await response.json() as { error?: string; reused?: boolean }
      setMessage(response.ok ? data.reused ? "Today's saved briefing already exists." : "Briefing saved." : data.error || "Briefing failed.")
      if (response.ok) router.refresh()
    } catch { setMessage("The briefing service could not be reached.") } finally { setPending(false) }
  }}>{pending ? "Preparing…" : "Prepare today’s planning brief"}</button><p role="status" className="mt-3 text-sm">{message}</p></div>
}
