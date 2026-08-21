import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import { motion } from 'framer-motion'

declare global {
  interface Window {
    Persona: any
  }
}

export default function ClaimVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const claimId = searchParams.get('claimId')
  const [kycStatus, setKycStatus] = useState<'loading' | 'pending' | 'approved' | 'declined' | 'error'>('loading')
  const [error, setError] = useState('')
  const personaClientRef = useRef(null)
  const statusCheckInterval = useRef(null)

  useEffect(() => {
    if (!claimId) {
      navigate('/creator/claim/start')
      return
    }

    const initPersona = async () => {
      try {
        // Load Persona SDK
        const script = document.createElement('script')
        script.src = 'https://cdn.withpersona.com/persona-web-sdk/v1/persona.js'
        script.async = true
        document.head.appendChild(script)

        await new Promise((resolve) => {
          script.onload = resolve
        })

        if (!window.Persona) {
          throw new Error('Persona SDK failed to load')
        }

        // Initialize embedded flow
        const templateId = import.meta.env.VITE_PERSONA_TEMPLATE_ID
        const environmentId = import.meta.env.VITE_PERSONA_ENV_ID

        if (!templateId || !environmentId) {
          throw new Error('Persona configuration missing')
        }

        personaClientRef.current = new window.Persona.Client({
          templateId,
          referenceId: claimId,
          environmentId,
          onReady: () => {
            personaClientRef.current.open()
          },
          onComplete: ({ inquiryId, status, fields }) => {
            console.log('Persona KYC complete:', { inquiryId, status })
            setKycStatus(status === 'approved' ? 'approved' : 'declined')
            // Start polling claim status
            startStatusPolling()
          },
          onCancel: ({ inquiryId }) => {
            setKycStatus('declined')
          },
          onError: (error) => {
            console.error('Persona error:', error)
            setError('KYC verification failed')
            setKycStatus('error')
          }
        })
      } catch (err) {
        console.error('Persona init error:', err)
        setError('Failed to load verification')
        setKycStatus('error')
      }
    }

    initPersona()

    return () => {
      if (statusCheckInterval.current) clearInterval(statusCheckInterval.current)
      if (personaClientRef.current) {
        personaClientRef.current.close()
      }
    }
  }, [claimId])

  const startStatusPolling = () => {
    statusCheckInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/creator/claim/status/${claimId}`)
        const data = await res.json()
        if (data.success) {
          const { claim_status, kyc_status } = data.claim
          if (claim_status === 'approved') {
            clearInterval(statusCheckInterval.current)
            navigate('/creator/claim/success')
          } else if (claim_status === 'denied') {
            clearInterval(statusCheckInterval.current)
            setKycStatus('declined')
          }
        }
      } catch (err) {
        console.error('Status polling error:', err)
      }
    }, 3000)
  }

  if (!claimId) return null

  const statusMessages = {
    loading: { icon: 'hourglass_empty', text: 'Loading verification...', color: 'text-primary' },
    pending: { icon: 'verified_user', text: 'Complete the verification in the window above', color: 'text-primary' },
    approved: { icon: 'check_circle', text: 'Verification approved! Redirecting...', color: 'text-primary' },
    declined: { icon: 'cancel', text: 'Verification was declined. You can try again.', color: 'text-error' },
    error: { icon: 'error', text: error || 'Verification failed. Please try again.', color: 'text-error' }
  }

  const current = statusMessages[kycStatus] || statusMessages.loading

  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-12 md:py-20">
        <div className="max-w-xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full bg-${kycStatus === 'approved' ? 'green' : kycStatus === 'declined' ? 'red' : 'primary'}-container/20 flex items-center justify-center mx-auto mb-6`}>
              <Icon name={current.icon} className="w-10 h-10 text-primary-container" />
            </div>
            <h1 className="text-headline-md font-bold text-on-surface mb-3">Identity Verification</h1>
            <p className="text-body-md text-on-surface-variant">
              {current.text}
            </p>
          </motion.div>

          {kycStatus === 'pending' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6 mb-6">
                <h3 className="font-label-lg text-on-surface mb-4 flex items-center gap-2">
                  <Icon name="verified_user" className="text-primary-container" />
                  Complete Your Verification
                </h3>
                <p className="text-body-md text-on-surface-variant mb-4">
                  The Persona verification window should open above. Please complete the following steps:
                </p>
                <ul className="space-y-3 text-body-md text-on-surface-variant">
                  <li className="flex items-center gap-3"><Icon name="check_circle" className="w-5 h-5 text-primary-container flex-shrink-0" /> Upload a clear photo of your government ID</li>
                  <li className="flex items-center gap-3"><Icon name="check_circle" className="w-5 h-5 text-primary-container flex-shrink-0" /> Take a selfie for liveness check</li>
                  <li className="flex items-center gap-3"><Icon name="check_circle" className="w-5 h-5 text-primary-container flex-shrink-0" /> Review and submit</li>
                </ul>
                <p className="text-body-sm text-on-surface-variant/60 mt-4">
                  This usually takes 2-3 minutes. Your claim will be automatically approved upon successful verification.
                </p>
              </div>
            )}

          {kycStatus === 'declined' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-surface-container-high border border-error/20 rounded-2xl p-6 mb-6">
                <h3 className="font-label-lg text-error mb-3 flex items-center gap-2">
                  <Icon name="cancel" className="w-5 h-5" /> Verification Declined
                </h3>
                <p className="text-body-md text-on-surface-variant mb-4">
                  Your identity verification was not approved. Common reasons include:
                </p>
                <ul className="space-y-2 text-body-md text-on-surface-variant mb-4">
                  <li className="flex items-center gap-2"><Icon name="fiber_manual_record" size="sm" /> Blurry or unclear ID photo</li>
                  <li className="flex items-center gap-2"><Icon name="fiber_manual_record" size="sm" /> Selfie doesn't match ID</li>
                  <li className="flex items-center gap-2"><Icon name="fiber_manual_record" size="sm" /> Expired or invalid document</li>
                </ul>
                <Button onClick={() => window.location.reload()} variant="secondary">
                  Try Again
                </Button>
              </div>
            )}

          {kycStatus === 'error' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-surface-container-high border border-error/20 rounded-2xl p-6 mb-6">
                <h3 className="font-label-lg text-error mb-3 flex items-center gap-2">
                  <Icon name="error" className="w-5 h-5" /> Verification Error
                </h3>
                <p className="text-body-md text-on-surface-variant mb-4">
                  {error || 'An error occurred during verification. Please try again.'}
                </p>
                <Button onClick={() => window.location.reload()}>
                  Retry Verification
                </Button>
              </div>
            )}
        </div>
      </Layout>
    )
  }
}