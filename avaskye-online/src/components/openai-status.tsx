import { openAiStatus } from "@/lib/openai/server"

/** Owner-only. The key is never rendered. */
export function OpenAiStatus() {
  const status = openAiStatus()
  return (
    <div className="mt-6 rounded-3xl border border-border bg-surface p-4">
      <h2 className="text-2xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>OpenAI</h2>
      <p className="mt-2">{status.connected ? "OpenAI is connected." : "OpenAI is not connected."}</p>
      <p className="mt-2 text-sm text-muted">
        {status.connected
          ? `Ava answers with the model ${status.model}. The key stays on this server and is not shown here.`
          : "Add OPENAI_API_KEY in the Vercel project avaskye-online. The customer site is a separate project, digimark101.com, and needs the same variable there. OPENAI_MODEL is optional. Nothing is invented while this is off."}
      </p>
      <p className="mt-2 text-sm text-muted">OpenAI speech, and realtime if it is turned on later, uses the voice coral. ElevenLabs stays the main voice when that key is set.</p>
    </div>
  )
}
