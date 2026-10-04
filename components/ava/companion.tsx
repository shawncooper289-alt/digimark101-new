'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AvaAvatar } from '@/components/branding/ava-avatar'
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: {results: ArrayLike<{isFinal:boolean; 0:{transcript:string}}>}) => void) | null; onerror: (()=>void)|null; onend:(()=>void)|null }
export function AvaCompanion() {
  const [open,setOpen]=useState(false), [voice,setVoice]=useState(false), [listening,setListening]=useState(false)
  const [input,setInput]=useState(''), [busy,setBusy]=useState(false), [notice,setNotice]=useState('')
  const [messages,setMessages]=useState<{role:string;content:string}[]>([])
  const recognition=useRef<Recognition|null>(null), enabled=useRef(false)
  useEffect(()=>()=>{recognition.current?.stop(); window.speechSynthesis?.cancel()},[])
  async function send(text:string) {
    if (!text.trim() || busy) return
    setOpen(true); setBusy(true); setNotice(''); setInput('')
    try {
      const url=process.env.NEXT_PUBLIC_digimark101_SUPABASE_URL || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const key=process.env.NEXT_PUBLIC_digimark101_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_digimark101_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if(!url || !key) throw new Error('Sign-in configuration is not available yet.')
      const db=createClient(url,key)
      const {data}=await db.auth.getSession()
      if(!data.session) throw new Error('Please sign in in the workspace before chatting with Ava.')
      const res=await fetch('/api/platform/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify({message:text})})
      const reply=await res.json()
      if(!res.ok) throw new Error(reply.error || 'Ava could not reply. Try again.')
      setMessages(m=>[...m,{role:'You',content:text},{role:'Ava',content:reply.text}])
      if(enabled.current && window.speechSynthesis) window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply.text))
      if(!reply.saved) setNotice('This conversation could not be saved to memory.')
    } catch(e) {setNotice(e instanceof Error ? e.message : 'Unable to connect.')} finally {setBusy(false)}
  }
  function toggleVoice() {
    enabled.current=!enabled.current; setVoice(enabled.current)
    if(!enabled.current){recognition.current?.stop(); window.speechSynthesis?.cancel(); setListening(false)}
  }
  function listen() {
    if(listening){recognition.current?.stop(); return}
    const w=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition}
    const C=w.SpeechRecognition || w.webkitSpeechRecognition
    if(!C){setNotice('Voice input is not supported in this browser. Text chat is still available.');return}
    enabled.current=true; setVoice(true)
    const r=new C(); recognition.current=r; r.lang='en-US'; r.continuous=false; r.interimResults=false
    r.onresult=e=>{const text=e.results[0][0].transcript; setInput(text); setOpen(true); void send(text)}
    r.onerror=()=>{setNotice('Microphone access or speech recognition failed. Try text chat.');setListening(false)}
    r.onend=()=>setListening(false)
    try {r.start();setListening(true)} catch {setNotice('Unable to start microphone.');setListening(false)}
  }
  return <aside aria-label="Ava Skye companion" style={{position:'fixed',bottom:20,right:20,zIndex:9999,maxWidth:'calc(100vw - 40px)'}}>
    {open && <section style={{width:360,maxWidth:'100%',maxHeight:'70vh',overflow:'auto',background:'#fff',color:'#322647',borderRadius:24,padding:20,boxShadow:'0 12px 60px #0003'}}>
      <header style={{display:'flex',justifyContent:'space-between'}}><strong>Ava Skye</strong><button onClick={()=>setOpen(false)} aria-label="Close Ava">×</button></header>
      <p>Text chat, or enable voice and tap the microphone. Your browser may process voice input.</p>
      <div aria-live="polite">{messages.map((m,i)=><p key={i}><strong>{m.role}: </strong>{m.content}</p>)}</div>
      <form onSubmit={e=>{e.preventDefault();void send(input)}}><label>Your message<input required maxLength={4000} value={input} onChange={e=>setInput(e.target.value)} /></label><button disabled={busy}>{busy?'Thinking…':'Send'}</button></form>
      <button onClick={toggleVoice} aria-pressed={voice}>Voice {voice?'on':'off'}</button>{voice && <button disabled={busy} onClick={listen}>{listening?'Stop microphone':'Speak to Ava'}</button>}
      {notice && <p role="status">{notice}</p>}
    </section>}
    <button onClick={()=>setOpen(o=>!o)} aria-label="Open Ava Skye" aria-expanded={open} style={{background:'transparent',border:0,padding:8,display:'flex',alignItems:'center',gap:8,color:'#a855f7'}}><AvaAvatar size="lg"/><span>Ava Skye</span></button>
  </aside>
}
