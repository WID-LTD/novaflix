interface IconProps {
  name: string
  fill?: boolean
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700
  size?: 'sm' | 'md' | 'lg' | 'xl' | string
  className?: string
  onClick?: () => void
}

const sizeMap = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl',
}

export default function Icon({ name, fill, weight = 400, size = 'md', className = '', onClick }: IconProps) {
  const fontSize = sizeMap[size as keyof typeof sizeMap] || size
  return (
    <span
      className={`material-symbols-outlined select-none ${fontSize} ${className}`}
      style={{ fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24` }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      {name}
    </span>
  )
}
