import type { FC, ReactNode } from 'react'

interface BadgeProps {
  variant?: 'accent' | 'success' | 'info' | 'warning' | 'outline'
  children: ReactNode
  className?: string
}

const variantStyles: Record<string, string> = {
  accent: 'bg-accent/20 text-accent border border-accent/30',
  success: 'bg-accent/20 text-accent border border-success/30',
  info: 'bg-accent/20 text-accent border border-info/30',
  warning: 'bg-white/20 text-accent-secondary border border-warning/30',
  outline: 'bg-transparent text-on-surface-variant border border-white/20',
}

const Badge: FC<BadgeProps> = ({ variant = 'accent', children, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
