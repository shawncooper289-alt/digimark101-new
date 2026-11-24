import Image from "next/image"
import { cn } from "@/lib/utils"

interface AvaAvatarProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showOnlineIndicator?: boolean
  isAnimated?: boolean
  /** When true (default on client platform / owner accounts), use the business-suit waist-up photo. */
  suit?: boolean
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
  suit = true,
}: AvaAvatarProps) {
  // Business-suit waist-up for client platform and owner-account views.
  // Office nightie visuals stay inside AvaSkye.online private surface only.
  const src = suit ? "/media/ava-float.png" : "/media/ava-city.jpg"

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
          src={src}
          alt=""
          fill
          sizes="96px"
          className="object-cover object-center"
        />
      </span>
      {showOnlineIndicator ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-paper bg-signal" />
      ) : null}
      <span className="sr-only">Ava Skye</span>
    </span>
  )
}
