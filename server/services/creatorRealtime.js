import { registerSocket, deregisterSocket, notifyUser } from './realtime.js'

// Creator channels that a creator can subscribe to for live data.
// Maps creatorId -> Set of connected websockets.
const creatorSockets = new Map()

export function registerCreatorSocket(creatorId, ws) {
  if (!creatorId || !ws) return
  if (!creatorSockets.has(creatorId)) creatorSockets.set(creatorId, new Set())
  creatorSockets.get(creatorId).add(ws)
}

export function deregisterCreatorSocket(creatorId, ws) {
  if (!creatorId) return
  const set = creatorSockets.get(creatorId)
  if (!set) return
  set.delete(ws)
  if (set.size === 0) creatorSockets.delete(creatorId)
}

// Emit a real-time event to a creator's live dashboard.
// channel: 'earnings' | 'engagement' | 'content' | 'payout' | 'live'
export function notifyCreator(creatorId, channel, payload) {
  if (!creatorId) return false
  const set = creatorSockets.get(creatorId)
  if (!set || set.size === 0) return false
  const msg = JSON.stringify({ type: `creator:${channel}`, channel, creatorId, ...payload })
  let sent = 0
  for (const ws of set) {
    if (ws.readyState === 1) {
      try { ws.send(msg); sent++ } catch {}
    }
  }
  // Also notify via the global notification channel so push/fallback works
  notifyUser(creatorId, { type: `creator:${channel}`, channel, creatorId, ...payload })
  return sent > 0
}

export function creatorSocketCount() {
  let n = 0
  for (const set of creatorSockets.values()) n += set.size
  return n
}

export default { registerCreatorSocket, deregisterCreatorSocket, notifyCreator, creatorSocketCount }
