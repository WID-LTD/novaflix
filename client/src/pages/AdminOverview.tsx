import { useEffect, useState } from 'react'
import { getToken, adminOverview } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatCard from '../components/admin/StatCard'
import StatusBadge from '../components/admin/StatusBadge'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts'
import { useAdminEvent, AdminEvents } from '../hooks/useAdminEvents'

interface OverviewData {
  stats: any
  revenueSeries: any[]
  signups: any[]
  watch: any[]
  top: any[]
  planBreakdown: any[]
  churn: any
  planCounts: any[]
  live: number
  activity: any[]
}

export default function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [pendingCreatorApps, setPendingCreatorApps] = useState(0)

  // Real-time updates for dashboard stats
  useAdminEvent('admin:user.signup', (data) => {
    console.log('[AdminOverview] New user signup:', data)
    if (data.isCreatorApply) {
      setPendingCreatorApps(prev => prev + 1)
    }
  })

  useAdminEvent('admin:creator.application.approved', () => {
    setPendingCreatorApps(prev => Math.max(0, prev - 1))
  })

  useAdminEvent('admin:creator.application.denied', () => {
    setPendingCreatorApps(prev => Math.max(0, prev - 1))
  })

  useAdminEvent('admin:user.signup', () => {
    console.log('[AdminOverview] New user signup - refreshing overview')
    // Could trigger a stat refresh or optimistic increment
  })

  useAdminEvent('admin:user.role.changed', () => {
    console.log('[AdminOverview] User role changed - stats may need refresh')
  })

  useAdminEvent('admin:user.banned', () => {
    console.log('[AdminOverview] User banned - stats may need refresh')
  })

  useAdminEvent('admin:report.resolved', () => {
    console.log('[AdminOverview] Report resolved - open reports count may change')
  })

  useEffect(() => {
    const token = getToken()
    if (!token) return
    adminOverview(token).then((r) => r.success && setData(r))
  }, [])

  if (!data) return <div className="text-on-surface-variant text-sm">Loading dashboard…</div>

  const totalSubs = data.churn ? Number(data.churn.active) + Number(data.churn.churned) : 0
  const churnPct = totalSubs ? ((Number(data.churn.churned) / totalSubs) * 100).toFixed(1) : '0'

  return (
    <div>
      <PageHeader icon="space_dashboard" title="Platform Overview" subtitle="Real-time pulse of NovaFlix" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-gutter mb-6">
        <StatCard label="Total Users" value={data.stats.totalUsers} icon="group" />
        <StatCard label="Active Subs" value={data.stats.activeSubscriptions} icon="subscriptions" tone="secondary" />
        <StatCard label="Revenue" value={`$${Number(data.stats.revenue || 0).toLocaleString()}`} icon="payments" tone="primary" />
        <StatCard label="Watch Hours" value={Math.round(Number(data.stats.totalMinutesWatched || 0) / 60)} icon="schedule" />
        <StatCard label="Live Viewers" value={data.live} icon="sensors" tone="secondary" />
        <StatCard label="Open Reports" value={data.stats.openReports} icon="gavel" tone={data.stats.openReports > 0 ? 'error' : 'default'} />
        <StatCard label="Pending Creators" value={pendingCreatorApps} icon="person_add" tone={pendingCreatorApps > 0 ? 'primary' : 'default'} />
      </div>

      <div className="grid md:grid-cols-2 gap-gutter mb-6">
        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
          <h3 className="font-label-md text-label-md text-on-surface mb-3">Revenue (30d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.revenueSeries}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#777' }} />
              <YAxis tick={{ fontSize: 10, fill: '#777' }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#E50914" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
          <h3 className="font-label-md text-label-md text-on-surface mb-3">New sign-ups (30d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.signups}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#777' }} />
              <YAxis tick={{ fontSize: 10, fill: '#777' }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 12 }} />
              <Bar dataKey="n" fill="#E50914" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-gutter mb-6">
        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
          <h3 className="font-label-md text-label-md text-on-surface mb-3">Top content</h3>
          <div className="space-y-2">
            {data.top.map((t) => (
              <div key={`${t.content_type}-${t.id}`} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <StatusBadge status={t.content_type} />
                <span className="text-sm text-on-surface truncate flex-1">{t.title}</span>
                <span className="text-xs text-on-surface-variant">{Number(t.views).toLocaleString()} views</span>
              </div>
            ))}
            {data.top.length === 0 && <p className="text-sm text-on-surface-variant">No content yet.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
            <h3 className="font-label-md text-label-md text-on-surface mb-3">Plans & churn</h3>
            <div className="grid grid-cols-2 gap-3">
              {data.planBreakdown.map((p) => (
                <div key={p.plan} className="bg-surface-container rounded-xl px-4 py-3">
                  <p className="text-xs text-on-surface-variant capitalize">{p.plan}</p>
                  <p className="text-lg font-bold text-on-surface">{p.n}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">Churn rate: <span className="text-error font-semibold">{churnPct}%</span></p>
          </div>

          <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
            <h3 className="font-label-md text-label-md text-on-surface mb-3">Recent admin activity</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {data.activity.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-on-surface-variant">{a.action}</span>
                  <span className="text-xs text-on-surface-dim">{a.actor_name || 'admin'}</span>
                </div>
              ))}
              {data.activity.length === 0 && <p className="text-sm text-on-surface-variant">No recent activity.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}