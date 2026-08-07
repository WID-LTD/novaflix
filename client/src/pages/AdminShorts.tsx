import { useEffect, useState } from 'react'
import { getToken, adminCatalog } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'
import StatCard from '../components/admin/StatCard'
import Icon from '../components/ui/Icon'

export default function AdminShorts() {
  const [token] = useState(() => getToken() ?? '')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminCatalog(token, 'shorts').then((r) => {
      if (r.success) setItems(r.items || [])
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shorts = items.filter((i) => i.kind === 'short')
  const views = shorts.reduce((s, i) => s + Number(i.views || 0), 0)

  if (loading) return <div className="text-on-surface-variant text-sm">Loading shorts…</div>

  return (
    <div>
      <PageHeader icon="smart_display" title="Shorts" subtitle="TikTok-style short-form content" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter mb-6">
        <StatCard label="Total Shorts" value={shorts.length} icon="smart_display" />
        <StatCard label="Views" value={views.toLocaleString()} icon="visibility" />
        <StatCard label="In Catalog List" value={items.length - shorts.length} icon="movie" />
      </div>

      <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Owner</th>
              </tr>
            </thead>
            <tbody>
              {shorts.map((s) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.thumbnail ? <img src={s.thumbnail} alt="" className="w-10 h-6 object-cover rounded" /> : <Icon name="smart_display" size="sm" className="text-on-surface-variant" />}
                      <span className="text-on-surface">{s.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-on-surface-variant">{Number(s.views || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{s.owner || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shorts.length === 0 && <p className="p-6 text-center text-on-surface-variant text-sm">No shorts.</p>}
        </div>
      </div>
    </div>
  )
}