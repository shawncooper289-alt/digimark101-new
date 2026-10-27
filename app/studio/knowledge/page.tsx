import Link from "next/link"
import { AVA_FRAMEWORKS, AVA_KNOWLEDGE_BASE_VERSION, AVA_SKILL_GROUPS } from "@/lib/ava/knowledge-base"
import { ONBOARDING_PLAYBOOK } from "@/lib/ava/onboarding-playbook"

export default function KnowledgePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Ava skills · {AVA_KNOWLEDGE_BASE_VERSION}</p>
      <h1 className="display mt-3 text-4xl">What she knows how to do.</h1>
      <p className="mt-4 text-ink-soft">
        These methods came back from the earlier Ava knowledge base and now sit in the dark studio. They are ways of working. They are not client results. A draft stays a draft until you confirm it.
      </p>
      <div className="mt-8 grid gap-4">
        {AVA_SKILL_GROUPS.map((group) => (
          <article key={group.id} className="rounded-[1.4rem] border border-ink/10 bg-card p-5">
            <h2 className="font-serif text-2xl">{group.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <section className="mt-8 rounded-[1.4rem] border border-ink/10 p-5">
        <h2 className="font-serif text-2xl">New-account interview</h2>
        <p className="mt-3 text-sm text-ink-soft">
          Ava asks these in order. A niche answer changes which later questions appear. A field that is already saved is skipped. She reads the list back and waits for yes before writing it to the account.
        </p>
        <ol className="mt-3 space-y-2 text-sm text-ink-soft">
          {ONBOARDING_PLAYBOOK.map((item, index) => (
            <li key={item.id}>
              <span className="text-ink">{index + 1}. {item.ask}</span> Fills {item.fields.join(", ")}
              {item.when ? ` when the niche is ${item.when.join(", ")}` : ""}.
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-8 rounded-[1.4rem] border border-ink/10 p-5">
        <h2 className="font-serif text-2xl">Frameworks she may name</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-soft">
          {AVA_FRAMEWORKS.map((item) => (
            <li key={item.name}>
              <span className="text-ink">{item.name}.</span> {item.framework}
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-6 text-sm text-ink-soft">
        Per-client facts belong in <Link className="text-signal underline" href="/studio/memory">Memory</Link>. Ask her to remember something, then confirm the save.
      </p>
    </div>
  )
}
