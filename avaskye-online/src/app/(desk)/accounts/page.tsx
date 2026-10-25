import { deskClients, text } from "@/lib/desk"
import { officeConfig, ownerEmails, readOfficeOwner } from "@/lib/office-store"

export default async function AccountsPage() {
  const current = await readOfficeOwner()
  const all = await deskClients()
  const emails = ownerEmails()
  const founders = all.filter((user) => user.role === "owner" || emails.includes(user.email.toLowerCase()))
  const config = officeConfig()

  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Accounts</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Owner and founder accounts on the shared Supabase project. These accounts have the owner role, unlimited workspaces, and skip membership billing on DigiMark101. Customer accounts are listed under Clients.
      </p>

      <div className="mt-8 rounded-3xl border border-border bg-surface p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">Access free founder accounts on digimark101.com</p>
        <p className="mt-2 text-sm text-muted">
          Your free accounts live on digimark101.com. Sign in there with any email listed in OWNER_EMAIL and you get unlimited workspaces, premium tools, and no billing.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="https://www.digimark101.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-black"
          >
            Open DigiMark101 Login
          </a>
          <a
            href="https://www.digimark101.com/studio"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-5 py-2 text-sm"
          >
            Open Studio
          </a>
        </div>
        <p className="mt-4 text-xs text-muted">
          Ava will walk you through setup the same way she does for clients. Say “set up my free accounts” in chat.
        </p>
      </div>

      {current ? (
        <div className="mt-8 rounded-3xl border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Current session</p>
          <p className="mt-2 font-medium">{current.email}</p>
          <p className="text-sm text-muted">ID: {current.id}</p>
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="text-2xl">Founder / owner accounts</h2>
        <p className="mt-2 text-sm text-muted">
          OWNER_EMAIL on this server: {config.owner || "not set"}{emails.length > 1 ? ` (+ ${emails.length - 1} more)` : ""}
        </p>
        {founders.length === 0 ? (
          <p className="mt-6 text-muted">No owner or founder accounts could be listed. The service role is required to read the auth admin endpoint.</p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {founders.map((user) => (
              <li key={user.id} className="rounded-3xl border border-border bg-surface p-4">
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted">
                  Role: {user.role} · Created: {user.created ? new Date(user.created).toLocaleDateString() : "unknown"} · {user.id}
                </p>
                {emails.includes(user.email.toLowerCase()) ? <p className="mt-1 text-xs text-accent">Matches OWNER_EMAIL — free on digimark101.com</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-10 text-sm text-muted">
        Full client list lives on the Clients page. The owner role is stamped on sign-in when the email matches OWNER_EMAIL. Add more emails to OWNER_EMAIL in Vercel if you want additional free founder accounts.
      </p>
    </section>
  )
}
