import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Line, Bar, Area, Pie, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Doughnut, Bubble } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip as CjsTooltip, Legend, CategoryScale, LinearScale, PointElement } from 'chart.js'
import Icon from '../components/ui/Icon'
import Skeleton from '../components/ui/Skeleton'
import { getToken, getCreatorAnalytics } from '../lib/auth'
import { subscribeCreator } from '../lib/creatorLive'

ChartJS.register(ArcElement, CjsTooltip, Legend, CategoryScale, LinearScale, PointElement)

const NAV = [
  { path: '/creator', label: 'Dashboard', icon: 'dashboard' },
  { path: '/creator/analytics', label: 'Analytics', icon: 'monitoring' },
  { path: '/creator/catalog', label: 'Catalog', icon: 'movie' },
  { path: '/creator/wallet', label: 'Wallet', icon: 'account_balance_wallet' },
  { path: '/creator/ppm', label: 'PPM', icon: 'tune' },
  { path: '/creator/onboarding', label: 'Onboarding', icon: 'rocket_launch' },
  { path: '/creator/go-live', label: 'Go Live', icon: 'podcasts' },
]

const PERIODS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

function fmt(n: any, dec = 0) {
  const x = Number(n || 0)
  if (isNaN(x)) return '0'
  return x.toLocaleString(undefined, { maximumFractionDigits: dec })
}

export default function CreatorAnalytics() {
  const nav = useNavigate()
  const loc = useLocation()
  const [section, setSection] = useState<'overview' | 'audience' | 'content'>('overview')
  const [period, setPeriod] = useState('30d')
  const [overview, setOverview] = useState<any>(null)
  const [audience, setAudience] = useState<any>(null)
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [liveEvent, setLiveEvent] = useState<string | null>(null)
  const sectionRef = useRef(section)
  sectionRef.current = section

  const load = async (s: string, p: string) => {
    const token = getToken()
    if (!token) return
    if (s === 'overview') {
      const r = await getCreatorAnalytics(token, 'overview', p)
      if (r.success) setOverview(r)
    } else if (s === 'audience') {
      const r = await getCreatorAnalytics(token, 'audience', p)
      if (r.success) setAudience(r)
    } else {
      const r = await getCreatorAnalytics(token, 'content', p)
      if (r.success) setContent(r)
    }
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    load(section, period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, period])

  useEffect(() => {
    const unsub = subscribeCreator(['engagement', 'content', 'earnings'], (msg) => {
      setConnected(true)
      setLiveEvent(msg.type)
      window.setTimeout(() => setLiveEvent(null), 3000)
      // Lightweight real-time refresh only for the active section
      load(sectionRef.current, period)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const viewsData = (overview?.series?.views || []).map((r: any) => ({
    date: new Date(r.date.endsWith('T00:00:00.000Z') ? r.date : r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    views: Number(r.total || 0),
  }))

  const watchData = (overview?.series?.watch || []).map((r: any) => ({
    date: r.date,
    minutes: Number(r.minutes || 0),
  }))

  const engagementData = (overview?.series?.engagement || []).map((r: any) => ({
    date: r.date,
    count: Number(r.total || 0),
  }))

  const revenueData = (overview?.series?.revenue || []).map((r: any) => ({
    date: r.date,
    revenue: Number(r.total || 0),
  }))

  const totals = overview?.totals || {}
  const rs = overview?.revenueSummary || {}

  const totalViews = viewsData.reduce((a: number, b: any) => a + (b.views || 0), 0)

  const statCards = [
    { icon: 'visibility' as const, label: 'Total Views', value: fmt(totalViews) },
    { icon: 'movie' as const, label: 'Uploads', value: fmt(totals.total_uploads) },
    { icon: 'group' as const, label: 'Followers', value: fmt(totals.total_followers) },
    { icon: 'bolt' as const, label: 'Shorts', value: fmt(totals.total_shorts) },
  ]

  const doughnutData = {
    labels: ['Tips', 'Gifts', 'Membership', 'Merch'],
    datasets: [{
      data: [Number(rs.tips || 0), Number(rs.gifts || 0), Number(rs.membership || 0), Number(rs.merch || 0)],
      backgroundColor: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'],
      borderWidth: 0,
    }],
  }

  const topContent = audience?.topContent || []
  const totalFollowersSeries = audience?.followersOverTime || []
  const followersData = totalFollowersSeries.map((r: any) => ({ date: r.date, followers: Number(r.total || 0) }))

  const bubbleData = {
    datasets: [{
      label: 'Content',
      data: (content?.uploads || []).map((u: any) => ({
        x: Number(u.views || 0),
        y: Number(u.minutes || 0),
        r: Math.min(20, Math.max(5, Number(u.likes || 0) / 2)),
      })),
      backgroundColor: 'rgba(72, 219, 251, 0.4)',
      borderColor: '#48dbfb',
    }],
  }

  const subNav = [
    { key: 'overview' as const, label: 'Overview', icon: 'dashboard' },
    { key: 'audience' as const, label: 'Audience', icon: 'group' },
    { key: 'content' as const, label: 'Content', icon: 'movie' },
  ]

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Icon name="monitoring" className="w-7 h-7 text-primary-container" />
            <div>
              <h1 className="text-headline-md font-bold">Creator Analytics</h1>
              <p className="text-on-surface-variant/60 text-xs mt-0.5">Performance insights across your content</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-high border border-white/5 rounded-xl p-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${period === p.value ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto mb-6 pb-1">
          {NAV.map(n => (
            <button
              key={n.path}
              onClick={() => nav(n.path)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-colors ${loc.pathname === n.path ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
            >
              <Icon name={n.icon as any} size="sm" /> {n.label}
            </button>
          ))}
        </nav>

        <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
          {subNav.map(s => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-colors ${section === s.key ? 'bg-white/10 text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <Icon name={s.icon as any} size="sm" /> {s.label}
            </button>
          ))}
        </div>

        <div className={`mb-4 px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all ${connected ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/5 text-on-surface-variant/60'}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-on-surface-variant/40'}`} />
          {connected ? (liveEvent ? `Live update received (${liveEvent})` : 'Live updates connected') : 'Connecting to live updates…'}
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-surface-container-high border border-white/5 rounded-xl p-4"><Skeleton variant="text" className="w-6 h-6 mb-2" /><Skeleton variant="text" className="w-16 h-5" /></div>
              ))}
            </div>
            <Skeleton variant="rect" className="h-72 rounded-xl" />
          </div>
        ) : (
          <>
            {section === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
                  {statCards.map((s, i) => (
                    <div key={s.label} className="bg-surface-container-high border border-white/5 rounded-xl p-4">
                      <Icon name={s.icon} className="text-primary-container mb-2" />
                      <p className="text-xl font-bold text-on-surface">{s.value}</p>
                      <p className="text-on-surface-variant/60 text-[10px] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-gutter">
                  <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                    <h3 className="font-label-md text-label-md text-on-surface mb-3">Views over time</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <Area data={viewsData} dataKey="views">
                        <defs>
                          <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#48dbfb" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#48dbfb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <Tooltip contentStyle={{ background: '#1c1b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                        <Area type="monotone" dataKey="views" stroke="#48dbfb" fill="url(#gv)" strokeWidth={2} />
                      </Area>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                    <h3 className="font-label-md text-label-md text-on-surface mb-3">Watch time (minutes)</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <Bar data={watchData} dataKey="minutes">
                        <XAxis dataKey="date" tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                        <Tooltip contentStyle={{ background: '#1c1b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                        <Bar dataKey="minutes" fill="#feca57" radius={[6, 6, 0, 0]} />
                      </Bar>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                    <h3 className="font-label-md text-label-md text-on-surface mb-3">Engagement (likes + comments)</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <Line data={engagementData} dataKey="count">
                        <XAxis dataKey="date" tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <Tooltip contentStyle={{ background: '#1c1b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                        <Line type="monotone" dataKey="count" stroke="#ff6b6b" strokeWidth={2} dot={false} />
                      </Line>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                    <h3 className="font-label-md text-label-md text-on-surface mb-3">Revenue over time</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <Area data={revenueData} dataKey="revenue">
                        <XAxis dataKey="date" tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                        <Tooltip contentStyle={{ background: '#1c1b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                        <Area type="monotone" dataKey="revenue" stroke="#ff9ff3" fill="rgba(255,159,243,0.25)" strokeWidth={2} />
                      </Area>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-gutter">
                  <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                    <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2"><Icon name="pie_chart" className="text-primary-container" /> Revenue breakdown</h3>
                    <div className="h-64 flex items-center justify-center">
                      <Doughnut data={doughnutData} options={{ plugins: { legend: { labels: { color: '#8a8a9a' } } } }} />
                    </div>
                  </div>
                  <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                    <h3 className="font-label-md text-label-md text-on-surface mb-3">Total revenue</h3>
                    <p className="text-3xl font-bold text-on-surface">${fmt(rs.total, 2)}</p>
                    <div className="mt-4 space-y-2 text-sm">
                      {[['Tips', rs.tips], ['Gifts', rs.gifts], ['Membership', rs.membership], ['Merch', rs.merch]].map(([label, val]) => (
                        <div key={label as string} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                          <span className="text-on-surface-variant">{label}</span>
                          <span className="text-on-surface">${fmt(val, 2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === 'audience' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-gutter">
                  <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                    <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2"><Icon name="group" className="text-primary-container" /> Follower growth</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <Line data={followersData} dataKey="followers">
                        <XAxis dataKey="date" tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#8a8a9a', fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                        <Tooltip contentStyle={{ background: '#1c1b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                        <Line type="monotone" dataKey="followers" stroke="#48dbfb" strokeWidth={2} dot={false} />
                      </Line>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                    <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2"><Icon name="trending_up" className="text-primary-container" /> Top content</h3>
                    {topContent.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {topContent.map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <div className="min-w-0">
                              <p className="text-sm text-on-surface truncate">{c.title || 'Untitled'}</p>
                              <p className="text-xs text-on-surface-variant/60">{fmt(c.minutes)} min watched</p>
                            </div>
                            <span className="text-xs text-primary-container shrink-0">{fmt(c.views)} views</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant/60 text-center py-8">No content performance data yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {section === 'content' && (
              <div className="space-y-6">
                <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                  <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2"><Icon name="bubble_chart" className="text-primary-container" /> Content performance (views × watch time)</h3>
                  <div className="h-72">
                    <Bubble data={bubbleData} options={{ scales: { x: { title: { display: true, text: 'Views', color: '#8a8a9a' }, ticks: { color: '#8a8a9a' } }, y: { title: { display: true, text: 'Watch minutes', color: '#8a8a9a' }, ticks: { color: '#8a8a9a' } }, plugins: { legend: { display: false } } } }} />
                  </div>
                </div>
                <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                  <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2"><Icon name="movie" className="text-primary-container" /> Uploads ({content?.uploads?.length || 0})</h3>
                  {content?.uploads && content.uploads.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-on-surface-variant/60 text-xs border-b border-white/5">
                            <th className="py-2 pr-4 font-medium">Title</th>
                            <th className="py-2 pr-4 font-medium">Genre</th>
                            <th className="py-2 pr-4 font-medium text-right">Views</th>
                            <th className="py-2 pr-4 font-medium text-right">Watch (min)</th>
                            <th className="py-2 pr-4 font-medium text-right">Likes</th>
                            <th className="py-2 font-medium text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {content.uploads.map((u: any) => (
                            <tr key={u.id} className="border-b border-white/5 last:border-0">
                              <td className="py-2.5 pr-4 text-on-surface truncate max-w-[220px]">{u.title || 'Untitled'}</td>
                              <td className="py-2.5 pr-4 text-on-surface-variant capitalize">{u.genre || '—'}</td>
                              <td className="py-2.5 pr-4 text-right">{fmt(u.views)}</td>
                              <td className="py-2.5 pr-4 text-right">{fmt(u.minutes)}</td>
                              <td className="py-2.5 pr-4 text-right">{fmt(u.likes)}</td>
                              <td className="py-2.5 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${u.visibility === 'public' || u.status === 'published' ? 'bg-primary-container/10 text-primary-container' : 'bg-white/10 text-on-surface-variant'}`}>
                                  {u.visibility || u.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant/60 text-center py-8">No uploads yet</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
