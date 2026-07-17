import { type FC, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import Skeleton from '../ui/Skeleton'

interface Props {
  children: ReactNode
}

const CreatorGuard: FC<Props> = ({ children }) => {
  const { user, loading, isCreator } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
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
