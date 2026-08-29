import { useEffect, useState } from 'react'
import { getToken, adminTransactions } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'
import { useAdminEvent, AdminEvents } from '../hooks/useAdminEvents'

const fmtMoney = (v: number) => `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

export default function AdminTransactions() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Real-time updates for transactions
  useAdminEvent('admin:transaction.created', (data) => {
    console.log('[AdminTransactions] New transaction:', data)
    setList((prev) => [data.transaction, ...prev])
  })

  useEffect(() => {
    const token = getToken()
    if (!token) return
    adminTransactions(token).then((r) => { if (r.success) setList(r.transactions || []); setLoading(false) })
  }, [])

  if (loading) return <div className="text-on-surface-variant text-sm">Loading transactions…</div>

  const total = list.reduce((s, t) => s + Number(t.amount || 0), 0)

  return (
    <div>
      <PageHeader icon="payments" title="Transactions" subtitle={`${list.length} total · ${fmtMoney(total)} processed`} />

      <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-on-surface-variant">{String(t.id).slice(0, 8)}</td>
                  <td className="px-4 py-3 text-on-surface">{t.user_name || '—'}</td>
                  <td className="px-4 py-3 text-on-surface-variant capitalize">{t.type}</td>
                  <td className="px-4 py-3 text-on-surface font-medium">{fmtMoney(t.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-on-surface-variant">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-6 text-center text-on-surface-variant text-sm">No transactions.</p>}
        </div>
      </div>
    </div>
  )
}