import { AvaVoiceWidget } from '@/components/ava/voice-widget'

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white via-purple-50 to-pink-50 p-10">
      <section className="max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">DigiMark101</h1>
        <p className="text-lg text-gray-700">
          Ava voice assistant scaffold is now assembled. Connect your Supabase and API keys to enable full production behavior.
        </p>
        <a href="https://avaskye.online/studio" className="mt-6 inline-block rounded-full bg-purple-700 px-6 py-3 font-semibold text-white">Open AvaSkye creative studio ↗</a>
      </section>

      <section className="mt-12 max-w-4xl"><h2 className="text-2xl font-bold">Ava seat pricing</h2><p className="mt-4">Starter: $27/person/month · 500 credits. Creator: $50 · 1,500 credits. Power: $89 · 4,000 credits.</p><p className="mt-4">All seats include full Ava knowledge and creative skills: emails, social posts, writing, brainstorming and next actions. Copy/paste manually. Agency publishing, automations and API access are separate upgrades.</p><p className="mt-4">Extra usage: $10 / 300 credits, $25 / 900, $50 / 2,000. Included credits reset monthly; purchased credits remain while subscribed. No automatic overages. Allowances provisional pending cost testing. Payments and credit enforcement are not yet live.</p><a href="https://avaskye.online/pricing" className="mt-4 inline-block underline">View AvaSkye plans</a></section>
      <AvaVoiceWidget userId="demo-user" />
    </main>
  )
}
