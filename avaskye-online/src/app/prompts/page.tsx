import { Header } from "@/components/header";
import { PACKS } from "@/lib/catalog";
export default function UsagePage() { return <main><Header /><section className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-4xl">Additional usage</h1>{PACKS.map(p => <p key={p.price} className="mt-4">${p.price} — {p.credits.toLocaleString()} credits</p>)}<p className="mt-6">Purchased credits remain available while subscribed. No automatic charges. Checkout unavailable until billing and server-side credit accounting are configured. API usage is sold separately.</p></section></main> }
