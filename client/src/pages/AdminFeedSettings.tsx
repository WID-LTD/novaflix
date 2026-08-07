import { useEffect, useState } from 'react'
import { getToken, adminFeedSettings, adminSetFeedSetting } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import Icon from '../components/ui/Icon'

export default function AdminFeedSettings() {
  const [token] = useState(() => getToken() ?? '')
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    adminFeedSettings(token).then((r) => { if (r.success) setSettings(r.settings || {}); setLoading(false) })
  }, [])

  const set = async (key: string, value: any) => {
    const r = await adminSetFeedSetting(token, key, value)
    setMsg(r.success ? `Updated ${key} ✓` : r.error)
    if (r.success) setSettings((prev: any) => ({ ...prev, [key]: String(value) }))
  }

  if (loading) return <div className="text-on-surface-variant text-sm">Loading feed settings…</div>

  const entries = Object.entries(settings)

  return (
    <div>
      <PageHeader icon="tune" title="Feed & Algorithm" subtitle="Tune discovery, recommendations and trending" />
      {msg && <p className="text-sm text-primary mb-4">{msg}</p>}

      <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-on-surface">{key}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{String(value)}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => set(key, true)} className="btn-outline !py-1 text-xs"><Icon name="toggle_on" size="sm" /> On</button>
                    <button onClick={() => set(key, false)} className="btn-outline !py-1 text-xs"><Icon name="toggle_off" size="sm" /> Off</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <p className="p-5 text-center text-on-surface-variant text-sm">No feed settings configured.</p>}
        </div>
      </div>
    </div>
  )
}