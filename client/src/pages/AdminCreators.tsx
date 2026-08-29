import { useEffect, useState, useCallback } from 'react'
import { getToken, adminGetCreatorApplications, adminApproveCreatorApplication, adminDenyCreatorApplication, adminGetCreators } from '../lib/auth'
import PageHeader from '../components/admin/PageHeader'
import StatCard from '../components/admin/StatCard'
import { useAdminEvent, AdminEvents } from '../hooks/useAdminEvents'

type Tab = 'pending' | 'approved' | 'denied' | 'all'

export default function AdminCreators() {
  const [tab, setTab] = useState<Tab>('pending')
  const [applications, setApplications] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Real-time updates for creator applications
  useAdminEvent('admin:creator.application.approved', (data) => {
    console.log('[AdminCreators] Creator application approved:', data)
    // Update local state optimistically
    setApplications((prev) => prev.map((app) =>
      app.user_id === data.userId ? { ...app, status: 'approved' } : app
    ))
  })

  useAdminEvent('admin:creator.application.denied', (data) => {
    console.log('[AdminCreators] Creator application denied:', data)
    setApplications((prev) => prev.map((app) =>
      app.user_id === data.userId ? { ...app, status: 'denied' } : app
    ))
  })

  // New creator application submitted
  useAdminEvent('admin:creator.application.submitted', (data) => {
    console.log('[AdminCreators] New creator application submitted:', data)
    // Prepend the new application to the pending list
    const newApp = {
      id: data.userId, // Using userId as temporary ID until fetch refreshes
      user_id: data.userId,
      handle: data.platformName || '',
      bio: data.bio || '',
      status: 'pending',
      created_at: new Date(data.timestamp).toISOString(),
      email: data.email,
      name: data.name,
      avatar: null,
      display_name: data.name,
      category: '',
      portfolio_url: '',
    }
    setApplications((prev) => {
      // Avoid duplicates if fetchData already loaded it
      if (prev.some(app => app.user_id === data.userId)) return prev
      return [newApp, ...prev]
    })
  })

  const fetchData = useCallback(async () => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    const [appsRes, creatorsRes] = await Promise.all([
      adminGetCreatorApplications(token, tab === 'all' ? undefined : tab),
      adminGetCreators(token)
    ])
    if (appsRes.success) setApplications(appsRes.applications || [])
    if (creatorsRes.success) setCreators(creatorsRes.creators || [])
    setLoading(false)
  }, [tab])

  useEffect(() => { fetchData() }, [fetchData])

  const handleApprove = async (id: string) => {
    const token = getToken()
    if (!token) return
    setActionLoading(id)
    await adminApproveCreatorApplication(token, id)
    setActionLoading(null)
    fetchData()
  }

  const handleDeny = async (id: string) => {
    const token = getToken()
    if (!token) return
    setActionLoading(id)
    await adminDenyCreatorApplication(token, id)
    setActionLoading(null)
    fetchData()
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Approved' },
    { key: 'denied', label: 'Denied' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div>
      <PageHeader icon="videocam" title="Creator Studio" subtitle="Manage creator applications and approvals" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-6">
        <StatCard label="Total Creators" value={creators.length} icon="videocam" />
        <StatCard label="Pending Applications" value={pendingCount} icon="pending" tone="primary" />
        <StatCard label="Approved" value={applications.filter(a => a.status === 'approved').length} icon="check_circle" tone="secondary" />
        <StatCard label="Denied" value={applications.filter(a => a.status === 'denied').length} icon="cancel" tone="error" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-500">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant/60 border-b border-white/5">
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Portfolio</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <>
                  <tr key={app.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden shrink-0">
                          {app.avatar ? (
                            <img src={app.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs">
                              {(app.name || app.display_name || '?')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-on-surface font-medium">{app.display_name || app.name}</p>
                          <p className="text-on-surface-variant text-xs">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{app.category || '—'}</td>
                    <td className="px-4 py-3">
                      {app.portfolio_url ? (
                        <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary-container hover:underline text-xs truncate max-w-[120px] block">
                          {app.portfolio_url.replace(/^https?:\/\//, '')}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs">
                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        app.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                        app.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {app.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={actionLoading === app.id}
                            className="px-3 py-1.5 bg-green-500/20 text-green-500 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === app.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleDeny(app.id)}
                            disabled={actionLoading === app.id}
                            className="px-3 py-1.5 bg-red-500/20 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === app.id ? '...' : 'Deny'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedId === app.id && app.bio && (
                    <tr key={`${app.id}-detail`}>
                      <td colSpan={6} className="px-4 py-3 bg-surface-container/50">
                        <p className="text-on-surface-variant text-sm">{app.bio || app.profile_bio}</p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {applications.length === 0 && !loading && (
            <p className="p-6 text-center text-on-surface-variant text-sm">
              No {tab === 'all' ? '' : tab} applications.
            </p>
          )}
          {loading && (
            <p className="p-6 text-center text-on-surface-variant text-sm">Loading...</p>
          )}
        </div>
      </div>
    </div>
  )
}
