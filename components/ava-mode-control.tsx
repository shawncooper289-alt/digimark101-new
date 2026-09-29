'use client';
import { useState } from 'react';

type Mode = 'guided' | 'self-directed';
export function AvaModeControl() {
 const [mode, setMode] = useState<Mode>('guided');
 const [goal, setGoal] = useState('');
 return <form className="control" onSubmit={(event) => { event.preventDefault(); alert('Workspace setup will be saved when Supabase authentication is connected.'); }}>
   <div className="mode-switch" role="radiogroup" aria-label="Ava operating mode">
     <button type="button" aria-pressed={mode === 'guided'} className={mode === 'guided' ? 'selected' : ''} onClick={() => setMode('guided')}><b>Ava Guided</b><span>Ava asks questions, creates a launch path, and queues work for approval.</span></button>
     <button type="button" aria-pressed={mode === 'self-directed'} className={mode === 'self-directed' ? 'selected' : ''} onClick={() => setMode('self-directed')}><b>Client Control</b><span>Manage every campaign, pipeline, and integration yourself. Ava remains available on demand.</span></button>
   </div>
   <label>What is the first result you want? <textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="For example: launch a lead funnel and book 10 consultations" required /></label>
   <div className="notice">{mode === 'guided' ? 'Ava will start by clarifying your offer, audience, and first measurable milestone.' : 'You retain full control. Ava will only act after an explicit request.'}</div>
   <button className="button" type="submit">Create workspace</button>
 </form>;
}
