"use client";

import { useState } from "react";
import { Header } from "@/components/header";

const KINDS = [
  { id: "post", label: "Post" },
  { id: "email", label: "Email" },
  { id: "page", label: "Page" },
  { id: "automation", label: "Automation" },
];

export default function StudioPage() {
  const [kind, setKind] = useState("post");
  const [brief, setBrief] = useState("");
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [, setLeft] = useState(40);

  async function run() {
    const res = await fetch("/api/ava/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, brief }),
    });
    const data = await res.json();
    setDraft(data.draft || "");
    setLeft((n) => Math.max(0, n - 1));
    setNote(data.note || "One prompt used. Approve before anything sends.");
  }

  return (
    <div className="min-h-dvh bg-bg">
      <Header cta="Plans" href="/pricing" />
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Studio · template drafting demo</p>
          <h1 className="mt-3 text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Tell Ava the job.</h1>
          <div className="mt-6 flex flex-wrap gap-2">
            {KINDS.map((item) => (
              <button key={item.id} onClick={() => setKind(item.id)} className={`rounded-full px-4 py-2 text-sm ${kind === item.id ? "bg-accent text-accent-fg" : "border border-border"}`}>{item.label}</button>
            ))}
          </div>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Who it is for, the offer, the one result." className="mt-4 h-40 w-full rounded-2xl border border-border bg-surface p-4 text-sm" />
          <button onClick={run} className="mt-4 rounded-full bg-accent px-5 py-2 text-sm text-accent-fg">Create template draft</button>
          {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
        </div>
        <pre className="min-h-80 whitespace-pre-wrap rounded-3xl border border-border bg-surface p-6 text-sm">{draft || "The draft lands here. Nothing sends until you approve it."}</pre>
      </section>
    </div>
  );
}
