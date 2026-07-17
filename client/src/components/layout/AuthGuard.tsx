import { type FC, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, getPlanRank } from '../../lib/AuthContext'
import Skeleton from '../ui/Skeleton'

interface Props {
  children: ReactNode
  requirePremium?: boolean
  requirePlan?: string
  creatorOnly?: boolean
}

const AuthGuard: FC<Props> = ({ children, requirePremium, requirePlan, creatorOnly }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton variant="poster" className="w-24 h-36 mx-auto" />
          <Skeleton variant="text" className="w-48 h-4 mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  if (creatorOnly && user.role !== 'creator' && user.role !== 'admin') {
    return <Navigate to="/creator/login" replace />
  }

  const currentRank = getPlanRank(user.plan)
  const minPlan = requirePlan || (requirePremium ? 'premium' : null)

  if (minPlan && currentRank < getPlanRank(minPlan)) {
    return <Navigate to={`/pricing?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}

export default AuthGuard
