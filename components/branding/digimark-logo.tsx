import { cn } from "@/lib/utils"

interface DigiMarkLogoProps {
  className?: string
  variant?: "ink" | "paper"
  compact?: boolean
}

export function DigiMarkLogo({ className, compact = false }: DigiMarkLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 bg-transparent", className)}>
      <img
        src="/brand/digimark101-logo.png"
        alt=""
        width={384}
        height={384}
        className={compact ? "h-10 w-10 shrink-0 object-contain" : "h-12 w-12 shrink-0 object-contain"}
      />
      <span className="whitespace-nowrap text-lg font-semibold">DigiMark101</span>
    </span>
  )
}
