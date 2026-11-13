import { VideoMaker } from "@/components/studio/video-maker"

export const dynamic = "force-dynamic"

export default function StudioVideoPage() {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">Video maker</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Start with the idea. Ava writes the script in plain language, then the scenes, the captions, and the render. A finished video stays on the premium setting. A preview draft is marked as a draft and is not a finished video.
      </p>
      <div className="mt-8">
        <VideoMaker />
      </div>
    </section>
  )
}
