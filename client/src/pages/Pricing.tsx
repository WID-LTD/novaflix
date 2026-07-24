import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { initializePayment, getGatewayInfo } from '../lib/auth'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import Icon from '../components/ui/Icon'

interface Feature {
  label: string
  included: boolean
  bold?: boolean
}

const plans = [
  {
    id: 'student',
    name: 'Student',
    price: '₦800',
    description: 'For learners on a budget',
    popular: false,
    features: [
      { label: '720p HD Quality', included: true },
      { label: '1 device at a time', included: true },
      { label: 'Offline downloads (1 device)', included: true },
      { label: 'Ad-free listening', included: false },
      { label: '6 skips per hour', included: true },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₦1,500',
    description: 'Solo streaming essentials',
    popular: false,
    features: [
      { label: '720p HD Quality', included: true },
      { label: '1 device at a time', included: true },
      { label: 'Offline downloads (1 device)', included: true },
      { label: 'Ad-free listening', included: false },
      { label: '6 skips per hour', included: true },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '₦2,500',
    description: 'The sweet spot',
    popular: true,
    features: [
      { label: '1080p Full HD', included: true, bold: true },
      { label: '2 devices simultaneously', included: true },
      { label: 'Offline downloads (2 devices)', included: true },
      { label: 'Completely ad-free', included: true },
      { label: 'Unlimited skips', included: true },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₦5,500',
    description: 'Cinema grade experience',
    popular: false,
    features: [
      { label: '4K UHD + HDR10 / Dolby Vision', included: true, bold: true },
      { label: 'Spatial Audio', included: true },
      { label: '4 devices simultaneously', included: true },
      { label: 'Offline downloads (6 devices)', included: true },
      { label: 'Completely ad-free', included: true },
      { label: 'Exclusive premier access', included: true },
    ],
  },
]

export default function Pricing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('standard')
  const [gateway, setGateway] = useState<'paystack' | 'flutterwave'>('paystack')
  const [gateways, setGateways] = useState<{ paystack: { configured: boolean; publicKey: string }; flutterwave: { configured: boolean; publicKey: string } } | null>(null)

  useEffect(() => {
    if (user) {
      getGatewayInfo(localStorage.getItem('novaflix-token') || '').then(setGateways)
    }
  }, [user])

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId)
    if (!user) {
      navigate('/login')
      return
    }
    if (planId === 'free') return
    setLoading(planId)
    const token = localStorage.getItem('novaflix-token') || ''
    const res = await initializePayment(token, planId, gateway)
    setLoading(null)
    if (res.success) {
      if (res.authorization_url) {
        window.location.href = res.authorization_url
      } else {
        toast.error('Unexpected response from payment server')
      }
    } else {
      toast.error(res.error || 'Payment failed')
    }
  }

  const currentPlan = user?.plan || 'free'
  const isCurrentPlan = (planId: string) => currentPlan === planId && currentPlan !== 'free'

  return (
    <div className="min-h-screen bg-background">
      <div className="relative pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] opacity-20 pointer-events-none blur-[120px] bg-gradient-to-b from-primary-container to-transparent" />

        <div className="relative z-10 text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-surface-container-highest text-secondary font-label-md text-label-md mb-6 uppercase tracking-widest">Pricing Tiers</span>
          <h1 className="text-headline-lg md:text-display-lg mb-4 text-balance">Choose the plan that's right for you</h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">From students to cinephiles — every tier unlocks a premium <img src="/leter-mark-logo.png" alt="" className="h-5 w-auto inline align-middle" /> experience.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20" id="plan-selector">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id
            const isActive = isCurrentPlan(plan.id)
            return (
              <div
                key={plan.id}
                className={`relative group flex flex-col p-6 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-surface-container-high border-primary-container/50 scale-105 z-10 shadow-2xl'
                    : 'bg-surface-container border-outline-variant/30 hover:translate-y-[-8px]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary-container px-4 py-1 rounded-full font-label-md text-label-sm font-bold uppercase tracking-tighter whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-4 right-4 bg-secondary text-black px-3 py-1 rounded-full font-label-md text-label-sm font-bold">
                    Current
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-headline-md mb-1">{plan.name}</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-headline-lg font-bold">{plan.price}</span>
                    <span className="text-on-surface-variant text-body-md">/month</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-3">
                      {f.included ? (
                        <Icon name="check_circle" className="text-primary text-[20px]" />
                      ) : (
                        <Icon name="cancel" className="text-on-surface-variant/40 text-[20px]" />
                      )}
                      <span className={`text-body-md ${f.included ? (f.bold ? 'font-bold text-on-surface' : '') : 'text-on-surface-variant/60'}`}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={isActive}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-4 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-95'
                      : 'border border-primary-container text-primary-container hover:bg-primary-container hover:text-on-primary-container'
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : isActive ? (
                    'Current Plan'
                  ) : (
                    `Subscribe — ${plan.price}`
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          <span className="text-on-surface-variant text-body-md">Pay with</span>
          <button
            onClick={() => setGateway('paystack')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all ${
              gateway === 'paystack'
                ? 'bg-surface-container-high border-primary-container/50 scale-105 z-10'
                : 'bg-surface-container border-outline-variant/30 hover:brightness-110'
            }`}
          >
            <img src="/paystack-logo.svg" alt="Paystack" className="h-6" />
            <span className="font-label-md text-label-sm">Paystack</span>
            {gateways && !gateways.paystack.configured && (
              <span className="tooltip" data-tip="Keys not set — unavailable">
                <Icon name="warning" className="text-warning text-sm" />
              </span>
            )}
          </button>
          <button
            onClick={() => setGateway('flutterwave')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all ${
              gateway === 'flutterwave'
                ? 'bg-surface-container-high border-primary-container/50 scale-105 z-10'
                : 'bg-surface-container border-outline-variant/30 hover:brightness-110'
            }`}
          >
            <img src="/flutterwave-logo.svg" alt="Flutterwave" className="h-6" />
            <span className="font-label-md text-label-sm">Flutterwave</span>
            {gateways && !gateways.flutterwave.configured && (
              <span className="tooltip" data-tip="Keys not set — unavailable">
                <Icon name="warning" className="text-warning text-sm" />
              </span>
            )}
          </button>
        </div>

        <div className="text-center">
          <Link to="/settings" className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors group">
            Manage your subscription
            <Icon name="arrow_forward" size="sm" className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="mt-24 rounded-2xl overflow-hidden h-64 md:h-96 relative">
          <div className="w-full h-full bg-gradient-to-br from-primary-container/20 via-surface to-surface" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
            <p className="font-label-md text-label-md text-secondary mb-2">EXPERIENCE THE NEXUS</p>
            <h4 className="text-headline-md md:text-headline-lg max-w-xl">Studio quality content in every frame, everywhere you are.</h4>
          </div>
        </div>
      </div>
    </div>
  )
}
