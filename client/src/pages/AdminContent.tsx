import { useEffect, useState } from 'react'
import { getToken, adminCatalog, adminUpdateCatalogItem } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'
import Icon from '../components/ui/Icon'
import { useAdminEvent, AdminEvents } from '../hooks/useAdminEvents'

export default function AdminContent() {
  const [token] = useState(() => getToken() ?? '')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const [msg, setMsg] = useState('')

  // Real-time updates for catalog
  useAdminEvent('admin:catalog.updated', (data) => {
    console.log('[AdminContent] Catalog updated:', data)
    // Update the specific item in the list
    setItems((prev) => prev.map((i) => 
      i.id === data.id ? { ...i, ...data.fields } : i
    ))
  })

  useAdminEvent('admin:catalog.created', (data) => {
    console.log('[AdminContent] New content created:', data)
    // Could refresh or add the new item
  })

  useEffect(() => {
    adminCatalog(token).then((r) => {
      if (r.success) setItems(r.items || [])
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const open = (it: any) => {
    setEditId(it.id)
    setForm({
      title: it.title,
      status: it.status || '',
      maturity_rating: it.maturity_rating || '',
      language: it.language || '',
      trailer_url: it.trailer_url || '',
    })
    setMsg('')
  }

  const save = async () => {
    if (!editId) return
    const r = await adminUpdateCatalogItem(token, 'upload', editId, {
      title: form.title,
      status: form.status,
      maturity_rating: form.maturity_rating,
      language: form.language,
      trailer_url: form.trailer_url,
    })
    setMsg(r.success ? 'Saved ✓' : r.error)
    if (r.success) {
      setItems((prev) => prev.map((i) => (i.id === editId ? { ...i, ...form } : i)))
      setEditId(null)
    }
  }

  if (loading) return <div className="text-on-surface-variant text-sm">Loading catalog…</div>

  return (
    <div>
      <PageHeader icon="video_library" title="Content & Catalog" subtitle="Manage movies, short films and metadata" />

      <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {it.thumbnail ? (
                        <img src={it.thumbnail} alt="" className="w-10 h-6 object-cover rounded" />
                      ) : (
                        <Icon name="movie" size="sm" className="text-on-surface-variant" />
                      )}
                      <span className="text-on-surface">{it.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant capitalize">{it.kind || 'movie'}</td>
                  <td className="px-4 py-3"><StatusBadge status={it.status} /></td>
                  <td className="px-4 py-3 text-on-surface-variant">{Number(it.views || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{it.owner || '—'}</td>
                  <td className="px-4 py-3">
                    {it.kind === 'movie' ? (
                      <button onClick={() => open(it)} className="text-primary text-sm font-medium hover:underline">Edit</button>
                    ) : (
                      <span className="text-on-surface-variant/50 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="p-6 text-center text-on-surface-variant text-sm">No content in catalog.</p>}
        </div>
      </div>

      {editId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-high rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold">Edit content</h3>
            {[['title', 'Title'], ['maturity_rating', 'Maturity rating'], ['language', 'Language'], ['trailer_url', 'Trailer URL']].map(([k, label]) => (
              <label key={k} className="block text-sm">
                <span className="text-on-surface-variant">{label}</span>
                <input value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="input mt-1 w-full" />
              </label>
            ))}
            <label className="text-sm block">
              <span className="text-on-surface-variant">Status</span>
              <select value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input mt-1 w-full">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="hidden">Hidden</option>
                <option value="banned">Banned</option>
              </select>
            </label>
            {msg && <p className="text-sm text-primary">{msg}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditId(null)} className="btn-outline">Cancel</button>
              <button onClick={save} className="btn-primary">Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}