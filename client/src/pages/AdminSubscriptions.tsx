import { useEffect, useState } from 'react'
import { getToken, adminSubscriptions } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'

export default function AdminSubscriptions() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    adminSubscriptions(token).then((r) => { if (r.success) setList(r.subscriptions || []); setLoading(false) })
  }, [])

  if (loading) return <div className="text-on-surface-variant text-sm">Loading subscriptions…</div>

  return (
    <div>
      <PageHeader icon="subscriptions" title="Subscriptions" subtitle={`${list.length} active subscriptions`} />

      <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Renews</th>
                <th className="px-4 py-3">Started</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-on-surface">{s.user_name || '—'}</td>
                  <td className="px-4 py-3 text-on-surface-variant capitalize">{s.plan}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.active ? 'active' : 'paused'} /></td>
                  <td className="px-4 py-3 text-on-surface-variant">{s.renews_at ? new Date(s.renews_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{s.started_at ? new Date(s.started_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-6 text-center text-on-surface-variant text-sm">No subscriptions.</p>}
        </div>
      </div>
    </div>
  )
}