import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Crown, Check, X, Monitor, Download, Sparkles, Film } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { confirmPayment } from '../lib/auth'
import Button from '../components/ui/Button'
import PremiumBadge from '../components/ui/PremiumBadge'
import { useToast } from '../components/ui/Toast'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Explore and discover',
    features: [
      { label: 'Ad-supported streaming', included: true },
      { label: '720p max resolution', included: true },
      { label: 'Basic recommendations', included: true },
      { label: 'Skip ads', included: false },
      { label: '4K HDR streaming', included: false },
      { label: 'Offline downloads', included: false },
      { label: 'Early access to premieres', included: false },
      { label: 'Creator analytics', included: false },
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    description: 'The full experience',
    features: [
      { label: 'Ad-free streaming', included: true },
      { label: '4K HDR streaming', included: true },
      { label: 'Offline downloads', included: true },
      { label: 'Early access to premieres', included: true },
      { label: 'Advanced recommendations', included: true },
      { label: 'Creator analytics dashboard', included: true },
      { label: 'Watch parties', included: true },
      { label: 'Priority support', included: true },
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Duo',
    price: '$14.99',
    period: '/month',
    description: 'Share with someone',
    features: [
      { label: 'Everything in Premium', included: true },
      { label: '2 separate profiles', included: true },
      { label: 'Simultaneous streams', included: true },
      { label: 'Shared watchlist', included: true },
      { label: 'Duo playlists', included: true },
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
]

export default function Pricing() {
  const navigate = useNavigate()
  const { user, isPremium } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectPlan = async (planName: string) => {
    if (!user) {
      navigate('/login')
      return
    }
    if (planName === 'Free') {
      toast.info('You are already on the Free plan')
      return
    }
    setLoading(planName)
    const res = await confirmPayment(localStorage.getItem('novaflix-token') || '', planName.toLowerCase())
    setLoading(null)
    if (res.success) {
      toast.success(`Upgraded to ${planName}!`)
      setTimeout(() => window.location.reload(), 1000)
    } else {
      toast.error(res.error || 'Payment failed')
    }
  }

  return (
    <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <Crown className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl md:text-section font-bold mb-3">
            Choose Your <span className="text-accent">Plan</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            {user ? `You're on the ${isPremium ? 'Premium' : 'Free'} plan` : 'Start free and upgrade when you\'re ready. No hidden fees, cancel anytime.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-surface-card border rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? 'border-premium/50 ring-1 ring-premium/30'
                  : 'border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <PremiumBadge size="md" label="Most Popular" />
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm">
                    {f.included ? (
                      <Check className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-gray-600 shrink-0" />
                    )}
                    <span className={f.included ? 'text-gray-200' : 'text-gray-500'}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full"
                size="lg"
                loading={loading === plan.name}
                onClick={() => handleSelectPlan(plan.name)}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 bg-surface-card border border-white/10 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" /> Compare Features
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 pr-4 text-gray-400 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Free</th>
                  <th className="text-center py-3 px-4 text-accent font-semibold">Premium</th>
                  <th className="text-center py-3 pl-4 text-gray-400 font-medium">Duo</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Streaming quality', '720p', '4K HDR', '4K HDR'],
                  ['Ads', 'Yes', 'No', 'No'],
                  ['Offline downloads', 'No', 'Yes', 'Yes'],
                  ['Simultaneous streams', '1', '3', '6'],
                  ['Profiles', '1', '3', '2'],
                  ['Creator analytics', 'No', 'Yes', 'Yes'],
                  ['Watch parties', 'No', 'Yes', 'Yes'],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-gray-300">{row[0]}</td>
                    <td className="text-center py-3 px-4 text-gray-500">{row[1]}</td>
                    <td className="text-center py-3 px-4 text-accent font-medium">{row[2]}</td>
                    <td className="text-center py-3 pl-4 text-gray-300">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
