import type { FC } from 'react'
import Icon from './Icon'
import { useNavigate } from 'react-router-dom'
import Button from './Button'

interface LockedOverlayProps {
  feature: string
  description?: string
  className?: string
}

const LockedOverlay: FC<LockedOverlayProps> = ({
  feature,
  description = 'Available on Premium plan',
  className = '',
}) => {
  const navigate = useNavigate()

  return (
    <div
      className={`absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-accent/20 border border-premium/30 flex items-center justify-center">
        <Icon name="lock" className="w-6 h-6 text-primary-container" />
      </div>
      <p className="text-white font-semibold text-lg">{feature}</p>
      <p className="text-gray-400 text-sm">{description}</p>
      <Button
        size="sm"
        onClick={() => navigate('/pricing')}
        className="mt-2"
      >
        <Icon name="workspace_premium" fill={true} /> Upgrade to Premium
      </Button>
    </div>
  )
}

export default LockedOverlay
