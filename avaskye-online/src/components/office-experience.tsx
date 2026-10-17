"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CasualAva } from "@/components/casual-ava";
import { PROFESSIONAL_LOOK, type OfficeLook } from "@/lib/casual-looks";

export function OfficeExperience({
  visitorMode,
  isOwner,
  configured,
  casual,
}: {
  visitorMode: boolean
  isOwner: boolean
  configured: boolean
  casual: OfficeLook
}) {
  const router = useRouter();
  const [mode, setMode] = useState(visitorMode);
  const [command, setCommand] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function update(body: { visitorMode?: boolean; command?: string }) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/office/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { visitorMode?: boolean; reply?: string; error?: string };
      if (!response.ok) {
        setError(data.error || "Could not update visitor mode.");
        return;
      }
      setMode(Boolean(data.visitorMode));
      setReply(data.reply || null);
      setCommand("");
      router.refresh();
    } catch {
      setError("Could not update visitor mode.");
    } finally {
      setPending(false);
    }
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/office/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Owner sign-in failed.");
        return;
      }
      setPassword("");
      router.refresh();
    } catch {
      setError("Owner sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    await fetch("/api/office/session", { method: "DELETE" });
    router.refresh();
  }

  const look = mode ? PROFESSIONAL_LOOK : casual;

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-[auto_1fr] md:items-start">
      <CasualAva look={look} />
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Owner office</p>
          {isOwner ? (
            <button
              type="button"
              className="rounded-full border border-border px-4 py-2 text-sm"
              aria-pressed={mode}
              disabled={pending || !configured}
              onClick={() => void update({ visitorMode: !mode })}
            >
              {mode ? "Visitor mode on" : "Visitor mode off"}
            </button>
          ) : null}
        </div>
        <h1 className="mt-3 text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>
          Founder office
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          The daily look stays relaxed. Visitor mode switches Ava to the professional outfit while guests are here, then back to casual when you turn it off or tell her to.
        </p>
        {isOwner ? (
          <form
            className="mt-6 max-w-xl"
            onSubmit={(event) => {
              event.preventDefault();
              void update({ command });
            }}
          >
            <label htmlFor="ava-office-command" className="text-sm">
              Tell Ava
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                id="ava-office-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="Ava, guests are coming"
                className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-4 py-2 text-sm"
              />
              <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || !command.trim()}>
                Send
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">Try “guests are coming”, “switch to professional”, or “back to casual”.</p>
          </form>
        ) : (
          <details className="mt-6 max-w-sm">
            <summary className="cursor-pointer text-sm text-muted">Owner sign-in</summary>
            <form className="mt-3" onSubmit={signIn}>
              <label className="block text-sm" htmlFor="office-email">Email</label>
              <input id="office-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-full border border-border bg-transparent px-4 py-2 text-sm" />
              <label className="mt-3 block text-sm" htmlFor="office-password">Password</label>
              <input id="office-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-full border border-border bg-transparent px-4 py-2 text-sm" />
              <button type="submit" className="mt-3 rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || !configured}>
                Sign in
              </button>
              {configured ? null : <p className="mt-2 text-xs text-muted">Supabase and the owner mailbox need to be set on this server before visitor mode can be saved.</p>}
            </form>
          </details>
        )}
        {reply ? <p className="mt-4 max-w-xl text-sm">{reply}</p> : null}
        {error ? <p className="mt-4 max-w-xl text-sm">{error}</p> : null}
        {isOwner ? (
          <button type="button" className="mt-4 text-sm text-muted underline" onClick={() => void signOut()}>
            Sign out of the office
          </button>
        ) : null}
      </div>
    </section>
  );
}
