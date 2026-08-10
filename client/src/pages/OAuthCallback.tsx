import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { setToken } from '../lib/auth'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useAuth()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token = searchParams.get('token')
    const redirect = searchParams.get('redirect')
    const error = searchParams.get('error')
    const dest = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/home'

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setToken(token)
    refresh().then(() => {
      navigate(dest, { replace: true })
    })
  }, [searchParams, navigate, refresh])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin w-10 h-10 border-2 border-primary-container border-t-transparent rounded-full" />
        <p className="text-body-md text-on-surface-variant">Completing sign-in…</p>
      </div>
    </div>
  )
}
