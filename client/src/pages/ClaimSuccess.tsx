import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { motion } from 'framer-motion'

export default function ClaimSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/creator/onboarding')
    }, 5000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-12 md:py-20">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="w-28 h-28 rounded-full bg-green-container/20 flex items-center justify-center mx-auto mb-8">
              <Icon name="celebration" className="w-16 h-16 text-green" />
            </div>
            <h1 className="text-headline-lg font-bold text-on-surface mb-4">
              Profile Claimed Successfully!
            </h1>
            <p className="text-body-lg text-on-surface-variant mb-8">
              Your identity has been verified and your creator profile is now active.
              You're ready to start earning from your content.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="bg-green-container/10 border border-green/20 rounded-2xl p-6">
              <h3 className="font-label-lg text-green mb-4 flex items-center gap-2">
                <Icon name="verified_user" className="w-5 h-5" /> What's Next?
              </h3>
              <ul className="space-y-3 text-body-md text-on-surface-variant">
                <li className="flex items-center gap-3"><Icon name="check_circle" className="w-5 h-5 text-green flex-shrink-0" /> Set up your bank account for payouts</li>
                <li className="flex items-center gap-3"><Icon name="check_circle" className="w-5 h-5 text-green flex-shrink-0" /> Configure your PPM rate</li>
                <li className="flex items-center gap-3"><Icon name="check_circle" className="w-5 h-5 text-green flex-shrink-0" /> Start earning from your content</li>
              </ul>
            </div>

            <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6">
              <h3 className="font-label-lg text-on-surface mb-4 flex items-center gap-2">
                <Icon name="account_balance_wallet" className="w-5 h-5 text-primary-container" />
                Your Wallet is Ready
              </h3>
              <p className="text-body-md text-on-surface-variant mb-4">
                Your wallet has been activated with real-time PPM earnings. 
                You'll earn from every minute watched across all your content.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-surface-container rounded-xl p-4 text-center">
                  <p className="text-headline-md font-bold text-primary-container">₦0</p>
                  <p className="text-label-sm text-on-surface-variant mt-1">Wallet Balance</p>
                </div>
                <div className="bg-surface-container rounded-xl p-4 text-center">
                  <p className="text-headline-md font-bold text-primary-container">0</p>
                  <p className="text-label-sm text-on-surface-variant mt-1">Minutes Streamed</p>
                </div>
                <div className="bg-surface-container rounded-xl p-4 text-center">
                  <p className="text-headline-md font-bold text-primary-container">₦0</p>
                  <p className="text-label-sm text-on-surface-variant mt-1">Total Earnings</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pt-8"
          >
            <Button onClick={() => navigate('/creator/onboarding')} size="lg" className="w-full md:w-auto">
              <Icon name="arrow_forward" size="sm" className="mr-2" />
              Continue to Wallet Setup
            </Button>
            <p className="text-body-sm text-on-surface-variant/60 mt-4">
              Redirecting automatically in 5 seconds...
            </p>
          </motion.div>
        </div>
      </Layout>
    )
  }
}