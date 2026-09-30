import { cn } from '@/lib/utils'

interface AvaAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showOnlineIndicator?: boolean
  isAnimated?: boolean
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
}

export function AvaAvatar({
  size = 'md',
  className,
  showOnlineIndicator = false,
  isAnimated = false,
}: AvaAvatarProps) {
  return (
    <div className={cn('relative rounded-full', className)}>
      <div
        className={cn(
          'rounded-full bg-white/20 backdrop-blur-sm border border-white/40 text-white font-bold grid place-items-center',
          SIZE_MAP[size],
          isAnimated && 'animate-pulse'
        )}
      >
        A
      </div>
      {showOnlineIndicator && (
        <span className="absolute -bottom-0.5 -right-0.5 block w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  )
}
