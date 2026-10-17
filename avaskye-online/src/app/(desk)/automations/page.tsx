import { ConfirmButton } from "@/components/confirm-button"
import { deskRows, text } from "@/lib/desk"

export default async function AutomationsPage() {
  const rows = await deskRows("automations", "select=id,name,trigger_key,action_key,enabled&order=created_at.desc&limit=100")
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Automations</h1>
      <p className="mt-3 max-w-2xl text-muted">These run inside a client workspace. Turning one on or off waits for confirmation. They log an inbox note or a memory. They do not send mail.</p>
      {rows.length === 0 ? <p className="mt-8 text-muted">No automations yet.</p> : (
        <ul className="mt-8 grid gap-3">
          {rows.map((row) => {
            const enabled = row.enabled === true
            return (
              <li key={text(row, "id")} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-surface p-4">
                <div>
                  <p className="font-medium">{text(row, "name")}</p>
                  <p className="text-sm text-muted">{text(row, "trigger_key")} → {text(row, "action_key")} · {enabled ? "On" : "Off"}</p>
                </div>
                <ConfirmButton label={enabled ? "Turn off" : "Turn on"} confirmLabel={enabled ? "Confirm off" : "Confirm on"} body={{ action: "set_automation", id: text(row, "id"), enabled: !enabled }} />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
