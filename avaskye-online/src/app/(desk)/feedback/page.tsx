import { deskRows, text } from "@/lib/desk"

export default async function FeedbackPage() {
  const notes = await deskRows("beta_feedback", "select=id,user_id,body,page,created_at&order=created_at.desc&limit=100")
  const sessions = await deskRows("onboarding_sessions", "select=id,question_id,outcome,niche,created_at&order=created_at.desc&limit=100")
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Beta notes</h1>
      <p className="mt-3 max-w-2xl text-muted">Notes from beta seats, plus anonymized onboarding outcomes. Answers, names, and emails are not in the outcome log.</p>
      <h2 className="mt-10 text-3xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>What&apos;s missing / what broke</h2>
      {notes.length === 0 ? <p className="mt-4 text-muted">No beta notes yet. Apply 20261028_beta_onboarding.sql, then a beta account can send one from the studio.</p> : (
        <ul className="mt-4 grid gap-3">
          {notes.map((row) => (
            <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-4">
              <p>{text(row, "body")}</p>
              <p className="mt-2 text-sm text-muted">{text(row, "page") || "studio"} · {text(row, "created_at")} · {text(row, "user_id")}</p>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-10 text-3xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Onboarding outcomes</h2>
      {sessions.length === 0 ? <p className="mt-4 text-muted">No interview outcomes yet.</p> : (
        <ul className="mt-4 grid gap-2">
          {sessions.map((row) => (
            <li key={text(row, "id")} className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
              {text(row, "question_id")} · {text(row, "outcome")} · {text(row, "niche") || "no niche yet"} · {text(row, "created_at")}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
