import { getToken } from './auth'
import { WS_ORIGIN } from './config'

type LiveHandler = (data: any) => void

interface LiveSub {
  contentType: string
  contentId: string
  handler: LiveHandler
}

interface LiveMessage {
  type?: string
  contentId?: string
  contentType?: string
  [k: string]: any
}

const subs: LiveSub[] = []
let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let lastMessageAt = 0

function keyOf(type: string, id: string) {
  return `${type}:${id}`
}

function dispatch(msg: LiveMessage) {
  lastMessageAt = Date.now()
  if (!msg.type || msg.contentId === undefined || msg.contentType === undefined) return
  if (msg.type !== 'comment' && msg.type !== 'like') return
  const key = keyOf(msg.contentType, String(msg.contentId))
  for (const sub of subs) {
    if (keyOf(sub.contentType, sub.contentId) === key) {
      try { sub.handler(msg) } catch {}
    }
  }
}

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
  const token = getToken() || ''
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = WS_ORIGIN ? new URL(WS_ORIGIN).host : window.location.host
  ws = new WebSocket(`${protocol}//${host}/ws?token=${encodeURIComponent(token)}`)
  ws.onmessage = (ev) => {
    try {
      dispatch(JSON.parse(ev.data))
    } catch {
      /* ignore malformed frames */
    }
  }
  ws.onclose = () => {
    ws = null
    if (subs.length > 0) {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(connect, 3000)
    }
  }
  ws.onerror = () => {
    try { ws?.close() } catch {}
  }
}

export function subscribeContent(contentType: string, contentId: string | number, handler: LiveHandler): () => void {
  const sub: LiveSub = { contentType, contentId: String(contentId), handler }
  subs.push(sub)
  if (getToken()) connect()
  return () => {
    const i = subs.indexOf(sub)
    if (i !== -1) subs.splice(i, 1)
    if (subs.length === 0 && ws) {
      ws.close()
      ws = null
    }
  }
}

export function isLiveConnected(): boolean {
  return !!ws && ws.readyState === WebSocket.OPEN
}

export function lastLiveMessageAt(): number {
  return lastMessageAt
}
