import { useEffect, useState } from 'react'
import { getToken, adminModeration, adminResolveReport, adminAppeals, adminDecideAppeal } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'
import StatCard from '../components/admin/StatCard'
import Icon from '../components/ui/Icon'

export default function AdminModeration() {
  const [tab, setTab] = useState<'reports' | 'appeals'>('reports')
  const [items, setItems] = useState<any[]>([])
  const [appeals, setAppeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const loadReports = async () => {
    const token = getToken()
    if (!token) return
    const r = await adminModeration(token!)
    if (r.success) setItems(r.reports || r.items || [])
    setLoading(false)
  }

  const loadAppeals = async () => {
    const token = getToken()
    if (!token) return
    const r = await adminAppeals(token)
    if (r.success) setAppeals(r.appeals || [])
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'reports') loadReports()
    else loadAppeals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const resolve = async (id: string, status: string) => {
    const token = getToken()
    const r = await adminResolveReport(token!, id, status)
    if (r.success) setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const decide = async (appeal: any, status: string) => {
    const token = getToken()
    const r = await adminDecideAppeal(token!, appeal.id, status, notes[appeal.id] || '')
    if (r.success) { await loadAppeals(); setNotes((prev) => ({ ...prev, [appeal.id]: '' })) }
  }

  if (loading) return <div className="text-on-surface-variant text-sm">Loading moderation queue…</div>

  const open = items.filter((i) => (i.status || 'open') === 'open').length
  const pendingAppeals = appeals.filter((a) => a.status === 'pending').length

  return (
    <div>
      <PageHeader icon="gavel" title="Content Moderation" subtitle="Review reported content and account appeals" />

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('reports')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'reports' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
        >
          <Icon name="flag" size="sm" /> Reports
        </button>
        <button
          onClick={() => setTab('appeals')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'appeals' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
        >
          <Icon name="help_center" size="sm" /> Appeals {pendingAppeals > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold">{pendingAppeals}</span>}
        </button>
      </div>

      {tab === 'reports' ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter mb-6">
            <StatCard label="Open Reports" value={open} icon="flag" tone={open > 0 ? 'error' : 'default'} />
            <StatCard label="Total Queue" value={items.length} icon="inbox" />
          </div>
          <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Reported by</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 text-on-surface">{i.target_type || i.content?.type || '—'} #{String(i.target_id || i.id).slice(0, 8)}</td>
                      <td className="px-4 py-3 text-on-surface-variant max-w-xs truncate">{i.reason}{i.details ? ` — ${i.details}` : ''}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{i.reporter_name || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={i.status || 'open'} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => resolve(i.id, 'resolved')} className="btn-outline !py-1 text-xs">Resolve</button>
                          <button onClick={() => resolve(i.id, 'banned')} className="btn-danger !py-1 text-xs"><Icon name="block" size="sm" /> Ban</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && <p className="p-6 text-center text-on-surface-variant text-sm">Moderation queue is clear.</p>}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter mb-6">
            <StatCard label="Pending Appeals" value={pendingAppeals} icon="help_center" tone={pendingAppeals > 0 ? 'error' : 'default'} />
            <StatCard label="Total Appeals" value={appeals.length} icon="forum" />
          </div>
          <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Appeal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {appeals.map((a) => (
                    <tr key={a.id} className="border-b border-white/5 last:border-0 align-top">
                      <td className="px-4 py-3">
                        <p className="text-on-surface">{a.user_name || '—'}</p>
                        <p className="text-xs text-on-surface-variant">{a.user_email}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.appeal_type} /></td>
                      <td className="px-4 py-3">
                        <p className="text-on-surface-variant text-xs whitespace-pre-wrap max-w-md">{a.message}</p>
                        {a.account_reason && <p className="text-[11px] text-error mt-1">On record: {a.account_reason}</p>}
                        {a.resolution_note && <p className="text-[11px] text-success mt-1">Response: {a.resolution_note}</p>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3">
                        {a.status === 'pending' ? (
                          <div className="flex flex-col gap-2">
                            <input
                              value={notes[a.id] || ''}
                              onChange={(e) => setNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
                              placeholder="Resolution note…"
                              className="input !py-1 !px-2 text-xs"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => decide(a, 'approved')} className="btn-outline !py-1 text-xs text-success">Approve</button>
                              <button onClick={() => decide(a, 'denied')} className="btn-danger !py-1 text-xs">Deny</button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {appeals.length === 0 && <p className="p-6 text-center text-on-surface-variant text-sm">No appeals yet.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}