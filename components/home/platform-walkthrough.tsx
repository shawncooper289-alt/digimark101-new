import { PlatformVideo } from "@/components/home/platform-video"
import {
  PLATFORM_WALKTHROUGH_CAPTIONS,
  PLATFORM_WALKTHROUGH_POSTER,
  platformWalkthroughUrl,
  platformWalkthroughWebm,
} from "@/lib/video/platform-walkthrough"

export function PlatformWalkthrough() {
  const src = platformWalkthroughUrl()
  const webm = src ? platformWalkthroughWebm(src) : ""

  return (
    <section id="walkthrough" className="scroll-mt-24 border-b border-ink/10" aria-labelledby="walkthrough-heading">
      <div className="home-wrap grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="home-kicker">Walkthrough</p>
          <h2 id="walkthrough-heading" className="home-title">
            See the public site, without a made-up result.
          </h2>
          <p className="home-lede">
            About twelve seconds, with no narration. It shows the live homepage, the platform section, pricing, and the contact form. It is not a client story, and it does not play until you start it.
          </p>
        </div>
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-[1.4rem] border border-signal/35">
            <PlatformVideo
              src={src}
              webm={webm}
              poster={PLATFORM_WALKTHROUGH_POSTER}
              captions={PLATFORM_WALKTHROUGH_CAPTIONS}
              title="DigiMark101 platform walkthrough"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
