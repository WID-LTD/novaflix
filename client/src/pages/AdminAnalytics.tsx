import { useEffect, useState } from 'react'
import { getToken, adminAnalytics } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatCard from '../components/admin/StatCard'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts'
import { useAdminEvent, AdminEvents } from '../hooks/useAdminEvents'

const COLORS = ['#E50914', '#00B388', '#7C4DFF', '#F5A623', '#4DD0E1']

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null)

  // Real-time updates for analytics
  useAdminEvent('admin:user.signup', () => {
    console.log('[AdminAnalytics] New user signup - analytics may need refresh')
  })

  useAdminEvent('admin:user.signup', () => {
    console.log('[AdminAnalytics] New user signup - analytics may need refresh')
  })

  useAdminEvent('admin:user.role.changed', () => {
    console.log('[AdminAnalytics] User role changed')
  })

  useAdminEvent('admin:user.banned', () => {
    console.log('[AdminAnalytics] User banned')
  })

  useAdminEvent('admin:user.unbanned', () => {
    console.log('[AdminAnalytics] User unbanned')
  })

  useEffect(() => {
    const token = getToken()
    if (!token) return
    adminAnalytics(token).then((r) => r.success && setData(r))
  }, [])

  if (!data) return <div className="text-on-surface-variant text-sm">Loading analytics…</div>

  const revenue = data.revenueSeries.reduce((s: number, r: any) => s + Number(r.revenue || 0), 0)
  const signups = data.signups.reduce((s: number, r: any) => s + Number(r.n || 0), 0)
  const watch = data.watch.reduce((s: number, r: any) => s + Number(r.n || 0), 0)
  const active = Number(data.churn?.active || 0)
  const churned = Number(data.churn?.churned || 0)
  const subs = active + churned
  const churnRate = subs ? ((churned / subs) * 100).toFixed(1) : '0'

  const revenueByType = (data.byType || []).map((t: any) => ({ type: t.type, revenue: Number(t.total || 0) }))
  const planBreakdown = data.planBreakdown || []

  return (
    <div>
      <PageHeader icon="monitoring" title="Analytics & Revenue" subtitle="Financial and engagement performance" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-6">
        <StatCard label="Revenue (60d)" value={`$${revenue.toLocaleString()}`} icon="payments" tone="primary" />
        <StatCard label="Sign-ups (60d)" value={signups.toLocaleString()} icon="person_add" />
        <StatCard label="Watch (min)" value={watch.toLocaleString()} icon="schedule" />
        <StatCard label="Churn rate" value={`${churnRate}%`} icon="trending_down" tone={Number(churnRate) > 8 ? 'error' : 'secondary'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-gutter mb-6">
        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
          <h3 className="font-label-md text-label-md text-on-surface mb-3">Revenue trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.revenueSeries}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#888' }} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#E50914" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
          <h3 className="font-label-md text-label-md text-on-surface mb-3">Revenue by type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueByType}>
              <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#888' }} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 12 }} />
              <Bar dataKey="revenue" fill="#00B388" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-gutter mb-6">
        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
          <h3 className="font-label-md text-label-md text-on-surface mb-3">Plan distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={planBreakdown} dataKey="n" nameKey="plan" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {planBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {planBreakdown.map((p: any, i: number) => (
              <span key={p.plan} className="text-xs text-on-surface-variant flex items-center gap-1.5 capitalize">
                <i className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {p.plan} · {p.n}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
          <h3 className="font-label-md text-label-md text-on-surface mb-3">Churn</h3>
          <div className="text-4xl font-bold text-error">{churnRate}%</div>
          <p className="text-sm text-on-surface-variant mt-2">
            {active} active · {churned} churned. Live viewers now: <span className="text-secondary font-semibold">{data.live}</span>
          </p>
        </div>

        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
          <h3 className="font-label-md text-label-md text-on-surface mb-3">Sign-ups vs watch minutes</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={(data.signups || []).map((s: any) => {
                const w = (data.watch || []).find((x: any) => x.day === s.day)
                return { day: s.day, signups: Number(s.n), watch: Number(w?.n || 0) }
              })}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#888' }} />
              <YAxis tick={{ fontSize: 9, fill: '#888' }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="signups" stroke="#E50914" dot={false} name="Sign-ups" />
              <Line type="monotone" dataKey="watch" stroke="#00B388" dot={false} name="Watch (min)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}