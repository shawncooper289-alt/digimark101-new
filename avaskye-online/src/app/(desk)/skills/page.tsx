import Link from "next/link"
import { AVA_SKILL_GROUPS, AVA_FRAMEWORKS, AVA_KNOWLEDGE_BASE_VERSION } from "@shared/ava/knowledge-base"
import { requireOwner } from "@/lib/desk"
const destinations: Record<string, string[]> = {
  web: ["/content", "/campaigns"], social: ["/campaigns"], leadership: ["/automations", "/records"],
  clients: ["/clients", "/crm", "/pipeline"], agents: ["/automations", "/tools"],
  sales: ["/pipeline", "/calendar"], admin: ["/crm", "/calendar", "/inbox", "/memory", "/files", "/records"],
}
export default async function SkillsPage() {
  if (!(await requireOwner())) return null
  return <section>
    <h1 className="text-5xl">Ava’s knowledge & skills</h1>
    <p className="mt-3 text-muted">Live registry from the same knowledge source used by DigiMark101’s Ava. Version {AVA_KNOWLEDGE_BASE_VERSION}. A documented method is not proof an external service is connected.</p>
    <ul className="mt-8 grid gap-4">{AVA_SKILL_GROUPS.map((group) => <li key={group.id} className="rounded-3xl border border-border bg-surface p-5">
      <h2 className="text-2xl">{group.title}</h2>
      <ul className="mt-3 list-disc pl-5 text-sm">{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
      <div className="mt-4 flex flex-wrap gap-3">{destinations[group.id]?.map((href) => <Link className="underline" href={href} key={href}>{href.slice(1)}</Link>)}</div>
    </li>)}</ul>
    <h2 className="mt-8 text-2xl">Reasoning frameworks</h2>
    <ul className="mt-3 grid gap-2">{AVA_FRAMEWORKS.map((item) => <li key={item.name}>{item.name}: {item.framework}</li>)}</ul>
    <p className="mt-6 text-muted">For decisions, Ava should state the objective, evidence, assumptions, alternatives, risks, and next action. Live model reasoning requires an office AI provider key. This registry does not certify model quality or autonomous execution.</p>
  </section>
}
