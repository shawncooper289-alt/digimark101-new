'use client';

import { useState } from 'react';

type VariantState = 'canonical' | 'requested' | 'approved';

export function AvatarGovernance() {
  const [state, setState] = useState<VariantState>('canonical');
  const [reason, setReason] = useState('');

  const requestVariant = () => {
    if (!reason.trim()) return;
    setState('requested');
  };

  return <section className="identity-card">
    <div className="section-heading"><div><p className="eyebrow">Ava identity system</p><h2>One recognizable Ava Skye</h2></div><span className={`identity-state ${state}`}>{state === 'canonical' ? 'Canonical identity locked' : state === 'requested' ? 'White-label review pending' : 'White-label approved'}</span></div>
    <div className="identity-grid"><div><h3>Default for every workspace</h3><ul><li>Canonical Ava avatar, voice, and visual direction</li><li>Consistent persona, safety policy, and expert guidance</li><li>Media outputs remain tied to the Ava Skye identity</li></ul></div><div><h3>White-label exception</h3><p>Brand variants are unavailable by default. A workspace administrator must request a specific sales use case, then DigiMark101 must explicitly approve it before any asset can change.</p><label>White-label sales use case<textarea disabled={state !== 'canonical'} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe the client, campaign, and intended sales use" /></label><button className="button" type="button" disabled={!reason.trim() || state !== 'canonical'} onClick={requestVariant}>{state === 'requested' ? 'Request submitted' : 'Request white-label review'}</button></div></div>
    <p className="identity-note">Voice, likeness, and publishing changes are not enabled by this request. Approval must be recorded before a white-label media job is created.</p>
  </section>;
}
