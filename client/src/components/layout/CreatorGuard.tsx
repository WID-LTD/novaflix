import { type FC, type ReactNode, useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { getApplicationStatus } from '../../lib/auth'
import LoadingSpinner from '../ui/LoadingSpinner'

interface Props {
  children: ReactNode
}

const CreatorGuard: FC<Props> = ({ children }) => {
  const { user, loading, isCreator } = useAuth()
  const location = useLocation()
  const [appStatus, setAppStatus] = useState<any>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (user?.role === 'creator' && user.role !== 'admin') {
      getApplicationStatus()
        .then(res => setAppStatus(res))
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [user])

  if (loading || checking) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  if (!isCreator) {
    return <Navigate to="/home" replace />
  }

  // Admins bypass all creator checks
  if (user.role === 'admin') return <>{children}</>

  // Creators must pick a paid plan before accessing the dashboard
  const isOnChoosePlan = location.pathname === '/creator/choose-plan'
  if (user.plan === 'free' && !isOnChoosePlan) {
    return <Navigate to="/creator/choose-plan" replace />
  }

  // Pending approval -> redirect to pending screen
  if (appStatus?.application?.status === 'pending' && location.pathname !== '/creator/pending-claim') {
    return <Navigate to="/creator/pending-claim" replace />
  }

  return <>{children}</>
}

export default CreatorGuard
