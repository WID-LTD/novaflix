import { useEffect, useState } from 'react'
import { getToken } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'
import StatCard from '../components/admin/StatCard'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch(`/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((r) => { if (r.success) setUsers(r.users || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const changeRole = async (id: string, role: string) => {
    const token = getToken()
    const r = await fetch(`/api/admin/users/${id}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ role }) }).then((x) => x.json())
    if (r.success) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
  }

  if (loading) return <div className="text-on-surface-variant text-sm">Loading users…</div>

  const bans = users.filter((u) => u.role === 'banned').length

  return (
    <div>
      <PageHeader icon="group" title="Users & Access" subtitle="Manage roles, plans and access" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter mb-6">
        <StatCard label="Total Users" value={users.length} icon="group" />
        <StatCard label="Banned" value={bans} icon="block" tone={bans > 0 ? 'error' : 'default'} />
        <StatCard label="Admins" value={users.filter((u) => u.role === 'admin').length} icon="admin_panel_settings" tone="primary" />
      </div>

      <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-on-surface">{u.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role || 'user'} onChange={(e) => changeRole(u.id, e.target.value)} className="input !py-1 !px-2 text-xs">
                      {['user', 'creator', 'admin', 'banned'].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.plan || 'free'} /></td>
                  <td className="px-4 py-3 text-on-surface-variant">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="p-6 text-center text-on-surface-variant text-sm">No users.</p>}
        </div>
      </div>
    </div>
  )
}