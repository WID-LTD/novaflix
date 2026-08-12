import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useNotifications } from '../lib/notifications'
import { getToken } from '../lib/auth'
import { formatRelative } from '../components/features/news/formatRelative'

const BASE = '/api'
const PAGE_SIZE = 25

const TYPE_ICON: Record<string, string> = {
  follow: 'person_add',
  comment: 'mode_comment',
  forum: 'forum',
  gift: 'card_giftcard',
}

export default function Notifications() {
  const navigate = useNavigate()
  const { items, unread, refresh, markRead, markAllRead } = useNotifications(true)
  const [all, setAll] = useState<any[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const initialized = useRef(false)

  const go = useCallback((n: any) => {
    if (!n.is_read) markRead(n.id)
    if (n.link) navigate(n.link)
  }, [navigate, markRead])

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      setOffset(0)
      fetch(`${BASE}/notifications?limit=${PAGE_SIZE}&offset=0`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }).then((res) => res.json()).then((res) => {
        if (res.success) {
          setAll(res.notifications || [])
          setHasMore((res.notifications || []).length >= PAGE_SIZE)
        }
      })
    }
    refresh()
  }, [refresh])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const next = offset + PAGE_SIZE
    const res = await fetch(`${BASE}/notifications?limit=${PAGE_SIZE}&offset=${next}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((r) => r.json())
    if (res.success && res.notifications?.length) {
      setAll((prev) => {
        const seen = new Set(prev.map((n) => n.id))
        const additions = res.notifications.filter((n: any) => !seen.has(n.id))
        return [...prev, ...additions]
      })
      setOffset(next)
      setHasMore(res.notifications.length >= PAGE_SIZE)
    } else {
      setHasMore(false)
    }
    setLoadingMore(false)
  }, [loadingMore, hasMore, offset])

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

        {all.length === 0 ? (
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
                onClick={() => go(n)}
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

        {hasMore && (
          <div className="py-8 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="expand_more" size="sm" />
              )}
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
