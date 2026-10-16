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
      <svg viewBox="0 0 80 80" className={cn(SIZE_MAP[size], isAnimated && "motion-safe:animate-pulse")} aria-hidden="true">
        <circle cx="40" cy="40" r="38" fill="#35105d" />
        <circle cx="40" cy="40" r="30" fill="#f6f1fb" />
        <rect x="24" y="32" width="10" height="3" rx="1.5" fill="#35105d" />
        <rect x="46" y="32" width="10" height="3" rx="1.5" fill="#35105d" />
        <path d="M30 48c4 6 16 6 20 0" fill="none" stroke="#8738b9" strokeWidth="3" strokeLinecap="round" />
        <circle cx="58" cy="18" r="5" fill="#8738b9" />
      </svg>
      {showOnlineIndicator ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#2a0c4a]" />
      ) : null}
      <span className="sr-only">Ava Skye</span>
    </span>
  )
}
