import { useCallback, useEffect, useState } from 'react'
import { getToken, adminRoles, adminPermissions, adminCreateRole, adminUpdateRole, adminDeleteRole, adminAssignRole } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'
import StatCard from '../components/admin/StatCard'
import Icon from '../components/ui/Icon'

interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  permissions: string[]
  is_system: boolean
  created_at?: string
}

interface PermGroup {
  group: string
  perms: { key: string; label: string }[]
}

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [groups, setGroups] = useState<PermGroup[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Role | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[] })

  const load = useCallback(async () => {
    const token = getToken()
    if (!token) return
    const [r, p] = await Promise.all([adminRoles(token), adminPermissions(token)])
    const permList = (p.permissions || []).map((x: any) => ({ key: x.key, label: x.label, group: x.group || 'General' }))
    const map = new Map<string, { key: string; label: string }[]>()
    permList.forEach((x: any) => {
      if (!map.has(x.group)) map.set(x.group, [])
      map.get(x.group)!.push(x)
    })
    setGroups(Array.from(map.entries()).map(([group, perms]) => ({ group, perms })))
    setRoles(r.roles || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((x) => x.json())
      .then((x) => { if (x.success) setUsers(x.users || []) })
      .catch(() => {})
  }, [])

  const flash = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000) }

  const togglePerm = (key: string) => {
    setForm((f) => {
      const has = f.permissions.includes(key)
      return { ...f, permissions: has ? f.permissions.filter((k) => k !== key) : [...f.permissions, key] }
    })
  }

  const openCreate = () => {
    setActive(null); setEditing(true); setForm({ name: '', description: '', permissions: [] })
  }

  const openEdit = (role: Role) => {
    setActive(role); setEditing(true); setForm({ name: role.name, description: role.description || '', permissions: role.permissions || [] })
  }

  const save = async () => {
    setSaving(true); setMsg(null)
    const token = getToken()
    if (!token) return
    const payload = { name: form.name.trim(), description: form.description.trim(), permissions: form.permissions }
    const res = active
      ? await adminUpdateRole(token, active.id, payload)
      : await adminCreateRole(token, payload)
    if (res.success) {
      flash('ok', active ? 'Role updated' : 'Role created')
      await load()
      setEditing(false)
      if (active) setActive(res.role || active)
    } else {
      flash('err', res.error || 'Failed to save role')
    }
    setSaving(false)
  }

  const remove = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"? Users with this role will keep their account but lose these permissions.`)) return
    const token = getToken()
    if (!token) return
    const res = await adminDeleteRole(token, role.id)
    if (res.success) { flash('ok', 'Role deleted'); if (active?.id === role.id) setActive(null); await load() }
    else flash('err', res.error || 'Failed to delete role')
  }

  const assignRole = async (userId: string, adminRoleId: string) => {
    const token = getToken()
    if (!token) return
    const res = await adminAssignRole(token, userId, adminRoleId || null)
    if (res.success) { setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, admin_role_id: adminRoleId || null } : u))); flash('ok', 'Role assigned') }
    else flash('err', res.error || 'Failed to assign role')
  }

  const toggleAllInGroup = (group: string, perms: { key: string }[]) => {
    const keys = perms.map((p) => p.key)
    const allOn = keys.every((k) => form.permissions.includes(k))
    setForm((f) => ({ ...f, permissions: allOn ? f.permissions.filter((k) => !keys.includes(k)) : Array.from(new Set([...f.permissions, ...keys])) }))
  }

  if (loading) return <div className="text-on-surface-variant text-sm">Loading roles…</div>

  const adminUserCount = users.filter((u) => u.admin_role_id).length

  return (
    <div>
      <PageHeader icon="admin_panel_settings" title="Roles & Permissions" subtitle="Granular access control for admin team members" />

      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm border ${msg.type === 'ok' ? 'bg-success/10 border-success/30 text-success' : 'bg-error/10 border-error/30 text-error'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter mb-6">
        <StatCard label="Roles" value={roles.length} icon="admin_panel_settings" />
        <StatCard label="Permissions" value={groups.reduce((n, g) => n + g.perms.length, 0)} icon="key" tone="primary" />
        <StatCard label="Admins Assigned" value={adminUserCount} icon="verified_user" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-on-surface">Roles</h2>
        <button onClick={openCreate} className="btn-primary !py-2 !px-3 text-sm flex items-center gap-1.5">
          <Icon name="add" size="sm" /> New Role
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => { setActive(role); setEditing(false) }}
            className={`text-left p-4 rounded-xl border transition-colors ${active?.id === role.id ? 'border-primary bg-primary/10' : 'border-white/5 bg-surface-container-high hover:border-white/15'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-on-surface">{role.name}</p>
              <StatusBadge status={role.is_system ? 'admin' : 'creator'} />
            </div>
            <p className="text-xs text-on-surface-variant mb-2">{role.description || role.slug}</p>
            <p className="text-xs text-primary">{role.permissions?.length ?? 0} permissions</p>
          </button>
        ))}
      </div>

      {active && !editing && (
        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-on-surface">{active.name}</h3>
              <p className="text-xs text-on-surface-variant">{active.description || active.slug}</p>
            </div>
            <div className="flex gap-2">
              {!active.is_system && (
                <button onClick={() => remove(active)} className="btn-outline !py-1.5 !px-3 text-sm flex items-center gap-1.5 text-error">
                  <Icon name="delete" size="sm" /> Delete
                </button>
              )}
              <button onClick={() => openEdit(active)} className="btn-primary !py-1.5 !px-3 text-sm flex items-center gap-1.5">
                <Icon name="edit" size="sm" /> Edit
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {(active.permissions || []).map((k) => <span key={k} className="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-xs">{k}</span>)}
            {(active.permissions || []).length === 0 && <span className="text-xs text-on-surface-variant">No permissions granted.</span>}
          </div>

          <h4 className="text-sm font-semibold text-on-surface mb-3">Assigned Admins</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Account Role</th>
                  <th className="px-3 py-2">Admin Role</th>
                </tr>
              </thead>
              <tbody>
                {users.filter((u) => u.admin_role_id === active.id || (active.slug === 'super-admin' && u.role === 'admin')).map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2 text-on-surface">{u.name} <span className="text-on-surface-variant text-xs">({u.email})</span></td>
                    <td className="px-3 py-2"><StatusBadge status={u.role || 'user'} /></td>
                    <td className="px-3 py-2">
                      <select value={u.admin_role_id || ''} onChange={(e) => assignRole(u.id, e.target.value)} className="input !py-1 !px-2 text-xs">
                        <option value="">— None —</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {users.filter((u) => u.admin_role_id === active.id || (active.slug === 'super-admin' && u.role === 'admin')).length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-3 text-center text-on-surface-variant text-xs">No admins assigned to this role.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-semibold text-on-surface mt-6 mb-3">Permission Matrix</h4>
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.group} className="border border-white/5 rounded-lg p-3">
                <p className="text-xs uppercase tracking-wider text-on-surface-variant/70 font-semibold mb-2">{g.group}</p>
                <div className="flex flex-wrap gap-2">
                  {g.perms.map((p) => (
                    <span
                      key={p.key}
                      title={p.key}
                      className={`px-2.5 py-1 rounded-lg text-xs ${(active.permissions || []).includes(p.key) ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
          <h3 className="font-semibold text-on-surface mb-4">{active ? `Edit: ${active.name}` : 'Create Role'}</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Role name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Support Agent" className="input" />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What can this role do?" className="input" />
            </div>
          </div>

          <p className="text-xs uppercase tracking-wider text-on-surface-variant/70 font-semibold mb-3">Permissions</p>
          <div className="space-y-3 mb-5">
            {groups.map((g) => (
              <div key={g.group} className="border border-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant/70 font-semibold">{g.group}</p>
                  <button onClick={() => toggleAllInGroup(g.group, g.perms)} className="text-xs text-primary hover:underline">
                    {g.perms.every((p) => form.permissions.includes(p.key)) ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {g.perms.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePerm(p.key)} className="accent-primary h-4 w-4" />
                      <span className="text-on-surface">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary flex items-center gap-1.5">
              <Icon name="save" size="sm" /> {saving ? 'Saving…' : 'Save Role'}
            </button>
            <button onClick={() => { setEditing(false); if (!active) setForm({ name: '', description: '', permissions: [] }) }} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
