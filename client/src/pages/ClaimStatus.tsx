import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import { motion } from 'framer-motion'

export default function ClaimStatus() {
  const { claimId } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/creator/claim/status/${claimId}`)
        const data = await res.json()
        if (data.success) {
          setClaim(data.claim)
          if (data.claim.claim_status === 'approved') {
            setLoading(false)
            setTimeout(() => navigate('/creator/claim/success'), 2000)
          } else if (data.claim.claim_status === 'denied') {
            setLoading(false)
          } else {
            // Still pending, poll again
            setTimeout(pollStatus, 3000)
          }
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Status polling error:', err)
        setLoading(false)
      }
    }

    pollStatus()
  }, [claimId, navigate])

  if (loading && !claim) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-primary-container mx-auto mb-6" />
            <h2 className="text-headline-sm font-bold text-on-surface">Checking claim status...</h2>
            <p className="text-body-md text-on-surface-variant mt-2">This usually takes a few moments</p>
          </div>
        </Layout>
    )
  }

  if (!claim) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Icon name="error" className="w-16 h-16 text-error mx-auto mb-4" />
            <h2 className="text-headline-sm font-bold text-on-surface">Claim not found</h2>
            <Button onClick={() => navigate('/creator/claim/start')} className="mt-4">
              Start New Claim
            </Button>
          </div>
        </Layout>
    )
  }

  const statusConfig = {
    pending: { icon: 'hourglass_empty', text: 'Verification in Progress', color: 'text-primary', bg: 'bg-primary-container/10' },
    approved: { icon: 'check_circle', text: 'Claim Approved!', color: 'text-green', bg: 'bg-green-container/10' },
    denied: { icon: 'cancel', text: 'Claim Denied', color: 'text-error', bg: 'bg-red-container/10' }
  }

  const config = statusConfig[claim.claim_status] || statusConfig.pending

  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-12 md:py-20">
        <div className="max-w-xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className={`w-24 h-24 rounded-full ${config.bg} flex items-center justify-center mx-auto mb-6`}>
              <Icon name={config.icon} className="w-12 h-12 ${config.color}" />
            </div>
            <h1 className="text-headline-lg font-bold text-on-surface mb-3">{config.text}</h1>
            <p className="text-body-lg text-on-surface-variant">
              Claim ID: {claim.id.slice(0, 8)}...
            </p>
          </motion.div>

          {claim.claim_status === 'pending' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6">
                <h3 className="font-label-lg text-on-surface mb-4 flex items-center gap-2">
                  <Icon name="info" className="w-5 h-5 text-primary-container" />
                  What happens next?
                </h3>
                <ul className="space-y-3 text-body-md text-on-surface-variant">
                  <li className="flex items-center gap-3"><Icon name="check_circle" className="w-5 h-5 text-primary-container flex-shrink-0" /> Persona verification in progress</li>
                  <li className="flex items-center gap-3"><Icon name="check_circle" className="w-5 h-5 text-primary-container flex-shrink-0" /> Automatic approval upon successful verification</li>
                  <li className="flex items-center gap-3"><Icon name="check_circle" className="w-5 h-5 text-primary-container flex-shrink-0" /> Wallet activation and onboarding</li>
                </ul>
                <p className="text-body-sm text-on-surface-variant/60 mt-4">
                  This page will automatically redirect when complete.
                </p>
              </div>
            )}

          {claim.claim_status === 'approved' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-green-container/10 border border-green/20 rounded-2xl p-6">
                <h3 className="font-label-lg text-green mb-3 flex items-center gap-2">
                  <Icon name="check_circle" className="w-5 h-5" /> Claim Approved!
                </h3>
                <p className="text-body-md text-on-surface-variant mb-4">
                  Your identity has been verified and your creator profile has been claimed.
                  You'll be redirected to your wallet setup in a moment.
                </p>
                <Button onClick={() => navigate('/creator/onboarding')} size="lg" className="w-full">
                  <Icon name="arrow_forward" size="sm" className="mr-2" /> Continue to Wallet Setup
                </Button>
              </div>
            )}

          {claim.claim_status === 'denied' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-red-container/10 border border-red/20 rounded-2xl p-6">
                <h3 className="font-label-lg text-error mb-3 flex items-center gap-2">
                  <Icon name="cancel" className="w-5 h-5" /> Claim Denied
                </h3>
                <p className="text-body-md text-on-surface-variant mb-4">
                  Your claim was not approved. This could be due to verification failure or the profile being already claimed.
                </p>
                <Button onClick={() => navigate('/creator/claim/start')} variant="secondary" className="w-full">
                  <Icon name="refresh" size="sm" className="mr-2" /> Try Again
                </Button>
              </div>
            )}
        </div>
      </Layout>
    )
  }
}