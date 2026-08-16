import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { useNotifications } from '../lib/notifications'
import { getToken } from '../lib/auth'
import { formatRelative } from '../components/features/news/formatRelative'

const BASE = '/api'
const PAGE_SIZE = 50
const MAX_NOTIFICATIONS = 1000

const TYPE_ICON: Record<string, string> = {
  follow: 'person_add',
  comment: 'mode_comment',
  forum: 'forum',
  gift: 'card_giftcard',
}

export default function Notifications() {
  const navigate = useNavigate()
  const { unread, refresh, markRead, markAllRead } = useNotifications(true)
  const [all, setAll] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const initialized = useRef(false)

  const open = useCallback((n: any) => {
    setSelected(n)
    if (!n.is_read) {
      markRead(n.id)
      setAll((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }
  }, [markRead])

  const openLink = useCallback(() => {
    if (!selected) return
    const link = selected.link
    setSelected(null)
    if (link) navigate(link)
  }, [selected, navigate])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const loadAll = async () => {
      setLoading(true)
      const seen = new Set<string>()
      const collected: any[] = []
      let offset = 0
      while (offset < MAX_NOTIFICATIONS) {
        try {
          const res = await fetch(`${BASE}/notifications?limit=${PAGE_SIZE}&offset=${offset}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }).then((r) => r.json())
          const items = res.notifications || []
          if (!items.length) break
          for (const n of items) {
            if (!seen.has(n.id)) {
              seen.add(n.id)
              collected.push(n)
            }
          }
          offset += items.length
          if (items.length < PAGE_SIZE) break
        } catch {
          break
        }
      }
      setAll(collected)
      setLoading(false)
    }
    loadAll()
    refresh()
  }, [refresh])

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Icon name="notifications" className="w-8 h-8 text-primary-container" />
            <h1 className="text-headline-lg font-bold">Notifications</h1>
            {unread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-xs font-bold">
                {unread}
              </span>
            )}
          </div>
          {all.some((n) => !n.is_read) && (
            <button
              onClick={markAllRead}
              className="text-label-sm text-primary hover:underline transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <span className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : all.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="notifications_none" className="w-16 h-16 text-on-surface-variant/40 mx-auto mb-4" />
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-2">You're all caught up</h3>
            <p className="text-on-surface-variant/60 text-sm">Notifications about your follows, comments and gifts will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 rounded-2xl bg-surface-container border border-white/5 overflow-hidden">
            {all.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className="w-full text-left px-4 py-3.5 flex gap-3 items-start hover:bg-white/5 transition-colors"
              >
                <span className={`p-2 rounded-xl shrink-0 ${n.is_read ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary'}`}>
                  <Icon name={TYPE_ICON[n.type] || 'notifications'} size="sm" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-label-md text-on-surface leading-snug">{n.title}</span>
                  {n.body && <span className="block text-sm text-on-surface-variant line-clamp-2 mt-0.5">{n.body}</span>}
                  <span className="block text-xs text-on-surface-dim mt-1">{formatRelative(n.created_at)}</span>
                </span>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Notification'}
      >
        {selected && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`p-2 rounded-xl shrink-0 ${selected.is_read ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary'}`}>
                <Icon name={TYPE_ICON[selected.type] || 'notifications'} size="sm" />
              </span>
              {selected.actor_name && (
                <span className="text-label-md text-on-surface-variant">{selected.actor_name}</span>
              )}
              <span className="text-xs text-on-surface-dim ml-auto">{formatRelative(selected.created_at)}</span>
            </div>
            {selected.body && (
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap mb-6">{selected.body}</p>
            )}
            <div className="flex items-center justify-end gap-3">
              {selected.link && (
                <button
                  onClick={openLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:brightness-110 transition-all"
                >
                  Open <Icon name="arrow_forward" size="sm" />
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="px-5 py-2.5 bg-surface-container-high text-on-surface rounded-xl text-sm font-bold hover:brightness-110 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
