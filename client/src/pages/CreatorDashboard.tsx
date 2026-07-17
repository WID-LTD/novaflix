import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { getToken, getCreatorDashboard, getCreatorComments, getPayoutHistory, requestWithdraw, createPayoutRecipient, getArtistGraph } from '../lib/auth'
import Skeleton from '../components/ui/Skeleton'

const tabs = ['Overview', 'Content', 'Audience', 'Engagement', 'Payouts', 'Network', 'Analytics']

type DashboardData = {
  totalUploads: number
  totalViews: number
  totalMinutesWatched: number
  revenue: number
  tipRevenue: number
  totalLikes: number
  totalComments: number
  uploads: any[]
  recentComments: any[]
  recentTips: any[]
}

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [data, setData] = useState<DashboardData | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [graphData, setGraphData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [payoutMsg, setPayoutMsg] = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    Promise.all([
      getCreatorDashboard(token),
      getCreatorComments(token),
      getPayoutHistory(token),
      getArtistGraph(token),
    ]).then(([d, c, p, g]) => {
      if (d.success) setData(d.dashboard)
      if (c.success) setComments(c.comments)
      if (p.success) setPayouts(p.payouts)
      if (g.success) setGraphData(g.edges)
      setLoading(false)
    })
  }, [])

  const handleCreateRecipient = async () => {
    const token = getToken()
    if (!token) return
    const res = await createPayoutRecipient(token, { bankCode, accountNumber, accountName })
    if (res.success) setPayoutMsg('Recipient created! You can now withdraw.')
    else setPayoutMsg(res.error || 'Failed')
  }

  const handleWithdraw = async () => {
    const token = getToken()
    if (!token) return
    const res = await requestWithdraw(token, Number(withdrawAmount))
    if (res.success) setPayoutMsg('Withdrawal initiated!')
    else setPayoutMsg(res.error || 'Failed')
  }

  const statsCards = data ? [
    { icon: 'visibility' as const, label: 'Minutes Streamed', value: (data.totalMinutesWatched || 0).toLocaleString(), change: '+12%' },
    { icon: 'attach_money' as const, label: 'Revenue', value: `$${(data.revenue || 0).toLocaleString()}`, change: '+8%' },
    { icon: 'movie' as const, label: 'Uploads', value: String(data.totalUploads || 0), change: '+24%' },
    { icon: 'trending_up' as const, label: 'Total Views', value: (data.totalViews || 0).toLocaleString(), change: '+5%' },
    { icon: 'favorite' as const, label: 'Likes', value: (data.totalLikes || 0).toLocaleString(), change: '+15%' },
    { icon: 'chat' as const, label: 'Comments', value: (data.totalComments || 0).toLocaleString(), change: '+10%' },
  ] : []

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-gutter">
              {statsCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface-container-high border border-white/5 rounded-xl p-4"
                >
                  <Icon name={s.icon} className="text-primary-container mb-2" />
                  <p className="text-xl font-bold text-on-surface">{s.value}</p>
                  <p className="text-on-surface-variant/60 text-[10px] mt-0.5">{s.label}</p>
                  <span className="text-[10px] text-primary font-medium">{s.change}</span>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-gutter">
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
                  <Icon name="movie" className="text-primary-container" /> Recent Uploads
                </h3>
                {data && data.uploads && data.uploads.slice(0, 5).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <p className="text-sm text-on-surface-variant truncate">{u.title}</p>
                    <span className="text-xs text-on-surface-variant/60">{u.views || 0} views</span>
                  </div>
                ))}
                {(!data?.uploads || data.uploads.length === 0) && (
                  <p className="text-xs text-on-surface-variant/60 text-center py-4">No uploads yet</p>
                )}
              </div>

              <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
                  <Icon name="chat" className="text-primary-container" /> Recent Comments
                </h3>
                {data?.recentComments?.slice(0, 5).map((c: any) => (
                  <div key={c.id} className="py-2 border-b border-white/5 last:border-0">
                    <p className="text-xs text-on-surface-variant/60">{c.user_name}</p>
                    <p className="text-sm text-on-surface-variant truncate">{c.text}</p>
                  </div>
                ))}
                {(!data?.recentComments || data.recentComments.length === 0) && (
                  <p className="text-xs text-on-surface-variant/60 text-center py-4">No comments yet</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'Content':
        return (
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
            <h3 className="font-label-md text-label-md text-on-surface mb-4 flex items-center gap-2">
              <Icon name="movie" className="text-primary-container" /> Your Uploads
            </h3>
            {data && data.uploads && data.uploads.length > 0 ? (
              <div className="space-y-2">
                {data.uploads.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-label-md text-label-md text-on-surface truncate">{u.title}</p>
                      <p className="text-on-surface-variant/60 text-xs">{u.views || 0} views · {Math.round((u.minutes_watched || 0) / 60)}h watched</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant/60">
                      <span>${parseFloat(u.revenue || 0).toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        u.status === 'published' ? 'bg-primary-container/10 text-primary-container' : 'bg-white/10 text-on-surface-variant'
                      }`}>{u.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="add" className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
                <p className="text-sm text-on-surface-variant">No uploads yet. Upload your first video!</p>
              </div>
            )}
          </div>
        )

      case 'Audience':
        return (
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
            <h3 className="font-label-md text-label-md text-on-surface mb-4 flex items-center gap-2">
              <Icon name="language" className="text-primary-container" /> Top Locations
            </h3>
            {[
              { country: 'United States', viewers: 4520 },
              { country: 'United Kingdom', viewers: 2104 },
              { country: 'Germany', viewers: 1892 },
              { country: 'Canada', viewers: 1438 },
              { country: 'Brazil', viewers: 983 },
            ].map(loc => (
              <div key={loc.country} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-on-surface-variant">{loc.country}</span>
                <span className="text-xs text-on-surface-variant/60">{loc.viewers.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )

      case 'Engagement':
        return (
          <div className="grid md:grid-cols-2 gap-gutter">
            <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
              <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
                <Icon name="chat" className="text-primary-container" /> All Comments ({comments.length})
              </h3>
              {comments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
                        <Icon name="person" size="sm" className="text-primary-container" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-on-surface">{c.user_name}</p>
                        <p className="text-xs text-on-surface-variant">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/60 text-center py-6">No comments yet</p>
              )}
            </div>
            <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
              <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
                <Icon name="favorite" className="text-primary-container" /> Likes
              </h3>
              <p className="text-3xl font-bold text-on-surface">{data?.totalLikes || 0}</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">Total likes across all content</p>
            </div>
          </div>
        )

      case 'Payouts':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-gutter">
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                <p className="text-xs text-on-surface-variant">Total Revenue</p>
                <p className="text-2xl font-bold text-on-surface">${(data?.revenue || 0).toLocaleString()}</p>
              </div>
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                <p className="text-xs text-on-surface-variant">Tips Received</p>
                <p className="text-2xl font-bold text-on-surface">${(data?.tipRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                <p className="text-xs text-on-surface-variant">Total Views</p>
                <p className="text-2xl font-bold text-on-surface">{(data?.totalViews || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
              <h3 className="font-label-md text-label-md text-on-surface mb-4">Setup Bank Account</h3>
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <input value={bankCode} onChange={e => setBankCode(e.target.value)} placeholder="Bank Code (e.g. 057)" className="bg-surface-container border border-outline/20 rounded-xl px-3 py-2 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50" />
                <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number" className="bg-surface-container border border-outline/20 rounded-xl px-3 py-2 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50" />
                <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Account Name" className="bg-surface-container border border-outline/20 rounded-xl px-3 py-2 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50" />
              </div>
              <button onClick={handleCreateRecipient} className="px-4 py-2 bg-primary-container text-on-primary-container text-sm rounded-xl hover:brightness-110 transition-colors">
                Create Recipient
              </button>
            </div>

            <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
              <h3 className="font-label-md text-label-md text-on-surface mb-4">Request Withdrawal</h3>
              <div className="flex gap-3 max-w-sm">
                <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} type="number" placeholder="Amount ($)" className="flex-1 bg-surface-container border border-outline/20 rounded-xl px-3 py-2 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50" />
                <button onClick={handleWithdraw} className="px-4 py-2 bg-primary-container text-on-primary-container text-sm rounded-xl hover:brightness-110 transition-colors">
                  Withdraw
                </button>
              </div>
              {payoutMsg && <p className="text-xs text-primary mt-2">{payoutMsg}</p>}
            </div>

            <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
              <h3 className="font-label-md text-label-md text-on-surface mb-4 flex items-center gap-2">
                <Icon name="calendar_month" className="text-primary-container" /> Payout History
              </h3>
              {payouts.length > 0 ? (
                <div className="space-y-2">
                  {payouts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-on-surface-variant">${parseFloat(p.amount).toFixed(2)}</span>
                      <span className="text-xs text-on-surface-variant/60">{new Date(p.created_at).toLocaleDateString()}</span>
                      <span className={`text-xs ${p.status === 'completed' ? 'text-primary' : 'text-secondary'}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/60 text-center py-4">No payouts yet</p>
              )}
            </div>
          </div>
        )

      case 'Network':
        return (
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
            <h3 className="font-label-md text-label-md text-on-surface mb-4 flex items-center gap-2">
              <Icon name="account_tree" className="text-primary-container" /> Collaboration Network
            </h3>
            {graphData.length > 0 ? (
              <div className="space-y-2">
                {graphData.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-on-surface-variant py-1">
                    <span>{e.artist1_name}</span>
                    <span className="text-on-surface-variant/40">—</span>
                    <span>{e.artist2_name}</span>
                    <span className="text-xs text-on-surface-variant/60">({e.weight} collab{e.weight > 1 ? 's' : ''})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant/60 text-center py-8">No collaboration data yet. Run the artist seeding script to populate.</p>
            )}
          </div>
        )

      case 'Analytics':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-gutter">
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
                  <Icon name="monitoring" className="text-primary-container" /> Views Over Time
                </h3>
                <p className="text-xs text-on-surface-variant/60">Analytics chart coming soon</p>
              </div>
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
                  <Icon name="attach_money" className="text-primary-container" /> Revenue Breakdown
                </h3>
                <p className="text-xs text-on-surface-variant/60">Revenue charts coming soon</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="bar_chart" className="w-7 h-7 text-primary-container" />
          <div>
            <h1 className="text-headline-md font-bold">Creator Dashboard</h1>
            <p className="text-on-surface-variant/60 text-xs mt-0.5">Your films, audience, and revenue</p>
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

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-gutter">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface-container-high border border-white/5 rounded-xl p-4">
                <Skeleton variant="text" className="w-6 h-6 mb-2 rounded-lg" />
                <Skeleton variant="text" className="w-16 h-5 mb-1" />
                <Skeleton variant="text" className="w-20 h-2" />
              </div>
            ))}
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  )
}
