import { ConfirmButton } from "@/components/confirm-button"
import { deskRows, text } from "@/lib/desk"

const stages = ["new", "qualified", "proposal", "won", "lost"]

export default async function PipelinePage() {
  const deals = await deskRows("deals", "select=id,title,contact_name,stage,notes&order=created_at.desc&limit=200")
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Pipeline</h1>
      <p className="mt-3 max-w-2xl text-muted">Every client deal. Moving a stage asks you to confirm first.</p>
      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        {stages.map((stage) => (
          <div key={stage}>
            <h2 className="text-sm uppercase tracking-[0.16em] text-muted">{stage}</h2>
            <ul className="mt-3 grid gap-3">
              {deals.filter((row) => text(row, "stage") === stage).map((row) => (
                <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-3">
                  <p className="font-medium">{text(row, "title")}</p>
                  <p className="text-sm text-muted">{text(row, "contact_name") || "No contact"}</p>
                  <div className="mt-2 grid gap-2">
                    {stages.filter((next) => next !== stage).map((next) => (
                      <ConfirmButton key={next} label={`Move to ${next}`} confirmLabel={`Confirm ${next}`} body={{ action: "move_deal", id: text(row, "id"), stage: next }} />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {deals.length === 0 ? <p className="mt-6 text-muted">The pipeline is empty.</p> : null}
    </section>
  )
}
