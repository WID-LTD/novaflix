import type { FC } from 'react'

interface SkeletonProps {
  variant?: 'text' | 'card' | 'poster' | 'hero'
  className?: string
  width?: string | number
  height?: string | number
}

const variantStyles: Record<string, string> = {
  text: 'h-4 rounded-md',
  card: 'aspect-[2/3] rounded-xl',
  poster: 'aspect-[2/3] rounded-xl',
  hero: 'w-full h-[70vh] rounded-2xl',
}

const Skeleton: FC<SkeletonProps> = ({ variant = 'text', className = '', width, height }) => {
  return (
    <div
      className={`shimmer ${variantStyles[variant]} ${className}`}
      style={{ width, height }}
    />
  )
}

export default Skeleton
