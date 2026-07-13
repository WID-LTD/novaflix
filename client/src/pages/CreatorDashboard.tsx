import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Film, Users, DollarSign, Eye, TrendingUp,
  Globe, Calendar, Clock, Heart, MessageCircle, FilmIcon,
  Activity, GitBranch, Plus, User, Trash2,
} from 'lucide-react'
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

  // Payout form state
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
    { icon: Eye, label: 'Minutes Streamed', value: (data.totalMinutesWatched || 0).toLocaleString(), change: '+12%' },
    { icon: DollarSign, label: 'Revenue', value: `$${(data.revenue || 0).toLocaleString()}`, change: '+8%' },
    { icon: Film, label: 'Uploads', value: String(data.totalUploads || 0), change: '+24%' },
    { icon: TrendingUp, label: 'Total Views', value: (data.totalViews || 0).toLocaleString(), change: '+5%' },
    { icon: Heart, label: 'Likes', value: (data.totalLikes || 0).toLocaleString(), change: '+15%' },
    { icon: MessageCircle, label: 'Comments', value: (data.totalComments || 0).toLocaleString(), change: '+10%' },
  ] : []

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statsCards.map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-surface-card border border-white/10 rounded-2xl p-4"
                  >
                    <Icon className="w-5 h-5 text-accent mb-2" />
                    <p className="text-xl font-bold text-white">{s.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                    <span className="text-[10px] text-accent font-medium">{s.change}</span>
                  </motion.div>
                )
              })}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FilmIcon className="w-4 h-4 text-accent" /> Recent Uploads
                </h3>
                {data && data.uploads && data.uploads.slice(0, 5).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <p className="text-sm text-gray-300 truncate">{u.title}</p>
                    <span className="text-xs text-gray-500">{u.views || 0} views</span>
                  </div>
                ))}
                {(!data?.uploads || data.uploads.length === 0) && (
                  <p className="text-xs text-gray-500 text-center py-4">No uploads yet</p>
                )}
              </div>

              <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-accent" /> Recent Comments
                </h3>
                {data?.recentComments?.slice(0, 5).map((c: any) => (
                  <div key={c.id} className="py-2 border-b border-white/5 last:border-0">
                    <p className="text-xs text-gray-500">{c.user_name}</p>
                    <p className="text-sm text-gray-300 truncate">{c.text}</p>
                  </div>
                ))}
                {(!data?.recentComments || data.recentComments.length === 0) && (
                  <p className="text-xs text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'Content':
        return (
          <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Film className="w-4 h-4 text-accent" /> Your Uploads
            </h3>
            {data && data.uploads && data.uploads.length > 0 ? (
              <div className="space-y-2">
                {data.uploads.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{u.title}</p>
                      <p className="text-xs text-gray-500">{u.views || 0} views · {Math.round((u.minutes_watched || 0) / 60)}h watched</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>${parseFloat(u.revenue || 0).toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        u.status === 'published' ? 'bg-accent/10 text-accent' : 'bg-white/10 text-gray-400'
                      }`}>{u.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Plus className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No uploads yet. Upload your first video!</p>
              </div>
            )}
          </div>
        )

      case 'Audience':
        return (
          <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" /> Top Locations
            </h3>
            {[
              { country: 'United States', viewers: 4520 },
              { country: 'United Kingdom', viewers: 2104 },
              { country: 'Germany', viewers: 1892 },
              { country: 'Canada', viewers: 1438 },
              { country: 'Brazil', viewers: 983 },
            ].map(loc => (
              <div key={loc.country} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-gray-300">{loc.country}</span>
                <span className="text-xs text-gray-500">{loc.viewers.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )

      case 'Engagement':
        return (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-accent" /> All Comments ({comments.length})
              </h3>
              {comments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white">{c.user_name}</p>
                        <p className="text-xs text-gray-400">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-6">No comments yet</p>
              )}
            </div>
            <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-accent" /> Likes
              </h3>
              <p className="text-3xl font-bold text-white">{data?.totalLikes || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total likes across all content</p>
            </div>
          </div>
        )

      case 'Payouts':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-white">${(data?.revenue || 0).toLocaleString()}</p>
              </div>
              <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-500">Tips Received</p>
                <p className="text-2xl font-bold text-white">${(data?.tipRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-500">Total Views</p>
                <p className="text-2xl font-bold text-white">{(data?.totalViews || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Setup Bank Account</h3>
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <input value={bankCode} onChange={e => setBankCode(e.target.value)} placeholder="Bank Code (e.g. 057)" className="bg-surface-secondary border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50" />
                <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number" className="bg-surface-secondary border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50" />
                <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Account Name" className="bg-surface-secondary border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50" />
              </div>
              <button onClick={handleCreateRecipient} className="px-4 py-2 bg-accent text-white text-sm rounded-xl hover:bg-red-700 transition-colors">
                Create Recipient
              </button>
            </div>

            <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Request Withdrawal</h3>
              <div className="flex gap-3 max-w-sm">
                <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} type="number" placeholder="Amount ($)" className="flex-1 bg-surface-secondary border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50" />
                <button onClick={handleWithdraw} className="px-4 py-2 bg-accent text-white text-sm rounded-xl hover:bg-red-700 transition-colors">
                  Withdraw
                </button>
              </div>
              {payoutMsg && <p className="text-xs text-accent mt-2">{payoutMsg}</p>}
            </div>

            <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" /> Payout History
              </h3>
              {payouts.length > 0 ? (
                <div className="space-y-2">
                  {payouts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-gray-300">${parseFloat(p.amount).toFixed(2)}</span>
                      <span className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</span>
                      <span className={`text-xs ${p.status === 'completed' ? 'text-accent' : 'text-accent-secondary'}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">No payouts yet</p>
              )}
            </div>
          </div>
        )

      case 'Network':
        return (
          <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-accent" /> Collaboration Network
            </h3>
            {graphData.length > 0 ? (
              <div className="space-y-2">
                {graphData.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300 py-1">
                    <span>{e.artist1_name}</span>
                    <span className="text-gray-600">—</span>
                    <span>{e.artist2_name}</span>
                    <span className="text-xs text-gray-500">({e.weight} collab{e.weight > 1 ? 's' : ''})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-8">No collaboration data yet. Run the artist seeding script to populate.</p>
            )}
          </div>
        )

      case 'Analytics':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" /> Views Over Time
                </h3>
                <p className="text-xs text-gray-500">Analytics chart coming soon</p>
              </div>
              <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-accent" /> Revenue Breakdown
                </h3>
                <p className="text-xs text-gray-500">Revenue charts coming soon</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-7 h-7 text-accent" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Creator Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Your films, audience, and revenue</p>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-accent text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface-card border border-white/10 rounded-2xl p-4">
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
