import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { WS_ORIGIN } from '../lib/config'
import { getToken } from '../lib/auth'

interface AdminEventHandlers {
  'admin:user.signup'?: (data: { userId: string; email: string; name: string; isCreatorApply?: boolean; timestamp: number }) => void
  'admin:user.role.changed'?: (data: { userId: string; role: string; timestamp: number }) => void
  'admin:user.role.assigned'?: (data: { userId: string; adminRoleId: string | null; timestamp: number }) => void
  'admin:user.banned'?: (data: { userId: string; reason: string; timestamp: number }) => void
  'admin:user.unbanned'?: (data: { userId: string; timestamp: number }) => void
  'admin:user.suspended'?: (data: { userId: string; until: string; reason: string; timestamp: number }) => void
  'admin:user.unsuspended'?: (data: { userId: string; timestamp: number }) => void
  'admin:user.verified'?: (data: { userId: string; timestamp: number }) => void
  'admin:user.unverified'?: (data: { userId: string; timestamp: number }) => void
  'admin:role.created'?: (data: { role: { id: string; name: string; slug: string }; timestamp: number }) => void
  'admin:role.updated'?: (data: { role: { id: string; name: string }; timestamp: number }) => void
  'admin:role.deleted'?: (data: { roleId: string; timestamp: number }) => void
  'admin:creator.application.approved'?: (data: { userId: string; applicationId: string; timestamp: number }) => void
  'admin:creator.application.denied'?: (data: { userId: string; applicationId: string; timestamp: number }) => void
  'admin:report.resolved'?: (data: { reportId: string; status: string; timestamp: number }) => void
  'admin:appeal.decided'?: (data: { appealId: string; status: string; appealType: string; userId: string; timestamp: number }) => void
  'admin:catalog.updated'?: (data: { kind: string; id: string; fields: Record<string, unknown>; timestamp: number }) => void
  'admin:promo.created'?: (data: { promo: unknown; timestamp: number }) => void
  'admin:banner.created'?: (data: { banner: unknown; timestamp: number }) => void
  'admin:feed.settings.changed'?: (data: { key: string; value: unknown; timestamp: number }) => void
  'admin:report.resolved'?: (data: { reportId: string; status: string; timestamp: number }) => void
  'admin:appeal.decided'?: (data: { appealId: string; status: string; appealType: string; userId: string; timestamp: number }) => void
  'admin:creator.application.approved'?: (data: { userId: string; applicationId: string; timestamp: number }) => void
  'admin:creator.application.denied'?: (data: { userId: string; applicationId: string; timestamp: number }) => void
}

type AdminEventKey = keyof AdminEventHandlers
type AdminEventData = AdminEventHandlers[keyof AdminEventHandlers]

export function useAdminWebSocket(handlers: Partial<AdminEventHandlers>) {
  const { user } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!user || user.role !== 'admin') return

    const token = getToken()
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = WS_ORIGIN ? new URL(WS_ORIGIN).host : window.location.host
    
    let ws: WebSocket | null = null
    let closed = false

    const connect = () => {
      if (closed) return
      if (wsRef.current) wsRef.current.close()
      
      ws = new WebSocket(`${protocol}//${host}/ws?token=${encodeURIComponent(token)}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[AdminWS] Connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          const type = msg.type as AdminEventKey
          const handler = handlersRef.current[type]
          if (handler && typeof handler === 'function') {
            handler(msg as AdminEventData)
          }
        } catch (e) {
          console.error('[AdminWS] Error handling message:', e)
        }
      }

      ws.onclose = (event) => {
        console.log('[AdminWS] Disconnected:', event.code, event.reason)
        if (!closed && !event.wasClean) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!closed) connect()
          }, delay)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      closed = true
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [user])

  // Expose send function for sending admin events (if needed)
  const send = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    }
  }, [])

  return { send }
}

export default useAdminWebSocket