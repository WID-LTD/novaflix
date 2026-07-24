import { type FC, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

interface Props {
  children: ReactNode
}

const CreatorGuard: FC<Props> = ({ children }) => {
  const { user, loading, isCreator } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  if (!isCreator) {
    return <Navigate to="/home" replace />
  }

  // Creators must pick a paid plan before accessing the dashboard
  const isOnChoosePlan = location.pathname === '/creator/choose-plan'
  if (user.plan === 'free' && !isOnChoosePlan) {
    return <Navigate to="/creator/choose-plan" replace />
  }

  return <>{children}</>
}

export default CreatorGuard
