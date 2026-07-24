import { type FC, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

interface Props {
  children: ReactNode
}

const AdminGuard: FC<Props> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

export default AdminGuard
