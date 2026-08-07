import { useCallback, useEffect, useRef, useState } from 'react'
import { getToken } from './auth'

const BASE = '/api'

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  link: string
  is_read: boolean
  created_at: string
  actor_name: string | null
  actor_avatar: string | null
}

async function authedFetch(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } })
  return res.json()
}

async function authedPost(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  return res.json()
}

export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled) return
    const [listRes, countRes] = await Promise.all([
      authedFetch('/notifications?limit=25'),
      authedFetch('/notifications/unread-count'),
    ])
    if (listRes?.notifications) setItems(listRes.notifications)
    if (typeof countRes?.count === 'number') setUnread(countRes.count)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    refresh()
    const token = getToken()
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/ws?token=${encodeURIComponent(token || '')}`)
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.type === 'notification' && data.notification) {
          setItems((prev) => {
            const next = [...prev.filter((n) => n.id !== data.notification.id)]
            next.unshift(data.notification)
            return next
          })
          setUnread((u) => u + 1)
        }
      } catch {
        /* ignore malformed frames */
      }
    }
    pollRef.current = setInterval(() => { refresh() }, 20000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [enabled, refresh])

  const markRead = useCallback(async (id: string): Promise<void> => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnread((u) => Math.max(0, u - 1))
    await authedPost(`/notifications/${id}/read`)
  }, [])

  const markAllRead = useCallback(async (): Promise<void> => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnread(0)
    await authedPost('/notifications/read-all')
  }, [])

  return { items, unread, open, setOpen, refresh, markRead, markAllRead }
}