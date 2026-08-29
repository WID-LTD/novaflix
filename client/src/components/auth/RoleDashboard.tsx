import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function RoleDashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />
    case 'creator':
      return <Navigate to="/creator" replace />
    case 'viewer':
    default:
      return <Navigate to="/home" replace />
  }
}
