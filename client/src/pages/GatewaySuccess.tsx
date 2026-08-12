import { useEffect, useState } from 'react'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { verifyGlowGift, verifyTip } from '../lib/auth'
import Icon from '../components/ui/Icon'

export default function GatewaySuccess() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState('')

  const isTip = location.pathname.startsWith('/tips')

  useEffect(() => {
    const reference = searchParams.get('reference')
    if (!reference) {
      setStatus('error')
      setError('No payment reference found')
      return
    }
    const token = localStorage.getItem('novaflix-token') || ''
    const verify = isTip ? verifyTip(token, reference) : verifyGlowGift(token, reference)
    verify.then((res) => {
      if (res.success) setStatus('success')
      else setStatus('error')
      if (res.error) setError(res.error)
    })
  }, [searchParams, isTip])

  const backLabel = isTip ? 'Back to Movie' : 'Back to Profile'
  const backTo = isTip ? '/movie' : '/profile'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <h1 className="text-headline-lg mb-2">Verifying Payment</h1>
            <p className="text-on-surface-variant">Please wait while we confirm your {isTip ? 'tip' : 'gift'}...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <Icon name="check_circle" className="text-green-500 text-6xl mx-auto mb-6" />
            <h1 className="text-headline-lg mb-2">{isTip ? 'Tip Sent!' : 'Gift Sent!'}</h1>
            <p className="text-on-surface-variant mb-8">Your {isTip ? 'support' : 'gift'} has been delivered. Thank you!</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold hover:brightness-110"
            >
              Continue Browsing
              <Icon name="arrow_forward" />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <Icon name="error" className="text-red-500 text-6xl mx-auto mb-6" />
            <h1 className="text-headline-lg mb-2">Payment Issue</h1>
            <p className="text-on-surface-variant mb-2">{error}</p>
            <p className="text-body-sm text-on-surface-variant mb-8">If your payment was deducted, contact support with your reference: {searchParams.get('reference')}</p>
            <button
              onClick={() => navigate(backTo)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold hover:brightness-110"
            >
              {backLabel}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
