import { cn } from "@/lib/utils"

interface DigiMarkLogoProps {
  className?: string
  variant?: "ink" | "paper"
  compact?: boolean
}

export function DigiMarkLogo({ className, compact = false }: DigiMarkLogoProps) {
  return (
    <span className={cn("inline-flex bg-transparent", className)}>
      <img
        src="/brand/digimark101-logo.svg"
        alt="DigiMark101"
        width={720}
        height={148}
        className={compact ? "h-10 w-auto" : "h-12 w-auto"}
      />
    </span>
  )
}
