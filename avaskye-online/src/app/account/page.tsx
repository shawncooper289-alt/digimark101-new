import Link from "next/link";
import { Header } from "@/components/header";
export default function AccountPage() { return <main><Header /><section className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-4xl">Account setup pending</h1><p className="mt-4">Billing, authentication and credit balances are not yet connected. Selecting a plan does not purchase or grant a seat.</p><Link href="/pricing">View seat pricing</Link></section></main> }
