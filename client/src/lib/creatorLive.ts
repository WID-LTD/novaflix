import { getToken } from './auth'
import { WS_ORIGIN } from './config'

type CreatorHandler = (data: any) => void

interface CreatorSub {
  channels: Set<string>
  handler: CreatorHandler
}

let subs: CreatorSub[] = []
let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let lastMessageAt = 0

const CREATOR_TYPES = new Set([
  'creator:earnings',
  'creator:engagement',
  'creator:content',
  'creator:payout',
  'creator:live',
])

function matches(msg: any): string | null {
  if (!msg.type || !CREATOR_TYPES.has(msg.type)) return null
  return msg.type
}

function dispatch(msg: any) {
  lastMessageAt = Date.now()
  const type = matches(msg)
  if (!type) return
  for (const sub of subs) {
    if (sub.channels.has(type)) {
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
  ws.onopen = () => {
    try {
      ws.send(JSON.stringify({ type: 'creator-subscribe' }))
    } catch {}
  }
  ws.onmessage = (ev) => {
    try { dispatch(JSON.parse(ev.data)) } catch {}
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

/**
 * Subscribe to creator real-time channels.
 * channels may be a single channel name or an array,
 * e.g. 'earnings' or ['earnings', 'engagement'].
 * Returns an unsubscribe function.
 */
export function subscribeCreator(channels: string | string[], handler: CreatorHandler): () => void {
  const keys = (Array.isArray(channels) ? channels : [channels])
    .map(c => (c.startsWith('creator:') ? c : `creator:${c}`))
  const sub: CreatorSub = { channels: new Set(keys), handler }
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

export function isCreatorLiveConnected(): boolean {
  return !!ws && ws.readyState === WebSocket.OPEN
}

export function lastCreatorLiveMessageAt(): number {
  return lastMessageAt
}

export default { subscribeCreator, isCreatorLiveConnected, lastCreatorLiveMessageAt }
