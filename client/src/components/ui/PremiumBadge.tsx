import type { FC } from 'react'
import { Crown } from 'lucide-react'

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizeStyles: Record<string, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
}

const iconSizes: Record<string, string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

const PremiumBadge: FC<PremiumBadgeProps> = ({ size = 'sm', label = 'Premium', className = '' }) => {
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full bg-gradient-to-r from-accent to-accent-secondary-light text-black ${sizeStyles[size]} ${className}`}
    >
      <Crown className={`${iconSizes[size]} fill-current`} />
      {label}
    </span>
  )
}

export default PremiumBadge
