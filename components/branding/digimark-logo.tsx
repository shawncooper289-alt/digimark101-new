import Image from "next/image"
import { cn } from "@/lib/utils"

interface DigiMarkLogoProps {
  className?: string
  variant?: "ink" | "paper"
  compact?: boolean
}

export function DigiMarkLogo({ className, variant = "ink", compact = false }: DigiMarkLogoProps) {
  const image = (
    // The official lockup is a wide SVG. Height is fixed so the header stays stable.
    <Image
      src="/brand/digimark101-logo.svg"
      alt="DigiMark101"
      width={720}
      height={300}
      priority
      className={compact ? "h-9 w-auto" : "h-12 w-auto"}
    />
  )

  if (variant === "paper") {
    return <span className={cn("inline-flex rounded-2xl bg-[#eae4d7] px-2 py-1", className)}>{image}</span>
  }

  return <span className={cn("inline-flex", className)}>{image}</span>
}
