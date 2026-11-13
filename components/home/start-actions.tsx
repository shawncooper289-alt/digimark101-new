import Link from "next/link"
import { OpenAvaButton } from "@/components/ava/open-ava-button"

export function StartActions({ compact = false }: { compact?: boolean }) {
  const size = compact ? "" : "text-base"
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Link href="/signup" className={`btn btn-signal w-full sm:w-auto ${size}`}>
        Create your account
      </Link>
      <OpenAvaButton className={`btn btn-ink w-full sm:w-auto ${size}`}>Try Ava</OpenAvaButton>
      <Link href="/beta" className={`btn btn-ghost w-full sm:w-auto ${size}`}>
        Join the beta
      </Link>
    </div>
  )
}
