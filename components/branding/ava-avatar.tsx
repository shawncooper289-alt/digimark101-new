import Image from "next/image"
import { cn } from "@/lib/utils"

interface AvaAvatarProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showOnlineIndicator?: boolean
  isAnimated?: boolean
}

const SIZE_MAP = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-24 w-24",
}

export function AvaAvatar({
  size = "md",
  className,
  showOnlineIndicator = false,
  isAnimated = false,
}: AvaAvatarProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "relative overflow-hidden rounded-full bg-pine ring-1 ring-signal/50",
          SIZE_MAP[size],
          isAnimated && "motion-safe:animate-pulse",
        )}
      >
        <Image
          src="/media/skye-desk-standing.jpg"
          alt=""
          fill
          sizes="96px"
          className="object-cover object-[30%_22%]"
        />
      </span>
      {showOnlineIndicator ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-paper bg-signal" />
      ) : null}
      <span className="sr-only">Ava Skye</span>
    </span>
  )
}
