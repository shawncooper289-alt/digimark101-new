import Link from 'next/link';

const capabilities = [
  ['Ava Guided', 'Ava turns goals into an accountable launch plan, asks the next best question, and prepares approved work.'],
  ['Client Control', 'Clients can pause Ava at any time and manage their workspace, automations, and campaigns directly.'],
  ['Growth OS', 'A single operating layer for leads, pipelines, campaigns, follow-up, reporting, and client delivery.'],
];

export default function Home() {
  return <main className="shell">
    <nav><strong>DigiMark101</strong><span>Ava Skye Growth OS</span><Link className="button ghost" href="/onboarding">Start workspace</Link></nav>
    <section className="hero"><p className="eyebrow">AI-guided SaaS for client growth</p><h1>Move from first question to first sale with Ava Skye.</h1><p className="lead">DigiMark101 brings CRM, automation, campaigns, and client operations into one workspace—while Ava gives every client expert, step-by-step guidance.</p><Link className="button" href="/onboarding">Build my launch plan</Link></section>
    <section className="grid">{capabilities.map(([title, text]) => <article key={title}><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className="safety"><div><p className="eyebrow">Human control is always available</p><h2>Guided when you want it. Hands-on when you need it.</h2></div><p>Ava may recommend and prepare work. Sensitive, financial, publishing, and irreversible actions remain approval-gated.</p></section>
  </main>;
}
