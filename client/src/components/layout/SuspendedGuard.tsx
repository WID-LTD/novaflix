import { type FC, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

interface Props {
  children: ReactNode
}

const SuspendedGuard: FC<Props> = ({ children }) => {
  const { user, loading, accountStatus } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  if (accountStatus === 'suspended' || accountStatus === 'banned') {
    return <Navigate to="/suspended" replace />
  }

  return <>{children}</>
}

export default SuspendedGuard