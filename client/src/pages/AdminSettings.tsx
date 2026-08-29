import { useEffect, useState } from 'react'
import { getToken, adminAuditLog } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'
import StatCard from '../components/admin/StatCard'
import { useAdminEvent, AdminEvents } from '../hooks/useAdminEvents'

export default function AdminSettings() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Real-time updates for audit log
  useAdminEvent('admin:audit.action', (data) => {
    console.log('[AdminSettings] New audit action:', data)
    setLogs((prev) => [data, ...prev])
  })

  useEffect(() => {
    const token = getToken()
    if (!token) return
    adminAuditLog(token).then((r) => { if (r.success) setLogs(r.activity || []); setLoading(false) })
  }, [])

  if (loading) return <div className="text-on-surface-variant text-sm">Loading audit log…</div>

  return (
    <div>
      <PageHeader icon="settings" title="Settings & Audit" subtitle="Platform audit trail of admin actions" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter mb-6">
        <StatCard label="Log Entries" value={logs.length} icon="history" />
      </div>

      <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Meta</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-on-surface font-mono text-xs">{l.action}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{l.actor_name || 'admin'}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    <span className="capitalize">{l.entity}</span> {l.entity_id ? `#${String(l.entity_id).slice(0, 8)}` : ''}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant max-w-xs truncate">{JSON.stringify(l.meta) || '—'}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p className="p-5 text-center text-on-surface-variant text-sm">No recorded admin activity yet.</p>}
        </div>
      </div>
    </div>
  )
}