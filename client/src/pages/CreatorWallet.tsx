import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bar } from 'recharts'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Icon from '../components/ui/Icon'
import Skeleton from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { getToken, getCreatorEarnings, getPayoutHistory, requestWithdraw, createPayoutRecipient } from '../lib/auth'
import { subscribeCreator } from '../lib/creatorLive'

const NAV = [
  { path: '/creator', label: 'Dashboard', icon: 'dashboard' },
  { path: '/creator/analytics', label: 'Analytics', icon: 'monitoring' },
  { path: '/creator/catalog', label: 'Catalog', icon: 'movie' },
  { path: '/creator/wallet', label: 'Wallet', icon: 'account_balance_wallet' },
  { path: '/creator/ppm', label: 'PPM', icon: 'tune' },
  { path: '/creator/onboarding', label: 'Onboarding', icon: 'rocket_launch' },
  { path: '/creator/go-live', label: 'Go Live', icon: 'podcasts' },
]

export default function CreatorWallet() {
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()
  const [earnings, setEarnings] = useState<any>({ summary: null, items: [] })
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [showRecipient, setShowRecipient] = useState(false)
  const [recipient, setRecipient] = useState({ bankCode: '', accountNumber: '', accountName: '' })
  const [savingRecipient, setSavingRecipient] = useState(false)

  const load = async () => {
    const token = getToken()
    if (!token) return
    const [e, p] = await Promise.all([getCreatorEarnings(token), getPayoutHistory(token)])
    if (e.success) setEarnings(e)
    if (p.success) setPayouts(p.payouts || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return subscribeCreator(['earnings', 'payout'], () => load())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // balance = settled earnings - attempted withdrawals
  const totalEarned = (earnings.items || []).reduce((a: number, i: any) => a + Number(i.amount || 0), 0)
  const totalWithdrawn = payouts.reduce((a: number, p: any) => a + (p.status === 'success' ? Number(p.amount || 0) : 0), 0)
  const balance = Math.max(0, totalEarned - totalWithdrawn)

  const summary = earnings.summary || []
  const movie = summary.find((s: any) => s.pool_type === 'movie')
  const short = summary.find((s: any) => s.pool_type === 'short')

  // earnings by period for chart
  const byPeriod: Record<string, number> = {}
  for (const i of earnings.items || []) {
    byPeriod[i.period] = (byPeriod[i.period] || 0) + Number(i.amount || 0)
  }
  const chartData = Object.entries(byPeriod).map(([period, amount]) => ({ period, amount })).sort((a, b) => a.period.localeCompare(b.period))

  const handleWithdraw = async () => {
    const token = getToken()
    if (!token || !amount) return
    setWithdrawing(true)
    const r = await requestWithdraw(token, Number(amount))
    setWithdrawing(false)
    if (r.success) { toast.success('Withdrawal initiated'); setAmount(''); load() }
    else toast.error(r.error || 'Withdrawal failed')
  }

  const saveRecipient = async () => {
    const token = getToken()
    if (!token) return
    setSavingRecipient(true)
    const r = await createPayoutRecipient(token, recipient)
    setSavingRecipient(false)
    if (r.success) { toast.success('Payout recipient saved'); setShowRecipient(false); setRecipient({ bankCode: '', accountNumber: '', accountName: '' }) }
    else toast.error(r.error || 'Failed to save recipient')
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="account_balance_wallet" className="w-7 h-7 text-primary-container" />
          <div>
            <h1 className="text-headline-md font-bold">Creator Wallet</h1>
            <p className="text-on-surface-variant/60 text-xs mt-0.5">Earnings, payouts, and withdrawals</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto mb-6 pb-1">
          {NAV.map(n => (
            <button key={n.path} onClick={() => nav(n.path)} className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-colors ${loc.pathname === n.path ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}>
              <Icon name={n.icon as any} size="sm" /> {n.label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-gutter">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-surface-container-high border border-white/5 rounded-xl p-5"><Skeleton variant="text" className="w-16 h-5 mb-2" /><Skeleton variant="text" className="w-24 h-8" /></div>)}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-gutter mb-6">
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-6">
                <p className="text-xs text-on-surface-variant">Available balance</p>
                <p className="text-3xl font-bold text-on-surface mt-1">${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">Settled earnings minus withdrawals</p>
              </div>
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-6">
                <p className="text-xs text-on-surface-variant">Total earned</p>
                <p className="text-3xl font-bold text-on-surface mt-1">${totalEarned.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 rounded-lg p-2"><span className="text-on-surface-variant/60 block">Movies</span><span className="text-on-surface font-semibold">{movie ? `$${Number(movie.amount || 0).toFixed(2)}` : '$0.00'}</span></div>
                  <div className="bg-white/5 rounded-lg p-2"><span className="text-on-surface-variant/60 block">Shorts</span><span className="text-on-surface font-semibold">{short ? `$${Number(short.amount || 0).toFixed(2)}` : '$0.00'}</span></div>
                </div>
              </div>
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-6">
                <p className="text-xs text-on-surface-variant">Withdrawn to date</p>
                <p className="text-3xl font-bold text-on-surface mt-1">${totalWithdrawn.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">{payouts.length} payout records</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-gutter mb-6">
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2"><Icon name="payments" className="text-primary-container" /> Withdraw funds</h3>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
                    <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} type="number" placeholder="0.00" className="w-full bg-surface-variant/20 border border-outline/30 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-primary-container" />
                  </div>
                  <Button onClick={handleWithdraw} loading={withdrawing} disabled={!amount || Number(amount) <= 0 || Number(amount) > balance}>Withdraw</Button>
                </div>
                {Number(amount) > 0 && Number(amount) > balance && (
                  <p className="text-xs text-red-300 mt-2">Amount exceeds available balance (${balance.toFixed(2)}).</p>
                )}
                <button onClick={() => setShowRecipient(true)} className="mt-4 flex items-center gap-1.5 text-sm text-primary-container hover:underline">
                  <Icon name="account_balance" size="sm" /> Manage payout recipient
                </button>
              </div>
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2"><Icon name="bar_chart" className="text-primary-container" /> Earnings by month</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <Bar data={chartData} dataKey="amount">
                      <XAxis dataKey="period" tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                      <Tooltip contentStyle={{ background: '#1c1b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                      <Bar dataKey="amount" fill="#48dbfb" radius={[6, 6, 0, 0]} />
                    </Bar>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-on-surface-variant/60 text-center py-12">No earnings yet this period</p>
                )}
              </div>
            </div>

            <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
              <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2"><Icon name="receipt_long" className="text-primary-container" /> Payout history</h3>
              {payouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-on-surface-variant/60 text-xs border-b border-white/5">
                        <th className="py-2 pr-4 font-medium">Date</th>
                        <th className="py-2 pr-4 font-medium text-right">Amount</th>
                        <th className="py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p: any) => (
                        <tr key={p.id || p.reference} className="border-b border-white/5 last:border-0">
                          <td className="py-2.5 pr-4 text-on-surface-variant">{new Date(p.created_at || p.date || Date.now()).toLocaleDateString()}</td>
                          <td className="py-2.5 pr-4 text-right text-on-surface">${Number(p.amount || 0).toFixed(2)}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.status === 'success' ? 'bg-emerald-500/10 text-emerald-300' : p.status === 'pending' ? 'bg-amber-500/10 text-amber-300' : 'bg-white/10 text-on-surface-variant'}`}>{p.status || 'pending'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/60 text-center py-8">No payouts yet</p>
              )}
            </div>
          </>
        )}
      </div>

      <Modal isOpen={showRecipient} onClose={() => setShowRecipient(false)} title="Payout Recipient">
        <div className="space-y-4">
          <div>
            <label className="text-on-surface-variant text-sm mb-1.5 block">Bank code</label>
            <Input value={recipient.bankCode} onChange={(e) => setRecipient(r => ({ ...r, bankCode: e.target.value }))} placeholder="e.g. 044" />
          </div>
          <div>
            <label className="text-on-surface-variant text-sm mb-1.5 block">Account number</label>
            <Input value={recipient.accountNumber} onChange={(e) => setRecipient(r => ({ ...r, accountNumber: e.target.value }))} placeholder="10-digit account number" />
          </div>
          <div>
            <label className="text-on-surface-variant text-sm mb-1.5 block">Account name</label>
            <Input value={recipient.accountName} onChange={(e) => setRecipient(r => ({ ...r, accountName: e.target.value }))} placeholder="Full legal name" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowRecipient(false)}>Cancel</Button>
            <Button onClick={saveRecipient} loading={savingRecipient} disabled={!recipient.bankCode || !recipient.accountNumber || !recipient.accountName}>Save recipient</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
