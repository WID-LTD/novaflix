import type { FC, ReactNode } from 'react'

interface BadgeProps {
  variant?: 'accent' | 'success' | 'info' | 'warning' | 'outline'
  children: ReactNode
  className?: string
}

const variantStyles: Record<string, string> = {
  accent: 'bg-accent/20 text-accent border border-accent/30',
  success: 'bg-success/20 text-success border border-success/30',
  info: 'bg-info/20 text-info border border-info/30',
  warning: 'bg-warning/20 text-warning border border-warning/30',
  outline: 'bg-transparent text-gray-300 border border-white/20',
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
