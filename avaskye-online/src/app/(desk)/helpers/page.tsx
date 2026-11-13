import { ConfirmButton } from "@/components/confirm-button"
import { deskRows, text } from "@/lib/desk"
import { MAX_HELPERS_AT_ONCE, OFFICE_HELPERS } from "@/lib/specialists"

export default async function HelpersPage() {
  const rows = await deskRows(
    "specialist_tasks",
    "select=id,owner_id,role,status,brief,result,created_at,finished_at&order=created_at.desc&limit=80",
  )
  const running = rows.filter((row) => text(row, "status") === "running").length
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Helpers</h1>
      <p className="mt-3 max-w-2xl text-muted">
        These six helpers work behind Ava. Clients never see them. They only see Ava and the draft. At most {MAX_HELPERS_AT_ONCE} run at the same time for one client. Anything beyond that waits in line. Nothing here sends mail, posts, or spends money.
      </p>
      <p className="mt-3 text-sm text-muted">Running in this list: {running}. The cap is {MAX_HELPERS_AT_ONCE} per client, even if this page shows work from more than one client.</p>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {OFFICE_HELPERS.map((helper) => (
          <li key={helper.id} className="rounded-3xl border border-border bg-surface p-4">
            <p className="font-medium">{helper.title}</p>
            <p className="mt-1 text-sm text-muted">{helper.scope}</p>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-3xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Recent work</h2>
      {rows.length === 0 ? <p className="mt-4 text-muted">No helper work yet. When Ava drafts something specialized for a client, it shows up here.</p> : (
        <ul className="mt-4 grid gap-3">
          {rows.map((row) => {
            const status = text(row, "status")
            const role = OFFICE_HELPERS.find((helper) => helper.id === text(row, "role"))?.title || text(row, "role")
            return (
              <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-4">
                <p className="font-medium">{role} · {status}</p>
                <p className="mt-1 text-sm text-muted">Client workspace {text(row, "owner_id")}</p>
                <p className="mt-2 text-sm">{text(row, "brief")}</p>
                {text(row, "result") ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{text(row, "result")}</p> : null}
                {status === "queued" ? (
                  <div className="mt-3">
                    <ConfirmButton label="Cancel waiting job" confirmLabel="Confirm cancel" body={{ action: "cancel_specialist_task", id: text(row, "id") }} />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
