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

      <AvaVoiceWidget userId="demo-user" />
    </main>
  )
}
