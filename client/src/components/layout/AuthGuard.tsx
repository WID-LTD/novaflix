import { type FC, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, getPlanRank } from '../../lib/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

interface Props {
  children: ReactNode
  requirePremium?: boolean
  requirePlan?: string
  creatorOnly?: boolean
}

const AuthGuard: FC<Props> = ({ children, requirePremium, requirePlan, creatorOnly }) => {
  const { user, loading, accountStatus } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  if ((accountStatus === 'suspended' || accountStatus === 'banned') && location.pathname !== '/suspended') {
    return <Navigate to="/suspended" replace />
  }

  if (creatorOnly && user.role !== 'creator' && user.role !== 'admin') {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  const currentRank = getPlanRank(user.plan)
  const minPlan = requirePlan || (requirePremium ? 'premium' : null)

  if (minPlan && currentRank < getPlanRank(minPlan)) {
    return <Navigate to={`/pricing?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}

export default AuthGuard
