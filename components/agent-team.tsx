'use client';

import { useState } from 'react';

type TaskStatus = 'proposed' | 'in_progress' | 'ready_for_review' | 'complete';
type Task = { title: string; agent: string; status: TaskStatus; outcome: string };

const agents = [
  ['Market Strategist', 'Clarifies positioning, offer, audience, and milestones.'],
  ['Campaign Architect', 'Designs funnels, launch sequences, and conversion paths.'],
  ['Content Studio', 'Produces approved campaign copy and creative briefs.'],
  ['CRM Specialist', 'Builds lead stages, follow-up workflows, and reporting.'],
  ['Growth Analyst', 'Measures conversion, attribution, and next experiments.'],
];
const statusLabel: Record<TaskStatus, string> = { proposed: 'Awaiting approval', in_progress: 'In progress', ready_for_review: 'Ready for review', complete: 'Complete' };

export function AgentTeam() {
  const [tasks, setTasks] = useState<Task[]>([
    { title: 'Define first offer and ideal client profile', agent: 'Market Strategist', status: 'ready_for_review', outcome: 'Ava is ready to review the positioning brief with you.' },
    { title: 'Create first-sales launch plan', agent: 'Campaign Architect', status: 'proposed', outcome: 'Requires approval before work begins.' },
  ]);
  const advance = (index: number) => setTasks((current) => current.map((task, i) => i === index ? { ...task, status: task.status === 'proposed' ? 'in_progress' : task.status === 'in_progress' ? 'ready_for_review' : 'complete' } : task));

  return <section className="agent-team">
    <div className="section-heading"><div><p className="eyebrow">Ava&apos;s specialist team</p><h2>One accountable operating team</h2></div><p>Ava owns orchestration: she assigns a named specialist, checks completion criteria, and returns work to you for review.</p></div>
    <div className="agent-grid">{agents.map(([name, description]) => <article key={name}><span className="agent-dot" /><h3>{name}</h3><p>{description}</p></article>)}</div>
    <div className="task-board"><div className="task-title"><h3>Delegated work</h3><span>Approval-gated</span></div>{tasks.map((task, index) => <div className="task" key={task.title}><div><b>{task.title}</b><p>{task.agent} · {task.outcome}</p></div><div className="task-action"><span className={`status ${task.status}`}>{statusLabel[task.status]}</span><button type="button" onClick={() => advance(index)} disabled={task.status === 'complete'}>{task.status === 'proposed' ? 'Approve' : task.status === 'in_progress' ? 'Mark ready' : task.status === 'ready_for_review' ? 'Approve result' : 'Done'}</button></div></div>)}</div>
  </section>;
}
