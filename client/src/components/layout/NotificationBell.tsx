import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { formatRelative } from '../features/news/formatRelative'
import type { NotificationItem } from '../../lib/notifications'

interface Props {
  items: NotificationItem[]
  unread: number
  open: boolean
  setOpen: (v: boolean) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

const TYPE_ICON: Record<string, string> = {
  follow: 'person_add',
  comment: 'mode_comment',
  forum: 'forum',
  gift: 'card_giftcard',
}

export default function NotificationBell({ items, unread, open, setOpen, markRead, markAllRead }: Props) {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement | null>(null)

  const go = (n: NotificationItem) => {
    if (!n.is_read) markRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-on-surface-variant hover:text-primary transition-colors p-2 relative"
        aria-label="Notifications"
      >
        <Icon name={unread > 0 ? 'notifications_active' : 'notifications'} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] glass-panel rounded-2xl shadow-xl overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-variant">
            <span className="font-label-lg text-label-lg text-on-surface">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-label-sm text-primary hover:text-primary container-text transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Icon name="notifications_none" className="text-on-surface-variant" size="xl" />
                <p className="mt-2 text-label-md text-label-md text-on-surface-variant">You're all caught up</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go(n)}
                  className="w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-white/5 transition-colors"
                >
                  <span className={`p-2 rounded-xl shrink-0 ${n.is_read ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary'}`}>
                    <Icon name={TYPE_ICON[n.type] || 'notifications'} size="sm" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-label-md text-label-md text-on-surface leading-snug">{n.title}</span>
                    {n.body && <span className="block text-sm text-on-surface-variant truncate">{n.body}</span>}
                    <span className="block text-xs text-on-surface-dim mt-0.5">{formatRelative(n.created_at)}</span>
                  </span>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}