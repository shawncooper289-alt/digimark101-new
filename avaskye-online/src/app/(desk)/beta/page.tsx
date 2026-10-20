import { requireOwner } from "@/lib/desk"
import { BetaLinks } from "@/components/beta-links"
export default async function BetaPage() {
  if (!(await requireOwner())) return null
  return <section>
    <p className="text-xs uppercase tracking-widest text-accent">Owner-only sharing desk</p>
    <h1 className="mt-3 text-5xl">Beta tester access</h1>
    <p className="mt-4 max-w-2xl text-muted">Share only the public links below, never this office or your owner login. Account signup and core studio operations do not require a payment in the current application. Testers create their own private customer accounts.</p>
    <BetaLinks />
    <h2 className="mt-8 text-2xl">What this access does—and does not—include</h2>
    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
      <li>Signup, email confirmation when enabled, login, and the core customer workspace. Live functions still require their configured services.</li>
      <li>No automatic charge or membership starts from signup. Paid lead releases and PayPal checkout are not bypassed.</li>
      <li>These are public registration links, not private invitation tokens. They do not expire, enforce a beta quota, or grant paid entitlements.</li>
      <li>No office access, owner privileges, shared customer records, or payment credentials are granted to testers.</li>
      <li>Use test data and avoid purchases. The live customer site is not an isolated payments sandbox.</li>
      <li>A Google Play closed-testing link must be created separately after an Android testing release exists.</li>
    </ul>
  </section>
}
