import { useEffect, useState } from 'react'
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm">Manage users, creators, and platform settings</p>
      </div>

      {message && (
        <div className="bg-green-500/10 text-green-400 text-sm p-3 rounded-xl mb-4">{message}</div>
      )}

      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-accent text-white' : 'bg-surface-secondary text-gray-400 hover:text-white'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers },
            { label: 'Total Uploads', value: stats.totalUploads },
            { label: 'Minutes Watched', value: stats.totalMinutesWatched?.toLocaleString() },
            { label: 'Tips Revenue', value: `$${stats.totalTips}` },
            { label: 'Active Subs', value: stats.activeSubscriptions },
          ].map((s, i) => (
            <div key={i} className="bg-surface-secondary border border-white/5 rounded-xl p-5">
              <p className="text-gray-400 text-xs mb-1">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-white/5">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2">Email</th>
                <th className="text-left py-3 px-2">Role</th>
                <th className="text-left py-3 px-2">Plan</th>
                <th className="text-left py-3 px-2">Verified</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-2">{u.name}</td>
                  <td className="py-3 px-2 text-gray-400">{u.email}</td>
                  <td className="py-3 px-2">
                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} className="bg-surface border border-white/10 rounded-lg px-2 py-1 text-xs text-white">
                      <option value="user">User</option>
                      <option value="creator">Creator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-2">{u.plan}</td>
                  <td className="py-3 px-2">{u.email_verified ? '✓' : '✗'}</td>
                  <td className="py-3 px-2">
                    <button onClick={() => handleRoleChange(u.id, 'banned')} className="text-red-400 text-xs hover:text-red-300">Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'creators' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-white/5">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2">Email</th>
                <th className="text-left py-3 px-2">Plan</th>
                <th className="text-left py-3 px-2">Verified</th>
              </tr>
            </thead>
            <tbody>
              {creators.map(c => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="py-3 px-2">{c.name}</td>
                  <td className="py-3 px-2 text-gray-400">{c.email}</td>
                  <td className="py-3 px-2">{c.plan}</td>
                  <td className="py-3 px-2">{c.email_verified ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'uploads' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-white/5">
                <th className="text-left py-3 px-2">Title</th>
                <th className="text-left py-3 px-2">Genre</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Views</th>
                <th className="text-left py-3 px-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map(u => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="py-3 px-2">{u.title}</td>
                  <td className="py-3 px-2 text-gray-400">{u.genre}</td>
                  <td className="py-3 px-2">{u.status}</td>
                  <td className="py-3 px-2">{u.views}</td>
                  <td className="py-3 px-2">${u.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'newsletter' && (
        <div className="max-w-2xl">
          <div className="bg-surface-secondary border border-white/5 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-400 mb-1">Subscribers</p>
            <p className="text-2xl font-bold">{subscribers.length}</p>
          </div>
          <div className="bg-surface-secondary border border-white/5 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Send Newsletter</h3>
            <div className="space-y-4">
              <input value={newsletterSubject} onChange={e => setNewsletterSubject(e.target.value)} placeholder="Subject" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50" />
              <textarea value={newsletterContent} onChange={e => setNewsletterContent(e.target.value)} placeholder="Email content (HTML supported)" rows={6} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 resize-none" />
              <button onClick={handleSendNewsletter} className="bg-accent text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors">
                Send to {subscribers.length} Subscribers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
