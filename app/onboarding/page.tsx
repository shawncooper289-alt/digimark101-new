import { AvaModeControl } from '@/components/ava-mode-control';
import { AgentTeam } from '@/components/agent-team';

export default function Onboarding() {
 return <main className="shell"><nav><strong>DigiMark101</strong><span>Workspace setup</span></nav><section className="onboarding"><p className="eyebrow">Meet Ava Skye</p><h1>How would you like to grow?</h1><p className="lead">Choose a starting mode. You can change it in workspace settings at any time.</p><AvaModeControl /><AgentTeam /></section></main>;
}
