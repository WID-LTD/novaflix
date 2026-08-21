import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBeneficiary, getBeneficiaries, getBankCodes } from '../lib/auth'
import { useToast } from '../components/ui/Toast'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { motion } from 'framer-motion'

const gateways = [
  { id: 'paystack', name: 'Paystack', icon: 'account_balance', color: 'text-blue-400', desc: 'Nigeria bank transfers, USSD, cards' },
  { id: 'flutterwave', name: 'Flutterwave', icon: 'sync', color: 'text-purple-400', desc: 'Africa mobile money, bank transfers, cards' }
]

export default function CreatorOnboarding() {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(0) // 0: gateway select, 1: form, 2: verification, 3: complete
  const [selectedGateway, setSelectedGateway] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [banks, setBanks] = useState([])
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verifiedName, setVerifiedName] = useState('')
  const [saving, setSaving] = useState(false)
  const [completedGateways, setCompletedGateways] = useState([])

  useEffect(() => {
    loadExisting()
  }, [])

  const loadExisting = async () => {
    try {
      const res = await getBeneficiaries()
      if (res.success) {
        const b = res.beneficiaries
        const completed = []
        if (b.paystack_recipient_code) completed.push('paystack')
        if (b.flutterwave_beneficiary_id) completed.push('flutterwave')
        setCompletedGateways(completed)
        if (completed.length === 2) {
          setStep(3)
        }
      }
    } catch (err) {
      console.error('Load existing error:', err)
    }
  }

  const loadBanks = async () => {
    try {
      const res = await getBankCodes(selectedGateway)
      if (res.success) setBanks(res.banks)
    } catch (err) {
      toast.error('Failed to load banks')
    }
  }

  const handleGatewaySelect = (gateway) => {
    setSelectedGateway(gateway)
    setStep(1)
    loadBanks()
  }

  const handleVerify = async () => {
    if (!bankCode || !accountNumber || !accountName) {
      toast.error('Please fill all fields')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/banks/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway: selectedGateway, bankCode, accountNumber, accountName })
      })
      const data = await res.json()
      if (data.success) {
        setVerified(true)
        setVerifiedName(data.verifiedName)
        setStep(2)
        toast.success(data.message || 'Account verified')
      } else {
        toast.error(data.error || 'Verification failed')
      }
    } catch (err) {
      toast.error('Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const handleSave = async () => {
    if (!verified) {
      toast.error('Please verify account first')
      return
    }
    setSaving(true)
    try {
      const res = await createBeneficiary({ gateway: selectedGateway, bankCode, accountNumber, accountName })
      if (res.success) {
        toast.success(`${selectedGateway} beneficiary created`)
        setCompletedGateways(prev => [...prev, selectedGateway])
        if (completedGateways.length + 1 >= 2) {
          setStep(3)
        } else {
          setStep(0)
          setSelectedGateway('')
          setBankCode('')
          setAccountNumber('')
          setAccountName('')
          setVerified(false)
          setVerifiedName('')
        }
      } else {
        toast.error(res.error || 'Failed to create beneficiary')
      }
    } catch (err) {
      toast.error('Failed to create beneficiary')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (step === 1) setStep(0)
    else if (step === 2) setStep(1)
    else if (step === 3) navigate('/creator/wallet')
  }

  const currentGateway = gateways.find(g => g.id === selectedGateway)

  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-6 md:py-10 pb-nav">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {['Select Gateway', 'Bank Details', 'Verify', 'Complete'].map((label, i) => (
                <div key={i} className={`flex-1 text-center ${i <= step ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                  <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-medium ${
                    i < step ? 'bg-primary-container text-on-primary-container' : 
                    i === step ? 'bg-primary-container/20 text-primary-container' : 
                    'bg-surface-container border border-white/10 text-on-surface-variant'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Gateway Selection */}
            {step === 0 && (
              <motion.div key="gateway-select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="text-center mb-8">
                  <Icon name="account_balance_wallet" className="w-16 h-16 text-primary-container mx-auto mb-4 opacity-50" />
                  <h1 className="text-headline-lg font-bold mb-2">Setup Payout Methods</h1>
                  <p className="text-body-md text-on-surface-variant">
                    Add both payout gateways to withdraw your earnings instantly
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {gateways.map(g => (
                    <motion.button
                      key={g.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: g.id === 'paystack' ? 0.1 : 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleGatewaySelect(g.id)}
                      disabled={completedGateways.includes(g.id)}
                      className={`relative p-6 rounded-2xl border-2 transition-all ${
                        completedGateways.includes(g.id) 
                          ? 'bg-green/10 border-green/30 opacity-50 cursor-not-allowed' 
                          : 'border-outline/30 hover:border-primary/50 hover:bg-white/5'
                      }`}
                    >
                      {completedGateways.includes(g.id) && (
                        <div className="absolute top-3 right-3">
                          <Icon name="check_circle" className="w-6 h-6 text-green" />
                        </div>
                      )}
                      <Icon name={g.icon} className={`w-8 h-8 mx-auto mb-3 ${g.color}`} />
                      <h3 className="font-label-lg text-on-surface mb-1">{g.name}</h3>
                      <p className="text-body-sm text-on-surface-variant">{g.desc}</p>
                      {completedGateways.includes(g.id) && (
                        <div className="mt-3 text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green/10 text-green rounded-full text-xs font-medium">
                            <Icon name="check" size="sm" /> Completed
                          </span>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}

          {/* Step 1: Bank Details Form */}
          {step === 1 && currentGateway && (
            <motion.div key="bank-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Button variant="secondary" onClick={handleBack} className="mb-6">
                <Icon name="arrow_back" size="sm" className="mr-2" /> Back
              </Button>

              <div className="text-center mb-8">
                <Icon name={currentGateway.icon} className={`w-12 h-12 mx-auto mb-3 ${currentGateway.color}`} />
                <h1 className="text-headline-lg font-bold mb-2">Add {currentGateway.name} Beneficiary</h1>
                <p className="text-body-md text-on-surface-variant">Enter your bank details for instant payouts</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">
                    <Icon name="filter_list" size="sm" className="inline mr-1.5" /> Bank
                  </label>
                  <select
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    className="w-full bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm on-surface focus:outline-none focus:border-primary-container"
                    required
                  >
                    <option value="">Select your bank</option>
                    {banks.map(bank => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name} ({bank.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">
                    <Icon name="account_number" size="sm" className="inline mr-1.5" /> Account Number
                  </label>
                  <Input
                    placeholder="Enter 10-digit account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                </div>

                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">
                    <Icon name="person" size="sm" className="inline mr-1.5" /> Account Name (as on bank records)
                  </label>
                  <Input
                    placeholder="Enter name exactly as on bank records"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={handleBack} className="flex-1">
                    <Icon name="arrow_back" size="sm" className="mr-2" /> Back
                  </Button>
                  <Button onClick={handleVerify} loading={verifying} className="flex-1">
                    <Icon name="verified" size="sm" className="mr-2" />
                    {verifying ? 'Verifying...' : 'Verify Account'}
                  </Button>
                </div>
              </div>
            )}

          {/* Step 2: Verification Result */}
          {step === 2 && currentGateway && (
            <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Button variant="secondary" onClick={handleBack} className="mb-6">
                <Icon name="arrow_back" size="sm" className="mr-2" /> Back
              </Button>

              <div className="text-center mb-8">
                <div className={`w-24 h-24 rounded-full mx-auto mb-6 ${verified ? 'bg-green/10' : 'bg-error/10'} flex items-center justify-center`}>
                  <Icon name={verified ? 'check_circle' : 'cancel'} className="w-12 h-12 ${verified ? 'text-green' : 'text-error'}" />
                </div>
                <h1 className="text-headline-lg font-bold mb-2">
                  {verified ? 'Account Verified!' : 'Verification Failed'}
                </h1>
                <p className="text-body-md text-on-surface-variant">
                  {verified 
                    ? `Bank records show: <strong>${verifiedName}</strong>. Name matches!`
                    : 'Account name does not match bank records. Please check and try again.'}
                </p>
              </div>

              {verified && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6 mb-6">
                    <h3 className="font-label-lg text-on-surface mb-4 flex items-center gap-2">
                      <Icon name="verified" className="text-green" /> Verified Successfully
                    </h3>
                    <div className="bg-surface-container rounded-xl p-4 mb-4">
                      <p className="text-label-sm text-on-surface-variant mb-1">Bank Name</p>
                      <p className="font-label-md text-on-surface">{verifiedName}</p>
                    </div>
                    <div className="bg-surface-container rounded-xl p-4 mb-4">
                      <p className="text-label-sm text-on-surface-variant mb-1">Account Number</p>
                      <p className="font-label-md text-on-surface font-mono">{accountNumber}</p>
                    </div>
                    <div className="bg-surface-container rounded-xl p-4">
                      <p className="text-label-sm text-on-surface-variant mb-1">Bank Code</p>
                      <p className="font-label-md text-on-surface font-mono">{bankCode}</p>
                    </div>
                  </div>

                  <Button onClick={handleSave} size="lg" className="w-full" loading={saving}>
                    <Icon name="save" size="sm" className="mr-2" />
                    {saving ? 'Saving...' : 'Save Beneficiary & Continue'}
                  </Button>
                </motion.div>
              )}

              {!verified && (
                <Button variant="secondary" onClick={() => setStep(1)} className="w-full mt-4">
                  <Icon name="refresh" size="sm" className="mr-2" /> Try Again
                </Button>
              )}
            )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center mb-8">
                <div className="w-28 h-28 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-6">
                  <Icon name="celebration" className="w-14 h-14 text-green" />
                </div>
                <h1 className="text-headline-lg font-bold mb-4">All Set!</h1>
                <p className="text-body-lg text-on-surface-variant">
                  Both payout gateways are configured. You can now withdraw your earnings instantly.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {gateways.map(g => (
                  <div key={g.id} className="bg-surface-container-high border border-white/5 rounded-2xl p-6 text-center">
                    <Icon name={g.icon} className={`w-10 h-10 mx-auto mb-3 ${g.color}`} />
                    <h3 className="font-label-lg text-on-surface mb-1">{g.name}</h3>
                    <p className="text-body-sm text-on-surface-variant">Configured & Ready</p>
                    <div className="mt-3 flex items-center justify-center gap-1 text-green">
                      <Icon name="check_circle" className="w-4 h-4" /> Active
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={() => navigate('/creator/wallet')} size="lg" className="w-full">
                <Icon name="account_balance_wallet" size="sm" className="mr-2" />
                Go to Wallet
              </Button>
            </motion.div>
          )}
        </div>
      </Layout>
    )
  }
}