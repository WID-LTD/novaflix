import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWalletBalance, getWalletTransactions, getWithdrawalPreview, processWithdrawal } from '../lib/auth'
import { useToast } from '../components/ui/Toast'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

const tabs = ['Overview', 'Earnings', 'Withdraw', 'History']

export default function CreatorWallet() {
  const navigate = useNavigate()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('Overview')
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawGateway, setWithdrawGateway] = useState('paystack')
  const [preview, setPreview] = useState(null)
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [balRes, txRes] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions()
      ])
      if (balRes.success) setBalance(balRes.balance_ngn)
      if (txRes.success) setTransactions(txRes.transactions)
    } catch (err) {
      console.error('Wallet load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updatePreview = async () => {
    if (!withdrawAmount || !withdrawGateway) return
    try {
      const res = await getWithdrawalPreview(withdrawAmount, withdrawGateway)
      if (res.success) setPreview(res.preview)
    } catch (err) {
      console.error('Preview error:', err)
    }
  }

  useEffect(() => {
    updatePreview()
  }, [withdrawAmount, withdrawGateway])

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawGateway) return
    setWithdrawing(true)
    try {
      const res = await processWithdrawal(withdrawAmount, withdrawGateway)
      if (res.success) {
        toast.success(`Withdrawal initiated! You'll receive ₦${(res.netToCreator).toLocaleString()} after ₦${res.gatewayFee} fee`)
        setWithdrawAmount('')
        setPreview(null)
        loadData()
      } else {
        toast.error(res.error || 'Withdrawal failed')
      }
    } catch (err) {
      toast.error('Withdrawal failed')
    } finally {
      setWithdrawing(false)
    }
  }

  const formatAmount = (amount) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)

  const getTypeLabel = (type) => {
    const labels = {
      'ppm_upload': 'PPM - Uploads',
      'ppm_scraped': 'PPM - Scraped',
      'ppm_youtube': 'PPM - YouTube',
      'ppm_live': 'PPM - Live→Shorts',
      'ppm_shorts': 'PPM - Shorts',
      'tip': 'Tip',
      'gift': 'Glow Gift',
      'membership': 'Membership',
      'withdrawal': 'Withdrawal',
      'refund': 'Refund'
    }
    return labels[type] || type
  }

  const getTypeColor = (type) => {
    if (type.startsWith('ppm_') || type === 'tip' || type === 'gift' || type === 'membership') return 'text-green'
    if (type === 'withdrawal') return 'text-error'
    return 'text-on-surface'
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-primary-container" />
        </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-6 md:py-10 pb-nav">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-headline-lg font-bold text-on-surface">Wallet</h1>
              <p className="text-body-md text-on-surface-variant mt-1">Real-time earnings & withdrawals</p>
            </div>
            <div className="bg-primary-container text-on-primary-container px-4 py-2 rounded-xl font-label-md text-sm">
              {formatAmount(balance)}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-high border border-white/5 rounded-xl p-4">
                  <p className="text-label-sm text-on-surface-variant">Wallet Balance</p>
                  <p className="text-headline-lg font-bold text-on-surface">{formatAmount(balance)}</p>
                </div>
                <div className="bg-surface-container-high border border-white/5 rounded-xl p-4">
                  <p className="text-label-sm text-on-surface-variant">Total Earned (30d)</p>
                  <p className="text-headline-lg font-bold text-green">
                    {formatAmount(transactions.filter(t => t.amount_ngn > 0 && t.created_at > Date.now() - 30*864e5).reduce((sum, t) => sum + t.amount_ngn, 0))}
                  </p>
                </div>
                <div className="bg-surface-container-high border border-white/5 rounded-xl p-4">
                  <p className="text-label-sm text-on-surface-variant">Withdrawn (30d)</p>
                  <p className="text-headline-lg font-bold text-error">
                    {formatAmount(transactions.filter(t => t.type === 'withdrawal' && t.created_at > Date.now() - 30*864e5).reduce((sum, t) => sum + Math.abs(t.amount_ngn), 0))}
                  </p>
                </div>
                <div className="bg-surface-container-high border border-white/5 rounded-xl p-4">
                  <p className="text-label-sm text-on-surface-variant">Pending</p>
                  <p className="text-headline-lg font-bold text-primary">{formatAmount(0)}</p>
                </div>
              </div>

              <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6">
                <h3 className="font-label-lg text-on-surface mb-4 flex items-center gap-2">
                  <Icon name="trending_up" className="text-primary-container" /> Recent Activity
                </h3>
                {transactions.slice(0, 5).length > 0 ? (
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((tx) => (
                      <motion.div key={tx.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tx.amount_ngn > 0 ? 'bg-green/10' : 'bg-error/10'}`}>
                            <Icon name={tx.type.startsWith('ppm_') ? 'play_circle' : tx.type === 'tip' ? 'favorite' : tx.type === 'gift' ? 'card_giftcard' : tx.type === 'withdrawal' ? 'account_balance_wallet' : 'receipt'} 
                              className={`w-5 h-5 ${tx.amount_ngn > 0 ? 'text-green' : 'text-error'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-on-surface">{getTypeLabel(tx.type)}</p>
                            <p className="text-xs text-on-surface-variant/60">{format(new Date(tx.created_at), 'MMM d, HH:mm')}</p>
                          </div>
                        </div>
                        <span className={`${getTypeColor(tx.type)} font-semibold`}>
                          {tx.amount_ngn > 0 ? '+' : ''}{formatAmount(tx.amount_ngn)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-md text-on-surface-variant text-center py-8">No transactions yet</p>
                )}
              </div>
            )}

          {activeTab === 'Earnings' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6">
                <h3 className="font-label-lg text-on-surface mb-4">Earnings Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['ppm_upload', 'ppm_scraped', 'ppm_youtube', 'ppm_live', 'ppm_shorts', 'tip', 'gift', 'membership'].map(type => {
                    const total = transactions.filter(t => t.type === type).reduce((sum, t) => sum + t.amount_ngn, 0)
                    if (total === 0) return null
                    return (
                      <div key={type} className="bg-surface-container rounded-xl p-4 text-center">
                        <p className="text-label-sm text-on-surface-variant mb-1">{getTypeLabel(type)}</p>
                        <p className="text-headline-md font-bold text-green">{formatAmount(total)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          {activeTab === 'Withdraw' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6">
                <h3 className="font-label-lg text-on-surface mb-6">Withdraw Earnings</h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-on-surface-variant text-sm mb-1.5 block">
                      <Icon name="attach_money" size="sm" className="inline mr-1.5" /> Amount (₦)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter amount (min ₦10,000)"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min={10000}
                      step={1000}
                    />
                  </div>
                  <div>
                    <label className="text-on-surface-variant text-sm mb-1.5 block">
                      <Icon name="account_balance" size="sm" className="inline mr-1.5" /> Gateway
                    </label>
                    <select
                      value={withdrawGateway}
                      onChange={(e) => setWithdrawGateway(e.target.value)}
                      className="w-full bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm on-surface focus:outline-none focus:border-primary-container"
                    >
                      <option value="paystack">Paystack (Instant, ₦10 fee)</option>
                      <option value="flutterwave">Flutterwave (Instant, ₦20 fee)</option>
                    </select>
                  </div>
                </div>

                {preview && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div className="bg-green/10 rounded-xl p-3">
                        <p className="text-label-sm text-green">Net to You</p>
                        <p className="text-headline-md font-bold text-green">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(preview.netToCreator)}</p>
                      </div>
                      <div className="bg-error/10 rounded-xl p-3">
                        <p className="text-label-sm text-error">Gateway Fee</p>
                        <p className="text-headline-md font-bold text-error">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(preview.gatewayFee)}</p>
                      </div>
                      <div className="bg-primary/10 rounded-xl p-3">
                        <p className="text-label-sm text-primary">Total Deducted</p>
                        <p className="text-headline-md font-bold text-on-surface">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(preview.totalDeduction)}</p>
                      </div>
                    </div>
                    <p className="text-body-sm text-on-surface-variant/60 text-center">
                      You'll receive <strong>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(preview.netToCreator)}</strong> after <strong>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(preview.gatewayFee)}</strong> gateway fee
                    </p>
                  </motion.div>
                )}

                <Button 
                  onClick={handleWithdraw} 
                  size="lg" 
                  className="w-full" 
                  loading={withdrawing}
                  disabled={!preview || !preview.canWithdraw}
                >
                  {withdrawing ? 'Processing...' : 'Withdraw Now'}
                </Button>

                <p className="text-xs text-on-surface-variant/60 text-center mt-3">
                  Minimum withdrawal: ₦10,000. Gateway fees are deducted from your balance.
                  <a href="/terms" className="text-primary underline">Full terms in T&C</a>
                </p>
              </div>
            )}

          {activeTab === 'History' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-surface-container-high border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-label-sm text-on-surface-variant">
                        <th className="p-4 text-left">Date</th>
                        <th className="p-4 text-left">Type</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4 text-right">Balance</th>
                        <th className="p-4 text-left">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? (
                        transactions.map(tx => (
                          <tr key={tx.id} className="border-b border-white/5">
                            <td className="p-4 text-label-sm text-on-surface-variant">
                              {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tx.amount_ngn > 0 ? 'bg-green/10 text-green' : 'bg-error/10 text-error'}`}>
                                {getTypeLabel(tx.type)}
                              </span>
                            </td>
                            <td className="p-4 text-right font-semibold {tx.amount_ngn > 0 ? 'text-green' : 'text-error'}">
                              {tx.amount_ngn > 0 ? '+' : ''}{formatAmount(tx.amount_ngn)}
                            </td>
                            <td className="p-4 text-right text-label-sm text-on-surface-variant">
                              {formatAmount(tx.balance_after_ngn)}
                            </td>
                            <td className="p-4 text-label-sm text-on-surface-variant/60 font-mono truncate max-w-xs">
                              {tx.reference || '-'}
                            </td>
                          </tr>
                        ))}
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-on-surface-variant">No transactions yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          <p className="text-xs text-on-surface-variant/60 text-center mt-8">
            Gateway fees covered by creator on withdrawal. Subscription fees covered by user. See <a href="/terms" className="text-primary underline">Terms & Conditions</a> for full details.
          </p>
        </div>
      </Layout>
    )
  }
}