import { TrackedLink } from "@/components/site/tracked-link"

export function StartActions({ eventPrefix = "cta", compact = false }: { eventPrefix?: string; compact?: boolean }) {
  const size = compact ? "" : "text-base"
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <TrackedLink href="/beta" event={`${eventPrefix}_beta`} className={`btn btn-signal w-full sm:w-auto ${size}`}>
        Claim a free beta seat
      </TrackedLink>
      <TrackedLink href="/signup" event={`${eventPrefix}_signup`} className={`btn btn-ghost w-full sm:w-auto ${size}`}>
        Create an account
      </TrackedLink>
    </div>
  )
}
