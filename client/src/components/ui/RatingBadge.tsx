import type { FC } from 'react'
import { Star } from 'lucide-react'

interface RatingBadgeProps {
  rating: number
  className?: string
}

const RatingBadge: FC<RatingBadgeProps> = ({ rating, className = '' }) => {
  const color =
    rating >= 7 ? 'text-accent' : rating >= 5 ? 'text-accent-secondary' : 'text-red-400'

  return (
    <div className={`inline-flex items-center gap-1 ${color} ${className}`}>
      <Star className="w-4 h-4 fill-current" />
      <span className="font-semibold text-sm">{rating.toFixed(1)}</span>
    </div>
  )
}

export default RatingBadge
