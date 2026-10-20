"use client"
import { useState } from "react"

const links = [
  { label: "Create a free account", url: "https://www.digimark101.com/signup" },
  { label: "Returning tester sign-in", url: "https://www.digimark101.com/login" },
]
export function BetaLinks() {
  const [message, setMessage] = useState("")
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setMessage("Copied. Ready to share.") }
    catch { setMessage("Copy is unavailable. Select and copy the link shown below.") }
  }
  return <div className="mt-8 grid gap-4">
    {links.map((link) => <div key={link.url} className="rounded-3xl border border-border bg-surface p-5">
      <h2 className="text-2xl">{link.label}</h2>
      <a href={link.url} className="mt-3 block break-all underline">{link.url}</a>
      <button className="mt-4 rounded-full border border-border px-4 py-2" onClick={() => void copy(link.url)}>Copy link</button>
    </div>)}
    <button className="w-fit rounded-full bg-accent px-4 py-2 text-accent-fg" onClick={() => void copy("You’re invited to test DigiMark101 and Ava Skye. Create your account at https://www.digimark101.com/signup . No payment is required for account setup and core workspace testing. Confirm your email if prompted, then sign in at https://www.digimark101.com/login . Please use test data, do not make purchases, and send me any bugs or confusing steps. This is a web beta, not a Google Play testing invitation.")}>Copy tester invitation</button>
    <p role="status" aria-live="polite">{message}</p>
  </div>
}
