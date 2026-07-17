import { useEffect, useState } from 'react'
import Icon from '../components/ui/Icon'
import { adminGetUsers, adminGetStats, adminGetUploads, adminGetCreators, adminUpdateUserRole, adminSendNewsletter, adminGetNewsletterSubscribers, getToken } from '../lib/auth'

export default function AdminDashboard() {
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [uploads, setUploads] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [newsletterSubject, setNewsletterSubject] = useState('')
  const [newsletterContent, setNewsletterContent] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) return

    adminGetStats(token).then(r => r.success && setStats(r.stats))
    adminGetUsers(token).then(r => r.success && setUsers(r.users))
    adminGetUploads(token).then(r => r.success && setUploads(r.uploads))
    adminGetCreators(token).then(r => r.success && setCreators(r.creators))
    adminGetNewsletterSubscribers(token).then(r => r.success && setSubscribers(r.subscribers))
  }, [])

  async function handleRoleChange(userId: string, role: string) {
    const token = getToken()
    if (!token) return
    const res = await adminUpdateUserRole(token, userId, role)
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      setMessage('Role updated')
    }
  }

  async function handleSendNewsletter() {
    if (!newsletterSubject || !newsletterContent) return
    const token = getToken()
    if (!token) return
    setMessage('Sending...')
    const res = await adminSendNewsletter(token, newsletterSubject, newsletterContent)
    setMessage(res.message || 'Sent')
  }

  const tabs = ['stats', 'users', 'creators', 'uploads', 'newsletter']

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Icon name="admin_panel_settings" className="w-8 h-8 text-primary-container" />
          <div>
            <h1 className="text-headline-md font-bold">Admin Dashboard</h1>
            <p className="text-on-surface-variant/60 text-sm">Manage users, creators, and platform settings</p>
          </div>
        </div>

        {message && (
          <div className="bg-secondary/10 text-secondary text-sm p-3 rounded-xl mb-4">{message}</div>
        )}

        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant/20 text-on-surface-variant hover:text-on-surface'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'stats' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-gutter">
            {[
              { label: 'Total Users', value: stats.totalUsers },
              { label: 'Total Uploads', value: stats.totalUploads },
              { label: 'Minutes Watched', value: stats.totalMinutesWatched?.toLocaleString() },
              { label: 'Tips Revenue', value: `$${stats.totalTips}` },
              { label: 'Active Subs', value: stats.activeSubscriptions },
            ].map((s, i) => (
              <div key={i} className="bg-surface-container-high border border-white/5 rounded-xl p-5">
                <p className="text-on-surface-variant/60 text-xs mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-on-surface">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-on-surface-variant/60 text-xs uppercase border-b border-white/5">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Plan</th>
                    <th className="text-left py-3 px-4">Verified</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-on-surface">{u.name}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{u.email}</td>
                      <td className="py-3 px-4">
                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} className="bg-surface-container border border-outline/20 rounded-lg px-2 py-1 text-xs on-surface">
                          <option value="user">User</option>
                          <option value="creator">Creator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">{u.plan}</td>
                      <td className="py-3 px-4">{u.email_verified ? <Icon name="check" className="text-secondary" /> : <Icon name="close" className="text-error" />}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleRoleChange(u.id, 'banned')} className="text-error text-xs hover:text-error/80">Ban</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'creators' && (
          <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-on-surface-variant/60 text-xs uppercase border-b border-white/5">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Plan</th>
                    <th className="text-left py-3 px-4">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map(c => (
                    <tr key={c.id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-on-surface">{c.name}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{c.email}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{c.plan}</td>
                      <td className="py-3 px-4">{c.email_verified ? <Icon name="check" className="text-secondary" /> : <Icon name="close" className="text-error" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'uploads' && (
          <div className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-on-surface-variant/60 text-xs uppercase border-b border-white/5">
                    <th className="text-left py-3 px-4">Title</th>
                    <th className="text-left py-3 px-4">Genre</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Views</th>
                    <th className="text-left py-3 px-4">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map(u => (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-on-surface">{u.title}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{u.genre}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{u.status}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{u.views}</td>
                      <td className="py-3 px-4 text-on-surface-variant">${u.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'newsletter' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-surface-container-high border border-white/5 rounded-xl p-6">
              <p className="text-on-surface-variant/60 text-sm mb-1">Subscribers</p>
              <p className="text-2xl font-bold text-on-surface">{subscribers.length}</p>
            </div>
            <div className="bg-surface-container-high border border-white/5 rounded-xl p-6">
              <h3 className="font-label-md text-label-md text-on-surface mb-4">Send Newsletter</h3>
              <div className="space-y-4">
                <input value={newsletterSubject} onChange={e => setNewsletterSubject(e.target.value)} placeholder="Subject" className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50" />
                <textarea value={newsletterContent} onChange={e => setNewsletterContent(e.target.value)} placeholder="Email content (HTML supported)" rows={6} className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50 resize-none" />
                <button onClick={handleSendNewsletter} className="bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-colors">
                  Send to {subscribers.length} Subscribers
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
