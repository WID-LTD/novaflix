import { useState } from 'react'
import Icon from '../components/ui/Icon'
import { adminGetUsers, adminSendAnnouncement, getToken } from '../lib/auth'
import { usePushNotifications } from '../hooks/usePushNotifications'

type Target = 'all' | 'plan' | 'role' | 'user'

const PLANS = ['free', 'student', 'basic', 'standard', 'premium']
const ROLES = ['user', 'creator', 'admin']

export default function AdminAnnouncements() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('/')
  const [target, setTarget] = useState<Target>('all')
  const [plan, setPlan] = useState('premium')
  const [role, setRole] = useState('creator')
  const [userId, setUserId] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const push = usePushNotifications(true)

  function loadUsers() {
    const token = getToken()
    if (!token) return
    adminGetUsers(token).then((r) => r.success && setUsers(r.users))
  }

  function handleTargetChange(next: Target) {
    setTarget(next)
    if (next === 'user' && users.length === 0) loadUsers()
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    const token = getToken()
    if (!token) return
    setSending(true)
    setMessage('Sending...')
    const payload: Record<string, any> = {
      title: title.trim(),
      body: body.trim(),
      link: link.trim() || '/',
      target,
    }
    if (target === 'plan') payload.plan = plan
    if (target === 'role') payload.role = role
    if (target === 'user') payload.userId = userId

    const res = await adminSendAnnouncement(token, payload)
    if (res.success) {
      setMessage(`Sent! ${res.recipients} recipient(s) · ${res.notified} online · ${res.pushed} browser push · ${res.emailed} emailed`)
      setTitle('')
      setBody('')
      setLink('/')
    } else {
      setMessage(res.error || 'Failed to send')
    }
    setSending(false)
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Icon name="campaign" className="w-8 h-8 text-primary-container" />
          <div>
            <h1 className="text-headline-md font-bold">Announcements</h1>
            <p className="text-on-surface-variant/60 text-sm">Send a push notification to your audience</p>
          </div>
        </div>

        {message && (
          <div className="bg-secondary/10 text-secondary text-sm p-3 rounded-xl mb-4">{message}</div>
        )}

        <div className="bg-surface-container-high border border-white/5 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-on-surface-variant/60 text-xs mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              placeholder="e.g. New movies are here!"
              className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
            />
          </div>

          <div>
            <label className="block text-on-surface-variant/60 text-xs mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="What should users know?"
              className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-on-surface-variant/60 text-xs mb-1">Deeplink (defaults to home)</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/ or /search?type=movie"
              className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
            />
          </div>

          <div>
            <label className="block text-on-surface-variant/60 text-xs mb-2">Audience</label>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'plan', 'role', 'user'] as Target[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTargetChange(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${target === t ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant/20 text-on-surface-variant hover:text-on-surface'}`}
                >
                  {t === 'all' ? 'All users' : t === 'plan' ? 'By plan' : t === 'role' ? 'By role' : 'Specific user'}
                </button>
              ))}
            </div>
          </div>

          {target === 'plan' && (
            <div>
              <label className="block text-on-surface-variant/60 text-xs mb-1">Plan</label>
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm on-surface focus:outline-none">
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {target === 'role' && (
            <div>
              <label className="block text-on-surface-variant/60 text-xs mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm on-surface focus:outline-none">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {target === 'user' && (
            <div>
              <label className="block text-on-surface-variant/60 text-xs mb-1">User</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm on-surface focus:outline-none">
                <option value="">Select a user…</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send announcement'}
          </button>
        </div>

        {push.supported && (
          <div className="mt-6 bg-surface-container-high border border-white/5 rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-label-md text-label-md text-on-surface">Browser push</p>
              <p className="text-sm text-on-surface-variant">Permission: {push.permission}{push.configured ? '' : ' (server not configured)'}</p>
            </div>
            {push.permission === 'default' && (
              <button onClick={push.subscribe} disabled={push.subscribing} className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 transition-colors disabled:opacity-50">
                {push.subscribing ? 'Enabling…' : 'Enable push'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
