import { useEffect, useState } from 'react'
import { getToken } from '../lib/auth'
import { API_BASE } from '../lib/config'
import PageHeader from '../components/admin/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'
import StatCard from '../components/admin/StatCard'

export default function AdminCreators() {
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch(`${API_BASE}/admin/creator-studio`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((r) => { if (r.success) setCreators(r.creators || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-on-surface-variant text-sm">Loading creators…</div>

  const featured = creators.filter((c) => c.featured).length

  return (
    <div>
      <PageHeader icon="videocam" title="Creator Studio" subtitle="Oversee creators on the platform" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter mb-6">
        <StatCard label="Total Creators" value={creators.length} icon="videocam" />
        <StatCard label="Verified" value={creators.filter((c) => c.verified).length} icon="verified" tone="secondary" />
        <StatCard label="Featured" value={featured} icon="star" tone="primary" />
      </div>

      <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-on-surface">{c.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{c.email}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.plan || 'free'} /></td>
                  <td className="px-4 py-3 text-on-surface-variant">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {creators.length === 0 && <p className="p-6 text-center text-on-surface-variant text-sm">No creators.</p>}
        </div>
      </div>
    </div>
  )
}