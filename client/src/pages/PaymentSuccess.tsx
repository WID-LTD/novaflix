import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verifyPayment, setToken } from '../lib/auth'
import { useAuth } from '../lib/AuthContext'
import Icon from '../components/ui/Icon'
import OnboardingTour from '../components/ui/OnboardingTour'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState('')

  useEffect(() => {
    const reference = searchParams.get('reference')
    const plan = searchParams.get('plan') || 'basic'
    if (!reference) {
      setStatus('error')
      setError('No payment reference found')
      return
    }

    const token = localStorage.getItem('novaflix-token') || ''
    verifyPayment(token, reference, plan).then((res) => {
      if (res.success) {
        if (res.token) setToken(res.token)
        setStatus('success')
        refresh()
      } else {
        setStatus('error')
        setError(res.error || 'Payment verification failed')
      }
    })
  }, [searchParams, refresh])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <h1 className="text-headline-lg mb-2">Verifying Payment</h1>
            <p className="text-on-surface-variant">Please wait while we confirm your subscription...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <Icon name="check_circle" className="text-green-500 text-6xl mx-auto mb-6" />
            <h1 className="text-headline-lg mb-2">Payment Successful!</h1>
            <p className="text-on-surface-variant mb-8">Your plan has been upgraded. Welcome to <img src="/leter-mark-logo.png" alt="" className="h-4 w-auto inline align-middle" />!</p>
            <button
              id="tour-start-watching"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold hover:brightness-110"
            >
              Start Watching
              <Icon name="arrow_forward" />
            </button>
            <OnboardingTour
              storageKey="novaflix-onboarding-purchase"
              steps={[
                {
                  targetSelector: '#tour-start-watching',
                  title: 'You\'re All Set!',
                  description: 'Your premium plan is active. Click here to start exploring ad-free streaming, higher quality, and exclusive content.',
                  placement: 'top',
                },
              ]}
            />
          </>
        )}

        {status === 'error' && (
          <>
            <Icon name="error" className="text-red-500 text-6xl mx-auto mb-6" />
            <h1 className="text-headline-lg mb-2">Payment Issue</h1>
            <p className="text-on-surface-variant mb-2">{error}</p>
            <p className="text-body-sm text-on-surface-variant mb-8">If your payment was deducted, contact support with your reference: {searchParams.get('reference')}</p>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold hover:brightness-110"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
