interface DigiMarkLogoProps {
  width?: number
  height?: number
  variant?: 'default' | 'white'
}

export function DigiMarkLogo({ width = 120, height = 28, variant = 'default' }: DigiMarkLogoProps) {
  const color = variant === 'white' ? '#ffffff' : '#111827'

  return (
    <svg width={width} height={height} viewBox="0 0 240 56" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DigiMark101 logo">
      <rect x="0" y="0" width="56" height="56" rx="14" fill="url(#grad)" />
      <text x="15" y="36" fill="white" fontFamily="Arial" fontWeight="700" fontSize="20">DM</text>
      <text x="68" y="35" fill={color} fontFamily="Arial" fontWeight="700" fontSize="24">DigiMark101</text>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  )
}
